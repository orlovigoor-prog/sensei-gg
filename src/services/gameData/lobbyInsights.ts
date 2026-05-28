import type { PlayerInfo } from '../../store/lobbySlice';
import { patchTierVisuals, type PatchTier } from './core';

export type LobbyRankBracket = 'platinum-plus';

export interface LobbyCounterpickInsight {
  champion: string;
  matchupWinRate: number;
  matches?: number;
}

export interface LobbyChampionInsight {
  role: PlayerInfo['mainRole'];
  rankBracket: LobbyRankBracket;
  counters: LobbyCounterpickInsight[];
  globalWinRate: number;
  overallMatches?: number;
  patchTier: PatchTier;
  tierColor: string;
  patch: string;
  sampleLabel: string;
}

const patch = '16.11';
const sampleLabel = 'Platinum+, Ranked Solo';

const buildInsight = (input: Omit<LobbyChampionInsight, 'tierColor' | 'patch' | 'sampleLabel' | 'rankBracket'>): LobbyChampionInsight => ({
  ...input,
  rankBracket: 'platinum-plus',
  tierColor: patchTierVisuals[input.patchTier] ?? patchTierVisuals.B,
  patch,
  sampleLabel
});

const roleInsightCatalog: Partial<Record<PlayerInfo['mainRole'], Record<string, LobbyChampionInsight>>> = {
  TOP: {
    Aatrox: buildInsight({
      role: 'TOP',
      globalWinRate: 49.4,
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
      globalWinRate: 49.4,
      overallMatches: 2413,
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
      globalWinRate: 48.5,
      overallMatches: 319204,
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
  rankBracket: LobbyRankBracket = 'platinum-plus'
): LobbyChampionInsight | null => {
  if (rankBracket !== 'platinum-plus') {
    return null;
  }

  return roleInsightCatalog[role]?.[championName] ?? null;
};
