import type { SubscriptionState, SubscriptionRuntimeHydrationPayload } from '../store/subscriptionSlice';
import type { SubscriptionPurchaseAvailability } from './overwolfSubscriptionActions';
import type { SubscriptionProviderCapabilities, SubscriptionProviderStrategy, NormalizedSubscriptionDiagnostics } from './subscriptionProviderDomain';

export interface SubscriptionPurchaseFlowSnapshot {
  purchaseFlowInProgress: boolean;
  purchaseFlowStatus: SubscriptionState['purchaseFlowStatus'];
  purchaseFlowStartedAt: string | null;
  purchaseFlowCompletedAt: string | null;
  purchaseFlowError: string | null;
}

export const getSubscriptionPurchaseFlowSnapshot = (
  subscription: Pick<
    SubscriptionState,
    'purchaseFlowInProgress'
    | 'purchaseFlowStatus'
    | 'purchaseFlowStartedAt'
    | 'purchaseFlowCompletedAt'
    | 'purchaseFlowError'
  >
): SubscriptionPurchaseFlowSnapshot => {
  return {
    purchaseFlowInProgress: subscription.purchaseFlowInProgress,
    purchaseFlowStatus: subscription.purchaseFlowStatus,
    purchaseFlowStartedAt: subscription.purchaseFlowStartedAt,
    purchaseFlowCompletedAt: subscription.purchaseFlowCompletedAt,
    purchaseFlowError: subscription.purchaseFlowError
  };
};

export interface BuildSubscriptionRuntimeSnapshotInput {
  providerStrategy: SubscriptionProviderStrategy;
  diagnostics: Pick<
    NormalizedSubscriptionDiagnostics,
    | 'provider'
    | 'integrationReady'
    | 'storeIdConfigured'
    | 'premiumPlanConfigured'
    | 'premiumPlanId'
    | 'devPlan'
    | 'devScenario'
    | 'devStateUpdatedAt'
    | 'diagnosticsReady'
    | 'manifestProfileApiRequired'
    | 'storeConfigReady'
    | 'premiumPlanReady'
    | 'localScenarioSwitchingAvailable'
  >;
  purchaseAvailability: Pick<SubscriptionPurchaseAvailability, 'canOpenPurchaseFlow' | 'reason'>;
  purchaseFlow: SubscriptionPurchaseFlowSnapshot;
  liveSubscription: {
    entitlementSource: SubscriptionState['source'] | null;
    activePlanCount: number;
    hasMatchingPremiumPlan: boolean;
    matchingPremiumPlanId: number | null;
    matchingPremiumPlanState: string | null;
  };
  syncOutcome: {
    outcome: SubscriptionState['syncOutcome'];
    fallbackReason: SubscriptionState['fallbackReason'];
  };
  comparison: {
    diagnosticsAvailable: boolean;
    liveAvailable: boolean;
    effectivePlan: SubscriptionState['plan'];
    effectiveSource: SubscriptionState['source'];
    diagnosticsPlan: SubscriptionState['plan'] | null;
    diagnosticsSource: SubscriptionState['source'] | null;
    livePlan: SubscriptionState['plan'] | null;
    liveSource: SubscriptionState['source'] | null;
    liveVsEffectivePlanMismatch: boolean;
    liveVsEffectiveSourceMismatch: boolean;
    diagnosticsVsEffectivePlanMismatch: boolean;
    diagnosticsVsEffectiveSourceMismatch: boolean;
    diagnosticsVsLivePlanMismatch: boolean;
    diagnosticsVsLiveSourceMismatch: boolean;
    hasAnyDivergence: boolean;
  };
  providerCapabilities: Pick<SubscriptionProviderCapabilities, 'syncReady'>;
  lastSyncAt: string;
  lastSyncError: string | null;
  foundationDiagnostics: {
    available: boolean;
    subscriptionReady: boolean;
    accountLinkageReady: boolean;
    aiHistorySyncReady: boolean;
    progressionSyncReady: boolean;
    weeklyReportsSyncReady: boolean;
  };
  premiumPersistence: {
    configured: boolean;
    identityProvider: string | null;
    syncReady: boolean;
    requiredForPremiumPersistence: boolean;
  };
  aiHistory: {
    configured: boolean;
    persistence: string | null;
    syncReady: boolean;
    premiumRequired: boolean;
  };
  premiumCapabilities: {
    progression: {
      configured: boolean;
      persistence: string | null;
      syncReady: boolean;
      premiumRequired: boolean;
    };
    weeklyReports: {
      configured: boolean;
      persistence: string | null;
      syncReady: boolean;
      premiumRequired: boolean;
    };
  };
}

export const buildSubscriptionRuntimeSnapshot = (
  input: BuildSubscriptionRuntimeSnapshotInput
): SubscriptionRuntimeHydrationPayload => ({
  providerStrategy: input.providerStrategy,
  provider: input.diagnostics.provider,
  integrationReady: input.diagnostics.integrationReady,
  storeIdConfigured: input.diagnostics.storeIdConfigured,
  premiumPlanConfigured: input.diagnostics.premiumPlanConfigured,
  premiumPlanId: input.diagnostics.premiumPlanId,
  devPlan: input.diagnostics.devPlan,
  devScenario: input.diagnostics.devScenario,
  devStateUpdatedAt: input.diagnostics.devStateUpdatedAt,
  diagnosticsReady: input.diagnostics.diagnosticsReady,
  manifestProfileApiRequired: input.diagnostics.manifestProfileApiRequired,
  storeConfigReady: input.diagnostics.storeConfigReady,
  premiumPlanReady: input.diagnostics.premiumPlanReady,
  localScenarioSwitchingAvailable: input.diagnostics.localScenarioSwitchingAvailable,
  purchaseFlowReady: input.purchaseAvailability.canOpenPurchaseFlow,
  purchaseFlowReason: input.purchaseAvailability.reason,
  purchaseFlowInProgress: input.purchaseFlow.purchaseFlowInProgress,
  purchaseFlowStatus: input.purchaseFlow.purchaseFlowStatus,
  purchaseFlowStartedAt: input.purchaseFlow.purchaseFlowStartedAt,
  purchaseFlowCompletedAt: input.purchaseFlow.purchaseFlowCompletedAt,
  purchaseFlowError: input.purchaseFlow.purchaseFlowError,
  liveEntitlementSource: input.liveSubscription.entitlementSource,
  liveActivePlanCount: input.liveSubscription.activePlanCount,
  liveHasMatchingPremiumPlan: input.liveSubscription.hasMatchingPremiumPlan,
  liveMatchingPremiumPlanId: input.liveSubscription.matchingPremiumPlanId,
  liveMatchingPremiumPlanState: input.liveSubscription.matchingPremiumPlanState,
  comparisonDiagnosticsAvailable: input.comparison.diagnosticsAvailable,
  comparisonLiveAvailable: input.comparison.liveAvailable,
  comparisonEffectivePlan: input.comparison.effectivePlan,
  comparisonEffectiveSource: input.comparison.effectiveSource,
  comparisonDiagnosticsPlan: input.comparison.diagnosticsPlan,
  comparisonDiagnosticsSource: input.comparison.diagnosticsSource,
  comparisonLivePlan: input.comparison.livePlan,
  comparisonLiveSource: input.comparison.liveSource,
  comparisonLiveVsEffectivePlanMismatch: input.comparison.liveVsEffectivePlanMismatch,
  comparisonLiveVsEffectiveSourceMismatch: input.comparison.liveVsEffectiveSourceMismatch,
  comparisonDiagnosticsVsEffectivePlanMismatch: input.comparison.diagnosticsVsEffectivePlanMismatch,
  comparisonDiagnosticsVsEffectiveSourceMismatch: input.comparison.diagnosticsVsEffectiveSourceMismatch,
  comparisonDiagnosticsVsLivePlanMismatch: input.comparison.diagnosticsVsLivePlanMismatch,
  comparisonDiagnosticsVsLiveSourceMismatch: input.comparison.diagnosticsVsLiveSourceMismatch,
  comparisonHasAnyDivergence: input.comparison.hasAnyDivergence,
  syncOutcome: input.syncOutcome.outcome,
  fallbackReason: input.syncOutcome.fallbackReason,
  syncReady: input.providerCapabilities.syncReady,
  lastSyncAt: input.lastSyncAt,
  lastSyncError: input.lastSyncError,
  foundationDiagnosticsAvailable: input.foundationDiagnostics.available,
  foundationSubscriptionReady: input.foundationDiagnostics.subscriptionReady,
  foundationAccountLinkageReady: input.foundationDiagnostics.accountLinkageReady,
  foundationAiHistorySyncReady: input.foundationDiagnostics.aiHistorySyncReady,
  foundationProgressionSyncReady: input.foundationDiagnostics.progressionSyncReady,
  foundationWeeklyReportsSyncReady: input.foundationDiagnostics.weeklyReportsSyncReady,
  premiumPersistenceConfigured: input.premiumPersistence.configured,
  premiumPersistenceIdentityProvider: input.premiumPersistence.identityProvider,
  premiumPersistenceSyncReady: input.premiumPersistence.syncReady,
  premiumPersistenceRequired: input.premiumPersistence.requiredForPremiumPersistence,
  aiHistoryConfigured: input.aiHistory.configured,
  aiHistoryPersistence: input.aiHistory.persistence,
  aiHistorySyncReady: input.aiHistory.syncReady,
  aiHistoryPremiumRequired: input.aiHistory.premiumRequired,
  progressionFoundationConfigured: input.premiumCapabilities.progression.configured,
  progressionFoundationPersistence: input.premiumCapabilities.progression.persistence,
  progressionFoundationSyncReady: input.premiumCapabilities.progression.syncReady,
  progressionFoundationPremiumRequired: input.premiumCapabilities.progression.premiumRequired,
  weeklyReportsFoundationConfigured: input.premiumCapabilities.weeklyReports.configured,
  weeklyReportsFoundationPersistence: input.premiumCapabilities.weeklyReports.persistence,
  weeklyReportsFoundationSyncReady: input.premiumCapabilities.weeklyReports.syncReady,
  weeklyReportsFoundationPremiumRequired: input.premiumCapabilities.weeklyReports.premiumRequired
});
