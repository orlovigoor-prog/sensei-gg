import type { PlayerInfo } from '../../store/lobbySlice';
import { fetchSubscriptionServiceJson } from '../subscriptionDevTools';
import { patchTierVisuals, type PatchTier } from './core';

export type LobbyRankBracket = 'emerald_plus' | 'platinum-plus' | 'diamond2-plus';
export type LobbyDataRankBracket = LobbyRankBracket | 'all';
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

export const fetchLobbyChampionInsight = async (
  championName: string,
  role: PlayerInfo['mainRole'],
  rankBracket: LobbyRankBracket = 'emerald_plus'
): Promise<LobbyChampionInsight | null> => {
  const query = new URLSearchParams({ champion: championName, role, rank: rankBracket });
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
