import type { PlayerInfo } from '../store/lobbySlice';

export type RankTier = PlayerInfo['tier'] | 'UNRANKED';

const rankColors: Record<RankTier, string> = {
  CHALLENGER: '#fbbf24',
  GRANDMASTER: '#f87171',
  MASTER: '#c084fc',
  DIAMOND: '#60a5fa',
  EMERALD: '#34d399',
  PLATINUM: '#22d3ee',
  GOLD: '#facc15',
  SILVER: '#cbd5e1',
  BRONZE: '#d97706',
  IRON: '#6b7280',
  UNRANKED: '#38bdf8'
};

const rankIconSlugs: Record<RankTier, string> = {
  CHALLENGER: 'challenger',
  GRANDMASTER: 'grandmaster',
  MASTER: 'master',
  DIAMOND: 'diamond',
  EMERALD: 'emerald',
  PLATINUM: 'platinum',
  GOLD: 'gold',
  SILVER: 'silver',
  BRONZE: 'bronze',
  IRON: 'iron',
  UNRANKED: 'default'
};

const OPGG_RANK_BASE = 'https://opgg-static.akamaized.net/images/medals_new';
const COMMUNITY_DRAGON_UNRANKED_BASE = 'https://raw.communitydragon.org/15.10/plugins/rcp-be-lol-game-data/global/default/assets/regalia/bannerskins';

export const getRankColor = (tier: RankTier) => rankColors[tier];

export const getRankIconUrl = (tier: RankTier) => {
  if (tier === 'UNRANKED') {
    return `${COMMUNITY_DRAGON_UNRANKED_BASE}/${rankIconSlugs[tier]}.png`;
  }

  return `${OPGG_RANK_BASE}/${rankIconSlugs[tier]}.png?image=q_auto:good,f_webp,w_144`;
};
