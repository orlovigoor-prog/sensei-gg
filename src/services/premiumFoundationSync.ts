import { buildAiHistoryFoundationSnapshot, fetchAiHistoryFoundationConfig, normalizeAiHistoryFoundation } from './aiHistoryFoundation';
import { fetchPremiumCapabilitiesFoundationConfig, normalizePremiumCapabilitiesFoundation } from './premiumCapabilitiesFoundation';
import { fetchPremiumPersistenceFoundationConfig, normalizePremiumPersistenceFoundation } from './premiumPersistenceFoundation';
import type { AppDispatch } from '../store';
import { hydrateAiHistoryFoundation } from '../store/aiHistorySlice';
import { hydrateEntitlements, hydrateSubscriptionRuntime } from '../store/subscriptionSlice';
import { resolveSubscriptionPurchaseAvailability, isSubscriptionSyncReady } from './overwolfSubscriptionActions';
import { fetchSubscriptionFoundationConfig, resolveSubscriptionEntitlements } from './overwolfSubscriptions';
import {
  normalizeSubscriptionDiagnostics,
  normalizeSubscriptionFoundationConfig,
  resolveSubscriptionProviderStrategy
} from './subscriptionProviderDomain';
import { subscriptionProviderAdapter } from './subscriptionProviderAdapter';
import {
  fetchSubscriptionDevState,
  fetchSubscriptionDiagnostics,
  fetchSubscriptionFoundationDiagnostics,
  getSubscriptionDevEntitlements
} from './subscriptionDevTools';
import { buildSubscriptionRuntimeSnapshot, type SubscriptionPurchaseFlowSnapshot } from './subscriptionRuntimeState';

interface SyncPremiumFoundationOptions {
  dispatch: AppDispatch;
  purchaseFlow: SubscriptionPurchaseFlowSnapshot;
}

export const syncPremiumFoundation = async ({
  dispatch,
  purchaseFlow
}: SyncPremiumFoundationOptions) => {
  const syncedAt = new Date().toISOString();

  const [entitlementsResult, foundationConfigResult, aiHistoryConfigResult, diagnosticsResult, devStateResult, premiumCapabilitiesResult, foundationDiagnosticsResult, premiumPersistenceResult] = await Promise.allSettled([
    resolveSubscriptionEntitlements(),
    fetchSubscriptionFoundationConfig(),
    fetchAiHistoryFoundationConfig(),
    fetchSubscriptionDiagnostics(),
    fetchSubscriptionDevState(),
    fetchPremiumCapabilitiesFoundationConfig(),
    fetchSubscriptionFoundationDiagnostics(),
    fetchPremiumPersistenceFoundationConfig()
  ]);

  let syncError: string | null = null;

  if (entitlementsResult.status === 'fulfilled') {
    dispatch(hydrateEntitlements(entitlementsResult.value));
  } else {
    syncError = entitlementsResult.reason instanceof Error ? entitlementsResult.reason.message : 'Failed to resolve subscription entitlements';
  }

  const foundationConfig = foundationConfigResult.status === 'fulfilled' ? foundationConfigResult.value : null;
  if (!syncError && foundationConfigResult.status === 'rejected') {
    syncError = foundationConfigResult.reason instanceof Error ? foundationConfigResult.reason.message : 'Failed to fetch subscription config';
  }

  const purchaseAvailability = resolveSubscriptionPurchaseAvailability(foundationConfig);
  const normalizedFoundation = normalizeSubscriptionFoundationConfig(foundationConfig);

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

  const diagnostics = diagnosticsResult.status === 'fulfilled' ? diagnosticsResult.value : null;
  if (!syncError && diagnosticsResult.status === 'rejected') {
    syncError = diagnosticsResult.reason instanceof Error ? diagnosticsResult.reason.message : 'Failed to fetch subscription diagnostics';
  }

  const devState = devStateResult.status === 'fulfilled' ? devStateResult.value : null;
  if (!syncError && devStateResult.status === 'rejected') {
    syncError = devStateResult.reason instanceof Error ? devStateResult.reason.message : 'Failed to fetch subscription dev state';
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

  const normalizedDiagnostics = normalizeSubscriptionDiagnostics(diagnostics, normalizedFoundation);
  const providerCapabilities = subscriptionProviderAdapter.getCapabilities();
  const providerStrategy = resolveSubscriptionProviderStrategy({
    foundation: normalizedFoundation,
    capabilities: providerCapabilities,
    diagnostics: normalizedDiagnostics
  });

  const fallbackDevEntitlements = getSubscriptionDevEntitlements(devState);

  if (
    entitlementsResult.status !== 'fulfilled'
    && (devState || normalizedDiagnostics.entitlements)
  ) {
    dispatch(hydrateEntitlements(normalizedDiagnostics.entitlements ?? fallbackDevEntitlements));
  }

  dispatch(hydrateSubscriptionRuntime(buildSubscriptionRuntimeSnapshot({
    providerStrategy,
    diagnostics: {
      ...normalizedDiagnostics,
      devPlan: devState?.plan ?? normalizedDiagnostics.devPlan,
      devScenario: devState?.scenario ?? normalizedDiagnostics.devScenario,
      devStateUpdatedAt: devState?.updatedAt ?? normalizedDiagnostics.devStateUpdatedAt
    },
    purchaseAvailability,
    purchaseFlow,
    liveSubscription: {
      entitlementSource: null,
      activePlanCount: 0,
      hasMatchingPremiumPlan: false,
      matchingPremiumPlanId: null,
      matchingPremiumPlanState: null
    },
    providerCapabilities: {
      syncReady: providerCapabilities.syncReady && isSubscriptionSyncReady()
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
