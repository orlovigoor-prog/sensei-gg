import type { PlayerInfo } from '../store/lobbySlice';

const mockTiers: PlayerInfo['tier'][] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'];
const mockRoles: PlayerInfo['mainRole'][] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];
const mockChampions = ['Yasuo', 'Zed', 'LeeSin', 'Jinx', 'Thresh'];

export const createMockPlayers = (): PlayerInfo[] =>
  Array.from({ length: 10 }, (_, i) => ({
    summonerName: `Player${i + 1}`,
    rank: `${Math.floor(Math.random() * 100)}`,
    tier: mockTiers[Math.floor(Math.random() * mockTiers.length)],
    lp: Math.floor(Math.random() * 100),
    wins: Math.floor(Math.random() * 100) + 20,
    losses: Math.floor(Math.random() * 100) + 20,
    winRate: Math.floor(Math.random() * 40) + 40,
    mainRole: mockRoles[i % mockRoles.length],
    championMastery: Math.floor(Math.random() * 500000),
    championPoints: Math.floor(Math.random() * 500000),
    isPro: false,
    recentMatches: Array.from({ length: 5 }, () => ({
      result: Math.random() > 0.5 ? 'W' : 'L',
      champion: mockChampions[Math.floor(Math.random() * mockChampions.length)],
      kda: `${Math.floor(Math.random() * 15)} / ${Math.floor(Math.random() * 5)} / ${Math.floor(Math.random() * 15)}`,
      k: Math.floor(Math.random() * 15),
      d: Math.floor(Math.random() * 5),
      a: Math.floor(Math.random() * 15),
      gameType: 'RANKED'
    }))
  }));
