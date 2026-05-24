import { dragonVersion, type RankTier } from './core';

export const rankVisuals: Record<RankTier, { color: string; slug: string }> = {
  CHALLENGER: { color: '#fbbf24', slug: 'challenger' },
  GRANDMASTER: { color: '#f87171', slug: 'grandmaster' },
  MASTER: { color: '#c084fc', slug: 'master' },
  DIAMOND: { color: '#60a5fa', slug: 'diamond' },
  EMERALD: { color: '#34d399', slug: 'emerald' },
  PLATINUM: { color: '#22d3ee', slug: 'platinum' },
  GOLD: { color: '#facc15', slug: 'gold' },
  SILVER: { color: '#cbd5e1', slug: 'silver' },
  BRONZE: { color: '#d97706', slug: 'bronze' },
  IRON: { color: '#6b7280', slug: 'iron' },
  UNRANKED: { color: '#38bdf8', slug: 'default' }
};

export const getProfileIconUrl = (profileIconId: number) => `https://ddragon.leagueoflegends.com/cdn/${dragonVersion}/img/profileicon/${profileIconId}.png`;
