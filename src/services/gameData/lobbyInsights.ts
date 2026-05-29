import type { PlayerInfo } from '../../store/lobbySlice';
import { fetchSubscriptionServiceJson } from '../subscriptionDevTools';
import { patchTierVisuals, type PatchTier } from './core';
import { canChampionPlayRole } from './championRoles';

export type LobbyRankBracket = 'emerald_plus' | 'platinum-plus' | 'diamond2-plus';

export interface LobbyCounterpickInsight {
  champion: string;
  matchupWinRate: number;
  matches?: number;
}

export interface LobbyChampionInsight {
  role: PlayerInfo['mainRole'];
  rankBracket: LobbyRankBracket;
  counters: LobbyCounterpickInsight[];
  globalWinRate?: number | null;
  overallMatches?: number;
  patchTier: PatchTier;
  tierColor: string;
  patch: string;
  sampleLabel: string;
}

const patch = '30';
const sampleLabel = 'Emerald+, Ranked Solo/Duo, last 30 days';

const buildInsight = (input: Omit<LobbyChampionInsight, 'tierColor' | 'patch' | 'sampleLabel' | 'rankBracket'>): LobbyChampionInsight => ({
  ...input,
  rankBracket: 'emerald_plus',
  tierColor: patchTierVisuals[input.patchTier] ?? patchTierVisuals.B,
  patch,
  sampleLabel
});

const roleInsightCatalog: Partial<Record<PlayerInfo['mainRole'], Record<string, LobbyChampionInsight>>> = {
  TOP: {
    Aatrox: buildInsight({
      role: 'TOP',
      globalWinRate: 50.42,
      overallMatches: 326074,
      patchTier: 'B',
      counters: [
        { champion: 'Vayne', matchupWinRate: 53.2 },
        { champion: 'Kennen', matchupWinRate: 52.9, matches: 1385 },
        { champion: 'Irelia', matchupWinRate: 52.9, matches: 3976 },
        { champion: 'Ornn', matchupWinRate: 52.2, matches: 3354 },
        { champion: 'Kayle', matchupWinRate: 52.2, matches: 1766 }
      ]
    })
  },
  MID: {
    Ahri: buildInsight({
      role: 'MID',
      globalWinRate: 51.75,
      overallMatches: 569255,
      patchTier: 'S',
      counters: [
        { champion: 'Morgana', matchupWinRate: 77.8, matches: 9 },
        { champion: "Vel'Koz", matchupWinRate: 70.0, matches: 10 },
        { champion: 'Brand', matchupWinRate: 64.3, matches: 14 },
        { champion: 'Sylas', matchupWinRate: 63.9, matches: 133 },
        { champion: 'Ryze', matchupWinRate: 60.9, matches: 46 }
      ]
    })
  },
  ADC: {
    Jinx: buildInsight({
      role: 'ADC',
      globalWinRate: 52.42,
      overallMatches: 631037,
      patchTier: 'B',
      counters: [
        { champion: 'Seraphine', matchupWinRate: 54.8, matches: 1322 },
        { champion: 'Swain', matchupWinRate: 53.2, matches: 1753 },
        { champion: 'Karthus', matchupWinRate: 52.8, matches: 1306 },
        { champion: 'Ziggs', matchupWinRate: 52.2, matches: 2270 },
        { champion: 'Twitch', matchupWinRate: 51.9, matches: 9783 }
      ]
    })
  }
};

export const getLobbyChampionInsight = (
  championName: string,
  role: PlayerInfo['mainRole'],
  rankBracket: LobbyRankBracket = 'emerald_plus'
): LobbyChampionInsight | null => {
  if (rankBracket !== 'emerald_plus' && rankBracket !== 'platinum-plus') {
    return null;
  }

  const insight = roleInsightCatalog[role]?.[championName] ?? null;

  return insight ? {
    ...insight,
    counters: insight.counters.filter((counter) => canChampionPlayRole(counter.champion, role))
  } : null;
};

interface BackendLobbyChampionInsightResponse {
  ok: boolean;
  insight?: {
    role: PlayerInfo['mainRole'];
    rankBracket: LobbyRankBracket;
    counters?: LobbyCounterpickInsight[];
    globalWinRate?: number | null;
    overallMatches?: number | null;
    patchTier?: PatchTier | null;
    patch?: string;
    sampleLabel?: string;
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

  if (!response?.ok || !insight?.patchTier) {
    return getLobbyChampionInsight(championName, role, rankBracket === 'diamond2-plus' ? 'emerald_plus' : rankBracket);
  }

  return {
    role: insight.role,
    rankBracket: insight.rankBracket,
    counters: Array.isArray(insight.counters) ? insight.counters.filter((counter) => canChampionPlayRole(counter.champion, insight.role)) : [],
    globalWinRate: Number.isFinite(insight.globalWinRate) ? insight.globalWinRate : null,
    overallMatches: Number.isFinite(insight.overallMatches) ? insight.overallMatches ?? undefined : undefined,
    patchTier: insight.patchTier,
    tierColor: patchTierVisuals[insight.patchTier] ?? patchTierVisuals.B,
    patch: insight.patch || patch,
    sampleLabel: insight.sampleLabel || sampleLabel
  };
};
