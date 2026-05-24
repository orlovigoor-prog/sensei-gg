/// <reference types="@overwolf/types" />

import { fetchSubscriptionFoundationConfig, type SubscriptionFoundationConfigResponse } from './overwolfSubscriptions';
import { normalizeSubscriptionFoundationConfig } from './subscriptionProviderDomain';
import { subscriptionProviderAdapter, type OverwolfSubscriptionInAppTheme } from './subscriptionProviderAdapter';

export type SubscriptionPurchaseAvailabilityReason =
  | 'ready'
  | 'overwolf-unavailable'
  | 'subscription-api-unavailable'
  | 'premium-plan-not-configured';

export interface SubscriptionPurchaseAvailability {
  canOpenPurchaseFlow: boolean;
  reason: SubscriptionPurchaseAvailabilityReason;
  premiumPlanId: number | null;
  storeId: string | null;
  provider: string | null;
  integrationReady: boolean;
}

export interface OpenPremiumSubscriptionPurchaseResult extends SubscriptionPurchaseAvailability {
  started: boolean;
}

export interface WaitForSubscriptionChangeResult {
  changed: boolean;
  timedOut: boolean;
}

export const resolveSubscriptionPurchaseAvailability = (
  foundationConfig: SubscriptionFoundationConfigResponse | null
): SubscriptionPurchaseAvailability => {
  const normalizedFoundation = normalizeSubscriptionFoundationConfig(foundationConfig);
  const providerCapabilities = subscriptionProviderAdapter.getCapabilities();
  const premiumPlanId = normalizedFoundation.premiumPlanId;

  if (!premiumPlanId) {
    return {
      canOpenPurchaseFlow: false,
      reason: 'premium-plan-not-configured',
      premiumPlanId: null,
      storeId: normalizedFoundation.storeId,
      provider: normalizedFoundation.provider,
      integrationReady: normalizedFoundation.integrationReady
    };
  }

  if (!providerCapabilities.isOverwolfAvailable && normalizedFoundation.premiumPlanConfigured) {
    return {
      canOpenPurchaseFlow: false,
      reason: 'overwolf-unavailable',
      premiumPlanId,
      storeId: normalizedFoundation.storeId,
      provider: normalizedFoundation.provider,
      integrationReady: normalizedFoundation.integrationReady
    };
  }

  if (!providerCapabilities.canOpenInAppPurchase) {
    return {
      canOpenPurchaseFlow: false,
      reason: 'subscription-api-unavailable',
      premiumPlanId,
      storeId: normalizedFoundation.storeId,
      provider: normalizedFoundation.provider,
      integrationReady: normalizedFoundation.integrationReady
    };
  }

  return {
    canOpenPurchaseFlow: true,
    reason: 'ready',
    premiumPlanId,
    storeId: normalizedFoundation.storeId,
    provider: normalizedFoundation.provider,
    integrationReady: normalizedFoundation.integrationReady
  };
};

export const getSubscriptionPurchaseAvailability = async (): Promise<SubscriptionPurchaseAvailability> => {
  const foundationConfig = await fetchSubscriptionFoundationConfig();
  return resolveSubscriptionPurchaseAvailability(foundationConfig);
};

export const isSubscriptionSyncReady = () => {
  return subscriptionProviderAdapter.getCapabilities().syncReady;
};

export const openPremiumSubscriptionPurchase = async (
  theme: OverwolfSubscriptionInAppTheme = 'Dark'
): Promise<OpenPremiumSubscriptionPurchaseResult> => {
  const availability = await getSubscriptionPurchaseAvailability();

  if (!availability.canOpenPurchaseFlow || availability.premiumPlanId === null) {
    return {
      ...availability,
      started: false
    };
  }

  const started = subscriptionProviderAdapter.openInAppPurchase(availability.premiumPlanId, theme);

  return {
    ...availability,
    started
  };
};

export const waitForSubscriptionChange = async (timeoutMs = 45000): Promise<WaitForSubscriptionChangeResult> => {
  return subscriptionProviderAdapter.waitForSubscriptionChange(timeoutMs);
};

export const subscribeToSubscriptionChanges = (callback: () => void) => {
  return subscriptionProviderAdapter.subscribeToSubscriptionChanges(callback);
};
