import type { PlayerInfo } from '../../store/lobbySlice';
import { fetchSubscriptionServiceJson } from '../subscriptionDevTools';
import { canChampionPlayRole } from './championRoles';
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
  const validCounters = counters.filter((counter) => Number.isFinite(counter.matchupWinRate));
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

interface StaticPatchSource {
  provider?: unknown;
  realm?: unknown;
  url?: unknown;
  observedAt?: unknown;
}

interface StaticMetaSnapshot {
  game?: unknown;
  queue?: unknown;
  rankBracket?: unknown;
  defaultRankBracket?: unknown;
  patch?: unknown;
  patchBuild?: unknown;
  patchSource?: StaticPatchSource;
  coverage?: { completeCoverage?: unknown };
  updatedAt?: unknown;
  roles?: Record<string, { tiers?: Record<string, unknown> }>;
  champions?: Record<string, {
    slug?: unknown;
    roles?: Record<string, {
      rankBracket?: unknown;
      patch?: unknown;
      sampleLabel?: unknown;
      globalWinRate?: unknown;
      overallMatches?: unknown;
      counters?: unknown;
    }>;
  }>;
}

interface StaticMetaData {
  tierSnapshot: StaticMetaSnapshot;
  counterpickSnapshot: StaticMetaSnapshot;
  patch: string;
}

const STATIC_META_REALM_URL = 'https://ddragon.leagueoflegends.com/realms/na.json';
const STATIC_META_RANK_BRACKET = 'all';
let staticMetaDataRequest: Promise<StaticMetaData | null> | null = null;

const insightCache = new Map<string, LobbyChampionInsight | null>();
const insightRequests = new Map<string, Promise<LobbyChampionInsight | null>>();

const normalizeChampionKey = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const toFiniteNumber = (value: unknown) => (
  typeof value === 'number' && Number.isFinite(value) ? value : null
);

const getPatchFromBuild = (value: unknown) => {
  const match = /^(\d+)\.(\d+)(?:\.\d+)?$/.exec(String(value || '').trim());
  return match ? `${Number.parseInt(match[1], 10)}.${Number.parseInt(match[2], 10)}` : null;
};

const isCompleteStaticSnapshot = (snapshot: StaticMetaSnapshot, currentBuild: string, currentPatch: string) => (
  snapshot.game === 'league-of-legends'
  && snapshot.queue === 'ranked-solo-duo'
  && snapshot.patch === currentPatch
  && snapshot.patchBuild === currentBuild
  && snapshot.patchSource?.provider === 'riot-data-dragon-realm'
  && snapshot.patchSource?.realm === 'na'
  && snapshot.patchSource?.url === STATIC_META_REALM_URL
  && typeof snapshot.patchSource?.observedAt === 'string'
  && Number.isFinite(Date.parse(snapshot.patchSource.observedAt))
  && snapshot.coverage?.completeCoverage === true
);

const getStaticMetaUrl = (fileName: string) => `${import.meta.env.BASE_URL}meta/${fileName}`;

const loadStaticTierSnapshot = async (): Promise<StaticMetaSnapshot | null> => {
  try {
    const response = await fetch(getStaticMetaUrl('tier-list.json'));
    return response.ok ? await response.json() as StaticMetaSnapshot : null;
  } catch {
    return null;
  }
};

const loadStaticCounterpickSnapshot = async (): Promise<StaticMetaSnapshot | null> => {
  try {
    const response = await fetch(getStaticMetaUrl('counterpicks.json'));
    return response.ok ? await response.json() as StaticMetaSnapshot : null;
  } catch {
    return null;
  }
};

const loadStaticMetaData = async (): Promise<StaticMetaData | null> => {
  const [tierSnapshot, counterpickSnapshot, realmResponse] = await Promise.all([
    loadStaticTierSnapshot(),
    loadStaticCounterpickSnapshot(),
    fetch(STATIC_META_REALM_URL).catch(() => null)
  ]);

  if (!tierSnapshot || !counterpickSnapshot || !realmResponse?.ok) {
    return null;
  }

  try {
    const realm = await realmResponse.json() as { v?: unknown };
    const currentBuild = typeof realm.v === 'string' ? realm.v.trim() : '';
    const currentPatch = getPatchFromBuild(currentBuild);

    if (!currentPatch
      || !isCompleteStaticSnapshot(tierSnapshot, currentBuild, currentPatch)
      || !isCompleteStaticSnapshot(counterpickSnapshot, currentBuild, currentPatch)
      || tierSnapshot.rankBracket !== STATIC_META_RANK_BRACKET
      || counterpickSnapshot.defaultRankBracket !== STATIC_META_RANK_BRACKET) {
      return null;
    }

    return { tierSnapshot, counterpickSnapshot, patch: currentPatch };
  } catch {
    return null;
  }
};

const requestStaticMetaData = () => {
  staticMetaDataRequest ||= loadStaticMetaData();
  return staticMetaDataRequest;
};

const findSnapshotTier = (snapshot: StaticMetaSnapshot, championName: string, role: PlayerInfo['mainRole']): PatchTier | null => {
  const championKey = normalizeChampionKey(championName);
  const tiers = snapshot.roles?.[role]?.tiers || {};

  for (const [tier, champions] of Object.entries(tiers)) {
    if (!(tier in patchTierVisuals) || !Array.isArray(champions)) {
      continue;
    }

    if (champions.some((champion) => typeof champion === 'string' && normalizeChampionKey(champion) === championKey)) {
      return tier as PatchTier;
    }
  }

  return null;
};

const findCounterpickRole = (snapshot: StaticMetaSnapshot, championName: string, role: PlayerInfo['mainRole']) => {
  const championKey = normalizeChampionKey(championName);
  const candidate = Object.entries(snapshot.champions || {}).find(([name, entry]) => (
    normalizeChampionKey(name) === championKey || (typeof entry.slug === 'string' && normalizeChampionKey(entry.slug) === championKey)
  ));

  return candidate?.[1].roles?.[role] || null;
};

const getStaticLobbyChampionInsight = async (
  championName: string,
  role: PlayerInfo['mainRole']
): Promise<LobbyChampionInsight | null> => {
  const staticMetaData = await requestStaticMetaData();

  if (!staticMetaData) {
    return null;
  }

  const patchTier = findSnapshotTier(staticMetaData.tierSnapshot, championName, role);
  const matchup = findCounterpickRole(staticMetaData.counterpickSnapshot, championName, role);
  const counters = Array.isArray(matchup?.counters)
    ? matchup.counters.flatMap((counter): LobbyCounterpickInsight[] => {
      if (typeof counter !== 'object' || !counter) {
        return [];
      }

      const { champion, matchupWinRate, matches } = counter as { champion?: unknown; matchupWinRate?: unknown; matches?: unknown };
      const normalizedMatchupWinRate = toFiniteNumber(matchupWinRate);
      const normalizedMatches = toFiniteNumber(matches);

      return typeof champion === 'string'
        && normalizedMatchupWinRate !== null
        && canChampionPlayRole(champion, role)
        ? [{ champion, matchupWinRate: normalizedMatchupWinRate, matches: normalizedMatches ?? undefined }]
        : [];
    })
    : [];
  const reliableCounters = getReliableLobbyCounters(counters);
  const globalWinRate = toFiniteNumber(matchup?.globalWinRate);
  const overallMatches = toFiniteNumber(matchup?.overallMatches);

  if (!patchTier && reliableCounters.length === 0) {
    return null;
  }

  return {
    role,
    rankBracket: STATIC_META_RANK_BRACKET,
    counters: reliableCounters,
    globalWinRate,
    overallMatches: overallMatches ?? undefined,
    patchTier,
    tierColor: patchTier ? patchTierVisuals[patchTier] : '#94a3b8',
    patch: staticMetaData.patch,
    sampleLabel: typeof matchup?.sampleLabel === 'string'
      ? matchup.sampleLabel
      : `All ranks, Ranked Solo/Duo, patch ${staticMetaData.patch}`,
    signalQuality: resolveLobbySignalQuality({ counters: reliableCounters, globalWinRate, patchTier })
  };
};

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
    return getStaticLobbyChampionInsight(championName, role);
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
  staticMetaDataRequest = null;
};
