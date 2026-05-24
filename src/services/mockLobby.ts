import type { PlayerInfo } from '../store/lobbySlice';
import type { RankedStats, Summoner } from './riotApi';
import type { CompletedMatchSummary } from '../store/gameSlice';
import { championCatalog, getChampionScenariosByRole, type ChampionScenario } from './gameData';

export const reviewModePlayerName = 'DemoProfilePlayer';

export interface DemoChampionStat {
  champion: string;
  games: number;
  winRate: number;
  kda: string;
  csPerMinute: number;
}

export interface DemoRoleStat {
  role: string;
  games: number;
  winRate: number;
}

export interface DemoRecentMatch {
  champion: string;
  result: 'Победа' | 'Поражение';
  kda: string;
  cs: number;
  duration: string;
}

export const reviewModeSummoner: Summoner = {
  id: 'demo-summoner-id',
  accountId: 'demo-account-id',
  puuid: 'demo-puuid',
  name: reviewModePlayerName,
  profileIconId: 4568,
  revisionDate: Date.now(),
  summonerLevel: 398
};

export const reviewModeRankedStats: RankedStats = {
  queueType: 'RANKED_SOLO_5x5',
  tier: 'EMERALD',
  rank: 'II',
  leaguePoints: 68,
  wins: 122,
  losses: 101,
  hotStreak: true,
  veteran: true,
  freshBlood: false,
  inactive: false
};

export const reviewModeChampionPool: DemoChampionStat[] = [
  { champion: 'Jinx', games: 44, winRate: 61.4, kda: '6.9 / 3.1 / 7.8', csPerMinute: 7.8 },
  { champion: "Kai'Sa", games: 28, winRate: 57.1, kda: '7.1 / 3.8 / 6.9', csPerMinute: 7.3 },
  { champion: 'Xayah', games: 19, winRate: 52.6, kda: '5.8 / 3.4 / 8.2', csPerMinute: 7.0 },
  { champion: 'Ezreal', games: 16, winRate: 50.0, kda: '4.9 / 3.0 / 7.1', csPerMinute: 6.9 },
  { champion: 'Ashe', games: 12, winRate: 58.3, kda: '4.4 / 3.7 / 10.1', csPerMinute: 6.6 }
];

export const reviewModeRoleStats: DemoRoleStat[] = [
  { role: 'ADC', games: 104, winRate: 58.7 },
  { role: 'SUPPORT', games: 21, winRate: 52.3 },
  { role: 'MID', games: 11, winRate: 45.4 },
  { role: 'TOP', games: 6, winRate: 50.0 }
];

export const reviewModeRecentMatches: DemoRecentMatch[] = [
  { champion: 'Jinx', result: 'Победа', kda: '12 / 3 / 8', cs: 214, duration: '29:12' },
  { champion: "Kai'Sa", result: 'Победа', kda: '9 / 2 / 6', cs: 201, duration: '27:05' },
  { champion: 'Jinx', result: 'Поражение', kda: '4 / 6 / 5', cs: 186, duration: '31:44' }
];

const roleMatchStatRanges: Record<PlayerInfo['mainRole'], {
  completedCs: [number, number];
  recentCsWin: [number, number];
  recentCsLoss: [number, number];
  killsWin: [number, number];
  killsLoss: [number, number];
  deathsWin: [number, number];
  deathsLoss: [number, number];
  assistsWin: [number, number];
  assistsLoss: [number, number];
  gameDuration: [number, number];
  championPoolGames: [[number, number], [number, number], [number, number], [number, number], [number, number]];
  championPoolWinRate: [[number, number], [number, number], [number, number], [number, number], [number, number]];
  championPoolCsPerMinute: [[number, number], [number, number], [number, number], [number, number], [number, number]];
}> = {
  TOP: {
    completedCs: [185, 255],
    recentCsWin: [182, 244],
    recentCsLoss: [168, 228],
    killsWin: [5, 10],
    killsLoss: [2, 6],
    deathsWin: [1, 4],
    deathsLoss: [4, 8],
    assistsWin: [4, 8],
    assistsLoss: [2, 5],
    gameDuration: [1680, 2220],
    championPoolGames: [[30, 52], [20, 34], [14, 24], [10, 18], [7, 14]],
    championPoolWinRate: [[53, 61], [50, 58], [47, 55], [45, 52], [44, 51]],
    championPoolCsPerMinute: [[68, 82], [66, 79], [64, 77], [61, 74], [58, 72]]
  },
  JUNGLE: {
    completedCs: [155, 220],
    recentCsWin: [150, 208],
    recentCsLoss: [138, 194],
    killsWin: [5, 11],
    killsLoss: [2, 7],
    deathsWin: [1, 4],
    deathsLoss: [4, 8],
    assistsWin: [8, 15],
    assistsLoss: [4, 10],
    gameDuration: [1620, 2100],
    championPoolGames: [[28, 49], [18, 32], [13, 22], [9, 17], [7, 13]],
    championPoolWinRate: [[54, 62], [50, 59], [48, 56], [46, 54], [44, 52]],
    championPoolCsPerMinute: [[57, 72], [56, 69], [54, 67], [52, 65], [50, 63]]
  },
  MID: {
    completedCs: [175, 245],
    recentCsWin: [174, 236],
    recentCsLoss: [162, 224],
    killsWin: [7, 13],
    killsLoss: [3, 8],
    deathsWin: [1, 4],
    deathsLoss: [4, 8],
    assistsWin: [5, 10],
    assistsLoss: [2, 6],
    gameDuration: [1620, 2040],
    championPoolGames: [[26, 45], [17, 30], [12, 21], [9, 16], [6, 12]],
    championPoolWinRate: [[53, 61], [50, 58], [47, 56], [45, 53], [43, 51]],
    championPoolCsPerMinute: [[72, 86], [70, 83], [68, 80], [65, 78], [62, 75]]
  },
  ADC: {
    completedCs: [195, 270],
    recentCsWin: [192, 252],
    recentCsLoss: [178, 236],
    killsWin: [8, 15],
    killsLoss: [3, 9],
    deathsWin: [1, 4],
    deathsLoss: [4, 8],
    assistsWin: [5, 10],
    assistsLoss: [2, 7],
    gameDuration: [1680, 2160],
    championPoolGames: [[34, 56], [22, 36], [15, 25], [11, 19], [8, 15]],
    championPoolWinRate: [[54, 63], [51, 60], [48, 57], [46, 54], [45, 53]],
    championPoolCsPerMinute: [[76, 90], [73, 87], [70, 84], [67, 81], [64, 78]]
  },
  SUPPORT: {
    completedCs: [28, 58],
    recentCsWin: [24, 52],
    recentCsLoss: [21, 46],
    killsWin: [1, 4],
    killsLoss: [0, 3],
    deathsWin: [1, 4],
    deathsLoss: [4, 9],
    assistsWin: [12, 20],
    assistsLoss: [6, 15],
    gameDuration: [1620, 2100],
    championPoolGames: [[24, 42], [16, 29], [11, 20], [8, 15], [6, 12]],
    championPoolWinRate: [[53, 61], [50, 58], [48, 55], [46, 53], [44, 52]],
    championPoolCsPerMinute: [[11, 18], [11, 17], [10, 16], [10, 15], [9, 14]]
  }
};
const roleOrder: PlayerInfo['mainRole'][] = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'];

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomFrom = <T>(items: T[]) => items[randomInt(0, items.length - 1)];

const takeUniqueRandom = <T>(items: T[], count: number) => {
  const pool = [...items];
  const picked: T[] = [];

  while (pool.length > 0 && picked.length < count) {
    const index = randomInt(0, pool.length - 1);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }

  return picked;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const roleChampionPools: Record<PlayerInfo['mainRole'], string[]> = {
  TOP: championCatalog.filter((entry) => entry.primaryRole === 'TOP').map((entry) => entry.name),
  JUNGLE: championCatalog.filter((entry) => entry.primaryRole === 'JUNGLE').map((entry) => entry.name),
  MID: championCatalog.filter((entry) => entry.primaryRole === 'MID').map((entry) => entry.name),
  ADC: championCatalog.filter((entry) => entry.primaryRole === 'ADC').map((entry) => entry.name),
  SUPPORT: championCatalog.filter((entry) => entry.primaryRole === 'SUPPORT').map((entry) => entry.name)
};

const applyScenarioModifier = (scenario: ChampionScenario, stat: 'kills' | 'deaths' | 'assists', value: number, result: 'W' | 'L') => {
  if (scenario.style === 'lane-bully') {
    if (stat === 'kills') return value + (result === 'W' ? 2 : 1);
    if (stat === 'deaths') return Math.max(1, value - (result === 'W' ? 1 : 0));
  }

  if (scenario.style === 'scaling-carry') {
    if (stat === 'kills') return value + (result === 'W' ? 1 : 0);
    if (stat === 'deaths') return result === 'W' ? Math.max(1, value - 1) : value;
  }

  if (scenario.style === 'playmaker') {
    if (stat === 'kills') return value + 1;
    if (stat === 'assists') return value + 2;
  }

  if (scenario.style === 'teamfight-anchor') {
    if (stat === 'assists') return value + 3;
    if (stat === 'deaths') return result === 'W' ? value : value + 1;
  }

  if (scenario.style === 'utility') {
    if (stat === 'kills') return Math.max(0, value - 1);
    if (stat === 'assists') return value + 4;
  }

  return value;
};

const buildRecentMatch = (champion: string, role: PlayerInfo['mainRole'], result: 'W' | 'L', scenario?: ChampionScenario) => {
  const ranges = roleMatchStatRanges[role];
  const baseKills = result === 'W' ? randomInt(ranges.killsWin[0], ranges.killsWin[1]) : randomInt(ranges.killsLoss[0], ranges.killsLoss[1]);
  const baseDeaths = result === 'W' ? randomInt(ranges.deathsWin[0], ranges.deathsWin[1]) : randomInt(ranges.deathsLoss[0], ranges.deathsLoss[1]);
  const baseAssists = result === 'W' ? randomInt(ranges.assistsWin[0], ranges.assistsWin[1]) : randomInt(ranges.assistsLoss[0], ranges.assistsLoss[1]);
  const kills = clamp(scenario ? applyScenarioModifier(scenario, 'kills', baseKills, result) : baseKills, 0, 20);
  const deaths = clamp(scenario ? applyScenarioModifier(scenario, 'deaths', baseDeaths, result) : baseDeaths, 1, 12);
  const assists = clamp(scenario ? applyScenarioModifier(scenario, 'assists', baseAssists, result) : baseAssists, 0, 24);

  return {
    result,
    champion,
    kda: `${kills} / ${deaths} / ${assists}`,
    k: kills,
    d: deaths,
    a: assists,
    gameType: 'RANKED' as const
  };
};

const buildDemoProfileRecentMatches = () => {
  const role = randomFrom(roleOrder);
  const scenario = randomFrom(getChampionScenariosByRole(role));
  const [primaryChampion, secondaryChampion] = scenario.champions;

  return {
    role,
    scenario,
    matches: [
      buildRecentMatch(primaryChampion, role, 'W', scenario),
      buildRecentMatch(secondaryChampion, role, 'W', scenario),
      buildRecentMatch(primaryChampion, role, 'L', scenario)
    ]
  };
};

const formatDurationLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

const buildDemoChampionPool = (role: PlayerInfo['mainRole'], demoRecentMatches: PlayerInfo['recentMatches'], scenario: ChampionScenario): DemoChampionStat[] => {
  const statRanges = roleMatchStatRanges[role];
  const champions = [
    ...scenario.champions,
    ...takeUniqueRandom(roleChampionPools[role].filter((champion) => !scenario.champions.includes(champion)), 3)
  ];

  return champions.map((champion, index) => ({
    champion,
    games: randomInt(statRanges.championPoolGames[index][0], statRanges.championPoolGames[index][1]),
    winRate: Number((randomInt(statRanges.championPoolWinRate[index][0], statRanges.championPoolWinRate[index][1]) + Math.random()).toFixed(1)),
    kda: demoRecentMatches[index]?.kda ?? buildRecentMatch(champion, role, index < 2 ? 'W' : 'L', scenario).kda,
    csPerMinute: Number((randomInt(statRanges.championPoolCsPerMinute[index][0], statRanges.championPoolCsPerMinute[index][1]) / 10).toFixed(1))
  }));
};

const buildDemoRoleStats = (demoRole: PlayerInfo['mainRole']): DemoRoleStat[] => (
  roleOrder.map((role) => ({
    role,
    games: role === demoRole ? randomInt(72, 128) : randomInt(4, role === 'SUPPORT' || role === 'JUNGLE' ? 22 : 18),
    winRate: role === demoRole ? randomInt(53, 61) : randomInt(41, 54)
  }))
);

const buildDemoRecentMatchCards = (role: PlayerInfo['mainRole'], demoRecentMatches: PlayerInfo['recentMatches']): DemoRecentMatch[] => {
  const statRanges = roleMatchStatRanges[role];

  return demoRecentMatches.map((match) => ({
    champion: match.champion,
    result: match.result === 'W' ? 'Победа' : 'Поражение',
    kda: match.kda,
    cs: match.result === 'W'
      ? randomInt(statRanges.recentCsWin[0], statRanges.recentCsWin[1])
      : randomInt(statRanges.recentCsLoss[0], statRanges.recentCsLoss[1]),
    duration: formatDurationLabel(randomInt(statRanges.gameDuration[0], statRanges.gameDuration[1]))
  }));
};

const buildCompletedMatchSummary = (player: PlayerInfo): CompletedMatchSummary => {
  const latestMatch = player.recentMatches[0];
  const statRanges = roleMatchStatRanges[player.mainRole];
  const gameDurationSeconds = randomInt(statRanges.gameDuration[0], statRanges.gameDuration[1]);
  const cs = randomInt(statRanges.completedCs[0], statRanges.completedCs[1]);
  const kills = latestMatch?.k ?? 0;
  const deaths = latestMatch?.d ?? 0;
  const assists = latestMatch?.a ?? 0;
  const kda = Number((((kills + assists) / Math.max(1, deaths))).toFixed(2));

  return {
    championName: latestMatch?.champion ?? 'Jinx',
    kills,
    deaths,
    assists,
    cs,
    gameDurationSeconds,
    csPerMinute: Number((cs / (gameDurationSeconds / 60)).toFixed(1)),
    kda,
    takedowns: kills + assists,
    endedAt: new Date().toISOString()
  };
};

export const createMockPlayers = (): PlayerInfo[] => ([
  {
    summonerName: 'Player1',
    rank: '14',
    tier: 'SILVER',
    lp: 14,
    wins: 48,
    losses: 58,
    winRate: 45,
    mainRole: 'TOP',
    championMastery: 122000,
    championPoints: 148000,
    isPro: false,
    recentMatches: [
      { result: 'W', champion: 'LeeSin', kda: '12 / 4 / 11', k: 12, d: 4, a: 11, gameType: 'RANKED' },
      { result: 'L', champion: 'Aatrox', kda: '3 / 6 / 4', k: 3, d: 6, a: 4, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player2',
    rank: '91',
    tier: 'GOLD',
    lp: 91,
    wins: 73,
    losses: 64,
    winRate: 53,
    mainRole: 'JUNGLE',
    championMastery: 266000,
    championPoints: 291000,
    isPro: false,
    recentMatches: [
      { result: 'W', champion: 'Zed', kda: '2 / 1 / 5', k: 2, d: 1, a: 5, gameType: 'RANKED' },
      { result: 'W', champion: 'LeeSin', kda: '7 / 3 / 9', k: 7, d: 3, a: 9, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player3',
    rank: '1',
    tier: 'PLATINUM',
    lp: 1,
    wins: 76,
    losses: 50,
    winRate: 60,
    mainRole: 'MID',
    championMastery: 311000,
    championPoints: 338000,
    isPro: false,
    recentMatches: [
      { result: 'W', champion: 'Ahri', kda: '11 / 4 / 12', k: 11, d: 4, a: 12, gameType: 'RANKED' },
      { result: 'W', champion: 'Orianna', kda: '6 / 2 / 10', k: 6, d: 2, a: 10, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player4',
    rank: '68',
    tier: 'EMERALD',
    lp: 68,
    wins: 122,
    losses: 101,
    winRate: 55,
    mainRole: 'ADC',
    championMastery: 412000,
    championPoints: 468000,
    isPro: false,
    recentMatches: [
      { result: 'W', champion: 'Jinx', kda: '12 / 3 / 8', k: 12, d: 3, a: 8, gameType: 'RANKED' },
      { result: 'W', champion: "Kai'Sa", kda: '9 / 2 / 6', k: 9, d: 2, a: 6, gameType: 'RANKED' },
      { result: 'L', champion: 'Jinx', kda: '4 / 6 / 5', k: 4, d: 6, a: 5, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player5',
    rank: '22',
    tier: 'DIAMOND',
    lp: 22,
    wins: 50,
    losses: 51,
    winRate: 50,
    mainRole: 'SUPPORT',
    championMastery: 201000,
    championPoints: 235000,
    isPro: false,
    recentMatches: [
      { result: 'W', champion: 'Thresh', kda: '6 / 4 / 2', k: 6, d: 4, a: 2, gameType: 'RANKED' },
      { result: 'W', champion: 'Nautilus', kda: '1 / 4 / 14', k: 1, d: 4, a: 14, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player6',
    rank: '46',
    tier: 'BRONZE',
    lp: 46,
    wins: 60,
    losses: 61,
    winRate: 50,
    mainRole: 'TOP',
    championMastery: 98000,
    championPoints: 126000,
    isPro: false,
    recentMatches: [
      { result: 'L', champion: 'Renekton', kda: '7 / 8 / 2', k: 7, d: 8, a: 2, gameType: 'RANKED' },
      { result: 'L', champion: 'Aatrox', kda: '3 / 7 / 4', k: 3, d: 7, a: 4, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player7',
    rank: '3',
    tier: 'SILVER',
    lp: 3,
    wins: 47,
    losses: 64,
    winRate: 42,
    mainRole: 'JUNGLE',
    championMastery: 103000,
    championPoints: 141000,
    isPro: false,
    recentMatches: [
      { result: 'L', champion: 'LeeSin', kda: '7 / 1 / 5', k: 7, d: 1, a: 5, gameType: 'RANKED' },
      { result: 'W', champion: 'Vi', kda: '8 / 3 / 7', k: 8, d: 3, a: 7, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player8',
    rank: '62',
    tier: 'BRONZE',
    lp: 62,
    wins: 81,
    losses: 99,
    winRate: 45,
    mainRole: 'MID',
    championMastery: 117000,
    championPoints: 163000,
    isPro: false,
    recentMatches: [
      { result: 'L', champion: 'Zed', kda: '14 / 0 / 12', k: 14, d: 0, a: 12, gameType: 'RANKED' },
      { result: 'W', champion: 'Vex', kda: '10 / 2 / 8', k: 10, d: 2, a: 8, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player9',
    rank: '4',
    tier: 'BRONZE',
    lp: 4,
    wins: 31,
    losses: 61,
    winRate: 34,
    mainRole: 'ADC',
    championMastery: 87000,
    championPoints: 109000,
    isPro: false,
    recentMatches: [
      { result: 'L', champion: 'Lucian', kda: '5 / 9 / 1', k: 5, d: 9, a: 1, gameType: 'RANKED' },
      { result: 'L', champion: 'Jinx', kda: '2 / 7 / 3', k: 2, d: 7, a: 3, gameType: 'RANKED' }
    ]
  },
  {
    summonerName: 'Player10',
    rank: '72',
    tier: 'SILVER',
    lp: 72,
    wins: 56,
    losses: 65,
    winRate: 46,
    mainRole: 'SUPPORT',
    championMastery: 93000,
    championPoints: 118000,
    isPro: false,
    recentMatches: [
      { result: 'L', champion: 'Thresh', kda: '0 / 6 / 7', k: 0, d: 6, a: 7, gameType: 'RANKED' },
      { result: 'L', champion: 'Leona', kda: '1 / 8 / 9', k: 1, d: 8, a: 9, gameType: 'RANKED' }
    ]
  }
]);

export interface ReviewModeScenario {
  players: PlayerInfo[];
  completedMatch: CompletedMatchSummary;
  partyMembers: string[];
}

export const createReviewModeScenario = (): ReviewModeScenario => {
  const demoProfile = buildDemoProfileRecentMatches();
  const demoRole = demoProfile.role;
  const demoScenario = demoProfile.scenario;
  const demoRecentMatches = demoProfile.matches;
  const demoChampionPool = buildDemoChampionPool(demoRole, demoRecentMatches, demoScenario);
  const demoRoleStats = buildDemoRoleStats(demoRole);
  const demoRecentMatchCards = buildDemoRecentMatchCards(demoRole, demoRecentMatches);

  const players = createMockPlayers();
  const targetIndex = roleOrder.indexOf(demoRole);
  const partyPartnerName = players.find((_, index) => index < 5 && index !== targetIndex)?.summonerName ?? 'Player1';
  players[targetIndex] = {
    ...players[targetIndex],
    summonerName: reviewModePlayerName,
    tier: 'EMERALD',
    lp: 68,
    wins: 122,
    losses: 101,
    winRate: 55,
    mainRole: demoRole,
    championMastery: 412000,
    championPoints: 468000,
    recentMatches: demoRecentMatches
  };

  reviewModeRankedStats.queueType = 'RANKED_SOLO_5x5';

  reviewModeChampionPool.splice(0, reviewModeChampionPool.length,
    ...demoChampionPool
  );

  reviewModeRoleStats.splice(0, reviewModeRoleStats.length,
    ...demoRoleStats
  );

  reviewModeRecentMatches.splice(0, reviewModeRecentMatches.length,
    ...demoRecentMatchCards
  );

  return {
    players,
    completedMatch: buildCompletedMatchSummary(players[targetIndex]),
    partyMembers: [reviewModePlayerName, partyPartnerName]
  };
};
