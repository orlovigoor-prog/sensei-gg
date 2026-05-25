import { buildSubscriptionEntitlements, type SenseiSubscriptionEntitlements } from './subscriptionEntitlements';

export type SubscriptionDevPlan = 'free' | 'premium';

export interface SubscriptionDevStateResponse {
  ok?: boolean;
  plan?: SubscriptionDevPlan;
  scenario?: string;
  updatedAt?: string;
  entitlements?: SenseiSubscriptionEntitlements;
}

export interface SubscriptionDiagnosticsResponse {
  ok?: boolean;
  provider?: string;
  integrationReady?: boolean;
  storeIdConfigured?: boolean;
  premiumPlanConfigured?: boolean;
  storeId?: string | null;
  premiumPlanId?: number | null;
  devState?: {
    plan?: SubscriptionDevPlan;
    scenario?: string;
    updatedAt?: string;
  };
  entitlements?: SenseiSubscriptionEntitlements;
  overwolfTestReadiness?: {
    manifestProfileApiRequired?: boolean;
    storeConfigReady?: boolean;
    premiumPlanReady?: boolean;
    localScenarioSwitchingAvailable?: boolean;
  };
  notes?: string[];
}

export interface SubscriptionFoundationDiagnosticsResponse {
  ok?: boolean;
  subscription?: SubscriptionDiagnosticsResponse;
  accountSession?: {
    provider?: string;
    configured?: boolean;
    authenticated?: boolean;
    sessionTokenReady?: boolean;
    accountId?: string | null;
    accountLinked?: boolean;
    devState?: {
      authenticated?: boolean;
      sessionTokenReady?: boolean;
      accountId?: string | null;
      scenario?: string;
      updatedAt?: string;
    };
    notes?: string[];
  };
  accountLinkage?: {
    identityProvider?: string;
    configured?: boolean;
    syncReady?: boolean;
    requiredForPremiumPersistence?: boolean;
    scopes?: {
      aiHistory?: boolean;
      progression?: boolean;
      weeklyReports?: boolean;
    };
    notes?: string[];
  };
  aiHistory?: {
    persistence?: string;
    syncReady?: boolean;
    premiumRequired?: boolean;
    notes?: string[];
  };
  premiumCapabilities?: {
    progression?: {
      configured?: boolean;
      persistence?: string;
      syncReady?: boolean;
      premiumRequired?: boolean;
    };
    weeklyReports?: {
      configured?: boolean;
      persistence?: string;
      syncReady?: boolean;
      premiumRequired?: boolean;
    };
    devState?: {
      progressionSyncReady?: boolean;
      weeklyReportsSyncReady?: boolean;
      scenario?: string;
      updatedAt?: string;
    };
    notes?: string[];
  };
  readiness?: {
    subscriptionReady?: boolean;
    identityAuthenticated?: boolean;
    sessionTokenReady?: boolean;
    accountIdPresent?: boolean;
    accountLinkageSyncReady?: boolean;
    aiHistorySyncReady?: boolean;
    progressionSyncReady?: boolean;
    weeklyReportsSyncReady?: boolean;
  };
  notes?: string[];
}

export interface SubscriptionFoundationFixtureResponse {
  ok?: boolean;
  preset?: string | null;
  scenario?: string;
  plan?: SubscriptionDevPlan;
  progressionSyncReady?: boolean;
  weeklyReportsSyncReady?: boolean;
  accountLinkageSyncReady?: boolean;
  identityAuthenticated?: boolean;
  sessionTokenReady?: boolean;
  accountId?: string | null;
  updatedAt?: string;
  diagnostics?: SubscriptionFoundationDiagnosticsResponse;
  error?: string;
}

export interface SubscriptionFoundationFixtureCatalogResponse {
  ok?: boolean;
  fixtures?: Array<{
    name?: string;
    plan?: SubscriptionDevPlan;
    progressionSyncReady?: boolean;
    weeklyReportsSyncReady?: boolean;
    accountLinkageSyncReady?: boolean;
    identityAuthenticated?: boolean;
    sessionTokenReady?: boolean;
    accountId?: string | null;
    scenario?: string;
  }>;
  notes?: string[];
}

export interface SubscriptionFoundationOrchestrationResponse {
  ok?: boolean;
  orchestration?: string | null;
  foundationPreset?: string | null;
  accountSessionPreset?: string | null;
  scenario?: string;
  plan?: SubscriptionDevPlan;
  progressionSyncReady?: boolean;
  weeklyReportsSyncReady?: boolean;
  accountLinkageSyncReady?: boolean;
  identityAuthenticated?: boolean;
  sessionTokenReady?: boolean;
  accountId?: string | null;
  updatedAt?: string;
  diagnostics?: SubscriptionFoundationDiagnosticsResponse;
  error?: string;
}

export interface SubscriptionFoundationOrchestrationCatalogResponse {
  ok?: boolean;
  fixtures?: Array<{
    name?: string;
    foundationPreset?: string;
    accountSessionPreset?: string;
    overrides?: {
      accountLinkageSyncReady?: boolean;
      progressionSyncReady?: boolean;
      weeklyReportsSyncReady?: boolean;
    } | null;
    scenario?: string;
  }>;
  notes?: string[];
}

export interface AccountSessionFoundationResponse {
  ok?: boolean;
  provider?: string;
  configured?: boolean;
  authenticated?: boolean;
  sessionTokenReady?: boolean;
  accountId?: string | null;
  accountLinked?: boolean;
  devState?: {
    authenticated?: boolean;
    sessionTokenReady?: boolean;
    accountId?: string | null;
    scenario?: string;
    updatedAt?: string;
  };
  notes?: string[];
}

export interface SubscriptionFoundationSyncMatrixResponse {
  ok?: boolean;
  matrix?: string | null;
  stage?: 'identity' | 'session-token' | 'account-linkage' | 'premium-capabilities' | 'weekly-reports' | 'progression' | 'complete';
  scenario?: string;
  plan?: SubscriptionDevPlan;
  authenticated?: boolean;
  sessionTokenReady?: boolean;
  accountId?: string | null;
  accountLinkageSyncReady?: boolean;
  progressionSyncReady?: boolean;
  weeklyReportsSyncReady?: boolean;
  expectedReadiness?: {
    identityAuthenticated?: boolean;
    sessionTokenReady?: boolean;
    accountIdPresent?: boolean;
    accountLinkageSyncReady?: boolean;
    progressionSyncReady?: boolean;
    weeklyReportsSyncReady?: boolean;
  };
  blockingReason?: string | null;
  testAssertions?: {
    entitlements?: {
      plan?: SubscriptionDevPlan;
      hasFullAiReview?: boolean;
      hasUnlimitedAiReviews?: boolean;
      hasAiHistoryAccess?: boolean;
      hasProgressionAccess?: boolean;
      hasWeeklyReports?: boolean;
    };
    purchaseAvailability?: {
      canOpenPurchaseFlow?: boolean;
      reason?: 'ready' | 'overwolf-unavailable' | 'subscription-api-unavailable' | 'premium-plan-not-configured';
      integrationReady?: boolean;
    };
    persistenceEligibility?: {
      accountLinkageEligible?: boolean;
      premiumPersistenceEligible?: boolean;
      progressionSyncEligible?: boolean;
      weeklyReportsSyncEligible?: boolean;
    };
    readinessGates?: {
      identityAuthenticated?: boolean;
      sessionTokenReady?: boolean;
      accountIdPresent?: boolean;
      accountLinkageSyncReady?: boolean;
      progressionSyncReady?: boolean;
      weeklyReportsSyncReady?: boolean;
    };
  };
  updatedAt?: string;
  diagnostics?: SubscriptionFoundationDiagnosticsResponse;
  error?: string;
}

export interface SubscriptionFoundationSyncMatrixCatalogResponse {
  ok?: boolean;
  fixtures?: Array<{
    name?: string;
    plan?: SubscriptionDevPlan;
    stage?: 'identity' | 'session-token' | 'account-linkage' | 'premium-capabilities' | 'weekly-reports' | 'progression' | 'complete';
    authenticated?: boolean;
    sessionTokenReady?: boolean;
    accountId?: string | null;
    accountLinkageSyncReady?: boolean;
    progressionSyncReady?: boolean;
    weeklyReportsSyncReady?: boolean;
    expectedReadiness?: {
      identityAuthenticated?: boolean;
      sessionTokenReady?: boolean;
      accountIdPresent?: boolean;
      accountLinkageSyncReady?: boolean;
      progressionSyncReady?: boolean;
      weeklyReportsSyncReady?: boolean;
    };
    blockingReason?: string | null;
    testAssertions?: {
      entitlements?: {
        plan?: SubscriptionDevPlan;
        hasFullAiReview?: boolean;
        hasUnlimitedAiReviews?: boolean;
        hasAiHistoryAccess?: boolean;
        hasProgressionAccess?: boolean;
        hasWeeklyReports?: boolean;
      };
      purchaseAvailability?: {
        canOpenPurchaseFlow?: boolean;
        reason?: 'ready' | 'overwolf-unavailable' | 'subscription-api-unavailable' | 'premium-plan-not-configured';
        integrationReady?: boolean;
      };
      persistenceEligibility?: {
        accountLinkageEligible?: boolean;
        premiumPersistenceEligible?: boolean;
        progressionSyncEligible?: boolean;
        weeklyReportsSyncEligible?: boolean;
      };
      readinessGates?: {
        identityAuthenticated?: boolean;
        sessionTokenReady?: boolean;
        accountIdPresent?: boolean;
        accountLinkageSyncReady?: boolean;
        progressionSyncReady?: boolean;
        weeklyReportsSyncReady?: boolean;
      };
    };
    scenario?: string;
  }>;
  notes?: string[];
}

export interface SubscriptionFoundationTestCaseCatalogResponse {
  ok?: boolean;
  testCases?: Array<{
    name?: string;
    type?: 'fixture' | 'sync-matrix' | 'orchestration';
    verificationRole?: 'matrix-premium-fixture' | 'matrix-session-gate' | 'matrix-orchestration-readiness-gate' | null;
    bundleFamily?: 'fixture' | 'sync-matrix' | 'orchestration';
    apply?: {
      endpoint?: string;
      method?: 'POST';
      payload?: {
        preset?: string;
        matrix?: string;
        orchestration?: string;
      };
    };
    reset?: {
      endpoint?: string;
      method?: 'DELETE';
    };
    label?: string;
    scenario?: string;
    covers?: Array<'subscription-foundation' | 'identity-session' | 'account-linkage' | 'premium-entitlements' | 'progression-sync' | 'weekly-reports-sync' | 'identity-gating' | 'account-linkage-gating' | 'premium-readiness-gating' | 'ready-state-validation'>;
    recommendedFor?: Array<'baseline-smoke-tests' | 'manual-dry-run' | 'readiness-gate-regression' | 'step-by-step-automation' | 'cross-layer-integration' | 'end-to-end-dry-run' | 'premium-path-validation' | 'free-path-validation'>;
    dependencies?: string[];
    supersedes?: string[];
    equivalentTo?: string[];
    stage?: 'identity' | 'session-token' | 'account-linkage' | 'premium-capabilities' | 'weekly-reports' | 'progression' | 'complete';
    blockingReason?: string | null;
    expectedReadiness?: {
      identityAuthenticated?: boolean;
      sessionTokenReady?: boolean;
      accountIdPresent?: boolean;
      accountLinkageSyncReady?: boolean;
      progressionSyncReady?: boolean;
      weeklyReportsSyncReady?: boolean;
    };
    testAssertions?: SubscriptionFoundationSyncMatrixResponse['testAssertions'];
    recommendedValidationSequence?: string[];
  }>;
  automationSequence?: Array<{
    order?: number;
    testCaseName?: string;
    type?: 'fixture' | 'sync-matrix' | 'orchestration';
    phase?: 'fixture-baseline' | 'sync-gates' | 'orchestration-integration';
    stage?: 'identity' | 'session-token' | 'account-linkage' | 'premium-capabilities' | 'weekly-reports' | 'progression' | 'complete';
    verificationRole?: 'matrix-premium-fixture' | 'matrix-session-gate' | 'matrix-orchestration-readiness-gate' | null;
    selectedByDefault?: boolean;
    skipReason?: 'superseded-by-newer-case' | 'covered-by-equivalent-case' | null;
    dependencies?: string[];
  }>;
  notes?: string[];
}

export interface AccountSessionDevStateResponse {
  ok?: boolean;
  preset?: string | null;
  authenticated?: boolean;
  sessionTokenReady?: boolean;
  accountId?: string | null;
  scenario?: string;
  updatedAt?: string;
}

export interface AccountSessionPresetCatalogResponse {
  ok?: boolean;
  fixtures?: Array<{
    name?: string;
    authenticated?: boolean;
    sessionTokenReady?: boolean;
    accountId?: string | null;
    scenario?: string;
  }>;
  notes?: string[];
}

const DEFAULT_SUBSCRIPTION_SERVER_BASE_URL = 'http://127.0.0.1:8787';

export const getSubscriptionServiceBaseUrl = () => {
  // @ts-ignore Vite env
  const reviewEndpoint = import.meta.env.VITE_AI_REVIEW_ENDPOINT;

  if (typeof reviewEndpoint === 'string' && reviewEndpoint.trim().length > 0) {
    try {
      return new URL(reviewEndpoint).origin;
    } catch {
      return DEFAULT_SUBSCRIPTION_SERVER_BASE_URL;
    }
  }

  return DEFAULT_SUBSCRIPTION_SERVER_BASE_URL;
};

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 4000) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
};

export const fetchSubscriptionServiceJson = async <T>(path: string, init: RequestInit = {}, timeoutMs = 4000): Promise<T | null> => {
  try {
    const response = await fetchWithTimeout(`${getSubscriptionServiceBaseUrl()}${path}`, init, timeoutMs);
    if (!response.ok) {
      return null;
    }

    return await response.json() as T;
  } catch {
    return null;
  }
};

export const fetchSubscriptionDiagnostics = async (): Promise<SubscriptionDiagnosticsResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionDiagnosticsResponse>('/api/subscription/diagnostics');
};

export const fetchSubscriptionFoundationDiagnostics = async (): Promise<SubscriptionFoundationDiagnosticsResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationDiagnosticsResponse>('/api/subscription/foundation-diagnostics');
};

export const fetchSubscriptionFoundationFixtures = async (): Promise<SubscriptionFoundationFixtureCatalogResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationFixtureCatalogResponse>('/api/subscription/foundation-fixtures');
};

export const fetchSubscriptionFoundationOrchestrations = async (): Promise<SubscriptionFoundationOrchestrationCatalogResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationOrchestrationCatalogResponse>('/api/subscription/foundation-orchestrations');
};

export const fetchSubscriptionFoundationSyncMatrix = async (): Promise<SubscriptionFoundationSyncMatrixCatalogResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationSyncMatrixCatalogResponse>('/api/subscription/foundation-sync-matrix');
};

export const fetchSubscriptionFoundationTestCases = async (): Promise<SubscriptionFoundationTestCaseCatalogResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationTestCaseCatalogResponse>('/api/subscription/foundation-test-cases');
};

export const fetchAccountSessionFoundationConfig = async (): Promise<AccountSessionFoundationResponse | null> => {
  return fetchSubscriptionServiceJson<AccountSessionFoundationResponse>('/api/account-session/config');
};

export const fetchAccountSessionDevState = async (): Promise<AccountSessionDevStateResponse | null> => {
  return fetchSubscriptionServiceJson<AccountSessionDevStateResponse>('/api/account-session/dev-state');
};

export const fetchAccountSessionPresets = async (): Promise<AccountSessionPresetCatalogResponse | null> => {
  return fetchSubscriptionServiceJson<AccountSessionPresetCatalogResponse>('/api/account-session/presets');
};

export const updateAccountSessionDevState = async (input: {
  preset?: string;
  authenticated?: boolean;
  sessionTokenReady?: boolean;
  accountId?: string | null;
  scenario?: string;
}): Promise<AccountSessionDevStateResponse | null> => {
  return fetchSubscriptionServiceJson<AccountSessionDevStateResponse>('/api/account-session/dev-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      preset: input.preset,
      authenticated: input.authenticated,
      sessionTokenReady: input.sessionTokenReady,
      accountId: input.accountId,
      scenario: input.scenario
    })
  });
};

export const resetAccountSessionDevState = async (): Promise<AccountSessionDevStateResponse | null> => {
  return fetchSubscriptionServiceJson<AccountSessionDevStateResponse>('/api/account-session/dev-state', {
    method: 'DELETE'
  });
};

export const applySubscriptionFoundationFixture = async (input: {
  plan?: SubscriptionDevPlan;
  preset?: string;
  progressionSyncReady?: boolean;
  weeklyReportsSyncReady?: boolean;
  accountLinkageSyncReady?: boolean;
  identityAuthenticated?: boolean;
  sessionTokenReady?: boolean;
  accountId?: string | null;
  scenario?: string;
}): Promise<SubscriptionFoundationFixtureResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationFixtureResponse>('/api/subscription/foundation-fixture', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      preset: input.preset,
      plan: input.plan,
      progressionSyncReady: input.progressionSyncReady,
      weeklyReportsSyncReady: input.weeklyReportsSyncReady,
      accountLinkageSyncReady: input.accountLinkageSyncReady,
      identityAuthenticated: input.identityAuthenticated,
      sessionTokenReady: input.sessionTokenReady,
      accountId: input.accountId,
      scenario: input.scenario
    })
  });
};

export const resetSubscriptionFoundationFixture = async (): Promise<SubscriptionFoundationFixtureResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationFixtureResponse>('/api/subscription/foundation-fixture', {
    method: 'DELETE'
  });
};

export const applySubscriptionFoundationOrchestration = async (input: {
  orchestration: string;
  scenario?: string;
}): Promise<SubscriptionFoundationOrchestrationResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationOrchestrationResponse>('/api/subscription/foundation-orchestration', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      orchestration: input.orchestration,
      scenario: input.scenario
    })
  });
};

export const applySubscriptionFoundationSyncMatrix = async (input: {
  matrix: string;
  scenario?: string;
}): Promise<SubscriptionFoundationSyncMatrixResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationSyncMatrixResponse>('/api/subscription/foundation-sync-matrix', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      matrix: input.matrix,
      scenario: input.scenario
    })
  });
};

export const fetchSubscriptionDevState = async (): Promise<SubscriptionDevStateResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionDevStateResponse>('/api/subscription/dev-state');
};

export const updateSubscriptionDevState = async (input: {
  plan: SubscriptionDevPlan;
  scenario?: string;
}): Promise<SubscriptionDevStateResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionDevStateResponse>('/api/subscription/dev-state', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan: input.plan,
      scenario: input.scenario
    })
  });
};

export const resetSubscriptionDevState = async (): Promise<SubscriptionDevStateResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionDevStateResponse>('/api/subscription/dev-state', {
    method: 'DELETE'
  });
};

export const getSubscriptionDevEntitlements = (state: SubscriptionDevStateResponse | null): SenseiSubscriptionEntitlements => {
  if (state?.entitlements) {
    return state.entitlements;
  }

  return buildSubscriptionEntitlements(state?.plan === 'premium' ? 'premium' : 'free', 'local-dev-foundation');
};
