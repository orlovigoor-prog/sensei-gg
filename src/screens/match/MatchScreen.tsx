import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { LobbyPlayerCard } from '../../components/LobbyPlayerCard';
import { PostGamePlayerRow } from '../../components/PostGamePlayerRow';
import type { CompletedScoreboardPlayer, PlayerInfo } from '../../store/lobbySlice';
import { dispatchSearchPlayerCommand } from '../../services/appCommands';
import { canRevealPlayerIdentity, getPlayerDisplayName } from '../../services/playerPrivacyPolicy';

const laneOrder = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const;

const laneLabels: Record<(typeof laneOrder)[number], string> = {
  TOP: 'Топ',
  JUNGLE: 'Лес',
  MID: 'Мид',
  ADC: 'Бот',
  SUPPORT: 'Саппорт'
};

const sectionLabelStyle = {
  color: '#6b7280',
  fontSize: '10px',
  fontWeight: 'bold',
  letterSpacing: '0.08em',
  marginBottom: '8px'
} as const;

interface MatchScreenProps {
  reviewMode?: boolean;
}

const toPostGameScoreboardPlayer = (player: PlayerInfo): CompletedScoreboardPlayer => {
  const latestMatch = player.recentMatches?.[0];

  return {
    summonerName: player.summonerName,
    championName: player.championName ?? latestMatch?.champion ?? '',
    role: player.mainRole,
    result: latestMatch?.result,
    kills: latestMatch?.k,
    deaths: latestMatch?.d,
    assists: latestMatch?.a,
    cs: latestMatch?.cs,
    goldEarned: latestMatch?.goldEarned,
    visionScore: latestMatch?.visionScore,
    items: latestMatch?.items,
    trinketId: latestMatch?.trinketId,
    summonerSpells: latestMatch?.summonerSpells,
    runes: latestMatch?.runes
  };
};

const createUnavailablePostGameTeam = () => Array.from({ length: 5 }, () => ({
  summonerName: '—',
  championName: ''
}));

const hasScoreValue = (value: number | undefined): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

const formatPostGameScoreValue = (value: number | undefined) => hasScoreValue(value) ? String(value) : '—';

const getPostGameTeamTotal = (
  players: CompletedScoreboardPlayer[],
  stat: 'kills' | 'deaths' | 'assists'
) => {
  const values = players.map((player) => player[stat]);

  return values.every(hasScoreValue)
    ? values.reduce((sum, value) => sum + value, 0)
    : undefined;
};

const formatPostGameTeamScore = (players: CompletedScoreboardPlayer[]) => (
  [
    getPostGameTeamTotal(players, 'kills'),
    getPostGameTeamTotal(players, 'deaths'),
    getPostGameTeamTotal(players, 'assists')
  ].map(formatPostGameScoreValue).join(' / ')
);

const getPostGameTeamResult = (players: CompletedScoreboardPlayer[]) => {
  const results = players.map((player) => player.result);

  return results.length === 5 && results.every((result) => result === 'W')
    ? 'W'
    : results.length === 5 && results.every((result) => result === 'L')
      ? 'L'
      : undefined;
};

const isCompletedScoreboardTeam = (value: unknown): value is CompletedScoreboardPlayer[] => (
  Array.isArray(value)
  && value.length === 5
  && value.every((player) => (
    typeof player === 'object'
    && player !== null
    && typeof (player as CompletedScoreboardPlayer).summonerName === 'string'
    && (player as CompletedScoreboardPlayer).summonerName.trim().length > 0
    && typeof (player as CompletedScoreboardPlayer).championName === 'string'
    && (player as CompletedScoreboardPlayer).championName.trim().length > 0
  ))
);

const orderPostGamePlayersByLane = (players: CompletedScoreboardPlayer[]) => {
  const usedIndexes = new Set<number>();

  return laneOrder.map((lane, laneIndex) => {
    const matchedIndex = players.findIndex((player, playerIndex) => !usedIndexes.has(playerIndex) && player.role === lane);
    const fallbackIndex = players.findIndex((_, playerIndex) => !usedIndexes.has(playerIndex));
    const selectedIndex = matchedIndex >= 0 ? matchedIndex : fallbackIndex >= 0 ? fallbackIndex : laneIndex;

    usedIndexes.add(selectedIndex);

    return {
      lane,
      player: players[selectedIndex],
      index: selectedIndex
    };
  });
};

export function MatchScreen({ reviewMode = false }: MatchScreenProps) {
  const lobbyState = useSelector((state: RootState) => state.lobby);
  const allies = lobbyState.players.allies;
  const enemies = lobbyState.players.enemies;
  const completedScoreboard = !reviewMode && lobbyState.completedScoreboard?.source === 'overwolf-live-client-data'
    && isCompletedScoreboardTeam(lobbyState.completedScoreboard.allies)
    && isCompletedScoreboardTeam(lobbyState.completedScoreboard.enemies)
    ? lobbyState.completedScoreboard
    : null;
  const isRankedSoloDuo = !reviewMode && lobbyState.gameMode === 'RANKED_SOLO_5x5';

  const getDisplayName = (player: PlayerInfo, index: number, isAlly: boolean) => {
    return getPlayerDisplayName({
      gameMode: lobbyState.gameMode,
      reviewMode,
      isAlly,
      summonerName: player.summonerName,
      localSummonerName: lobbyState.localSummonerName,
      partyMembers: lobbyState.partyMembers,
      index
    });
  };

  const canLookupPlayerProfile = (player: PlayerInfo, isAlly: boolean) => canRevealPlayerIdentity({
    gameMode: lobbyState.gameMode,
    reviewMode,
    isAlly,
    summonerName: player.summonerName,
    localSummonerName: lobbyState.localSummonerName,
    partyMembers: lobbyState.partyMembers
  });

  const getPostGameDisplayName = (player: CompletedScoreboardPlayer, index: number, isAlly: boolean) => {
    return getPlayerDisplayName({
      gameMode: lobbyState.gameMode,
      reviewMode,
      isAlly,
      summonerName: player.summonerName,
      localSummonerName: completedScoreboard?.localSummonerName ?? lobbyState.localSummonerName,
      partyMembers: lobbyState.partyMembers,
      index
    });
  };

  const handlePlayerClick = (player: PlayerInfo, isAlly: boolean) => {
    dispatchSearchPlayerCommand({
      summonerName: player.summonerName,
      targetRegion: 'euw',
      gameMode: lobbyState.gameMode,
      reviewMode,
      isAlly,
      localSummonerName: lobbyState.localSummonerName,
      partyMembers: lobbyState.partyMembers
    });
  };

  const hasCompleteProfileSignals = !isRankedSoloDuo && [...allies, ...enemies].length === 10 && [...allies, ...enemies].every((player) => (
    typeof player.winRate === 'number' && Number.isFinite(player.winRate)
      && typeof player.wins === 'number' && Number.isFinite(player.wins)
      && typeof player.losses === 'number' && Number.isFinite(player.losses)
  ));
  const getSignalReason = (player: PlayerInfo) => {
    const winRate = player.winRate;
    const wins = player.wins;
    const losses = player.losses;

    if (typeof winRate !== 'number' || typeof wins !== 'number' || typeof losses !== 'number') {
      return 'профильная статистика недоступна';
    }

    const totalGames = wins + losses;

    if (winRate >= 58 && totalGames >= 80) {
      return 'высокий винрейт на герое';
    }

    if (winRate >= 54) {
      return 'стабильный винрейт на герое';
    }

    if (totalGames >= 120) {
      return 'много матчей на герое, пик выглядит уверенно';
    }

    return 'по текущему пику выглядит самым надежным вариантом';
  };
  const lobbySignals = hasCompleteProfileSignals
    ? (() => {
        const allyAverageWinRate = Math.round(allies.reduce((sum, player) => sum + (player.winRate as number), 0) / allies.length);
        const enemyAverageWinRate = Math.round(enemies.reduce((sum, player) => sum + (player.winRate as number), 0) / enemies.length);
        const bestAlly = allies.reduce((best, player) => (player.winRate as number) > (best.winRate as number) ? player : best);
        const biggestThreat = enemies.reduce((best, player) => (player.winRate as number) > (best.winRate as number) ? player : best);
        const averageGap = allyAverageWinRate - enemyAverageWinRate;

        return {
          allyAverageWinRate,
          enemyAverageWinRate,
          bestAlly,
          biggestThreat,
          pressureSide: allyAverageWinRate >= enemyAverageWinRate ? 'союзники выглядят стабильнее по пику героев' : 'состав соперника выглядит стабильнее по пику героев',
          pressureHeadline: averageGap >= 5
            ? 'Преимущество по пику у вашей команды'
            : averageGap <= -5
              ? 'По пику состав соперника выглядит сильнее'
              : 'По пику составы идут близко'
        };
      })()
    : null;

  const orderPlayersByLane = (players: PlayerInfo[]) => {
    const usedIndexes = new Set<number>();

    return laneOrder.map((lane, laneIndex) => {
      const matchedIndex = players.findIndex((player, playerIndex) => !usedIndexes.has(playerIndex) && player.mainRole === lane);
      const fallbackIndex = players.findIndex((_, playerIndex) => !usedIndexes.has(playerIndex));
      const selectedIndex = matchedIndex >= 0 ? matchedIndex : fallbackIndex >= 0 ? fallbackIndex : Math.min(laneIndex, players.length - 1);

      usedIndexes.add(selectedIndex);

      return {
        lane,
        player: players[selectedIndex],
        index: selectedIndex
      };
    });
  };

  const alliedByLane = orderPlayersByLane(allies);
  const enemyByLane = orderPlayersByLane(enemies);
  const showKeySignals = (lobbyState.phase === 'loading' || lobbyState.phase === 'in-game') && lobbySignals !== null;
  const playerCardVariant = lobbyState.phase === 'champ-select' ? 'lobby' : 'in-game';
  const reviewNotice = reviewMode
    ? 'Состав, сигналы и постматч-сводка ниже запущены через Review Mode и показывают демонстрационный сценарий интерфейса.'
    : null;

  if (lobbyState.phase === 'post-game') {
    const postGameAllies = reviewMode
      ? allies.length === 5 ? allies.map(toPostGameScoreboardPlayer) : createUnavailablePostGameTeam()
      : completedScoreboard?.allies ?? createUnavailablePostGameTeam();
    const postGameEnemies = reviewMode
      ? enemies.length === 5 ? enemies.map(toPostGameScoreboardPlayer) : createUnavailablePostGameTeam()
      : completedScoreboard?.enemies ?? createUnavailablePostGameTeam();
    const alliedByLane = orderPostGamePlayersByLane(postGameAllies);
    const enemyByLane = orderPostGamePlayersByLane(postGameEnemies);
    const allyTeamKills = getPostGameTeamTotal(postGameAllies, 'kills');
    const enemyTeamKills = getPostGameTeamTotal(postGameEnemies, 'kills');
    const allyScoreLine = formatPostGameTeamScore(postGameAllies);
    const enemyScoreLine = formatPostGameTeamScore(postGameEnemies);
    const allyTeamResult = getPostGameTeamResult(postGameAllies);
    const enemyTeamResult = getPostGameTeamResult(postGameEnemies);
    const resultLabel = (result: 'W' | 'L' | undefined) => result === 'W'
      ? 'ПОБЕДА'
      : result === 'L'
        ? 'ПОРАЖЕНИЕ'
        : 'РЕЗУЛЬТАТ НЕ ПОДТВЕРЖДЁН';
    const resultColor = (result: 'W' | 'L' | undefined) => result === 'W'
      ? '#10b981'
      : result === 'L'
        ? '#ef4444'
        : '#94a3b8';

    return (
      <div style={{
        padding: '8px',
        height: '100%',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(8, 11, 18, 0.66), rgba(10, 14, 22, 0.5))',
        borderRadius: '14px',
        border: '1px solid rgba(31, 41, 55, 0.8)',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateRows: 'minmax(0, 1fr)'
      }}>
        <div style={{
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.28)',
          border: '1px solid #1f2937',
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr)',
          gap: '10px',
          minHeight: 0
        }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '10px' }}>
                <div>
                  <div style={{ color: resultColor(allyTeamResult), fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '3px' }}>
                    {resultLabel(allyTeamResult)}
                  </div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
                    {allyScoreLine}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>ИТОГИ МАТЧА</div>
                  <div style={{ color: '#9ca3af', fontSize: '11px' }}>Матч завершен</div>
                {reviewMode && (
                  <div style={{ display: 'inline-flex', marginTop: '5px', padding: '3px 6px', borderRadius: '999px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.32)', color: '#fdba74', fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.06em' }}>
                    ДЕМО-ДАННЫЕ / REVIEW MODE
                  </div>
                )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: resultColor(enemyTeamResult), fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '3px' }}>
                    {resultLabel(enemyTeamResult)}
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
                  {enemyScoreLine}
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em' }}>СОЮЗНИКИ</div>
              <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em' }}>СОПЕРНИКИ</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', minHeight: 0 }}>
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(5, minmax(0, 1fr))', gap: '8px', minHeight: 0 }}>
              {alliedByLane.map(({ lane, player, index }) => (
                <PostGamePlayerRow
                  key={`post-ally-${lane}`}
                  player={player}
                  displayName={getPostGameDisplayName(player, index, true)}
                  isWinner={allyTeamResult === 'W' ? true : allyTeamResult === 'L' ? false : undefined}
                  laneLabel={laneLabels[lane]}
                  teamKills={allyTeamKills}
                />
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateRows: 'repeat(5, minmax(0, 1fr))', gap: '8px', minHeight: 0 }}>
              {enemyByLane.map(({ lane, player, index }) => (
                <PostGamePlayerRow
                  key={`post-enemy-${lane}`}
                  player={player}
                  displayName={getPostGameDisplayName(player, index, false)}
                  isWinner={enemyTeamResult === 'W' ? true : enemyTeamResult === 'L' ? false : undefined}
                  laneLabel={laneLabels[lane]}
                  teamKills={enemyTeamKills}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Если нет данных о лобби, показываем заглушку.
  if (!allies || allies.length === 0) {
    return (
      <div style={{
        padding: '20px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
          <h3 style={{ color: '#fff', margin: '0 0 10px 0' }}>Ожидание лобби...</h3>
          <p style={{ fontSize: '13px' }}>
            Информация о матче появится после входа в лобби
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '10px', 
      height: '100%', 
      overflowX: 'hidden',
      overflowY: 'visible',
      background: 'linear-gradient(180deg, rgba(8, 11, 18, 0.66), rgba(10, 14, 22, 0.5))',
      borderRadius: '14px',
      border: '1px solid rgba(31, 41, 55, 0.8)',
      boxSizing: 'border-box'
    }}>
      {reviewNotice && (
        <div style={{ marginBottom: '8px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.35)', color: '#d1d5db', fontSize: '11px', lineHeight: 1.5 }}>
          <div style={{ color: '#fdba74', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '4px' }}>REVIEW MODE</div>
          {reviewNotice}
        </div>
      )}
      {showKeySignals && lobbySignals && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '8px',
          marginBottom: '8px'
        }}>
          <div style={{ padding: '8px 10px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 19, 26, 0.72))', border: '1px solid rgba(16, 185, 129, 0.28)', borderRadius: '10px' }}>
            <div style={{ color: '#10b981', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px', letterSpacing: '0.05em' }}>СТАБИЛЬНЫЙ СОЮЗНИК</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{getDisplayName(lobbySignals.bestAlly, allies.indexOf(lobbySignals.bestAlly), true)}</div>
            <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: 1.3 }}>{laneLabels[lobbySignals.bestAlly.mainRole]} · {lobbySignals.bestAlly.winRate}% WR · {(lobbySignals.bestAlly.wins as number) + (lobbySignals.bestAlly.losses as number)} игр</div>
            <div style={{ color: '#d1d5db', fontSize: '10px', lineHeight: 1.3, marginTop: '3px' }}>{getSignalReason(lobbySignals.bestAlly)}</div>
          </div>
          <div style={{ padding: '8px 10px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 19, 26, 0.72))', border: '1px solid rgba(239, 68, 68, 0.28)', borderRadius: '10px' }}>
            <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px', letterSpacing: '0.05em' }}>ГЛАВНАЯ УГРОЗА</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{getDisplayName(lobbySignals.biggestThreat, enemies.indexOf(lobbySignals.biggestThreat), false)}</div>
            <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: 1.3 }}>{laneLabels[lobbySignals.biggestThreat.mainRole]} · {lobbySignals.biggestThreat.winRate}% WR · {(lobbySignals.biggestThreat.wins as number) + (lobbySignals.biggestThreat.losses as number)} игр</div>
            <div style={{ color: '#d1d5db', fontSize: '10px', lineHeight: 1.3, marginTop: '3px' }}>{getSignalReason(lobbySignals.biggestThreat)}</div>
          </div>
          <div style={{ padding: '8px 10px', background: 'rgba(15, 19, 26, 0.72)', border: '1px solid #1f2937', borderRadius: '10px' }}>
            <div style={{ color: '#00ffcc', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px', letterSpacing: '0.05em' }}>ОБЩИЙ СИГНАЛ</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>{lobbySignals.pressureHeadline}</div>
            <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: 1.3 }}>{lobbySignals.allyAverageWinRate}% vs {lobbySignals.enemyAverageWinRate}% · {lobbySignals.pressureSide}</div>
          </div>
        </div>
      )}

      <div style={{ ...sectionLabelStyle, marginBottom: '6px' }}>СОСТАВ ПО ЛИНИЯМ</div>
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '8px',
          marginBottom: '6px'
        }}>
          {alliedByLane.map(({ lane, player, index }) => (
            <div
              key={`ally-${lane}`}
              style={{
                minWidth: 0,
                padding: '2px',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.14), rgba(16, 185, 129, 0.04))',
                border: '1px solid rgba(16, 185, 129, 0.28)'
              }}
            >
              <LobbyPlayerCard
                player={player}
                isAlly={true}
                onPlayerClick={handlePlayerClick}
                displayName={getDisplayName(player, index, true)}
                searchDisabled={!canLookupPlayerProfile(player, true)}
                variant={playerCardVariant}
              />
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '8px',
          marginBottom: '6px'
        }}>
          {laneOrder.map((lane) => (
            <div
              key={lane}
              style={{
                padding: '5px 8px',
                borderRadius: '999px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid #1f2937',
                color: '#d1d5db',
                fontSize: '10px',
                fontWeight: 'bold',
                letterSpacing: '0.06em',
                textAlign: 'center'
              }}
            >
              {laneLabels[lane]}
            </div>
          ))}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          gap: '8px'
        }}>
          {enemyByLane.map(({ lane, player, index }) => (
            <div
              key={`enemy-${lane}`}
              style={{
                minWidth: 0,
                padding: '2px',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(239, 68, 68, 0.14), rgba(239, 68, 68, 0.04))',
                border: '1px solid rgba(239, 68, 68, 0.28)'
              }}
            >
              <LobbyPlayerCard
                player={player}
                isAlly={false}
                onPlayerClick={handlePlayerClick}
                displayName={getDisplayName(player, index, false)}
                searchDisabled={!canLookupPlayerProfile(player, false)}
                variant={playerCardVariant}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
