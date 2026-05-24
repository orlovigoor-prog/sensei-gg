import type { SubscriptionDiagnosticsResponse, SubscriptionDevPlan } from './subscriptionDevTools';
import type { SubscriptionFoundationConfigResponse } from './subscriptionProviderAdapter';
import type { SenseiSubscriptionEntitlements } from './subscriptionEntitlements';

export interface SubscriptionProviderCapabilities {
  isOverwolfAvailable: boolean;
  canReadDetailedActivePlans: boolean;
  canListenSubscriptionChanges: boolean;
  canOpenInAppPurchase: boolean;
  syncReady: boolean;
}

export type SubscriptionProviderStrategy = 'local-dev-foundation' | 'overwolf-live' | 'mixed-fallback';

export interface NormalizedSubscriptionFoundationConfig {
  provider: string | null;
  integrationReady: boolean;
  storeIdConfigured: boolean;
  premiumPlanConfigured: boolean;
  storeId: string | null;
  premiumPlanId: number | null;
  devPlan: SubscriptionDevPlan | null;
}

export interface NormalizedSubscriptionDiagnostics {
  diagnosticsReady: boolean;
  providerStrategy: SubscriptionProviderStrategy;
  provider: string | null;
  integrationReady: boolean;
  storeIdConfigured: boolean;
  premiumPlanConfigured: boolean;
  storeId: string | null;
  premiumPlanId: number | null;
  devPlan: SubscriptionDevPlan | null;
  devScenario: string | null;
  devStateUpdatedAt: string | null;
  manifestProfileApiRequired: boolean;
  storeConfigReady: boolean;
  premiumPlanReady: boolean;
  localScenarioSwitchingAvailable: boolean;
  entitlements: SenseiSubscriptionEntitlements | null;
  notes: string[];
}

export const normalizeSubscriptionFoundationConfig = (
  config: SubscriptionFoundationConfigResponse | null
): NormalizedSubscriptionFoundationConfig => ({
  provider: config?.provider ?? null,
  integrationReady: Boolean(config?.integrationReady),
  storeIdConfigured: Boolean(config?.storeIdConfigured),
  premiumPlanConfigured: Boolean(config?.premiumPlanConfigured),
  storeId: config?.storeId ?? null,
  premiumPlanId: typeof config?.premiumPlanId === 'number' && config.premiumPlanId > 0 ? config.premiumPlanId : null,
  devPlan: config?.devPlan === 'premium' ? 'premium' : config?.devPlan === 'free' ? 'free' : null
});

export const normalizeSubscriptionDiagnostics = (
  diagnostics: SubscriptionDiagnosticsResponse | null,
  foundation: NormalizedSubscriptionFoundationConfig
): NormalizedSubscriptionDiagnostics => ({
  diagnosticsReady: Boolean(diagnostics),
  providerStrategy: 'local-dev-foundation',
  provider: diagnostics?.provider ?? foundation.provider,
  integrationReady: Boolean(diagnostics?.integrationReady ?? foundation.integrationReady),
  storeIdConfigured: Boolean(diagnostics?.storeIdConfigured ?? foundation.storeIdConfigured),
  premiumPlanConfigured: Boolean(diagnostics?.premiumPlanConfigured ?? foundation.premiumPlanConfigured),
  storeId: diagnostics?.storeId ?? foundation.storeId,
  premiumPlanId: typeof diagnostics?.premiumPlanId === 'number' && diagnostics.premiumPlanId > 0
    ? diagnostics.premiumPlanId
    : foundation.premiumPlanId,
  devPlan: diagnostics?.devState?.plan === 'premium'
    ? 'premium'
    : diagnostics?.devState?.plan === 'free'
      ? 'free'
      : foundation.devPlan,
  devScenario: diagnostics?.devState?.scenario ?? null,
  devStateUpdatedAt: diagnostics?.devState?.updatedAt ?? null,
  manifestProfileApiRequired: diagnostics?.overwolfTestReadiness?.manifestProfileApiRequired ?? true,
  storeConfigReady: diagnostics?.overwolfTestReadiness?.storeConfigReady ?? false,
  premiumPlanReady: diagnostics?.overwolfTestReadiness?.premiumPlanReady ?? false,
  localScenarioSwitchingAvailable: diagnostics?.overwolfTestReadiness?.localScenarioSwitchingAvailable ?? false,
  entitlements: diagnostics?.entitlements ?? null,
  notes: Array.isArray(diagnostics?.notes) ? diagnostics.notes : []
});

export const resolveSubscriptionProviderStrategy = (input: {
  foundation: NormalizedSubscriptionFoundationConfig;
  capabilities: SubscriptionProviderCapabilities;
  diagnostics: NormalizedSubscriptionDiagnostics;
}): SubscriptionProviderStrategy => {
  const { foundation, capabilities, diagnostics } = input;

  if (
    foundation.premiumPlanConfigured
    && capabilities.isOverwolfAvailable
    && capabilities.canReadDetailedActivePlans
    && capabilities.canListenSubscriptionChanges
  ) {
    return 'overwolf-live';
  }

  if (
    diagnostics.diagnosticsReady
    && (capabilities.isOverwolfAvailable || foundation.premiumPlanConfigured)
  ) {
    return 'mixed-fallback';
  }

  return 'local-dev-foundation';
};
