import styles from 'js/account/usage/yourPlan.module.scss';
import React, {useEffect, useMemo, useState} from 'react';
import {formatDate} from 'js/utils';
import Badge, {BadgeColor} from 'js/components/common/badge';
import subscriptionStore from 'js/account/subscriptionStore';
import sessionStore from 'js/stores/session';
import BillingButton from 'js/account/plans/billingButton.component';
import {ACCOUNT_ROUTES} from 'js/account/routes';
import envStore from 'js/envStore';
import {
  PlanNames,
  Product,
  SubscriptionChangeType,
} from 'js/account/stripe.types';
import {getProducts} from '../stripe.api';
import {getSubscriptionChangeDetails} from '../stripe.utils';
import LimitNotifications from 'js/components/usageLimits/limitNotifications.component';

const BADGE_COLOR_KEYS: {[key in SubscriptionChangeType]: BadgeColor} = {
  [SubscriptionChangeType.RENEWAL]: 'light-blue',
  [SubscriptionChangeType.CANCELLATION]: 'light-red',
  [SubscriptionChangeType.PRODUCT_CHANGE]: 'light-amber',
  [SubscriptionChangeType.PRICE_CHANGE]: 'light-amber',
  [SubscriptionChangeType.NO_CHANGE]: 'light-blue',
};

/*
 * Show the user's current plan and any storage add-ons, with links to the Plans page
 */
export const YourPlan = () => {
  const [subscriptions] = useState(() => subscriptionStore);
  const [env] = useState(() => envStore);
  const [session] = useState(() => sessionStore);
  const [productsState, setProductsState] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      await getProducts().then((productResponse) => {
        setProductsState(productResponse.results);
      });
    };
    fetchProducts();
  }, []);

  /*
   * The plan name displayed to the user. This will display, in order of precedence:
   * * The user's active plan subscription
   * * The FREE_TIER_DISPLAY["name"] setting (if the user registered before FREE_TIER_CUTOFF_DATE
   * * The free plan
   */
  const planName = useMemo(() => {
    if (subscriptions.planResponse.length) {
      return subscriptions.planResponse[0].items[0].price.product.name;
    }
    return env.data?.free_tier_display?.name || PlanNames.FREE;
  }, [env.isReady, subscriptions.isInitialised]);

  // The start date of the user's plan. Defaults to the account creation date if the user doesn't have a subscription.
  const startDate = useMemo(() => {
    let date;
    if (subscriptions.planResponse.length) {
      date = subscriptions.planResponse[0].start_date;
    } else {
      date = session.currentAccount.date_joined;
    }
    return formatDate(date);
  }, [env.isReady, subscriptions.isInitialised]);

  const currentPlan = useMemo(() => {
    if (subscriptionStore.planResponse.length) {
      return subscriptions.planResponse[0];
    } else {
      return null;
    }
  }, [env.isReady, subscriptions.isInitialised]);

  /*
   * Performs logical operations to determine what information to provide about
   * the upcoming status of user's subscription. Currently it is assumed that
   * the only type of scheduled price change will be a downgrade from annual to monthly
   */
  const subscriptionUpdate = useMemo(() => {
    return getSubscriptionChangeDetails(currentPlan, productsState);
  }, [currentPlan, productsState]);

  return (
    <article>
      <section className={styles.section}>
        <div className={styles.banner}>
          <LimitNotifications usagePage />
        </div>
        <div className={styles.planInfo}>
          <p className={styles.plan}>
            <strong>
              {t('##plan_name## Plan').replace('##plan_name##', planName)}
            </strong>
          </p>
          <time dateTime={startDate} className={styles.start}>
            {t('Started on ##start_date##').replace(
              '##start_date##',
              startDate
            )}
          </time>
          {subscriptionUpdate && (
            <Badge
              color={BADGE_COLOR_KEYS[subscriptionUpdate.type]!}
              size={'s'}
              label={
                <time
                  dateTime={subscriptionUpdate.date}
                  className={styles.updateBadge}
                >
                  {subscriptionUpdate.type === SubscriptionChangeType.RENEWAL &&
                    t('Renews on ##renewal_date##').replace(
                      '##renewal_date##',
                      formatDate(subscriptionUpdate.date)
                    )}
                  {[
                    SubscriptionChangeType.CANCELLATION,
                    SubscriptionChangeType.PRODUCT_CHANGE,
                  ].includes(subscriptionUpdate.type) &&
                    t('Ends on ##end_date##').replace(
                      '##end_date##',
                      formatDate(subscriptionUpdate.date)
                    )}
                  {subscriptionUpdate.type ===
                    SubscriptionChangeType.PRICE_CHANGE &&
                    t('Switching to monthly on ##change_date##').replace(
                      '##change_date##',
                      formatDate(subscriptionUpdate.date)
                    )}
                </time>
              }
            />
          )}
        </div>
        <nav>
          <BillingButton
            label={'See plans'}
            type={'frame'}
            color={'blue'}
            onClick={() => window.location.assign('#' + ACCOUNT_ROUTES.PLAN)}
          />
          {/* This is commented out until the add-ons tab on the Plans page is implemented
        <BillingButton
          label={'get add-ons'}
          type={'full'}
          color={'blue'}
          // TODO: change this to point to the add-ons tab
          onClick={() => window.location.assign('#' + ACCOUNT_ROUTES.PLAN)}
        />
         */}
        </nav>
      </section>
      {subscriptionUpdate?.type === SubscriptionChangeType.CANCELLATION && (
        <div className={styles.subscriptionChangeNotice}>
          {t(
            'Your ##current_plan## plan has been canceled but will remain active until the end of the billing period.'
          ).replace('##current_plan##', planName)}
        </div>
      )}
      {subscriptionUpdate?.type === SubscriptionChangeType.PRODUCT_CHANGE && (
        <div className={styles.subscriptionChangeNotice}>
          {t(
            'Your ##current_plan## plan will change to the ##next_plan## plan on'
          )
            .replace('##current_plan##', planName)
            .replace('##next_plan##', subscriptionUpdate.nextProduct!.name)}
          &nbsp;
          <time dateTime={subscriptionUpdate.date}>
            {formatDate(subscriptionUpdate.date)}
          </time>
          {t(
            '. You can continue using ##current_plan## plan features until the end of the billing period.'
          ).replace('##current_plan##', planName)}
        </div>
      )}
      {subscriptionUpdate?.type === SubscriptionChangeType.PRICE_CHANGE && (
        <div className={styles.subscriptionChangeNotice}>
          {t(
            'Your ##current_plan## plan will change from annual to monthly starting from'
          ).replace('##current_plan##', planName)}
          &nbsp;
          <time dateTime={subscriptionUpdate.date}>
            {formatDate(subscriptionUpdate.date)}
          </time>
          .
        </div>
      )}
    </article>
  );
};
