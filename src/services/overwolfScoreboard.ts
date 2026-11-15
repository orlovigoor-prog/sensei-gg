import type { CompletedMatchScoreboard, CompletedScoreboardPlayer, PlayerInfo, PlayerRole } from '../store/lobbySlice';

type UnknownRecord = Record<string, unknown>;

const roleByLiveClientPosition: Record<string, PlayerRole> = {
  TOP: 'TOP',
  JUNGLE: 'JUNGLE',
  MIDDLE: 'MID',
  MID: 'MID',
  BOTTOM: 'ADC',
  BOT: 'ADC',
  ADC: 'ADC',
  UTILITY: 'SUPPORT',
  SUPPORT: 'SUPPORT'
};

const summonerSpellIdsByName: Record<string, number> = {
  BARRIER: 21,
  CLARITY: 13,
  CLEANSE: 1,
  EXHAUST: 3,
  FLASH: 4,
  GHOST: 6,
  HEAL: 7,
  IGNITE: 14,
  MARK: 32,
  SMITE: 11,
  SNOWBALL: 32,
  TELEPORT: 12
};

const asRecord = (value: unknown): UnknownRecord | null => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as UnknownRecord
    : null
);

const parseJsonValue = (value: unknown): unknown => {
  let parsedValue = value;

  for (let attempt = 0; attempt < 3 && typeof parsedValue === 'string'; attempt += 1) {
    try {
      parsedValue = JSON.parse(parsedValue) as unknown;
    } catch {
      return null;
    }
  }

  return parsedValue;
};

const readRecord = (value: unknown): UnknownRecord | null => asRecord(parseJsonValue(value));

const readArray = (value: unknown): unknown[] | null => {
  const parsedValue = parseJsonValue(value);
  return Array.isArray(parsedValue) ? parsedValue : null;
};

const unwrapLiveClientValue = (value: unknown, key: 'active_player' | 'all_players') => {
  let unwrappedValue = parseJsonValue(value);

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const record = asRecord(unwrappedValue);

    if (!record || record[key] === undefined) {
      break;
    }

    unwrappedValue = parseJsonValue(record[key]);
  }

  return unwrappedValue;
};

const readString = (value: unknown): string | undefined => (
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
);

const readNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : undefined;
  }

  return undefined;
};

const normalizeName = (value: string) => value.trim().toLocaleLowerCase();

const normalizeRole = (value: unknown): PlayerRole | undefined => {
  const position = readString(value)?.toUpperCase();
  return position ? roleByLiveClientPosition[position] : undefined;
};

const normalizeSummonerSpellId = (value: unknown): number | undefined => {
  const spell = readRecord(value);
  const spellName = readString(spell?.displayName)?.toUpperCase();
  return spellName ? summonerSpellIdsByName[spellName] : undefined;
};

const normalizeItems = (value: unknown) => {
  const rawItems = readArray(value) ?? [];
  const items: number[] = [];
  let trinketId: number | undefined;

  rawItems.forEach((rawItem) => {
    const item = readRecord(rawItem);
    const itemId = readNumber(item?.itemID ?? item?.itemId ?? item?.id);
    const slot = readNumber(item?.slot);

    if (!itemId || itemId <= 0) {
      return;
    }

    if (slot === 6) {
      trinketId = itemId;
      return;
    }

    if (items.length < 6) {
      items.push(itemId);
    }
  });

  return {
    items: items.length > 0 ? items : undefined,
    trinketId
  };
};

const normalizePlayer = (value: unknown): { team: 'ORDER' | 'CHAOS'; player: CompletedScoreboardPlayer } | null => {
  const source = readRecord(value);
  const team = readString(source?.team)?.toUpperCase();
  const summonerName = readString(source?.summonerName);
  const championName = readString(source?.championName);

  if ((team !== 'ORDER' && team !== 'CHAOS') || !summonerName || !championName) {
    return null;
  }

  const scores = readRecord(source?.scores);
  const runes = readRecord(source?.runes);
  const summonerSpells = readRecord(source?.summonerSpells);
  const spellOne = normalizeSummonerSpellId(summonerSpells?.summonerSpellOne);
  const spellTwo = normalizeSummonerSpellId(summonerSpells?.summonerSpellTwo);
  const normalizedItems = normalizeItems(source?.items);
  const keystoneId = readNumber(readRecord(runes?.keystone)?.id);
  const primaryStyleId = readNumber(readRecord(runes?.primaryRuneTree)?.id);
  const secondaryStyleId = readNumber(readRecord(runes?.secondaryRuneTree)?.id);

  return {
    team,
    player: {
      summonerName,
      championName,
      role: normalizeRole(source?.position),
      kills: readNumber(scores?.kills),
      deaths: readNumber(scores?.deaths),
      assists: readNumber(scores?.assists),
      cs: readNumber(scores?.creepScore),
      visionScore: readNumber(scores?.wardScore),
      ...normalizedItems,
      summonerSpells: spellOne !== undefined && spellTwo !== undefined ? [spellOne, spellTwo] : undefined,
      runes: keystoneId !== undefined || primaryStyleId !== undefined || secondaryStyleId !== undefined
        ? { keystoneId, primaryStyleId, secondaryStyleId }
        : undefined
    }
  };
};

export interface LiveClientScoreboardSnapshot {
  activePlayer: unknown;
  allPlayers: unknown;
}

export interface LiveClientRosterSnapshot {
  allies: PlayerInfo[];
  enemies: PlayerInfo[];
  localSummonerName: string;
  source: 'overwolf-live-client-data';
}

export const extractLiveClientScoreboardSnapshot = (value: unknown): Partial<LiveClientScoreboardSnapshot> => {
  const liveClientData = readRecord(value);

  if (!liveClientData) {
    return {};
  }

  return {
    activePlayer: liveClientData.active_player,
    allPlayers: liveClientData.all_players
  };
};

export const normalizeLiveClientScoreboard = ({ activePlayer, allPlayers }: LiveClientScoreboardSnapshot): CompletedMatchScoreboard | null => {
  const activePlayerRecord = readRecord(unwrapLiveClientValue(activePlayer, 'active_player'));
  const activePlayerName = readString(activePlayerRecord?.summonerName);
  const rawPlayers = readArray(unwrapLiveClientValue(allPlayers, 'all_players'));

  if (!activePlayerName || !rawPlayers) {
    return null;
  }

  const normalizedPlayers = rawPlayers.map(normalizePlayer);
  if (normalizedPlayers.some((player) => player === null)) {
    return null;
  }

  const players = normalizedPlayers as Array<{ team: 'ORDER' | 'CHAOS'; player: CompletedScoreboardPlayer }>;
  const localPlayer = players.find(({ player }) => normalizeName(player.summonerName) === normalizeName(activePlayerName));

  if (!localPlayer) {
    return null;
  }

  const allies = players.filter(({ team }) => team === localPlayer.team).map(({ player }) => player);
  const enemies = players.filter(({ team }) => team !== localPlayer.team).map(({ player }) => player);

  if (allies.length !== 5 || enemies.length !== 5) {
    return null;
  }

  return {
    allies,
    enemies,
    localSummonerName: localPlayer.player.summonerName,
    source: 'overwolf-live-client-data'
  };
};

const hasCompleteRoleCoverage = (players: CompletedScoreboardPlayer[]) => {
  const roles = players.map((player) => player.role);
  return roles.length === 5 && roles.every((role): role is PlayerRole => role !== undefined) && new Set(roles).size === 5;
};

export const normalizeLiveClientRoster = (snapshot: LiveClientScoreboardSnapshot): LiveClientRosterSnapshot | null => {
  const scoreboard = normalizeLiveClientScoreboard(snapshot);

  if (!scoreboard || !hasCompleteRoleCoverage(scoreboard.allies) || !hasCompleteRoleCoverage(scoreboard.enemies)) {
    return null;
  }

  const toPlayerInfo = (player: CompletedScoreboardPlayer): PlayerInfo => ({
    summonerName: player.summonerName,
    championName: player.championName,
    mainRole: player.role as PlayerRole,
    summonerSpells: player.summonerSpells,
    runes: player.runes
  });

  return {
    allies: scoreboard.allies.map(toPlayerInfo),
    enemies: scoreboard.enemies.map(toPlayerInfo),
    localSummonerName: scoreboard.localSummonerName,
    source: scoreboard.source
  };
};
