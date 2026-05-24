import { fetchSubscriptionServiceJson } from './subscriptionDevTools';

export interface PremiumCapabilityFoundationNodeResponse {
  configured?: boolean;
  persistence?: string;
  syncReady?: boolean;
  premiumRequired?: boolean;
}

export interface PremiumCapabilitiesFoundationResponse {
  ok?: boolean;
  progression?: PremiumCapabilityFoundationNodeResponse;
  weeklyReports?: PremiumCapabilityFoundationNodeResponse;
  devState?: {
    progressionSyncReady?: boolean;
    weeklyReportsSyncReady?: boolean;
    scenario?: string;
    updatedAt?: string;
  };
  notes?: string[];
}

export interface NormalizedPremiumCapabilityFoundationNode {
  configured: boolean;
  persistence: string | null;
  syncReady: boolean;
  premiumRequired: boolean;
}

export interface NormalizedPremiumCapabilitiesFoundation {
  progression: NormalizedPremiumCapabilityFoundationNode;
  weeklyReports: NormalizedPremiumCapabilityFoundationNode;
  notes: string[];
}

const normalizeNode = (node: PremiumCapabilityFoundationNodeResponse | null | undefined): NormalizedPremiumCapabilityFoundationNode => ({
  configured: Boolean(node?.configured),
  persistence: node?.persistence ?? null,
  syncReady: Boolean(node?.syncReady),
  premiumRequired: node?.premiumRequired ?? true
});

export const fetchPremiumCapabilitiesFoundationConfig = async (): Promise<PremiumCapabilitiesFoundationResponse | null> => {
  return fetchSubscriptionServiceJson<PremiumCapabilitiesFoundationResponse>('/api/premium-capabilities/config');
};

export const normalizePremiumCapabilitiesFoundation = (
  config: PremiumCapabilitiesFoundationResponse | null
): NormalizedPremiumCapabilitiesFoundation => ({
  progression: normalizeNode(config?.progression),
  weeklyReports: normalizeNode(config?.weeklyReports),
  notes: Array.isArray(config?.notes) ? config.notes : []
});
