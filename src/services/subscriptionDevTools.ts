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

export const applySubscriptionFoundationFixture = async (input: {
  plan?: SubscriptionDevPlan;
  preset?: string;
  progressionSyncReady?: boolean;
  weeklyReportsSyncReady?: boolean;
  accountLinkageSyncReady?: boolean;
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
      scenario: input.scenario
    })
  });
};

export const resetSubscriptionFoundationFixture = async (): Promise<SubscriptionFoundationFixtureResponse | null> => {
  return fetchSubscriptionServiceJson<SubscriptionFoundationFixtureResponse>('/api/subscription/foundation-fixture', {
    method: 'DELETE'
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
