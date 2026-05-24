/// <reference types="@overwolf/types" />

import { isOverwolfAvailable } from './overwolfBridge';
import { fetchSubscriptionServiceJson } from './subscriptionDevTools';
import type { OverwolfDetailedActivePlan } from './subscriptionEntitlements';
import type { SubscriptionProviderCapabilities } from './subscriptionProviderDomain';

export interface SubscriptionFoundationConfigResponse {
  provider?: string;
  integrationReady?: boolean;
  storeIdConfigured?: boolean;
  premiumPlanConfigured?: boolean;
  storeId?: string | null;
  premiumPlanId?: number | null;
  devPlan?: 'free' | 'premium';
}

export interface LocalEntitlementsResponse {
  ok?: boolean;
  source?: string;
  plan?: 'free' | 'premium';
  features?: {
    fullAiReview?: boolean;
    unlimitedAiReviews?: boolean;
    aiHistory?: boolean;
    progressionInsights?: boolean;
    weeklyReports?: boolean;
  };
}

export type OverwolfSubscriptionInAppTheme = 'Light' | 'Dark';

const canReadDetailedActivePlans = () => {
  return Boolean(isOverwolfAvailable() && overwolf.profile?.subscriptions?.getDetailedActivePlans);
};

const canOpenInAppPurchase = () => {
  return Boolean(overwolf.profile?.subscriptions?.inapp?.show);
};

const canListenSubscriptionChanges = () => {
  return Boolean(overwolf.profile?.subscriptions?.onSubscriptionChanged);
};

export const subscriptionProviderAdapter = {
  fetchFoundationConfig: async (): Promise<SubscriptionFoundationConfigResponse | null> => {
    return fetchSubscriptionServiceJson<SubscriptionFoundationConfigResponse>('/api/subscription/config');
  },

  fetchLocalDevEntitlements: async (): Promise<LocalEntitlementsResponse | null> => {
    return fetchSubscriptionServiceJson<LocalEntitlementsResponse>('/api/subscription/entitlements');
  },

  getDetailedActivePlans: async (): Promise<OverwolfDetailedActivePlan[] | null> => {
    if (!canReadDetailedActivePlans()) {
      return null;
    }

    return new Promise((resolve, reject) => {
      overwolf.profile.subscriptions.getDetailedActivePlans((result) => {
        if (!result.success) {
          reject(new Error(result.error || 'Failed to fetch active subscription plans'));
          return;
        }

        resolve(Array.isArray(result.plans) ? result.plans as unknown as OverwolfDetailedActivePlan[] : []);
      });
    });
  },

  isSyncReady: () => {
    return Boolean(canReadDetailedActivePlans() && canListenSubscriptionChanges());
  },

  getCapabilities: (): SubscriptionProviderCapabilities => {
    const overwolfAvailable = isOverwolfAvailable();
    const readDetailedActivePlans = canReadDetailedActivePlans();
    const listenSubscriptionChanges = canListenSubscriptionChanges();
    const openInAppPurchase = canOpenInAppPurchase();

    return {
      isOverwolfAvailable: overwolfAvailable,
      canReadDetailedActivePlans: readDetailedActivePlans,
      canListenSubscriptionChanges: listenSubscriptionChanges,
      canOpenInAppPurchase: openInAppPurchase,
      syncReady: Boolean(readDetailedActivePlans && listenSubscriptionChanges)
    };
  },

  canOpenInAppPurchase,

  openInAppPurchase: (planId: number, theme: OverwolfSubscriptionInAppTheme) => {
    if (!isOverwolfAvailable() || !canOpenInAppPurchase()) {
      return false;
    }

    overwolf.profile.subscriptions.inapp.show(planId, theme);
    return true;
  },

  waitForSubscriptionChange: async (timeoutMs = 45000): Promise<{ changed: boolean; timedOut: boolean }> => {
    if (!isOverwolfAvailable() || !canListenSubscriptionChanges()) {
      return {
        changed: false,
        timedOut: false
      };
    }

    return new Promise((resolve) => {
      let settled = false;

      const handleSubscriptionChanged = () => {
        if (settled) {
          return;
        }

        settled = true;
        window.clearTimeout(timeoutId);
        overwolf.profile.subscriptions.onSubscriptionChanged.removeListener(handleSubscriptionChanged);
        resolve({ changed: true, timedOut: false });
      };

      const timeoutId = window.setTimeout(() => {
        if (settled) {
          return;
        }

        settled = true;
        overwolf.profile.subscriptions.onSubscriptionChanged.removeListener(handleSubscriptionChanged);
        resolve({ changed: false, timedOut: true });
      }, timeoutMs);

      overwolf.profile.subscriptions.onSubscriptionChanged.addListener(handleSubscriptionChanged);
    });
  },

  subscribeToSubscriptionChanges: (callback: () => void) => {
    if (!isOverwolfAvailable() || !canListenSubscriptionChanges()) {
      return () => {};
    }

    const handleSubscriptionChanged = () => {
      callback();
    };

    overwolf.profile.subscriptions.onSubscriptionChanged.addListener(handleSubscriptionChanged);

    return () => {
      overwolf.profile.subscriptions.onSubscriptionChanged.removeListener(handleSubscriptionChanged);
    };
  }
};
