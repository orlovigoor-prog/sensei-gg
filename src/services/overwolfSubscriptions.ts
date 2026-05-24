/// <reference types="@overwolf/types" />

import {
  buildSubscriptionEntitlements,
  resolveEntitlementsFromOverwolfPlans,
  type SenseiSubscriptionEntitlements
} from './subscriptionEntitlements';
import {
  subscriptionProviderAdapter,
  type SubscriptionFoundationConfigResponse
} from './subscriptionProviderAdapter';

export const fetchSubscriptionFoundationConfig = async (): Promise<SubscriptionFoundationConfigResponse | null> => {
  return subscriptionProviderAdapter.fetchFoundationConfig();
};

const fetchLocalDevEntitlements = async (): Promise<SenseiSubscriptionEntitlements> => {
  try {
    const data = await subscriptionProviderAdapter.fetchLocalDevEntitlements();
    if (!data) {
      return buildSubscriptionEntitlements('free', 'fallback-free');
    }

    const plan = data.plan === 'premium' ? 'premium' : 'free';
    return {
      ...buildSubscriptionEntitlements(plan, 'local-dev-foundation'),
      hasFullAiReview: data.features?.fullAiReview ?? true,
      hasUnlimitedAiReviews: data.features?.unlimitedAiReviews ?? plan === 'premium',
      hasAiHistoryAccess: data.features?.aiHistory ?? plan === 'premium',
      hasProgressionAccess: data.features?.progressionInsights ?? plan === 'premium',
      hasWeeklyReports: data.features?.weeklyReports ?? plan === 'premium'
    };
  } catch {
    return buildSubscriptionEntitlements('free', 'fallback-free');
  }
};

export const resolveSubscriptionEntitlements = async (): Promise<SenseiSubscriptionEntitlements> => {
  const foundationConfig = await fetchSubscriptionFoundationConfig();

  if (
    foundationConfig?.premiumPlanConfigured
    && typeof foundationConfig.premiumPlanId === 'number'
    && foundationConfig.premiumPlanId > 0
  ) {
    try {
      const activePlans = await subscriptionProviderAdapter.getDetailedActivePlans();
      if (activePlans) {
        return resolveEntitlementsFromOverwolfPlans(activePlans, foundationConfig.premiumPlanId);
      }
    } catch (error) {
      console.warn('Failed to resolve Overwolf subscription state, falling back to local dev entitlements', error);
    }
  }

  return fetchLocalDevEntitlements();
};

export type { SubscriptionFoundationConfigResponse };
