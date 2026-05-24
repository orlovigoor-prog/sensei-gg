import { fetchSubscriptionServiceJson } from './subscriptionDevTools';
import type { AiHistoryState } from '../store/aiHistorySlice';

export interface AiReviewHistoryFoundationConfigResponse {
  ok?: boolean;
  persistence?: string;
  syncReady?: boolean;
  premiumRequired?: boolean;
  notes?: string[];
}

export interface NormalizedAiHistoryFoundation {
  configured: boolean;
  persistence: string | null;
  syncReady: boolean;
  premiumRequired: boolean;
  notes: string[];
}

export interface AiHistoryFoundationHydrationPayload extends Omit<AiHistoryState, 'entries' | 'hydratedAt'> {}

export const fetchAiHistoryFoundationConfig = async (): Promise<AiReviewHistoryFoundationConfigResponse | null> => {
  return fetchSubscriptionServiceJson<AiReviewHistoryFoundationConfigResponse>('/api/review-history/config');
};

export const normalizeAiHistoryFoundation = (
  config: AiReviewHistoryFoundationConfigResponse | null
): NormalizedAiHistoryFoundation => ({
  configured: Boolean(config),
  persistence: config?.persistence ?? null,
  syncReady: Boolean(config?.syncReady),
  premiumRequired: config?.premiumRequired ?? true,
  notes: Array.isArray(config?.notes) ? config.notes : []
});

export const buildAiHistoryFoundationSnapshot = (
  foundation: NormalizedAiHistoryFoundation
): AiHistoryFoundationHydrationPayload => ({
  configured: foundation.configured,
  persistence: foundation.persistence,
  syncReady: foundation.syncReady,
  premiumRequired: foundation.premiumRequired
});

