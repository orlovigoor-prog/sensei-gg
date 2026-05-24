import type { PlayerInfo } from '../store/lobbySlice';

const apexRankTiers: PlayerInfo['tier'][] = ['MASTER', 'GRANDMASTER', 'CHALLENGER'];

export const formatPlayerRankLabel = (player: Pick<PlayerInfo, 'tier' | 'rank' | 'lp'>) => {
  const normalizedDivision = typeof player.rank === 'string' ? player.rank.trim().toUpperCase() : '';
  const hasDivision = ['I', 'II', 'III', 'IV'].includes(normalizedDivision);

  if (apexRankTiers.includes(player.tier)) {
    return player.lp > 0 ? `${player.tier} ${player.lp} LP` : player.tier;
  }

  return hasDivision ? `${player.tier} ${normalizedDivision}` : player.tier;
};
