import {useState, useReducer, useContext, useEffect} from 'react';
import type {SubscriptionInfo} from 'js/account/stripe.types';
import {getAccountLimits} from 'js/account/stripe.api';
import {USAGE_WARNING_RATIO} from 'js/constants';
import useWhenStripeIsEnabled from 'js/hooks/useWhenStripeIsEnabled.hook';
import {when} from 'mobx';
import subscriptionStore from 'js/account/subscriptionStore';
import {UsageContext} from 'js/account/usage/useUsage.hook';
import {ProductsContext} from 'jsapp/js/account/useProducts.hook';
import {OneTimeAddOnsContext} from 'jsapp/js/account/useOneTimeAddonList.hook';

interface SubscribedState {
  subscribedProduct: null | SubscriptionInfo;
}

const initialState = {
  subscribedProduct: null,
};

function subscriptionReducer(state: SubscribedState, action: {prodData: any}) {
  return {...state, subscribedProduct: action.prodData};
}

export const useExceedingLimits = () => {
  const [state, dispatch] = useReducer(subscriptionReducer, initialState);
  const usage = useContext(UsageContext);
  const productsContext = useContext(ProductsContext);
  const oneTimeAddOnsContext = useContext(OneTimeAddOnsContext);

  const [exceedList, setExceedList] = useState<string[]>([]);
  const [warningList, setWarningList] = useState<string[]>([]);

  const [subscribedStorageLimit, setSubscribedStorageLimit] = useState<
    number | string
  >();
  const [subscribedSubmissionLimit, setSubscribedSubmissionLimit] = useState<
    number | string
  >();
  const [subscribedTranscriptionMinutes, setTranscriptionMinutes] = useState<
    number | string
  >();
  const [subscribedTranslationChars, setTranslationChars] = useState<
    number | string
  >();
  const [areLimitsLoaded, setAreLimitsLoaded] = useState(false);

  // Get products and get default limits for community plan
  useWhenStripeIsEnabled(() => {
    if (productsContext.isLoaded && oneTimeAddOnsContext.isLoaded) {
      getAccountLimits(
        productsContext.products,
        oneTimeAddOnsContext.oneTimeAddOns
      ).then((limits) => {
        setSubscribedSubmissionLimit(limits.remainingLimits.submission_limit);
        setSubscribedStorageLimit(limits.remainingLimits.storage_bytes_limit);
        setTranscriptionMinutes(limits.remainingLimits.nlp_seconds_limit);
        setTranslationChars(limits.remainingLimits.nlp_character_limit);
        setAreLimitsLoaded(true);
      });
    }
  }, [
    productsContext.isLoaded,
    productsContext.products,
    oneTimeAddOnsContext.isLoaded,
    oneTimeAddOnsContext.oneTimeAddOns,
  ]);

  // Get subscription data
  useWhenStripeIsEnabled(
    () =>
      when(
        () => subscriptionStore.isInitialised,
        () => {
          dispatch({
            prodData: subscriptionStore.planResponse,
          });
        }
      ),
    []
  );

  function isOverLimit(
    subscribedLimit: number | string | undefined,
    currentUsage: number | undefined,
    listString: string
  ) {
    if (
      subscribedLimit &&
      typeof subscribedLimit === 'number' &&
      typeof currentUsage === 'number'
    ) {
      if (currentUsage >= subscribedLimit) {
        setExceedList((prevState) => prevState.concat([listString]));
      } else if (currentUsage >= subscribedLimit * USAGE_WARNING_RATIO) {
        setWarningList((prevState) => prevState.concat([listString]));
      }
    }
  }

  // Check if usage is more than limit
  useEffect(() => {
    if (!usage.isLoaded || !areLimitsLoaded) {
      return;
    }
    isOverLimit(subscribedStorageLimit, usage.storage, 'storage');
    isOverLimit(subscribedSubmissionLimit, usage.submissions, 'submission');
    isOverLimit(
      subscribedTranscriptionMinutes,
      usage.transcriptionMinutes,
      'automated transcription'
    );
    isOverLimit(
      subscribedTranslationChars,
      usage.translationChars,
      'machine translation'
    );
  }, [usage.isLoaded, areLimitsLoaded]);

  return {exceedList, warningList};
};
