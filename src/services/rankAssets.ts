import { rankVisuals, type RankTier } from './gameData';

export type { RankTier } from './gameData';

const OPGG_RANK_BASE = 'https://opgg-static.akamaized.net/images/medals_new';
const COMMUNITY_DRAGON_UNRANKED_BASE = 'https://raw.communitydragon.org/15.10/plugins/rcp-be-lol-game-data/global/default/assets/regalia/bannerskins';

export const getRankColor = (tier: RankTier) => rankVisuals[tier].color;

export const getRankIconUrl = (tier: RankTier) => {
  if (tier === 'UNRANKED') {
    return `${COMMUNITY_DRAGON_UNRANKED_BASE}/${rankVisuals[tier].slug}.png`;
  }

  return `${OPGG_RANK_BASE}/${rankVisuals[tier].slug}.png?image=q_auto:good,f_webp,w_144`;
};
