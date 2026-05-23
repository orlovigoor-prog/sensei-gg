import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useState } from 'react';
import type { PlayerInfo } from '../../store/lobbySlice';
import type { CompletedMatchSummary } from '../../store/gameSlice';
import { getRankColor, getRankIconUrl } from '../../services/rankAssets';

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

interface PlayerCardProps {
  player: PlayerInfo;
  isAlly: boolean;
  onPlayerClick: (player: PlayerInfo) => void;
  displayName?: string;
  searchDisabled?: boolean;
  variant?: 'lobby' | 'in-game';
  reviewMode?: boolean;
}

interface MatchScreenProps {
  onRequestAiAnalysis?: () => void;
  isLoadingAi?: boolean;
  aiAdvice?: string;
  lastCompletedMatch?: CompletedMatchSummary | null;
  reviewMode?: boolean;
}

interface PostGamePlayerRowProps {
  player: PlayerInfo;
  displayName: string;
  isWinner: boolean;
  laneLabel: string;
}

interface LobbyCounterpick {
  champion: string;
  matchupWinRate: number;
}

interface LobbyChampionInsight {
  counters: LobbyCounterpick[];
  globalWinRate: number;
  patchTier: string;
  tierColor: string;
}

const mockCounterPool = [
  'Malphite',
  'Poppy',
  'Irelia',
  'Jax',
  'Renekton',
  'Trundle',
  'Rammus',
  'Morgana',
  'Brand',
  'Nautilus',
  'Lissandra',
  'Vex',
  'Cassiopeia',
  'Leona',
  'Zyra'
];

const patchTierPalette: Record<string, string> = {
  'S+': '#f59e0b',
  S: '#10b981',
  A: '#60a5fa',
  B: '#c084fc'
};

const getChampionKey = (championName: string) => championName.replace(/[^A-Za-z0-9]/g, '');

const getChampionIconUrl = (championName: string) => `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${getChampionKey(championName)}.png`;

const hashChampionName = (championName: string) => Array.from(championName).reduce((sum, char, index) => sum + (char.charCodeAt(0) * (index + 3)), 0);

const getMockLobbyInsight = (championName: string): LobbyChampionInsight => {
  const seed = hashChampionName(championName || 'Aatrox');
  const uniqueCounters: LobbyCounterpick[] = [];

  for (let step = 0; step < mockCounterPool.length && uniqueCounters.length < 5; step += 1) {
    const counter = mockCounterPool[(seed + step) % mockCounterPool.length];
    if (counter === championName || uniqueCounters.some((item) => item.champion === counter)) {
      continue;
    }

    uniqueCounters.push({
      champion: counter,
      matchupWinRate: Number((55.8 - uniqueCounters.length * 1.4 - ((seed + step) % 4) * 0.3).toFixed(1))
    });
  }

  const tierSteps = ['S+', 'S', 'A', 'B'] as const;
  const patchTier = tierSteps[seed % tierSteps.length];

  return {
    counters: uniqueCounters,
    globalWinRate: Number((48.4 + (seed % 37) * 0.14).toFixed(1)),
    patchTier,
    tierColor: patchTierPalette[patchTier]
  };
};

function PostGamePlayerRow({ player, displayName, isWinner, laneLabel }: PostGamePlayerRowProps) {
  const latestMatch = player.recentMatches?.[0];
  const championName = latestMatch?.champion || 'Aatrox';
  const championKey = championName.replace(/\s+/g, '');
  const championIcon = `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${championKey}.png`;
  const kdaText = latestMatch?.kda || `${Math.max(1, Math.round(player.winRate / 10))} / ${Math.max(1, Math.round((100 - player.winRate) / 18))} / ${Math.max(2, Math.round(player.wins / 12))}`;
  const rankLabel = player.lp ? `${player.tier} ${player.lp} LP` : player.tier;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px minmax(0, 1fr) auto',
      gap: '8px',
      alignItems: 'center',
      padding: '7px 9px',
      borderRadius: '10px',
      background: isWinner ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 19, 26, 0.72))' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 19, 26, 0.72))',
      border: `1px solid ${isWinner ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.24)'}`
    }}>
      <img
        src={championIcon}
        alt={championName}
        onError={(e) => {
          (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/Aatrox.png';
        }}
        style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ marginBottom: '2px' }}>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px', minWidth: 0 }}>
          <span style={{
            padding: '1px 5px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#d1d5db',
            fontSize: '8px',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            flexShrink: 0
          }}>
            {laneLabel}
          </span>
          <div style={{ color: '#9ca3af', fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {championName} · {rankLabel}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', fontSize: '8px' }}>
          <span style={{ color: '#d1d5db' }}>{kdaText}</span>
          <span style={{ color: '#9ca3af' }}>{player.winRate}% WR</span>
          <span style={{ color: '#9ca3af' }}>{player.wins + player.losses} игр</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ color: getRankColor(player.tier), fontWeight: 'bold', fontSize: '9px' }}>{player.lp}</div>
        <div style={{ color: '#6b7280', fontSize: '8px' }}>LP</div>
      </div>
    </div>
  );
}

function PlayerCard({ player, isAlly, onPlayerClick, displayName, searchDisabled = false, variant = 'in-game', reviewMode = false }: PlayerCardProps) {
  const winRateColor = player.winRate >= 50 ? '#10b981' : '#ef4444';
  const cardTitle = displayName || player.summonerName;
  const totalGames = player.wins + player.losses;
  const selectedChampion = player.recentMatches?.[0]?.champion;
  const championLabel = selectedChampion || 'Пик не выбран';
  const championIcon = selectedChampion ? getChampionIconUrl(selectedChampion) : getChampionIconUrl('Aatrox');
  
  const championStats = player.recentMatches?.filter(m => m.champion === selectedChampion && m.gameType === 'RANKED') || [];
  const champWins = championStats.filter(m => m.result === 'W').length;
  const champLosses = championStats.filter(m => m.result === 'L').length;
  const champTotal = championStats.length;
  
  // Считаем KDA на чемпионе
  const totalKills = championStats.reduce((sum, m) => sum + (m.k || 0), 0);
  const totalDeaths = championStats.reduce((sum, m) => sum + (m.d || 0), 0);
  const totalAssists = championStats.reduce((sum, m) => sum + (m.a || 0), 0);
  const averageKills = champTotal > 0 ? (totalKills / champTotal).toFixed(1) : '0.0';
  const averageDeaths = champTotal > 0 ? (totalDeaths / champTotal).toFixed(1) : '0.0';
  const averageAssists = champTotal > 0 ? (totalAssists / champTotal).toFixed(1) : '0.0';
  const rankLabel = player.lp ? `${player.tier} ${player.lp}` : player.tier;
  const lobbyInsight = getMockLobbyInsight(championLabel);
  
  const [showChampTooltip, setShowChampTooltip] = useState(false);
  const [hoveredCounter, setHoveredCounter] = useState<LobbyCounterpick | null>(null);

  return (
    <div 
      onClick={() => {
        if (!searchDisabled) {
          onPlayerClick(player);
        }
      }}
      style={{
        background: isAlly 
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))',
        border: `1px solid ${isAlly ? '#10b981' : '#ef4444'}`,
        borderRadius: '10px',
        padding: '10px',
        cursor: searchDisabled ? 'default' : 'pointer',
        transition: 'all 0.2s ease',
        width: '100%',
        minWidth: 0,
        minHeight: '142px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        margin: '0',
        position: 'relative',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${isAlly ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '8px' }}>
        <div style={{ flex: 1, minWidth: 0, minHeight: variant === 'lobby' ? '31px' : undefined }}>
          <div title={cardTitle} style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.01em' }}>
            {cardTitle}
          </div>
          {variant !== 'lobby' && (
            <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Уровень {player.rank} · {totalGames} матчей на герое
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '54px minmax(0, 1fr)', gap: variant === 'lobby' ? '8px' : '10px', alignItems: 'center', marginBottom: variant === 'lobby' ? '6px' : '8px' }}>
        <div 
          style={{ 
            position: 'relative',
            cursor: 'help',
            width: '54px',
            height: '54px'
          }}
          onMouseEnter={() => setShowChampTooltip(true)}
          onMouseLeave={() => setShowChampTooltip(false)}
        >
          <img 
            src={championIcon}
            alt={championLabel}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/Aatrox.png';
            }}
            style={{ 
              width: '54px', 
              height: '54px', 
              borderRadius: '8px', 
              border: '2px solid #00ffcc',
              display: 'block'
            }}
          />
          {showChampTooltip && champTotal > 0 && null}
        </div>

        <div style={{ minWidth: 0 }}>
          {variant === 'lobby' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, minWidth: 0 }}>
                  {championLabel}
                </div>
              </div>
              {reviewMode ? (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '7px 8px',
                  borderRadius: '7px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  minWidth: 0
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '3px' }}>Глобальный WR</div>
                    <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lobbyInsight.globalWinRate}%
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '3px' }}>Тир чемпиона</div>
                    <div style={{ color: lobbyInsight.tierColor, fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lobbyInsight.patchTier}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '7px 8px',
                  borderRadius: '7px',
                  minWidth: 0
                }}>
                  <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '3px' }}>Безопасный режим лобби</div>
                  <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '10px', lineHeight: 1.35 }}>
                    До реальной интеграции здесь показывается только базовая информация о пике без демонстрационных matchup-оценок.
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                <div style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, minWidth: 0 }}>{championLabel}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0, minWidth: 0 }}>
                  <img 
                    src={getRankIconUrl(player.tier)}
                    alt={player.tier}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                    style={{ 
                      width: '18px', 
                      height: '18px',
                      objectFit: 'contain',
                      flexShrink: 0,
                      display: 'block'
                    }}
                  />
                  <span style={{ 
                    color: getRankColor(player.tier),
                    fontWeight: 'bold',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {rankLabel}
                  </span>
                </div>
              </div>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                padding: '6px 8px', 
                borderRadius: '7px', 
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                minWidth: 0
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '2px' }}>Средняя K/D/A</div>
                  <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {averageKills} / {averageDeaths} / {averageAssists}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '2px' }}>Победы / поражения</div>
                  <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {champWins}W / {champLosses}L
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {variant === 'lobby' ? (
        reviewMode ? (
        <div style={{
          position: 'relative',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '6px 8px',
          borderRadius: '6px',
          marginTop: 'auto'
        }}>
          <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '5px' }}>Контрпики</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '5px' }}>
            {lobbyInsight.counters.map((counter) => (
              <div
                key={`${championLabel}-${counter.champion}`}
                onMouseEnter={() => setHoveredCounter(counter)}
                onMouseLeave={() => setHoveredCounter((current) => current?.champion === counter.champion ? null : current)}
                style={{ position: 'relative' }}
              >
                <img
                  src={getChampionIconUrl(counter.champion)}
                  alt={counter.champion}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = 'https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/Aatrox.png';
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '6px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'block'
                  }}
                />
              </div>
            ))}
          </div>
          {hoveredCounter && (
            <div style={{
              position: 'absolute',
              left: '8px',
              right: '8px',
              bottom: 'calc(100% + 6px)',
              padding: '6px 8px',
              borderRadius: '8px',
              background: 'rgba(10, 14, 22, 0.96)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              boxShadow: '0 8px 18px rgba(0, 0, 0, 0.35)',
              pointerEvents: 'none',
              zIndex: 3
            }}>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '10px', marginBottom: '2px' }}>{hoveredCounter.champion}</div>
              <div style={{ color: '#9ca3af', fontSize: '9px' }}>Общий винрейт в матчапе: {hoveredCounter.matchupWinRate}%</div>
            </div>
          )}
        </div>
        ) : (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '6px 8px',
            borderRadius: '6px',
            marginTop: 'auto'
          }}>
            <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '4px' }}>Matchup-инсайты</div>
            <div style={{ color: '#9ca3af', fontSize: '9px', lineHeight: 1.35 }}>
              Демонстрационные контрпики доступны только в Review Mode.
            </div>
          </div>
        )
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px', marginTop: 'auto' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '7px 6px', borderRadius: '6px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
            <div style={{ color: winRateColor, fontWeight: 'bold', fontSize: '14px' }}>
              {player.winRate}%
            </div>
            <div style={{ color: '#9ca3af', fontSize: '8px' }}>Винрейт</div>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '7px 6px', borderRadius: '6px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
              {totalGames}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '8px' }}>Матчи</div>
          </div>
        </div>
      )}
    </div>
  );
}

export function MatchScreen({ onRequestAiAnalysis, isLoadingAi = false, aiAdvice = '', lastCompletedMatch = null, reviewMode = false }: MatchScreenProps) {
  const lobbyState = useSelector((state: RootState) => state.lobby);
  const allies = lobbyState.players.allies;
  const enemies = lobbyState.players.enemies;
  const isRankedSoloDuoChampSelect = lobbyState.gameMode === 'RANKED_SOLO_5x5' && lobbyState.phase === 'champ-select';

  const getDisplayName = (player: PlayerInfo, index: number, isAlly: boolean) => {
    if (!isRankedSoloDuoChampSelect) {
      return player.summonerName;
    }

    if (isAlly && lobbyState.partyMembers.includes(player.summonerName)) {
      return player.summonerName;
    }

    return `${isAlly ? 'Ally' : 'Enemy'} ${index + 1}`;
  };

  const isNameHidden = (player: PlayerInfo, index: number, isAlly: boolean) => getDisplayName(player, index, isAlly) !== player.summonerName;

  // Если нет данных о лобби, показываем заглушку
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

  const handlePlayerClick = (player: PlayerInfo) => {
    // Отправляем событие для поиска игрока
    const event = new CustomEvent('sensei-search-player', {
      detail: { summonerName: player.summonerName, targetRegion: 'euw' }
    });
    window.dispatchEvent(event);
  };

  const allyAverageWinRate = Math.round(allies.reduce((sum: number, p: PlayerInfo) => sum + p.winRate, 0) / allies.length);
  const enemyAverageWinRate = Math.round(enemies.reduce((sum: number, p: PlayerInfo) => sum + p.winRate, 0) / enemies.length);
  const bestAlly = allies.reduce((best: PlayerInfo, player: PlayerInfo) => player.winRate > best.winRate ? player : best, allies[0]);
  const biggestThreat = enemies.reduce((best: PlayerInfo, player: PlayerInfo) => player.winRate > best.winRate ? player : best, enemies[0]);
  const pressureSide = allyAverageWinRate >= enemyAverageWinRate ? 'союзники выглядят стабильнее по пику героев' : 'состав соперника выглядит стабильнее по пику героев';
  const getSignalReason = (player: PlayerInfo) => {
    const totalGames = player.wins + player.losses;

    if (player.winRate >= 58 && totalGames >= 80) {
      return 'высокий винрейт на герое';
    }

    if (player.winRate >= 54) {
      return 'стабильный винрейт на герое';
    }

    if (totalGames >= 120) {
      return 'много матчей на герое, пик выглядит уверенно';
    }

    return 'по текущему пику выглядит самым надежным вариантом';
  };
  const averageGap = allyAverageWinRate - enemyAverageWinRate;
  const pressureHeadline = averageGap >= 5
    ? 'Преимущество по пику у вашей команды'
    : averageGap <= -5
      ? 'По пику состав соперника выглядит сильнее'
      : 'По пику составы идут близко';

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
  const aiAdviceLines = aiAdvice
    ? aiAdvice
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];
  const aiInsightLines = aiAdviceLines.filter((line) => line.startsWith('Сильная сторона:') || line.startsWith('Главный риск:') || line.startsWith('Фокус на следующую игру:'));
  const aiDetailLines = aiAdviceLines.filter((line) => !line.startsWith('Сильная сторона:') && !line.startsWith('Главный риск:') && !line.startsWith('Фокус на следующую игру:'));
  const aiDetailText = aiDetailLines.join('\n');
  const showKeySignals = reviewMode && lobbyState.phase !== 'champ-select';
  const playerCardVariant = lobbyState.phase === 'champ-select' ? 'lobby' : 'in-game';
  const allyTeamWon = allies.some((player) => player.recentMatches?.[0]?.result === 'W')
    ? true
    : enemies.some((player) => player.recentMatches?.[0]?.result === 'W')
      ? false
      : null;
  const progressSignal = lastCompletedMatch
    ? lastCompletedMatch.deaths <= 4 && lastCompletedMatch.cs >= 180
      ? 'Сильная база для следующего матча'
      : lastCompletedMatch.deaths > lastCompletedMatch.kills
        ? 'Нужен более аккуратный темп и меньше лишних смертей'
        : 'Есть база, но еще есть запас по чистоте исполнения'
    : 'После первого завершенного матча появится персональный сигнал прогресса';
  const reviewNotice = reviewMode
    ? 'Состав, сигналы и постматч-сводка ниже запущены через Review Mode и показывают демонстрационный сценарий интерфейса.'
    : null;

  if (lobbyState.phase === 'post-game') {
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
        gridTemplateRows: 'auto 1fr',
        gap: '8px'
      }}>
        {reviewNotice && (
          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.35)', color: '#d1d5db', fontSize: '11px', lineHeight: 1.5 }}>
            <div style={{ color: '#fdba74', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '4px' }}>REVIEW MODE</div>
            {reviewNotice}
          </div>
        )}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(8, 11, 18, 0.42))', border: '1px solid rgba(16, 185, 129, 0.28)' }}>
            <div style={{ color: '#10b981', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '4px' }}>ИТОГИ МАТЧА</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', marginBottom: '3px' }}>Фокус на личном прогрессе</div>
            <div style={{ color: '#9ca3af', fontSize: '11px', lineHeight: 1.4, marginBottom: '8px' }}>
              Разбор строится вокруг твоей команды и безопасного AI-фидбека после завершения игры.
            </div>
            <div style={{
              padding: '8px 10px',
              borderRadius: '10px',
              background: 'rgba(15, 19, 26, 0.55)',
              border: '1px solid rgba(16, 185, 129, 0.18)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '3px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Твой прогресс</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>{progressSignal}</div>
              <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: 1.35 }}>
                Sensei GG подчеркивает сильную сторону, главный риск и один конкретный фокус на следующую игру.
              </div>
              {lastCompletedMatch && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  <span style={{ padding: '3px 7px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.05)', color: '#d1d5db', fontSize: '9px' }}>
                    {lastCompletedMatch.kills}/{lastCompletedMatch.deaths}/{lastCompletedMatch.assists}
                  </span>
                  <span style={{ padding: '3px 7px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.05)', color: '#d1d5db', fontSize: '9px' }}>
                    {lastCompletedMatch.cs} CS
                  </span>
                  <span style={{ padding: '3px 7px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.05)', color: '#d1d5db', fontSize: '9px' }}>
                    {lastCompletedMatch.championName}
                  </span>
                </div>
              )}
            </div>
          </div>
          <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.28)', minHeight: 0, display: 'grid', gridTemplateRows: 'auto auto auto 1fr', gap: '8px' }}>
            <div>
              <div style={{ color: '#c084fc', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '4px' }}>AI-РАЗБОР</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '15px', marginBottom: '3px' }}>Как улучшить следующую игру</div>
              <div style={{ color: '#9ca3af', fontSize: '11px', lineHeight: 1.4 }}>
                Три коротких тезиса без лишнего шума.
              </div>
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {aiInsightLines.length > 0 ? aiInsightLines.map((line) => (
                <div
                  key={line}
                  style={{
                    padding: '7px 9px',
                    borderRadius: '10px',
                    background: 'rgba(15, 19, 26, 0.54)',
                    border: '1px solid rgba(168, 85, 247, 0.16)',
                    color: '#d1d5db',
                    fontSize: '10px',
                    lineHeight: 1.35
                  }}
                >
                  {line}
                </div>
              )) : (
                <div style={{ padding: '7px 9px', borderRadius: '10px', background: 'rgba(15, 19, 26, 0.54)', border: '1px solid rgba(168, 85, 247, 0.16)', color: '#9ca3af', fontSize: '10px', lineHeight: 1.35 }}>
                  После генерации AI-разбора здесь появятся короткие тезисы: сильная сторона, главный риск и конкретный следующий фокус.
                </div>
              )}
            </div>
            <button
              onClick={onRequestAiAnalysis}
              disabled={!onRequestAiAnalysis || isLoadingAi}
              style={{
                padding: '8px 12px',
                background: isLoadingAi ? 'rgba(168, 85, 247, 0.35)' : '#a855f7',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                cursor: !onRequestAiAnalysis || isLoadingAi ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                opacity: !onRequestAiAnalysis ? 0.7 : 1
              }}
            >
              {isLoadingAi ? 'AI собирает тезисы...' : 'Обновить тезисы AI'}
            </button>
            <div style={{
              minHeight: 0,
              overflow: 'hidden',
              padding: '10px',
              borderRadius: '10px',
              background: 'rgba(15, 19, 26, 0.72)',
              border: '1px solid rgba(168, 85, 247, 0.22)',
              color: '#d1d5db',
              fontSize: '11px',
              lineHeight: 1.45,
              whiteSpace: 'pre-line'
            }}>
              {aiDetailText || (aiInsightLines.length > 0
                ? 'Разбор собран по итогам завершенного матча и опирается только на локальные метрики: KDA, CS и общий паттерн темпа.'
                : 'После завершения матча здесь появятся три коротких тезиса: сильная сторона, главный риск и фокус на следующую игру.')}
            </div>
          </div>
        </div>

        <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.28)', border: '1px solid #1f2937', minHeight: 0, display: 'grid', gridTemplateRows: 'auto 1fr', gap: '6px' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <div style={{ color: '#6b7280', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.06em' }}>СОСТАВ ПО ЛИНИЯМ</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '8px' }}>
              <div style={{ color: allyTeamWon === false ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: '11px' }}>{allyTeamWon === true ? 'Победа' : 'Поражение'}</div>
              <div style={{
                padding: '5px 9px',
                borderRadius: '999px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(239, 68, 68, 0.12))',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#d1d5db',
                fontSize: '9px',
                fontWeight: 'bold',
                letterSpacing: '0.08em'
              }}>VS</div>
              <div style={{ color: allyTeamWon === true ? '#ef4444' : '#10b981', fontWeight: 'bold', fontSize: '11px', textAlign: 'right' }}>{allyTeamWon === true ? 'Поражение' : 'Победа'}</div>
            </div>
          </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', minHeight: 0 }}>
              <div style={{ display: 'grid', gap: '6px', alignContent: 'start' }}>
                {alliedByLane.map(({ lane, player, index }) => (
                  <PostGamePlayerRow
                    key={`post-ally-${lane}`}
                    player={player}
                    displayName={getDisplayName(player, index, true)}
                    isWinner={allyTeamWon !== false}
                    laneLabel={laneLabels[lane]}
                  />
                ))}
              </div>
              <div style={{ display: 'grid', gap: '6px', alignContent: 'start' }}>
                {enemyByLane.map(({ lane, player, index }) => (
                  <PostGamePlayerRow
                    key={`post-enemy-${lane}`}
                    player={player}
                    displayName={getDisplayName(player, index, false)}
                    isWinner={allyTeamWon === false}
                    laneLabel={laneLabels[lane]}
                  />
                ))}
              </div>
            </div>
          </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '10px', 
      height: '100%', 
      overflow: 'hidden',
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
      {showKeySignals && (
        <>
          <div style={{ ...sectionLabelStyle, marginBottom: '6px' }}>КЛЮЧЕВЫЕ СИГНАЛЫ</div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '8px',
            marginBottom: '8px'
          }}>
            <div style={{ padding: '8px 10px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 19, 26, 0.72))', border: '1px solid rgba(16, 185, 129, 0.28)', borderRadius: '10px' }}>
              <div style={{ color: '#10b981', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px', letterSpacing: '0.05em' }}>СТАБИЛЬНЫЙ СОЮЗНИК</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{bestAlly.summonerName}</div>
              <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: 1.3 }}>{laneLabels[bestAlly.mainRole as keyof typeof laneLabels] || bestAlly.mainRole} · {bestAlly.winRate}% WR · {bestAlly.wins + bestAlly.losses} игр</div>
              <div style={{ color: '#d1d5db', fontSize: '10px', lineHeight: 1.3, marginTop: '3px' }}>{getSignalReason(bestAlly)}</div>
            </div>
            <div style={{ padding: '8px 10px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 19, 26, 0.72))', border: '1px solid rgba(239, 68, 68, 0.28)', borderRadius: '10px' }}>
              <div style={{ color: '#ef4444', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px', letterSpacing: '0.05em' }}>ГЛАВНАЯ УГРОЗА</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: '2px' }}>{biggestThreat.summonerName}</div>
              <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: 1.3 }}>{laneLabels[biggestThreat.mainRole as keyof typeof laneLabels] || biggestThreat.mainRole} · {biggestThreat.winRate}% WR · {biggestThreat.wins + biggestThreat.losses} игр</div>
              <div style={{ color: '#d1d5db', fontSize: '10px', lineHeight: 1.3, marginTop: '3px' }}>{getSignalReason(biggestThreat)}</div>
            </div>
            <div style={{ padding: '8px 10px', background: 'rgba(15, 19, 26, 0.72)', border: '1px solid #1f2937', borderRadius: '10px' }}>
              <div style={{ color: '#00ffcc', fontSize: '10px', fontWeight: 'bold', marginBottom: '5px', letterSpacing: '0.05em' }}>ОБЩИЙ СИГНАЛ</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px' }}>{pressureHeadline}</div>
              <div style={{ color: '#9ca3af', fontSize: '10px', lineHeight: 1.3 }}>{allyAverageWinRate}% vs {enemyAverageWinRate}% · {pressureSide}</div>
            </div>
          </div>
        </>
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
              <PlayerCard
                player={player}
                isAlly={true}
                onPlayerClick={handlePlayerClick}
                displayName={getDisplayName(player, index, true)}
                searchDisabled={isNameHidden(player, index, true)}
                variant={playerCardVariant}
                reviewMode={reviewMode}
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
              <PlayerCard
                player={player}
                isAlly={false}
                onPlayerClick={handlePlayerClick}
                displayName={getDisplayName(player, index, false)}
                searchDisabled={isNameHidden(player, index, false)}
                variant={playerCardVariant}
                reviewMode={reviewMode}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
