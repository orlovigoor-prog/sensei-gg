import type { PlayerInfo } from '../../store/lobbySlice';

export type RankTier = PlayerInfo['tier'] | 'UNRANKED';

export const dragonVersion = '14.10.1';

export const patchTierVisuals = {
  'S+': '#f59e0b',
  S: '#10b981',
  A: '#60a5fa',
  B: '#c084fc'
} as const;

export type PatchTier = keyof typeof patchTierVisuals;
