import { fetchSubscriptionServiceJson } from './subscriptionDevTools';

export interface PremiumPersistenceFoundationResponse {
  ok?: boolean;
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
}

export interface NormalizedPremiumPersistenceFoundation {
  identityProvider: string | null;
  configured: boolean;
  syncReady: boolean;
  requiredForPremiumPersistence: boolean;
  scopes: {
    aiHistory: boolean;
    progression: boolean;
    weeklyReports: boolean;
  };
  notes: string[];
}

export const fetchPremiumPersistenceFoundationConfig = async (): Promise<PremiumPersistenceFoundationResponse | null> => {
  return fetchSubscriptionServiceJson<PremiumPersistenceFoundationResponse>('/api/premium-persistence/config');
};

export const normalizePremiumPersistenceFoundation = (
  config: PremiumPersistenceFoundationResponse | null
): NormalizedPremiumPersistenceFoundation => ({
  identityProvider: config?.identityProvider ?? null,
  configured: Boolean(config?.configured),
  syncReady: Boolean(config?.syncReady),
  requiredForPremiumPersistence: config?.requiredForPremiumPersistence ?? true,
  scopes: {
    aiHistory: config?.scopes?.aiHistory ?? true,
    progression: config?.scopes?.progression ?? true,
    weeklyReports: config?.scopes?.weeklyReports ?? true
  },
  notes: Array.isArray(config?.notes) ? config.notes : []
});
