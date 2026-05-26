import { buildAiHistoryFoundationSnapshot, fetchAiHistoryFoundationConfig, normalizeAiHistoryFoundation } from './aiHistoryFoundation';
import { fetchPremiumCapabilitiesFoundationConfig, normalizePremiumCapabilitiesFoundation } from './premiumCapabilitiesFoundation';
import { fetchPremiumPersistenceFoundationConfig, normalizePremiumPersistenceFoundation } from './premiumPersistenceFoundation';
import type { AppDispatch } from '../store';
import type { SubscriptionPurchaseFlowSnapshot } from './subscriptionRuntimeState';
import { hydrateAiHistoryFoundation } from '../store/aiHistorySlice';
import { hydrateEntitlements, hydrateSubscriptionRuntime } from '../store/subscriptionSlice';
import { isSubscriptionSyncReady, resolveSubscriptionPurchaseAvailability } from './overwolfSubscriptionActions';
import { resolveSubscriptionServiceState } from './overwolfSubscriptions';
import { fetchSubscriptionDevState, fetchSubscriptionFoundationDiagnostics, getSubscriptionDevEntitlements } from './subscriptionDevTools';
import { buildSubscriptionRuntimeSnapshot } from './subscriptionRuntimeState';

interface SyncSubscriptionRuntimeOptions {
  dispatch: AppDispatch;
  purchaseFlow: SubscriptionPurchaseFlowSnapshot;
}

export const syncSubscriptionRuntime = async ({
  dispatch,
  purchaseFlow
}: SyncSubscriptionRuntimeOptions) => {
  const syncedAt = new Date().toISOString();

  const [serviceStateResult, aiHistoryConfigResult, devStateResult, premiumCapabilitiesResult, foundationDiagnosticsResult, premiumPersistenceResult] = await Promise.allSettled([
    resolveSubscriptionServiceState(),
    fetchAiHistoryFoundationConfig(),
    fetchSubscriptionDevState(),
    fetchPremiumCapabilitiesFoundationConfig(),
    fetchSubscriptionFoundationDiagnostics(),
    fetchPremiumPersistenceFoundationConfig()
  ]);

  let syncError: string | null = null;

  const serviceState = serviceStateResult.status === 'fulfilled' ? serviceStateResult.value : null;
  if (serviceStateResult.status === 'rejected') {
    syncError = serviceStateResult.reason instanceof Error ? serviceStateResult.reason.message : 'Failed to resolve subscription service state';
  }

  const aiHistoryConfig = aiHistoryConfigResult.status === 'fulfilled' ? aiHistoryConfigResult.value : null;
  const normalizedAiHistoryFoundation = normalizeAiHistoryFoundation(aiHistoryConfig);
  if (!syncError && aiHistoryConfigResult.status === 'rejected') {
    syncError = aiHistoryConfigResult.reason instanceof Error ? aiHistoryConfigResult.reason.message : 'Failed to fetch AI history foundation config';
  }

  const premiumCapabilitiesConfig = premiumCapabilitiesResult.status === 'fulfilled' ? premiumCapabilitiesResult.value : null;
  const normalizedPremiumCapabilities = normalizePremiumCapabilitiesFoundation(premiumCapabilitiesConfig);
  if (!syncError && premiumCapabilitiesResult.status === 'rejected') {
    syncError = premiumCapabilitiesResult.reason instanceof Error ? premiumCapabilitiesResult.reason.message : 'Failed to fetch premium capabilities foundation config';
  }

  const foundationDiagnostics = foundationDiagnosticsResult.status === 'fulfilled' ? foundationDiagnosticsResult.value : null;
  if (!syncError && foundationDiagnosticsResult.status === 'rejected') {
    syncError = foundationDiagnosticsResult.reason instanceof Error ? foundationDiagnosticsResult.reason.message : 'Failed to fetch foundation diagnostics';
  }

  const premiumPersistenceConfig = premiumPersistenceResult.status === 'fulfilled' ? premiumPersistenceResult.value : null;
  const normalizedPremiumPersistence = normalizePremiumPersistenceFoundation(premiumPersistenceConfig);
  if (!syncError && premiumPersistenceResult.status === 'rejected') {
    syncError = premiumPersistenceResult.reason instanceof Error ? premiumPersistenceResult.reason.message : 'Failed to fetch premium persistence foundation config';
  }

  const devState = devStateResult.status === 'fulfilled' ? devStateResult.value : null;
  if (!syncError && devStateResult.status === 'rejected') {
    syncError = devStateResult.reason instanceof Error ? devStateResult.reason.message : 'Failed to fetch subscription dev state';
  }

  const fallbackEntitlements = getSubscriptionDevEntitlements(devState);
  const entitlements = serviceState?.entitlements ?? serviceState?.normalizedDiagnostics.entitlements ?? fallbackEntitlements;
  const purchaseAvailability = resolveSubscriptionPurchaseAvailability(serviceState?.foundationConfig ?? null);
  const liveEntitlements = serviceState?.liveEntitlements ?? null;

  dispatch(hydrateEntitlements(entitlements));

  dispatch(hydrateSubscriptionRuntime(buildSubscriptionRuntimeSnapshot({
    providerStrategy: serviceState?.providerStrategy ?? 'local-dev-foundation',
    diagnostics: {
      provider: serviceState?.normalizedDiagnostics.provider ?? null,
      integrationReady: serviceState?.normalizedDiagnostics.integrationReady ?? false,
      storeIdConfigured: serviceState?.normalizedDiagnostics.storeIdConfigured ?? false,
      premiumPlanConfigured: serviceState?.normalizedDiagnostics.premiumPlanConfigured ?? false,
      premiumPlanId: serviceState?.normalizedDiagnostics.premiumPlanId ?? null,
      devPlan: devState?.plan ?? serviceState?.normalizedDiagnostics.devPlan ?? null,
      devScenario: devState?.scenario ?? serviceState?.normalizedDiagnostics.devScenario ?? null,
      devStateUpdatedAt: devState?.updatedAt ?? serviceState?.normalizedDiagnostics.devStateUpdatedAt ?? null,
      diagnosticsReady: serviceState?.normalizedDiagnostics.diagnosticsReady ?? false,
      manifestProfileApiRequired: serviceState?.normalizedDiagnostics.manifestProfileApiRequired ?? true,
      storeConfigReady: serviceState?.normalizedDiagnostics.storeConfigReady ?? false,
      premiumPlanReady: serviceState?.normalizedDiagnostics.premiumPlanReady ?? false,
      localScenarioSwitchingAvailable: serviceState?.normalizedDiagnostics.localScenarioSwitchingAvailable ?? false
    },
    purchaseAvailability,
    purchaseFlow,
    liveSubscription: {
      entitlementSource: liveEntitlements?.entitlements.source ?? null,
      activePlanCount: liveEntitlements?.activePlanCount ?? 0,
      hasMatchingPremiumPlan: liveEntitlements?.hasMatchingPremiumPlan ?? false,
      matchingPremiumPlanId: liveEntitlements?.matchingPremiumPlanId ?? null,
      matchingPremiumPlanState: liveEntitlements?.matchingPremiumPlanState ?? null
    },
    syncOutcome: {
      outcome: serviceState?.syncOutcome ?? 'local-dev-fallback',
      fallbackReason: serviceState?.fallbackReason ?? null
    },
    comparison: {
      diagnosticsAvailable: serviceState?.entitlementComparison.diagnosticsAvailable ?? false,
      liveAvailable: serviceState?.entitlementComparison.liveAvailable ?? false,
      effectivePlan: serviceState?.entitlementComparison.effectivePlan ?? entitlements.plan,
      effectiveSource: serviceState?.entitlementComparison.effectiveSource ?? entitlements.source,
      diagnosticsPlan: serviceState?.entitlementComparison.diagnosticsPlan ?? null,
      diagnosticsSource: serviceState?.entitlementComparison.diagnosticsSource ?? null,
      livePlan: serviceState?.entitlementComparison.livePlan ?? null,
      liveSource: serviceState?.entitlementComparison.liveSource ?? null,
      liveVsEffectivePlanMismatch: serviceState?.entitlementComparison.liveVsEffectivePlanMismatch ?? false,
      liveVsEffectiveSourceMismatch: serviceState?.entitlementComparison.liveVsEffectiveSourceMismatch ?? false,
      diagnosticsVsEffectivePlanMismatch: serviceState?.entitlementComparison.diagnosticsVsEffectivePlanMismatch ?? false,
      diagnosticsVsEffectiveSourceMismatch: serviceState?.entitlementComparison.diagnosticsVsEffectiveSourceMismatch ?? false,
      diagnosticsVsLivePlanMismatch: serviceState?.entitlementComparison.diagnosticsVsLivePlanMismatch ?? false,
      diagnosticsVsLiveSourceMismatch: serviceState?.entitlementComparison.diagnosticsVsLiveSourceMismatch ?? false,
      hasAnyDivergence: serviceState?.entitlementComparison.hasAnyDivergence ?? false
    },
    providerCapabilities: {
      syncReady: Boolean(serviceState?.providerCapabilities.syncReady) && isSubscriptionSyncReady()
    },
    lastSyncAt: syncedAt,
    lastSyncError: syncError,
    foundationDiagnostics: {
      available: Boolean(foundationDiagnostics),
      subscriptionReady: foundationDiagnostics?.readiness?.subscriptionReady ?? false,
      accountLinkageReady: foundationDiagnostics?.readiness?.accountLinkageSyncReady ?? false,
      aiHistorySyncReady: foundationDiagnostics?.readiness?.aiHistorySyncReady ?? false,
      progressionSyncReady: foundationDiagnostics?.readiness?.progressionSyncReady ?? false,
      weeklyReportsSyncReady: foundationDiagnostics?.readiness?.weeklyReportsSyncReady ?? false
    },
    premiumPersistence: {
      configured: normalizedPremiumPersistence.configured,
      identityProvider: normalizedPremiumPersistence.identityProvider,
      syncReady: normalizedPremiumPersistence.syncReady,
      requiredForPremiumPersistence: normalizedPremiumPersistence.requiredForPremiumPersistence
    },
    aiHistory: {
      configured: normalizedAiHistoryFoundation.configured,
      persistence: normalizedAiHistoryFoundation.persistence,
      syncReady: normalizedAiHistoryFoundation.syncReady,
      premiumRequired: normalizedAiHistoryFoundation.premiumRequired
    },
    premiumCapabilities: {
      progression: normalizedPremiumCapabilities.progression,
      weeklyReports: normalizedPremiumCapabilities.weeklyReports
    }
  })));

  dispatch(hydrateAiHistoryFoundation(buildAiHistoryFoundationSnapshot(normalizedAiHistoryFoundation)));
};
