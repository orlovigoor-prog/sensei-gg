import type { PlayerInfo } from '../store/lobbySlice';

type RankTier = PlayerInfo['tier'];

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
  IRON: '#6b7280'
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
  IRON: 'iron'
};

const COMMUNITY_DRAGON_RANK_BASE = 'https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-static-assets/global/default/images/ranked-mini-crests';

export const getRankColor = (tier: RankTier) => rankColors[tier];

export const getRankIconUrl = (tier: RankTier) => `${COMMUNITY_DRAGON_RANK_BASE}/${rankIconSlugs[tier]}.png`;
