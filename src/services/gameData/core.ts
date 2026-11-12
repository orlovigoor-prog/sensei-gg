import type { PlayerInfo } from '../../store/lobbySlice';
import dataDragonConfig from '../../../game-data.config.json';

export type RankTier = PlayerInfo['tier'] | 'UNRANKED';

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
  A: '#60a5fa',
  B: '#c084fc'
} as const;

export type PatchTier = keyof typeof patchTierVisuals;
