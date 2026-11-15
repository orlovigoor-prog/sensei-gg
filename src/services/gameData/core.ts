import type { PlayerRankTier } from '../../store/lobbySlice';
import dataDragonConfig from '../../../game-data.config.json';

export type RankTier = PlayerRankTier | 'UNRANKED';

// Static Riot reference data is deliberately pinned for reproducible UI assets and text.
export const dragonVersion = dataDragonConfig.dataDragonVersion;
export const dataDragonLocale = dataDragonConfig.locale;
export const dataDragonCdnBaseUrl = `https://ddragon.leagueoflegends.com/cdn/${dragonVersion}`;

export const getDataDragonDataUrl = (path: string, locale = dataDragonLocale) => (
  `${dataDragonCdnBaseUrl}/data/${locale}/${path}`
);

export const getDataDragonAssetUrl = (path: string) => `${dataDragonCdnBaseUrl}/img/${path}`;

export const patchTierVisuals = {
  'S+': '#f59e0b',
  S: '#10b981',
  'S-': '#34d399',
  'A+': '#38bdf8',
  A: '#60a5fa',
  'A-': '#818cf8',
  'B+': '#a78bfa',
  B: '#c084fc',
  'B-': '#d8b4fe',
  'C+': '#fb923c',
  C: '#f97316',
  'C-': '#ea580c',
  'D+': '#f87171',
  D: '#ef4444',
  'D-': '#dc2626'
} as const;

export type PatchTier = keyof typeof patchTierVisuals;
