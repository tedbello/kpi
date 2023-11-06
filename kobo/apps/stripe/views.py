import stripe
from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Max, Prefetch
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from djstripe.models import (
    Customer,
    Price,
    Product,
    Session,
    Subscription,
    SubscriptionItem,
    SubscriptionSchedule,
)
from djstripe.settings import djstripe_settings
from organizations.utils import create_organization
from rest_framework import mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from kobo.apps.organizations.models import Organization
from kobo.apps.stripe.constants import ACTIVE_STRIPE_STATUSES
from kobo.apps.stripe.serializers import (
    ChangePlanSerializer,
    CheckoutLinkSerializer,
    CustomerPortalSerializer,
    OneTimeAddOnSerializer,
    ProductSerializer,
    SubscriptionSerializer,
)
from kpi.permissions import IsAuthenticated


# Lists the one-time purchases made by the organization that the logged-in user owns
class OneTimeAddOnViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = (IsAuthenticated,)
    serializer_class = OneTimeAddOnSerializer
    queryset = Session.objects.all()

    def get_queryset(self):
        return self.queryset.filter(
            livemode=settings.STRIPE_LIVE_MODE,
            customer__subscriber__owner__organization_user__user=self.request.user,
            mode='payment',
            payment_intent__status__in=['succeeded', 'processing'],
        ).prefetch_related('payment_intent')


class ChangePlanView(APIView):
    """
    Change an existing subscription to a new price.

    This will immediately change their subscription to the new plan if upgrading, prorating the charge.
    If the user is downgrading to a lower price, it will schedule the change at the end of the current billing period.

    <pre class="prettyprint">
    <b>GET</b> /api/v2/stripe/change-plan/?subscription_id=<code>{subscription_id}</code>&price_id=<code>{price_id}</code>
    </pre>

    > Example
    >
    >       curl -X GET https://[kpi]/api/v2/stripe/change-plan/

    > **Payload**
    >
    >        {
    >           "price_id": "price_A34cds8fmske3tf",
    >           "subscription_id": "sub_s9aNFrd2fsmld4gz",
    >        }

    where:

    * "price_id" (required) is the Stripe Price ID for the plan the user is changing to.
    * "subscription_id" (required) is a Stripe Subscription ID for the subscription being changed.
    """
    permission_classes = (IsAuthenticated,)
    serializer_class = ChangePlanSerializer

    @staticmethod
    def modify_subscription(price, subscription):
        stripe.api_key = djstripe_settings.STRIPE_SECRET_KEY
        subscription_item = subscription.items.get()
        # Exit immediately if the price we're changing to is the same as the price they're currently paying
        if price.id == subscription_item.price.id:
            return Response(
                {'status': 'already subscribed'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # If we're upgrading their plan or moving to a plan with the same price, change the subscription immediately
        if price.unit_amount >= subscription_item.price.unit_amount:
            stripe_response = stripe.Subscription.modify(
                subscription.id,
                payment_behavior='pending_if_incomplete',
                proration_behavior='always_invoice',
                items=[
                    {
                        'id': subscription_item.id,
                        'price': price.id,
                    }
                ],
            )
            # If there are pending updates, there was a problem scheduling the change to their plan
            if stripe_response['pending_update']:
                return Response({
                    'status': 'pending',
                })
            # Upgraded successfully!
            else:
                return Response({
                    'url': f'{settings.KOBOFORM_URL}/#/account/plan?checkout={price.id}',
                    'status': 'success',
                    'stripe_object': stripe_response,
                })

        # We're downgrading the subscription, schedule a subscription change at the end of the current period
        return ChangePlanView.schedule_subscription_change(
            subscription, subscription_item, price.id
        )

    @staticmethod
    def schedule_subscription_change(subscription, subscription_item, price_id):
        # First, try getting the existing schedule for the user's subscription
        try:
            schedule = SubscriptionSchedule.objects.get(
                subscription=subscription
            )
            # If the subscription is already scheduled to change to the given price, quit
            if schedule.phases[-1]['items'][0]['price'] == price_id:
                return Response(
                    {'status': 'error'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        # If we couldn't find a schedule, make a new one
        except ObjectDoesNotExist:
            schedule = stripe.SubscriptionSchedule.create(
                from_subscription=subscription.id
            )
        # SubscriptionSchedules are managed by their `phases` list. Make a new phase to append to that list
        new_phases = [{
            'iterations': 1,
            'items': [
                {
                    'price': price_id,
                    'quantity': 1,
                }
            ],
        }]
        # If the schedule already has phases, combine those with our new phase
        if schedule.phases:
            # Determine the current phase we're in, checking for the most recent phase with the current price ID
            phase_prices = [phase['items'][0]['price'] for phase in schedule.phases]
            phase_prices.reverse()
            current_phase_index = len(phase_prices) - phase_prices.index(
                subscription_item.price.id
            )
            phases_to_date = schedule.phases[0:current_phase_index]
            new_phases.insert(0, *phases_to_date)
        # Update the schedule at Stripe. Their webhook will sync our local SubscriptionSchedule models
        stripe.SubscriptionSchedule.modify(
            schedule.id, phases=new_phases
        )
        return Response({'status': 'scheduled'})

    def get(self, request):
        serializer = ChangePlanSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        price = serializer.validated_data.get('price_id')
        subscription = serializer.validated_data.get('subscription_id')
        # Make sure the subscription belongs to the current user
        try:
            if (
                not subscription.customer.subscriber.owner.organization_user.user
                == request.user
            ):
                raise AttributeError
        except AttributeError:
            return Response(status=status.HTTP_403_FORBIDDEN)
        return ChangePlanView.modify_subscription(price, subscription)


class CheckoutLinkView(APIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = CheckoutLinkSerializer

    @staticmethod
    def generate_payment_link(price, user, organization_id):
        if organization_id:
            # Get the organization for the logged-in user and provided organization ID
            organization = Organization.objects.get(
                id=organization_id, owner__organization_user__user_id=user
            )
        else:
            # Find the first organization the user belongs to, otherwise make a new one
            organization = Organization.objects.filter(
                users=user, owner__organization_user__user_id=user
            ).first()
            if not organization:
                organization = create_organization(
                    user,
                    f"{user.username}'s organization",
                    model=Organization,
                    owner__user=user,
                )
        customer, _ = Customer.get_or_create(
            subscriber=organization, livemode=settings.STRIPE_LIVE_MODE
        )
        # Update the customer's name and organization name in Stripe.
        # djstripe doesn't let us do this on customer creation, so modify the customer on Stripe and then fetch locally.
        stripe_customer = stripe.Customer.modify(
            customer.id,
            name=customer.name or user.extra_details.data.get('name', user.username),
            description=organization.name,
            api_key=djstripe_settings.STRIPE_SECRET_KEY,
            metadata={
                'kpi_owner_username': user.username,
                'kpi_owner_user_id': user.id,
                'request_url': settings.KOBOFORM_URL,
                'organization_id': organization_id,
            },
        )
        customer.sync_from_stripe_data(stripe_customer)
        session = CheckoutLinkView.start_checkout_session(
            customer.id, price, organization.id, user,
        )
        return session['url']

    @staticmethod
    def start_checkout_session(customer_id, price, organization_id, user):
        checkout_mode = (
            'payment' if price.type == 'one_time' else 'subscription'
        )
        kwargs = {}
        if checkout_mode == 'subscription':
            kwargs['subscription_data'] = {
                'metadata': {
                    'kpi_owner_username': user.username,
                    'kpi_owner_user_id': user.id,
                    'request_url': settings.KOBOFORM_URL,
                    'organization_id': organization_id,
                },
            }
        return stripe.checkout.Session.create(
            api_key=djstripe_settings.STRIPE_SECRET_KEY,
            allow_promotion_codes=True,
            automatic_tax={'enabled': False},
            billing_address_collection='required',
            customer=customer_id,
            customer_update={
                'address': 'auto',
                'name': 'auto',
            },
            line_items=[
                {
                    'price': price.id,
                    'quantity': 1,
                },
            ],
            metadata={
                'organization_id': organization_id,
                'price_id': price.id,
                'kpi_owner_username': user.username,
            },
            mode=checkout_mode,
            success_url=f'{settings.KOBOFORM_URL}/#/account/plan?checkout={price.id}',
            **kwargs,
        )

    def post(self, request):
        serializer = CheckoutLinkSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        price = serializer.validated_data.get('price_id')
        organization_id = serializer.validated_data.get('organization_id')
        url = self.generate_payment_link(price, request.user, organization_id)
        return Response({'url': url})


class CustomerPortalView(APIView):
    permission_classes = (IsAuthenticated,)

    @staticmethod
    def generate_portal_link(user, organization_id, price):
        customer = Customer.objects.filter(
            subscriber_id=organization_id,
            subscriber__owner__organization_user__user_id=user,
            subscriptions__status__in=ACTIVE_STRIPE_STATUSES,
            livemode=settings.STRIPE_LIVE_MODE,
        ).values(
            'id', 'subscriptions__id', 'subscriptions__items__id'
        ).first()

        if not customer:
            return Response(
                {'error': f"Couldn't find customer with organization id {organization_id}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        portal_kwargs = {}

        # if we're generating a portal link for a price change, find or generate a matching portal configuration
        if price:
            current_config = None
            all_configs = stripe.billing_portal.Configuration.list(
                api_key=djstripe_settings.STRIPE_SECRET_KEY,
                limit=100,
            )

            if not len(all_configs):
                return Response({'error': "Missing Stripe billing configuration."}, status=status.HTTP_502_BAD_GATEWAY)

            is_price_for_addon = price.product.metadata.get('product_type', '') == 'addon'

            if is_price_for_addon:
                """
                Recurring add-ons aren't included in the default billing configuration.
                This lets us hide them as an 'upgrade' option for paid plan users.
                Here, we try getting the portal configuration that lets us switch to the provided price.
                """
                current_config = next(
                    (config for config in all_configs if (
                            config['active'] and
                            config['livemode'] == settings.STRIPE_LIVE_MODE and
                            config['metadata'].get('portal_price', '') == price.id
                    )), None
                )

            if not current_config:
                # get the active default configuration - we'll use this if our product is a 'plan'
                current_config = next(
                    (config for config in all_configs if (
                        config['is_default'] and
                        config['active'] and
                        config['livemode'] == settings.STRIPE_LIVE_MODE
                    )), None
                )

                if is_price_for_addon:
                    """
                    we couldn't find a custom configuration, let's try making a new one
                    add the price we're switching into to the list of prices that allow subscription updates
                    """
                    new_products = [
                        {
                            'prices': [price.id],
                            'product': price.product.id,
                        },
                    ]
                    current_config['features']['subscription_update']['products'] = new_products
                    # create the billing configuration on Stripe, so it's ready when we send the customer to check out
                    current_config = stripe.billing_portal.Configuration.create(
                        api_key=djstripe_settings.STRIPE_SECRET_KEY,
                        business_profile=current_config['business_profile'],
                        features=current_config['features'],
                        metadata={
                            'portal_price': price.id,
                        }
                    )

            portal_kwargs = {
                'configuration': current_config['id'],
                'flow_data': {
                    'type': 'subscription_update_confirm',
                    'subscription_update_confirm': {
                        'items': [
                            {
                                'id': customer['subscriptions__items__id'],
                                'price': price.id,
                            },
                        ],
                        'subscription': customer['subscriptions__id'],
                    },
                    'after_completion': {
                        'type': 'redirect',
                        'redirect': {
                            'return_url': f'{settings.KOBOFORM_URL}/#/account/plan?checkout={price.id}',
                        },
                    },
                },
            }

        stripe_response = stripe.billing_portal.Session.create(
            api_key=djstripe_settings.STRIPE_SECRET_KEY,
            customer=customer['id'],
            return_url=f'{settings.KOBOFORM_URL}/#/account/plan',
            **portal_kwargs,
        )
        return Response({'url': stripe_response['url']})

    def post(self, request):
        serializer = CustomerPortalSerializer(data=request.query_params)
        serializer.is_valid(raise_exception=True)
        organization_id = serializer.validated_data.get('organization_id', None)
        price = serializer.validated_data.get('price_id', None)
        response = self.generate_portal_link(request.user, organization_id, price)
        return response


class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    lookup_field = 'id'
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return self.queryset.filter(
            livemode=settings.STRIPE_LIVE_MODE,
            customer__subscriber__users=self.request.user,
        ).select_related(
            'schedule'
        ).prefetch_related(
            Prefetch(
                'items',
                queryset=SubscriptionItem.objects.select_related(
                    'price__product'
                ),
            )
        )


@method_decorator(cache_page(settings.ENDPOINT_CACHE_DURATION), name='list')
class ProductViewSet(viewsets.GenericViewSet, mixins.ListModelMixin):
    """
    Returns Product and Price Lists, sorted from the product with the lowest price to highest
    <strong>This endpoint is cached for an amount of time determined by ENDPOINT_CACHE_DURATION</strong>

    <pre class="prettyprint">
    <b>GET</b> /api/v2/stripe/products/
    </pre>

    > Example
    >
    >       curl -X GET https://[kpi]/api/v2/stripe/products/

    > Response
    >
    >       HTTP 200 Ok
    >        {
    >           "count": ...
    >           "next": ...
    >           "previous": ...
    >           "results": [
    >               {
    >                   "id": string,
    >                   "name": string,
    >                   "type": string,
    >                   "prices": [
    >                       {
    >                           "id": string,
    >                           "nickname": string,
    >                           "currency": string,
    >                           "type": string,
    >                           "recurring": {
    >                               "aggregate_usage": string ('sum', 'last_during_period`, `last_ever`, `max`)
    >                               "interval": string ('month', 'year', 'week', 'day')
    >                               "interval_count": int,
    >                               "usage_type": string ('metered', 'licensed')
    >                           },
    >                           "unit_amount": int (cents),
    >                           "human_readable_price": string,
    >                           "metadata": {}
    >                       },
    >                       ...
    >                   ],
    >                   "metadata": {},
    >               },
    >               ...
    >           ]
    >        }
    >

    ### Note: unit_amount is price in cents (assuming currency is USD/AUD/CAD/etc.)

    ## Current Endpoint
    """

    queryset = (
        Product.objects.filter(
            active=True,
            livemode=settings.STRIPE_LIVE_MODE,
            prices__active=True,
        )
        .prefetch_related(
            Prefetch('prices', queryset=Price.objects.filter(active=True))
        )
        .annotate(highest_unit_amount=Max('prices__unit_amount'))
        .order_by('highest_unit_amount')
        .distinct()
    )
    serializer_class = ProductSerializer
