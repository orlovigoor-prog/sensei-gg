import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import {
  getDefaultSubscriptionState,
  getStoredSubscriptionState,
  type SubscriptionPlan,
  type SubscriptionEntitlementSource,
  type SubscriptionStateSnapshot
} from '../services/subscriptionStorage';
import type { SubscriptionPurchaseAvailabilityReason } from '../services/overwolfSubscriptionActions';
import type { SubscriptionProviderStrategy } from '../services/subscriptionProviderDomain';

export interface SubscriptionRuntimeState {
  providerStrategy: SubscriptionProviderStrategy;
  provider: string | null;
  integrationReady: boolean;
  storeIdConfigured: boolean;
  premiumPlanConfigured: boolean;
  premiumPlanId: number | null;
  devPlan: SubscriptionPlan | null;
  devScenario: string | null;
  devStateUpdatedAt: string | null;
  diagnosticsReady: boolean;
  manifestProfileApiRequired: boolean;
  storeConfigReady: boolean;
  premiumPlanReady: boolean;
  localScenarioSwitchingAvailable: boolean;
  purchaseFlowReady: boolean;
  purchaseFlowReason: SubscriptionPurchaseAvailabilityReason;
  purchaseFlowInProgress: boolean;
  purchaseFlowStatus: 'idle' | 'pending' | 'completed' | 'failed';
  purchaseFlowStartedAt: string | null;
  purchaseFlowCompletedAt: string | null;
  purchaseFlowError: string | null;
  syncReady: boolean;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  foundationDiagnosticsAvailable: boolean;
  foundationSubscriptionReady: boolean;
  foundationAccountLinkageReady: boolean;
  foundationAiHistorySyncReady: boolean;
  foundationProgressionSyncReady: boolean;
  foundationWeeklyReportsSyncReady: boolean;
  premiumPersistenceConfigured: boolean;
  premiumPersistenceIdentityProvider: string | null;
  premiumPersistenceSyncReady: boolean;
  premiumPersistenceRequired: boolean;
  aiHistoryConfigured: boolean;
  aiHistoryPersistence: string | null;
  aiHistorySyncReady: boolean;
  aiHistoryPremiumRequired: boolean;
  progressionFoundationConfigured: boolean;
  progressionFoundationPersistence: string | null;
  progressionFoundationSyncReady: boolean;
  progressionFoundationPremiumRequired: boolean;
  weeklyReportsFoundationConfigured: boolean;
  weeklyReportsFoundationPersistence: string | null;
  weeklyReportsFoundationSyncReady: boolean;
  weeklyReportsFoundationPremiumRequired: boolean;
}

export interface SubscriptionRuntimeHydrationPayload extends Omit<SubscriptionRuntimeState, 'lastSyncAt'> {
  lastSyncAt: string;
}

export interface SubscriptionState extends SubscriptionStateSnapshot, SubscriptionRuntimeState {}

const buildRuntimeState = (): SubscriptionRuntimeState => ({
  providerStrategy: 'local-dev-foundation',
  provider: null,
  integrationReady: false,
  storeIdConfigured: false,
  premiumPlanConfigured: false,
  premiumPlanId: null,
  devPlan: null,
  devScenario: null,
  devStateUpdatedAt: null,
  diagnosticsReady: false,
  manifestProfileApiRequired: true,
  storeConfigReady: false,
  premiumPlanReady: false,
  localScenarioSwitchingAvailable: false,
  purchaseFlowReady: false,
  purchaseFlowReason: 'premium-plan-not-configured',
  purchaseFlowInProgress: false,
  purchaseFlowStatus: 'idle',
  purchaseFlowStartedAt: null,
  purchaseFlowCompletedAt: null,
  purchaseFlowError: null,
  syncReady: false,
  lastSyncAt: null,
  lastSyncError: null,
  foundationDiagnosticsAvailable: false,
  foundationSubscriptionReady: false,
  foundationAccountLinkageReady: false,
  foundationAiHistorySyncReady: false,
  foundationProgressionSyncReady: false,
  foundationWeeklyReportsSyncReady: false,
  premiumPersistenceConfigured: false,
  premiumPersistenceIdentityProvider: null,
  premiumPersistenceSyncReady: false,
  premiumPersistenceRequired: true,
  aiHistoryConfigured: false,
  aiHistoryPersistence: null,
  aiHistorySyncReady: false,
  aiHistoryPremiumRequired: true,
  progressionFoundationConfigured: false,
  progressionFoundationPersistence: null,
  progressionFoundationSyncReady: false,
  progressionFoundationPremiumRequired: true,
  weeklyReportsFoundationConfigured: false,
  weeklyReportsFoundationPersistence: null,
  weeklyReportsFoundationSyncReady: false,
  weeklyReportsFoundationPremiumRequired: true
});

const buildInitialState = (): SubscriptionState => {
  const storedState = getStoredSubscriptionState();

  return {
    ...storedState,
    ...buildRuntimeState()
  };
};

const resetUsageWindow = (state: SubscriptionState) => {
  state.aiReviewsUsedThisWeek = 0;
  state.usageWindowStartedAt = new Date().toISOString();
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState: buildInitialState(),
  reducers: {
    setPlan: (state, action: PayloadAction<SubscriptionPlan>) => {
      state.plan = action.payload;
      state.source = action.payload === 'premium' ? 'local-dev-foundation' : 'fallback-free';
      state.hasUnlimitedAiReviews = action.payload === 'premium';
      state.hasAiHistoryAccess = action.payload === 'premium';
      state.hasProgressionAccess = action.payload === 'premium';
      state.hasWeeklyReports = action.payload === 'premium';
    },
    hydrateEntitlements: (state, action: PayloadAction<{
      plan: SubscriptionStateSnapshot['plan'];
      source: SubscriptionEntitlementSource;
      hasUnlimitedAiReviews: boolean;
      hasAiHistoryAccess: boolean;
      hasProgressionAccess: boolean;
      hasWeeklyReports: boolean;
    }>) => {
      state.plan = action.payload.plan;
      state.source = action.payload.source;
      state.hasUnlimitedAiReviews = action.payload.hasUnlimitedAiReviews;
      state.hasAiHistoryAccess = action.payload.hasAiHistoryAccess;
      state.hasProgressionAccess = action.payload.hasProgressionAccess;
      state.hasWeeklyReports = action.payload.hasWeeklyReports;
    },
    consumeAiReview: (state) => {
      if (state.hasUnlimitedAiReviews) {
        return;
      }

      const startedAtTime = new Date(state.usageWindowStartedAt).getTime();
      if (Number.isNaN(startedAtTime) || Date.now() - startedAtTime >= 7 * 24 * 60 * 60 * 1000) {
        resetUsageWindow(state);
      }

      state.aiReviewsUsedThisWeek += 1;
    },
    resetAiUsageWindow: (state) => {
      resetUsageWindow(state);
    },
    hydrateSubscriptionState: (state, action: PayloadAction<SubscriptionStateSnapshot>) => {
      state.plan = action.payload.plan;
      state.source = action.payload.source;
      state.aiReviewsUsedThisWeek = action.payload.aiReviewsUsedThisWeek;
      state.aiReviewWeeklyLimit = action.payload.aiReviewWeeklyLimit;
      state.usageWindowStartedAt = action.payload.usageWindowStartedAt;
      state.hasUnlimitedAiReviews = action.payload.hasUnlimitedAiReviews;
      state.hasAiHistoryAccess = action.payload.hasAiHistoryAccess;
      state.hasProgressionAccess = action.payload.hasProgressionAccess;
      state.hasWeeklyReports = action.payload.hasWeeklyReports;
    },
    hydrateSubscriptionRuntime: (state, action: PayloadAction<SubscriptionRuntimeHydrationPayload>) => {
      state.providerStrategy = action.payload.providerStrategy;
      state.provider = action.payload.provider;
      state.integrationReady = action.payload.integrationReady;
      state.storeIdConfigured = action.payload.storeIdConfigured;
      state.premiumPlanConfigured = action.payload.premiumPlanConfigured;
      state.premiumPlanId = action.payload.premiumPlanId;
      state.devPlan = action.payload.devPlan;
      state.devScenario = action.payload.devScenario;
      state.devStateUpdatedAt = action.payload.devStateUpdatedAt;
      state.diagnosticsReady = action.payload.diagnosticsReady;
      state.manifestProfileApiRequired = action.payload.manifestProfileApiRequired;
      state.storeConfigReady = action.payload.storeConfigReady;
      state.premiumPlanReady = action.payload.premiumPlanReady;
      state.localScenarioSwitchingAvailable = action.payload.localScenarioSwitchingAvailable;
      state.purchaseFlowReady = action.payload.purchaseFlowReady;
      state.purchaseFlowReason = action.payload.purchaseFlowReason;
      state.purchaseFlowInProgress = action.payload.purchaseFlowInProgress;
      state.purchaseFlowStatus = action.payload.purchaseFlowStatus;
      state.purchaseFlowStartedAt = action.payload.purchaseFlowStartedAt;
      state.purchaseFlowCompletedAt = action.payload.purchaseFlowCompletedAt;
      state.purchaseFlowError = action.payload.purchaseFlowError;
      state.syncReady = action.payload.syncReady;
      state.lastSyncAt = action.payload.lastSyncAt;
      state.lastSyncError = action.payload.lastSyncError;
      state.foundationDiagnosticsAvailable = action.payload.foundationDiagnosticsAvailable;
      state.foundationSubscriptionReady = action.payload.foundationSubscriptionReady;
      state.foundationAccountLinkageReady = action.payload.foundationAccountLinkageReady;
      state.foundationAiHistorySyncReady = action.payload.foundationAiHistorySyncReady;
      state.foundationProgressionSyncReady = action.payload.foundationProgressionSyncReady;
      state.foundationWeeklyReportsSyncReady = action.payload.foundationWeeklyReportsSyncReady;
      state.premiumPersistenceConfigured = action.payload.premiumPersistenceConfigured;
      state.premiumPersistenceIdentityProvider = action.payload.premiumPersistenceIdentityProvider;
      state.premiumPersistenceSyncReady = action.payload.premiumPersistenceSyncReady;
      state.premiumPersistenceRequired = action.payload.premiumPersistenceRequired;
      state.aiHistoryConfigured = action.payload.aiHistoryConfigured;
      state.aiHistoryPersistence = action.payload.aiHistoryPersistence;
      state.aiHistorySyncReady = action.payload.aiHistorySyncReady;
      state.aiHistoryPremiumRequired = action.payload.aiHistoryPremiumRequired;
      state.progressionFoundationConfigured = action.payload.progressionFoundationConfigured;
      state.progressionFoundationPersistence = action.payload.progressionFoundationPersistence;
      state.progressionFoundationSyncReady = action.payload.progressionFoundationSyncReady;
      state.progressionFoundationPremiumRequired = action.payload.progressionFoundationPremiumRequired;
      state.weeklyReportsFoundationConfigured = action.payload.weeklyReportsFoundationConfigured;
      state.weeklyReportsFoundationPersistence = action.payload.weeklyReportsFoundationPersistence;
      state.weeklyReportsFoundationSyncReady = action.payload.weeklyReportsFoundationSyncReady;
      state.weeklyReportsFoundationPremiumRequired = action.payload.weeklyReportsFoundationPremiumRequired;
    },
    startPurchaseFlow: (state) => {
      state.purchaseFlowInProgress = true;
      state.purchaseFlowStatus = 'pending';
      state.purchaseFlowStartedAt = new Date().toISOString();
      state.purchaseFlowCompletedAt = null;
      state.purchaseFlowError = null;
    },
    completePurchaseFlow: (state) => {
      state.purchaseFlowInProgress = false;
      state.purchaseFlowStatus = 'completed';
      state.purchaseFlowCompletedAt = new Date().toISOString();
      state.purchaseFlowError = null;
    },
    failPurchaseFlow: (state, action: PayloadAction<string>) => {
      state.purchaseFlowInProgress = false;
      state.purchaseFlowStatus = 'failed';
      state.purchaseFlowCompletedAt = new Date().toISOString();
      state.purchaseFlowError = action.payload;
    },
    resetPurchaseFlowState: (state) => {
      state.purchaseFlowInProgress = false;
      state.purchaseFlowStatus = 'idle';
      state.purchaseFlowStartedAt = null;
      state.purchaseFlowCompletedAt = null;
      state.purchaseFlowError = null;
    },
    resetSubscriptionState: () => ({
      ...buildInitialState()
    }),
    resetSubscriptionToDefaults: () => {
      const defaultState = getDefaultSubscriptionState();

      return {
        ...defaultState,
        ...buildRuntimeState()
      };
    }
  }
});

export const {
  setPlan,
  hydrateEntitlements,
  consumeAiReview,
  resetAiUsageWindow,
  hydrateSubscriptionState,
  hydrateSubscriptionRuntime,
  startPurchaseFlow,
  completePurchaseFlow,
  failPurchaseFlow,
  resetPurchaseFlowState,
  resetSubscriptionState,
  resetSubscriptionToDefaults
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer;
