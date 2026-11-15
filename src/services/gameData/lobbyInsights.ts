import type { PlayerInfo } from '../../store/lobbySlice';
import { fetchSubscriptionServiceJson } from '../subscriptionDevTools';
import { patchTierVisuals, type PatchTier } from './core';

export const LOBBY_META_RANK_BRACKET = 'all' as const;
export type LobbyDataRankBracket = typeof LOBBY_META_RANK_BRACKET;
export type LobbySignalQuality = 'strong' | 'medium' | 'tier-only' | 'none';

export const MIN_RELIABLE_LOBBY_COUNTER_SAMPLE = 500;
export const MIN_STRONG_LOBBY_COUNTERS = 2;

export interface LobbyCounterpickInsight {
  champion: string;
  matchupWinRate: number;
  matches?: number;
}

export interface LobbyChampionInsight {
  role: PlayerInfo['mainRole'];
  rankBracket: LobbyDataRankBracket;
  counters: LobbyCounterpickInsight[];
  globalWinRate?: number | null;
  overallMatches?: number;
  patchTier: PatchTier | null;
  tierColor: string;
  patch: string;
  sampleLabel: string;
  signalQuality: LobbySignalQuality;
}

export const getReliableLobbyCounters = (counters: LobbyCounterpickInsight[]) => {
  const validCounters = counters.filter((counter) => Number.isFinite(counter.matchupWinRate)).slice(0, 5);
  return validCounters.length === 5 ? validCounters : [];
};

export const resolveLobbySignalQuality = (input: {
  counters?: LobbyCounterpickInsight[];
  globalWinRate?: number | null;
  patchTier?: PatchTier | null;
}): LobbySignalQuality => {
  const reliableCounters = getReliableLobbyCounters(input.counters || []);

  if (Number.isFinite(input.globalWinRate) && reliableCounters.length >= MIN_STRONG_LOBBY_COUNTERS) {
    return 'strong';
  }

  if (Number.isFinite(input.globalWinRate)) {
    return 'medium';
  }

  if (input.patchTier) {
    return 'tier-only';
  }

  return 'none';
};

interface BackendLobbyChampionInsightResponse {
  ok: boolean;
  insight?: {
    role: PlayerInfo['mainRole'];
    rankBracket: LobbyDataRankBracket;
    counters?: LobbyCounterpickInsight[];
    globalWinRate?: number | null;
    overallMatches?: number | null;
    patchTier?: PatchTier | null;
    patch?: string;
    sampleLabel?: string;
    signalQuality?: LobbySignalQuality;
  } | null;
}

const insightCache = new Map<string, LobbyChampionInsight | null>();
const insightRequests = new Map<string, Promise<LobbyChampionInsight | null>>();

const getInsightCacheKey = (championName: string, role: PlayerInfo['mainRole']) => (
  `${championName.trim().toLocaleLowerCase()}:${role}`
);

const requestLobbyChampionInsight = async (
  championName: string,
  role: PlayerInfo['mainRole']
): Promise<LobbyChampionInsight | null> => {
  const query = new URLSearchParams({ champion: championName, role, rank: LOBBY_META_RANK_BRACKET });
  const response = await fetchSubscriptionServiceJson<BackendLobbyChampionInsightResponse>(`/api/lol/meta/champion-insight?${query.toString()}`);
  const insight = response?.insight;

  if (!response?.ok || !insight || (!insight.patchTier && !Array.isArray(insight.counters))) {
    return null;
  }

  const counters = getReliableLobbyCounters(Array.isArray(insight.counters) ? insight.counters : []);
  const normalizedGlobalWinRate = Number.isFinite(insight.globalWinRate) ? insight.globalWinRate : null;
  const patchTier = insight.patchTier || null;

  return {
    role: insight.role,
    rankBracket: insight.rankBracket,
    counters,
    globalWinRate: normalizedGlobalWinRate,
    overallMatches: Number.isFinite(insight.overallMatches) ? insight.overallMatches ?? undefined : undefined,
    patchTier,
    tierColor: patchTier ? patchTierVisuals[patchTier] : '#94a3b8',
    patch: insight.patch || 'unknown',
    sampleLabel: insight.sampleLabel || 'All ranks, Ranked Solo/Duo, current patch',
    signalQuality: insight.signalQuality || resolveLobbySignalQuality({ counters, globalWinRate: normalizedGlobalWinRate, patchTier })
  };
};

export const fetchLobbyChampionInsight = (
  championName: string,
  role: PlayerInfo['mainRole']
): Promise<LobbyChampionInsight | null> => {
  const cacheKey = getInsightCacheKey(championName, role);
  if (insightCache.has(cacheKey)) {
    return Promise.resolve(insightCache.get(cacheKey) ?? null);
  }

  const pendingRequest = insightRequests.get(cacheKey);
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = requestLobbyChampionInsight(championName, role)
    .then((insight) => {
      insightCache.set(cacheKey, insight);
      return insight;
    })
    .catch(() => null)
    .finally(() => {
      insightRequests.delete(cacheKey);
    });

  insightRequests.set(cacheKey, request);
  return request;
};

export const clearLobbyChampionInsightCache = () => {
  insightCache.clear();
  insightRequests.clear();
};
