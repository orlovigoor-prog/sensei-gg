/// <reference types="@overwolf/types" />

import {
  buildSubscriptionEntitlements,
  resolveOverwolfSubscriptionEntitlements,
  type ResolvedOverwolfSubscriptionEntitlements,
  type SenseiSubscriptionEntitlements
} from './subscriptionEntitlements';
import {
  normalizeSubscriptionDiagnostics,
  normalizeSubscriptionFoundationConfig,
  resolveSubscriptionProviderStrategy,
  type NormalizedSubscriptionDiagnostics,
  type NormalizedSubscriptionFoundationConfig,
  type SubscriptionProviderCapabilities,
  type SubscriptionProviderStrategy
} from './subscriptionProviderDomain';
import {
  subscriptionProviderAdapter,
  type SubscriptionFoundationConfigResponse
} from './subscriptionProviderAdapter';
import { fetchSubscriptionDiagnostics, type SubscriptionDiagnosticsResponse } from './subscriptionDevTools';

export const fetchSubscriptionFoundationConfig = async (): Promise<SubscriptionFoundationConfigResponse | null> => {
  return subscriptionProviderAdapter.fetchFoundationConfig();
};

export interface ResolvedSubscriptionServiceState {
  foundationConfig: SubscriptionFoundationConfigResponse | null;
  normalizedFoundation: NormalizedSubscriptionFoundationConfig;
  diagnostics: SubscriptionDiagnosticsResponse | null;
  normalizedDiagnostics: NormalizedSubscriptionDiagnostics;
  entitlements: SenseiSubscriptionEntitlements;
  liveEntitlements: ResolvedOverwolfSubscriptionEntitlements | null;
  entitlementComparison: {
    effectivePlan: SenseiSubscriptionEntitlements['plan'];
    effectiveSource: SenseiSubscriptionEntitlements['source'];
    diagnosticsPlan: SenseiSubscriptionEntitlements['plan'] | null;
    diagnosticsSource: SenseiSubscriptionEntitlements['source'] | null;
    livePlan: SenseiSubscriptionEntitlements['plan'] | null;
    liveSource: SenseiSubscriptionEntitlements['source'] | null;
    liveAvailable: boolean;
    diagnosticsAvailable: boolean;
    liveVsEffectivePlanMismatch: boolean;
    liveVsEffectiveSourceMismatch: boolean;
    diagnosticsVsEffectivePlanMismatch: boolean;
    diagnosticsVsEffectiveSourceMismatch: boolean;
    diagnosticsVsLivePlanMismatch: boolean;
    diagnosticsVsLiveSourceMismatch: boolean;
    hasAnyDivergence: boolean;
  };
  syncOutcome: 'overwolf-live-premium' | 'overwolf-live-free' | 'local-dev-fallback' | 'config-missing-fallback' | 'capability-missing-fallback' | 'overwolf-error-fallback';
  fallbackReason: 'premium-plan-not-configured' | 'overwolf-capabilities-missing' | 'overwolf-active-plans-unavailable' | 'local-dev-entitlements-unavailable' | null;
  providerCapabilities: SubscriptionProviderCapabilities;
  providerStrategy: SubscriptionProviderStrategy;
}

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

const resolveFallbackEntitlements = async (): Promise<{
  entitlements: SenseiSubscriptionEntitlements;
  fallbackReason: 'local-dev-entitlements-unavailable' | null;
}> => {
  try {
    return {
      entitlements: await fetchLocalDevEntitlements(),
      fallbackReason: null
    };
  } catch {
    return {
      entitlements: buildSubscriptionEntitlements('free', 'fallback-free'),
      fallbackReason: 'local-dev-entitlements-unavailable'
    };
  }
};

export const resolveSubscriptionEntitlements = async (
  foundationConfigOverride: SubscriptionFoundationConfigResponse | null = null
): Promise<SenseiSubscriptionEntitlements> => {
  const resolved = await resolveSubscriptionEntitlementsWithSource(foundationConfigOverride);
  return resolved.entitlements;
};

export const resolveSubscriptionEntitlementsWithSource = async (
  foundationConfigOverride: SubscriptionFoundationConfigResponse | null = null
): Promise<{
  entitlements: SenseiSubscriptionEntitlements;
  liveEntitlements: ResolvedOverwolfSubscriptionEntitlements | null;
  syncOutcome: ResolvedSubscriptionServiceState['syncOutcome'];
  fallbackReason: ResolvedSubscriptionServiceState['fallbackReason'];
}> => {
  const foundationConfig = foundationConfigOverride ?? await fetchSubscriptionFoundationConfig();
  const providerCapabilities = subscriptionProviderAdapter.getCapabilities();

  if (
    !foundationConfig?.premiumPlanConfigured
    || typeof foundationConfig.premiumPlanId !== 'number'
    || foundationConfig.premiumPlanId <= 0
  ) {
    const fallback = await resolveFallbackEntitlements();
    return {
      entitlements: fallback.entitlements,
      liveEntitlements: null,
      syncOutcome: 'config-missing-fallback',
      fallbackReason: fallback.fallbackReason ?? 'premium-plan-not-configured'
    };
  }

  if (!providerCapabilities.canReadDetailedActivePlans) {
    const fallback = await resolveFallbackEntitlements();
    return {
      entitlements: fallback.entitlements,
      liveEntitlements: null,
      syncOutcome: 'capability-missing-fallback',
      fallbackReason: fallback.fallbackReason ?? 'overwolf-capabilities-missing'
    };
  }

  try {
    const activePlans = await subscriptionProviderAdapter.getDetailedActivePlans();
    if (activePlans) {
      const liveEntitlements = resolveOverwolfSubscriptionEntitlements(activePlans, foundationConfig.premiumPlanId);
      return {
        entitlements: liveEntitlements.entitlements,
        liveEntitlements,
        syncOutcome: liveEntitlements.hasMatchingPremiumPlan ? 'overwolf-live-premium' : 'overwolf-live-free',
        fallbackReason: null
      };
    }
  } catch (error) {
    console.warn('Failed to resolve Overwolf subscription state, falling back to local dev entitlements', error);
  }

  const fallback = await resolveFallbackEntitlements();
  return {
    entitlements: fallback.entitlements,
    liveEntitlements: null,
    syncOutcome: 'overwolf-error-fallback',
    fallbackReason: fallback.fallbackReason ?? 'overwolf-active-plans-unavailable'
  };
};

const buildEntitlementComparison = (input: {
  effective: SenseiSubscriptionEntitlements;
  diagnostics: SenseiSubscriptionEntitlements | null;
  live: ResolvedOverwolfSubscriptionEntitlements | null;
}): ResolvedSubscriptionServiceState['entitlementComparison'] => {
  const diagnosticsEntitlements = input.diagnostics;
  const liveEntitlements = input.live?.entitlements ?? null;

  const liveVsEffectivePlanMismatch = Boolean(liveEntitlements && liveEntitlements.plan !== input.effective.plan);
  const liveVsEffectiveSourceMismatch = Boolean(liveEntitlements && liveEntitlements.source !== input.effective.source);
  const diagnosticsVsEffectivePlanMismatch = Boolean(diagnosticsEntitlements && diagnosticsEntitlements.plan !== input.effective.plan);
  const diagnosticsVsEffectiveSourceMismatch = Boolean(diagnosticsEntitlements && diagnosticsEntitlements.source !== input.effective.source);
  const diagnosticsVsLivePlanMismatch = Boolean(diagnosticsEntitlements && liveEntitlements && diagnosticsEntitlements.plan !== liveEntitlements.plan);
  const diagnosticsVsLiveSourceMismatch = Boolean(diagnosticsEntitlements && liveEntitlements && diagnosticsEntitlements.source !== liveEntitlements.source);

  return {
    effectivePlan: input.effective.plan,
    effectiveSource: input.effective.source,
    diagnosticsPlan: diagnosticsEntitlements?.plan ?? null,
    diagnosticsSource: diagnosticsEntitlements?.source ?? null,
    livePlan: liveEntitlements?.plan ?? null,
    liveSource: liveEntitlements?.source ?? null,
    liveAvailable: Boolean(liveEntitlements),
    diagnosticsAvailable: Boolean(diagnosticsEntitlements),
    liveVsEffectivePlanMismatch,
    liveVsEffectiveSourceMismatch,
    diagnosticsVsEffectivePlanMismatch,
    diagnosticsVsEffectiveSourceMismatch,
    diagnosticsVsLivePlanMismatch,
    diagnosticsVsLiveSourceMismatch,
    hasAnyDivergence: Boolean(
      liveVsEffectivePlanMismatch
      || liveVsEffectiveSourceMismatch
      || diagnosticsVsEffectivePlanMismatch
      || diagnosticsVsEffectiveSourceMismatch
      || diagnosticsVsLivePlanMismatch
      || diagnosticsVsLiveSourceMismatch
    )
  };
};

export const resolveSubscriptionServiceState = async (): Promise<ResolvedSubscriptionServiceState> => {
  const [foundationConfig, diagnostics] = await Promise.all([
    fetchSubscriptionFoundationConfig(),
    fetchSubscriptionDiagnostics()
  ]);

  const resolvedEntitlements = await resolveSubscriptionEntitlementsWithSource(foundationConfig);
  const normalizedFoundation = normalizeSubscriptionFoundationConfig(foundationConfig);
  const normalizedDiagnostics = normalizeSubscriptionDiagnostics(diagnostics, normalizedFoundation);
  const providerCapabilities = subscriptionProviderAdapter.getCapabilities();
  const providerStrategy = resolveSubscriptionProviderStrategy({
    foundation: normalizedFoundation,
    capabilities: providerCapabilities,
    diagnostics: normalizedDiagnostics
  });
  const entitlementComparison = buildEntitlementComparison({
    effective: resolvedEntitlements.entitlements,
    diagnostics: normalizedDiagnostics.entitlements,
    live: resolvedEntitlements.liveEntitlements
  });

  return {
    foundationConfig,
    normalizedFoundation,
    diagnostics,
    normalizedDiagnostics,
    entitlements: resolvedEntitlements.entitlements,
    liveEntitlements: resolvedEntitlements.liveEntitlements,
    entitlementComparison,
    syncOutcome: resolvedEntitlements.syncOutcome,
    fallbackReason: resolvedEntitlements.fallbackReason,
    providerCapabilities,
    providerStrategy
  };
};

export type { SubscriptionFoundationConfigResponse };
