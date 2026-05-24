export type SubscriptionPlan = 'free' | 'premium';

export type SubscriptionEntitlementSource =
  | 'overwolf-active-plan'
  | 'overwolf-pending-cancellation'
  | 'local-dev-foundation'
  | 'fallback-free';

export interface SubscriptionStateSnapshot {
  plan: SubscriptionPlan;
  source: SubscriptionEntitlementSource;
  aiReviewsUsedThisWeek: number;
  aiReviewWeeklyLimit: number;
  usageWindowStartedAt: string;
  hasUnlimitedAiReviews: boolean;
  hasAiHistoryAccess: boolean;
  hasProgressionAccess: boolean;
  hasWeeklyReports: boolean;
}

const SUBSCRIPTION_STORAGE_KEY = 'sensei_subscription_state';
const DEFAULT_AI_REVIEW_WEEKLY_LIMIT = 3;

const buildDefaultSubscriptionState = (): SubscriptionStateSnapshot => ({
  plan: 'free',
  source: 'fallback-free',
  aiReviewsUsedThisWeek: 0,
  aiReviewWeeklyLimit: DEFAULT_AI_REVIEW_WEEKLY_LIMIT,
  usageWindowStartedAt: new Date().toISOString(),
  hasUnlimitedAiReviews: false,
  hasAiHistoryAccess: false,
  hasProgressionAccess: false,
  hasWeeklyReports: false
});

const isUsageWindowExpired = (startedAt: string) => {
  const startedAtTime = new Date(startedAt).getTime();

  if (Number.isNaN(startedAtTime)) {
    return true;
  }

  return Date.now() - startedAtTime >= 7 * 24 * 60 * 60 * 1000;
};

export const getDefaultSubscriptionState = () => buildDefaultSubscriptionState();

export const getStoredSubscriptionState = (): SubscriptionStateSnapshot => {
  if (typeof window === 'undefined') {
    return buildDefaultSubscriptionState();
  }

  const storedValue = window.localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);

  if (!storedValue) {
    return buildDefaultSubscriptionState();
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<SubscriptionStateSnapshot>;
    const normalized: SubscriptionStateSnapshot = {
      plan: parsed.plan === 'premium' ? 'premium' : 'free',
      source: parsed.source === 'overwolf-active-plan' || parsed.source === 'overwolf-pending-cancellation' || parsed.source === 'local-dev-foundation' ? parsed.source : 'fallback-free',
      aiReviewsUsedThisWeek: typeof parsed.aiReviewsUsedThisWeek === 'number' ? Math.max(0, parsed.aiReviewsUsedThisWeek) : 0,
      aiReviewWeeklyLimit: typeof parsed.aiReviewWeeklyLimit === 'number' ? Math.max(1, parsed.aiReviewWeeklyLimit) : DEFAULT_AI_REVIEW_WEEKLY_LIMIT,
      usageWindowStartedAt: typeof parsed.usageWindowStartedAt === 'string' ? parsed.usageWindowStartedAt : new Date().toISOString(),
      hasUnlimitedAiReviews: Boolean(parsed.hasUnlimitedAiReviews),
      hasAiHistoryAccess: Boolean(parsed.hasAiHistoryAccess),
      hasProgressionAccess: Boolean(parsed.hasProgressionAccess),
      hasWeeklyReports: Boolean(parsed.hasWeeklyReports)
    };

    if (isUsageWindowExpired(normalized.usageWindowStartedAt)) {
      return {
        ...normalized,
        aiReviewsUsedThisWeek: 0,
        usageWindowStartedAt: new Date().toISOString()
      };
    }

    return normalized;
  } catch {
    return buildDefaultSubscriptionState();
  }
};

export const saveSubscriptionState = (state: SubscriptionStateSnapshot) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify(state));
};
