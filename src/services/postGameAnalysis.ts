import type { CompletedMatchSummary } from '../store/gameSlice';
import type { PlayerInfo } from '../store/lobbySlice';
import type { StructuredAiReview } from '../store/gameSlice';

interface PostGameAnalysisContext {
  lastCompletedMatch: CompletedMatchSummary;
  allies: PlayerInfo[];
  enemies: PlayerInfo[];
  reviewMode?: boolean;
}

export type { PostGameAnalysisContext };

const laneOrder = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const;

const parseKda = (value: string | undefined) => {
  if (!value) {
    return { kills: 0, deaths: 0, assists: 0 };
  }

  const parts = value
    .split('/')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((part) => Number.isFinite(part));

  return {
    kills: parts[0] ?? 0,
    deaths: parts[1] ?? 0,
    assists: parts[2] ?? 0
  };
};

const getPlayerGameSample = (player: PlayerInfo) => {
  const latestMatch = player.recentMatches[0];
  const latestKda = parseKda(latestMatch?.kda);

  return {
    lane: player.mainRole,
    kills: latestMatch?.k ?? latestKda.kills,
    deaths: latestMatch?.d ?? latestKda.deaths,
    assists: latestMatch?.a ?? latestKda.assists,
    champion: latestMatch?.champion ?? 'Unknown'
  };
};

const average = (values: number[]) => {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const formatDuration = (seconds: number | null) => {
  if (!seconds || seconds <= 0) {
    return null;
  }

  const totalSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getWinRateGap = (allies: PlayerInfo[], enemies: PlayerInfo[]) => {
  const allyAverageWinRate = Math.round(average(allies.map((player) => player.winRate)));
  const enemyAverageWinRate = Math.round(average(enemies.map((player) => player.winRate)));

  return {
    allyAverageWinRate,
    enemyAverageWinRate,
    delta: allyAverageWinRate - enemyAverageWinRate
  };
};

const getLanePressureCallout = (allies: PlayerInfo[], enemies: PlayerInfo[]) => {
  for (const lane of laneOrder) {
    const ally = allies.find((player) => player.mainRole === lane);
    const enemy = enemies.find((player) => player.mainRole === lane);

    if (!ally || !enemy) {
      continue;
    }

    const allySample = getPlayerGameSample(ally);
    const enemySample = getPlayerGameSample(enemy);
    const deathGap = allySample.deaths - enemySample.deaths;
    const killGap = enemySample.kills - allySample.kills;

    if (deathGap >= 3 || killGap >= 3) {
      return `Линия ${lane.toLowerCase()} просела сильнее остальных: у ${enemy.summonerName} было больше пространства, чем у вашего оппонента по линии.`;
    }
  }

  return null;
};

export const buildPostGameAnalysisPayload = ({ lastCompletedMatch, allies, enemies, reviewMode = false }: PostGameAnalysisContext) => ({
  match: {
    championName: lastCompletedMatch.championName,
    kills: lastCompletedMatch.kills,
    deaths: lastCompletedMatch.deaths,
    assists: lastCompletedMatch.assists,
    cs: lastCompletedMatch.cs,
    takedowns: lastCompletedMatch.takedowns,
    gameDurationSeconds: lastCompletedMatch.gameDurationSeconds,
    gameDurationLabel: formatDuration(lastCompletedMatch.gameDurationSeconds),
    csPerMinute: lastCompletedMatch.csPerMinute,
    endedAt: lastCompletedMatch.endedAt,
    kda: lastCompletedMatch.kda
  },
  context: getWinRateGap(allies, enemies),
  lobby: {
    allies: allies.map((player) => ({
      summonerName: player.summonerName,
      mainRole: player.mainRole,
      tier: player.tier,
      lp: player.lp,
      winRate: player.winRate,
      recentChampion: player.recentMatches[0]?.champion ?? null,
      recentKda: player.recentMatches[0]?.kda ?? null
    })),
    enemies: enemies.map((player) => ({
      summonerName: player.summonerName,
      mainRole: player.mainRole,
      tier: player.tier,
      lp: player.lp,
      winRate: player.winRate,
      recentChampion: player.recentMatches[0]?.champion ?? null,
      recentKda: player.recentMatches[0]?.kda ?? null
    }))
  },
  reviewMode
});

export const generatePostGameAnalysis = ({ lastCompletedMatch, allies, enemies, reviewMode = false }: PostGameAnalysisContext) => {
  const { championName, kills, deaths, assists, cs, gameDurationSeconds, csPerMinute, kda, takedowns } = lastCompletedMatch;
  const kdaValue = kda;
  const highDeaths = deaths >= 7;
  const veryHighDeaths = deaths >= 10;
  const lowFarm = cs < 150;
  const strongFarm = cs >= 190;
  const teamPlay = assists >= kills;
  const carryTempo = kills >= 8 && deaths <= 4;
  const lowImpact = kills + assists <= 8;
  const longGame = (gameDurationSeconds ?? 0) >= 1800;
  const weakCsPerMinute = csPerMinute !== null && csPerMinute < 6;
  const strongCsPerMinute = csPerMinute !== null && csPerMinute >= 7;
  const durationLabel = formatDuration(gameDurationSeconds);

  const { allyAverageWinRate, enemyAverageWinRate, delta } = getWinRateGap(allies, enemies);
  const lanePressureCallout = getLanePressureCallout(allies, enemies);
  const teamContext = allyAverageWinRate || enemyAverageWinRate
    ? `По лобби ваша команда входила примерно с ${allyAverageWinRate}% среднего WR против ${enemyAverageWinRate}% у соперника${Math.abs(delta) >= 4 ? `, разница была около ${Math.abs(delta)} п.п.` : ''}.`
    : 'Командный контекст по лобби ограничен, поэтому разбор опирается прежде всего на твои личные метрики.';

  const strength = carryTempo
    ? `на ${championName} ты дал сильный личный темп и не развалил игру лишними смертями`
    : strongFarm && strongCsPerMinute && !highDeaths
      ? `на ${championName} ты сохранил экономику и не отдал игру частыми ошибками`
    : teamPlay && kdaValue >= 3
        ? 'ты хорошо подключался к розыгрышам команды и не выпадал из общего темпа'
        : kdaValue >= 2.5
          ? 'ты удержал матч в playable-состоянии и не провалился по всем базовым метрикам сразу'
          : 'ты все еще оставил базу для роста, потому что матч не был проигран по одной случайной ошибке';

  const risk = veryHighDeaths
    ? 'слишком много смертей ломали любой накопленный перевес и постоянно сбрасывали темп'
    : weakCsPerMinute && longGame
      ? 'для такой длительности матча темп по фарму был слишком низким, поэтому золото приходило слишком неровно'
    : highDeaths
      ? 'частые смерти забирали у тебя право первым приходить на следующую волну или объект'
      : lowFarm && lowImpact
        ? 'ты дал мало золота и мало влияния одновременно, поэтому матч прошел без стабильной точки опоры'
        : lowFarm
          ? 'просадка по фарму обрезала твой доход в те окна, где драки можно было не форсить'
          : !teamPlay
            ? 'слишком много игры шло через личные входы, а не через синхрон с командой'
            : 'не хватило более чистой конвертации нормального старта в контроль карты и объектов';

  const nextFocus = veryHighDeaths
    ? 'в следующей игре обрежь риск: до 14 минуты входи только в очевидные драки с численным преимуществом или первым контролем.'
    : weakCsPerMinute
      ? 'в следующей игре держи ориентир не только на общий CS, но и на темп в минуту: не выпадай из фарма после каждой стычки.'
    : lowFarm
      ? 'в следующей игре добирай фарм в тихие окна между стычками и держи себе более ровный доход к середине матча.'
      : !teamPlay
        ? 'в следующей игре привязывай свои входы к позиции саппорта или лесника, а не начинай размен первым без продолжения.'
        : 'в следующей игре после каждого удачного розыгрыша сразу переводи темп в волну, башню или нейтральный объект.';

  const evidence = [
    `Факты матча: ${championName}, ${kills}/${deaths}/${assists}, ${cs} CS, KDA ${kdaValue.toFixed(1)}${csPerMinute !== null ? `, ${csPerMinute.toFixed(1)} CS/мин` : ''}${durationLabel ? `, длительность ${durationLabel}` : ''}, takedowns ${takedowns}.`,
    teamContext,
    lanePressureCallout,
    reviewMode ? 'Режим review: этот разбор собран на тестовых данных и показывает формат post-game фидбека, а не live-коучинг.' : null
  ].filter(Boolean);

  return [
    `Сильная сторона: ${strength}.`,
    `Главный риск: ${risk}.`,
    `Фокус на следующую игру: ${nextFocus}`,
    ...evidence
  ].join('\n');
};

export const generateStructuredPostGameAnalysis = (context: PostGameAnalysisContext): StructuredAiReview => {
  const fullText = generatePostGameAnalysis(context);
  const lines = fullText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const strength = lines.find((line) => line.startsWith('Сильная сторона:')) ?? 'Сильная сторона: нет данных.';
  const risk = lines.find((line) => line.startsWith('Главный риск:')) ?? 'Главный риск: нет данных.';
  const nextFocus = lines.find((line) => line.startsWith('Фокус на следующую игру:')) ?? 'Фокус на следующую игру: нет данных.';
  const evidenceLines = lines.filter((line) => !line.startsWith('Сильная сторона:') && !line.startsWith('Главный риск:') && !line.startsWith('Фокус на следующую игру:'));

  return {
    strength,
    risk,
    nextFocus,
    evidence: evidenceLines.join('\n'),
    source: 'local-client-fallback',
    fullText
  };
};
