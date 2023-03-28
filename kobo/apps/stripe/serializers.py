from django.core.exceptions import SuspiciousOperation, ValidationError
from djstripe.models import (
    Session,
    Price,
    Product,
    Subscription,
    SubscriptionItem,
)
from rest_framework import serializers


class OneTimeAddOnSerializer(serializers.ModelSerializer):
    payment_intent = serializers.SlugRelatedField(
        slug_field='status',
        read_only=True,
        many=False,
    )
    class Meta:
        model = Session
        fields = ('metadata', 'created', 'payment_intent',)


class BaseProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ('id', 'name', 'description', 'type', 'metadata')


class BasePriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Price
        fields = (
            "id",
            "nickname",
            "currency",
            "type",
            "unit_amount",
            "human_readable_price",
            "metadata",
        )

class CustomerPortalSerializer(serializers.Serializer):
    organization_uid = serializers.CharField(required=True)

    def validate_organization_uid(self, organization_uid):
        if organization_uid.startswith('org'):
            return organization_uid
        raise ValidationError('Invalid organization ID')


class CheckoutLinkSerializer(serializers.Serializer):
    price_id = serializers.SlugRelatedField(
        'id',
        queryset=Price.objects.filter(active=True, product__active=True),
        required=True,
        allow_empty=False,
    )
    organization_uid = serializers.CharField(required=False)

    def validate_organization_uid(self, organization_uid):
        if organization_uid.startswith('org') or not organization_uid:
            return organization_uid
        raise ValidationError('Invalid organization ID')

    class Meta:
        model = Price
        fields = ("id",)


class PriceSerializer(BasePriceSerializer):
    product = BaseProductSerializer()

    class Meta(BasePriceSerializer.Meta):
        fields = (
            "id",
            "nickname",
            "currency",
            "unit_amount",
            "human_readable_price",
            "metadata",
            "product",
        )


class ProductSerializer(BaseProductSerializer):
    prices = BasePriceSerializer(many=True)

    class Meta(BaseProductSerializer.Meta):
        fields = ("id", "name", "description", "type", "prices", "metadata")


class SubscriptionItemSerializer(serializers.ModelSerializer):
    price = PriceSerializer()

    class Meta:
        model = SubscriptionItem
        fields = ("id", "price")


class SubscriptionSerializer(serializers.ModelSerializer):
    items = SubscriptionItemSerializer(many=True)

    class Meta:
        model = Subscription
        exclude = ('djstripe_id',)
