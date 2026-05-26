import type { SubscriptionPlan } from './subscriptionStorage';

export type SubscriptionEntitlementSource =
  | 'overwolf-active-plan'
  | 'overwolf-pending-cancellation'
  | 'local-dev-foundation'
  | 'fallback-free';

export interface SenseiSubscriptionEntitlements {
  plan: SubscriptionPlan;
  source: SubscriptionEntitlementSource;
  hasFullAiReview: boolean;
  hasUnlimitedAiReviews: boolean;
  hasAiHistoryAccess: boolean;
  hasProgressionAccess: boolean;
  hasWeeklyReports: boolean;
}

export interface OverwolfDetailedActivePlan {
  planId?: number;
  state?: string;
  title?: string;
  description?: string;
  expiryDate?: string | number;
  price?: string;
  periodMonths?: string;
}

export interface ResolvedOverwolfSubscriptionEntitlements {
  entitlements: SenseiSubscriptionEntitlements;
  activePlanCount: number;
  hasMatchingPremiumPlan: boolean;
  matchingPremiumPlanId: number | null;
  matchingPremiumPlanState: string | null;
}

export const buildSubscriptionEntitlements = (
  plan: SubscriptionPlan,
  source: SubscriptionEntitlementSource
): SenseiSubscriptionEntitlements => ({
  plan,
  source,
  hasFullAiReview: true,
  hasUnlimitedAiReviews: plan === 'premium',
  hasAiHistoryAccess: plan === 'premium',
  hasProgressionAccess: plan === 'premium',
  hasWeeklyReports: plan === 'premium'
});

export const isPremiumOverwolfPlanState = (state: string | undefined) => {
  const normalized = typeof state === 'string' ? state.trim().toUpperCase() : '';
  return normalized === 'ACTIVE' || normalized === 'PENDING_CANCELLATION';
};

export const resolveEntitlementsFromOverwolfPlans = (
  plans: OverwolfDetailedActivePlan[],
  premiumPlanId: number
): SenseiSubscriptionEntitlements => {
  return resolveOverwolfSubscriptionEntitlements(plans, premiumPlanId).entitlements;
};

export const resolveOverwolfSubscriptionEntitlements = (
  plans: OverwolfDetailedActivePlan[],
  premiumPlanId: number
): ResolvedOverwolfSubscriptionEntitlements => {
  const matchingPlan = plans.find((plan) => plan.planId === premiumPlanId && isPremiumOverwolfPlanState(plan.state));

  if (!matchingPlan) {
    return {
      entitlements: buildSubscriptionEntitlements('free', 'fallback-free'),
      activePlanCount: plans.length,
      hasMatchingPremiumPlan: false,
      matchingPremiumPlanId: null,
      matchingPremiumPlanState: null
    };
  }

  const normalizedState = typeof matchingPlan.state === 'string' ? matchingPlan.state.trim().toUpperCase() : '';
  return {
    entitlements: buildSubscriptionEntitlements(
      'premium',
      normalizedState === 'PENDING_CANCELLATION' ? 'overwolf-pending-cancellation' : 'overwolf-active-plan'
    ),
    activePlanCount: plans.length,
    hasMatchingPremiumPlan: true,
    matchingPremiumPlanId: matchingPlan.planId === premiumPlanId ? premiumPlanId : null,
    matchingPremiumPlanState: normalizedState || null
  };
};
