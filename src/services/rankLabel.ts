import type { PlayerInfo, PlayerRankTier } from '../store/lobbySlice';

const apexRankTiers: PlayerRankTier[] = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

export const formatPlayerRankLabel = (player: Pick<PlayerInfo, 'tier' | 'rank' | 'lp'>) => {
  if (!player.tier) {
    return '—';
  }

  const normalizedDivision = typeof player.rank === 'string' ? player.rank.trim().toUpperCase() : '';
  const hasDivision = ['I', 'II', 'III', 'IV'].includes(normalizedDivision);

  if (apexRankTiers.includes(player.tier)) {
    return typeof player.lp === 'number' && player.lp > 0 ? `${player.tier} ${player.lp} LP` : player.tier;
  }

  return hasDivision ? `${player.tier} ${normalizedDivision}` : player.tier;
};
