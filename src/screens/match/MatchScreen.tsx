import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useEffect, useState } from 'react';
import { ItemTooltip } from '../../components/ItemTooltip';
import { PlayerLoadoutIcons } from '../../components/PlayerLoadoutIcons';
import type { PlayerInfo } from '../../store/lobbySlice';
import type { CompletedMatchSummary, StructuredAiReview } from '../../store/gameSlice';
import { getRankColor, getRankIconUrl } from '../../services/rankAssets';
import { formatPlayerRankLabel } from '../../services/rankLabel';
import { dispatchSearchPlayerCommand } from '../../services/appCommands';
import {
  getChampionCatalogEntry,
  getChampionIconUrl,
  getItemCatalogEntry,
  getItemIconUrl,
  getRecommendedItemBuild,
  resolveItemTooltipEntry,
  getDefaultRuneLoadout,
  getDefaultSummonerSpells,
  fetchLobbyChampionInsight,
  summonerSpellPool
} from '../../services/gameData';
import type { LobbyCounterpickInsight, LobbyRankBracket, RuneLoadout } from '../../services/gameData';
import type { ItemCatalogEntry } from '../../services/gameData/items';

const laneOrder = ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'] as const;

const laneLabels: Record<(typeof laneOrder)[number], string> = {
  TOP: 'Топ',
  JUNGLE: 'Лес',
  MID: 'Мид',
  ADC: 'Бот',
  SUPPORT: 'Саппорт'
};

const rankTierScores: Record<PlayerInfo['tier'], number> = {
  IRON: 1,
  BRONZE: 2,
  SILVER: 3,
  GOLD: 4,
  PLATINUM: 5,
  EMERALD: 6,
  DIAMOND: 7,
  MASTER: 8,
  GRANDMASTER: 9,
  CHALLENGER: 10
};

const resolveLobbyRankBracket = (players: PlayerInfo[]): LobbyRankBracket => {
  const rankedPlayers = players.filter((player) => rankTierScores[player.tier]);

  if (rankedPlayers.length === 0) {
    return 'emerald_plus';
  }

  const averageTierScore = rankedPlayers.reduce((sum, player) => sum + rankTierScores[player.tier], 0) / rankedPlayers.length;

  return averageTierScore >= rankTierScores.EMERALD ? 'emerald_plus' : 'emerald_plus';
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
  lobbyRankBracket?: LobbyRankBracket;
}

interface MatchScreenProps {
  onRequestAiAnalysis?: () => void;
  isLoadingAi?: boolean;
  aiAdvice?: string;
  aiReview?: StructuredAiReview | null;
  lastCompletedMatch?: CompletedMatchSummary | null;
  reviewMode?: boolean;
}

interface PostGamePlayerRowProps {
  player: PlayerInfo;
  displayName: string;
  isWinner: boolean;
  laneLabel: string;
  rowIndex: number;
}

const MIN_RELIABLE_COUNTER_SAMPLE = 500;

const getReliableLobbyCounters = (counters: LobbyCounterpickInsight[]) => counters
  .filter((counter) => Number.isFinite(counter.matches) && Number(counter.matches) >= MIN_RELIABLE_COUNTER_SAMPLE)
  .slice(0, 5);

const getLobbyMatchupHint = (champion: string, counters: LobbyCounterpickInsight[]) => {
  const primaryCounter = counters[0];

  if (!primaryCounter) {
    return 'Для этой роли пока мало надёжных matchup-данных. Играй от базовой силы пика и не делай выводы по шумной выборке.';
  }

  if (primaryCounter.matchupWinRate >= 55) {
    return `${primaryCounter.champion} заметно давит ${champion}: избегай ранних all-in и играй от безопасных разменов.`;
  }

  return `${primaryCounter.champion} — самый заметный риск для ${champion}. Уважай его окно силы и не отдавай темп в начале.`;
};

const getAiSourceMeta = (source: StructuredAiReview['source']) => {
  switch (source) {
    case 'provider':
      return {
        label: 'Основной AI',
        color: '#10b981',
        border: 'rgba(16, 185, 129, 0.32)',
        background: 'rgba(16, 185, 129, 0.12)'
      };
    case 'local-server-fallback':
      return {
        label: 'Резервный сервер',
        color: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.3)',
        background: 'rgba(245, 158, 11, 0.12)'
      };
    default:
      return {
        label: 'Локальный резерв',
        color: '#60a5fa',
        border: 'rgba(96, 165, 250, 0.3)',
        background: 'rgba(96, 165, 250, 0.12)'
      };
  }
};

const aiInsightTone = [
  {
    label: 'Сильная сторона',
    color: '#34d399',
    background: 'rgba(16, 185, 129, 0.12)',
    border: 'rgba(16, 185, 129, 0.2)'
  },
  {
    label: 'Главный риск',
    color: '#f59e0b',
    background: 'rgba(245, 158, 11, 0.12)',
    border: 'rgba(245, 158, 11, 0.2)'
  },
  {
    label: 'Следующий фокус',
    color: '#c084fc',
    background: 'rgba(168, 85, 247, 0.12)',
    border: 'rgba(168, 85, 247, 0.2)'
  }
] as const;

const hashChampionName = (championName: string) => Array.from(championName).reduce((sum, char, index) => sum + (char.charCodeAt(0) * (index + 3)), 0);

interface MockPostGameLoadout {
  role: PlayerInfo['mainRole'];
  build: ReturnType<typeof getRecommendedItemBuild>;
  spells: number[];
  runes: RuneLoadout;
  items: number[];
}

const getPlayerLoadout = (player: PlayerInfo, championName?: string) => {
  const latestMatch = player.recentMatches?.[0];
  const resolvedChampion = championName || latestMatch?.champion;

  return {
    spells: player.summonerSpells?.length === 2
      ? player.summonerSpells
      : latestMatch?.summonerSpells?.length === 2
        ? latestMatch.summonerSpells
        : getDefaultSummonerSpells(player.mainRole, resolvedChampion),
    runes: player.runes ?? latestMatch?.runes ?? getDefaultRuneLoadout(player.mainRole, resolvedChampion)
  };
};

const getMockPostGameLoadout = (championName: string, role: PlayerInfo['mainRole']): MockPostGameLoadout => {
  const seed = hashChampionName(`${championName}-${role}`);
  const build = getRecommendedItemBuild(championName, role);

  return {
    role,
    build,
    spells: [
      summonerSpellPool[seed % summonerSpellPool.length],
      summonerSpellPool[(seed + 3) % summonerSpellPool.length]
    ],
    runes: getDefaultRuneLoadout(role, championName),
    items: build?.items.slice(0, 5) ?? []
  };
};

function PostGamePlayerRow({ player, displayName, isWinner, laneLabel, rowIndex }: PostGamePlayerRowProps) {
  const latestMatch = player.recentMatches?.[0];
  const championName = latestMatch?.champion || 'Aatrox';
  const championIcon = getChampionIconUrl(championName);
  const championMeta = getChampionCatalogEntry(championName);
  const kdaText = latestMatch?.kda || `${Math.max(1, Math.round(player.winRate / 10))} / ${Math.max(1, Math.round((100 - player.winRate) / 18))} / ${Math.max(2, Math.round(player.wins / 12))}`;
  const totalGames = player.wins + player.losses;
  const mockLoadout = getMockPostGameLoadout(championName, player.mainRole);
  const playerLoadout = getPlayerLoadout(player, championName);
  const loadout = { ...mockLoadout, spells: playerLoadout.spells, runes: playerLoadout.runes };
  const buildLabel = mockLoadout.build?.name;
  const csEstimate = Math.max(24, Math.round((latestMatch?.k ?? 0) * 11 + (latestMatch?.a ?? 0) * 4 + player.winRate));
  const isDemoProfile = player.summonerName === 'DemoProfilePlayer';
  const [hoveredItemId, setHoveredItemId] = useState<number | null>(null);
  const [resolvedItemTooltips, setResolvedItemTooltips] = useState<Record<number, ItemCatalogEntry>>({});
  const hoveredItem = hoveredItemId !== null
    ? resolvedItemTooltips[hoveredItemId] ?? getItemCatalogEntry(hoveredItemId) ?? null
    : null;
  const shouldOpenTooltipDownward = rowIndex < 2;

  useEffect(() => {
    const missingItemIds = loadout.items.filter((itemId) => !resolvedItemTooltips[itemId]);

    if (missingItemIds.length === 0) {
      return;
    }

    let cancelled = false;

    const loadTooltipEntries = async () => {
      try {
        const resolvedEntries = await Promise.all(
          missingItemIds.map(async (itemId) => ({ itemId, entry: await resolveItemTooltipEntry(itemId) }))
        );

        if (cancelled) {
          return;
        }

        setResolvedItemTooltips((current) => {
          const nextEntries: Record<number, ItemCatalogEntry> = {};

          resolvedEntries.forEach(({ itemId, entry }) => {
            if (entry && !current[itemId]) {
              nextEntries[itemId] = entry;
            }
          });

          return Object.keys(nextEntries).length > 0
            ? { ...current, ...nextEntries }
            : current;
        });
      } catch {
        // ignore tooltip enrichment failures in post-game card
      }
    };

    loadTooltipEntries();

    return () => {
      cancelled = true;
    };
  }, [loadout.items, resolvedItemTooltips]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '76px minmax(0, 1fr) 58px 84px 112px',
      gap: '8px',
      alignItems: 'center',
      padding: '8px 9px',
      minHeight: '74px',
      borderRadius: '10px',
      background: isDemoProfile
        ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.16), rgba(15, 19, 26, 0.8))'
        : isWinner
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 19, 26, 0.72))'
          : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 19, 26, 0.72))',
      border: `1px solid ${isDemoProfile ? 'rgba(34, 211, 238, 0.36)' : isWinner ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.24)'}`,
      boxShadow: isDemoProfile ? 'inset 0 0 0 1px rgba(125, 211, 252, 0.14)' : 'none',
      position: 'relative',
      zIndex: hoveredItem ? 8 : 1
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '34px auto', gap: '4px', alignItems: 'center' }}>
        <img
          src={championIcon}
          alt={championName}
          onError={(e) => {
            (e.target as HTMLImageElement).src = getChampionIconUrl('Aatrox');
          }}
          style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)' }}
        />
        <PlayerLoadoutIcons spells={loadout.spells} runes={loadout.runes} size={14} compact tooltipPlacement={shouldOpenTooltipDownward ? 'bottom' : 'top'} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ marginBottom: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </div>
            {isDemoProfile && (
              <span style={{
                padding: '2px 6px',
                borderRadius: '999px',
                background: 'rgba(34, 211, 238, 0.12)',
                border: '1px solid rgba(34, 211, 238, 0.28)',
                color: '#67e8f9',
                fontSize: '8px',
                fontWeight: 'bold',
                letterSpacing: '0.05em',
                flexShrink: 0
              }}>
                YOU
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', minWidth: 0 }}>
          <span style={{
            padding: '2px 6px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            color: '#d1d5db',
            fontSize: '9px',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            flexShrink: 0
          }}>
            {laneLabel}
          </span>
          <div style={{ color: '#9ca3af', fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {championName}{championMeta ? ` · ${championMeta.tags[0]}` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '9px' }}>
          <span style={{ color: '#9ca3af' }}>{player.winRate}% WR</span>
          <span style={{ color: '#9ca3af' }}>{totalGames} игр</span>
          {buildLabel && (
            <span style={{ color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
              {buildLabel}
            </span>
          )}
        </div>
        <div style={{ color: '#6b7280', fontSize: '8px', lineHeight: 1.3, marginTop: '3px' }}>
          {player.tier} • {player.wins}W / {player.losses}L
        </div>
      </div>
      <div style={{
        textAlign: 'right',
        alignSelf: 'center'
      }}>
        <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '13px', lineHeight: 1.1, marginBottom: '4px' }}>
          {csEstimate}
        </div>
        <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.05em' }}>
          CS
        </div>
      </div>
      <div style={{
        textAlign: 'right',
        alignSelf: 'center'
      }}>
        <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '14px', lineHeight: 1.1, marginBottom: '4px' }}>
          {kdaText}
        </div>
        <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.05em' }}>
          K / D / A
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 22px)',
        gap: '5px',
        alignContent: 'center',
        justifyContent: 'end',
        minWidth: '76px',
        position: 'relative'
      }}>
        {loadout.items.map((itemId) => {
          const item = resolvedItemTooltips[itemId] ?? getItemCatalogEntry(itemId);

          return (
            <div
              key={`${displayName}-item-${itemId}`}
              onMouseEnter={() => {
                setHoveredItemId(itemId);
                if (!resolvedItemTooltips[itemId]) {
                  resolveItemTooltipEntry(itemId).then((entry) => {
                    if (entry) {
                      setResolvedItemTooltips((current) => current[itemId] ? current : { ...current, [itemId]: entry });
                    }
                  }).catch(() => {
                    // ignore tooltip enrichment failures on hover
                  });
                }
              }}
              onMouseLeave={() => setHoveredItemId((current) => current === itemId ? null : current)}
              style={{ position: 'relative' }}
            >
              <img
                src={getItemIconUrl(itemId)}
                alt={item?.name ?? `item-${itemId}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                style={{ width: '22px', height: '22px', borderRadius: '5px', border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.04)', display: 'block', cursor: 'help' }}
              />
            </div>
          );
        })}
        {hoveredItem && (
            <ItemTooltip
              item={hoveredItem}
              fallbackDescription="Базовый командный предмет из demo-каталога. Подробные live-статы здесь пока не подключены."
              positionStyle={shouldOpenTooltipDownward
                ? {
                    right: '-6px',
                    top: 'calc(100% + 12px)'
                  }
                : {
                    right: '-6px',
                    bottom: 'calc(100% + 12px)'
                  }}
              showArrow
              arrowDirection={shouldOpenTooltipDownward ? 'up' : 'down'}
              arrowStyle={shouldOpenTooltipDownward
                ? {
                    right: '22px',
                    bottom: '100%'
                  }
                : {
                    right: '22px',
                    top: '100%'
                  }}
            />
          )}
      </div>
    </div>
  );
}

function PlayerCard({ player, isAlly, onPlayerClick, displayName, searchDisabled = false, variant = 'in-game', lobbyRankBracket = 'emerald_plus' }: PlayerCardProps) {
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
  const rankLabel = formatPlayerRankLabel(player);
  const playerLoadout = getPlayerLoadout(player, championLabel);
  
  const [showChampTooltip, setShowChampTooltip] = useState(false);
  const [hoveredCounter, setHoveredCounter] = useState<LobbyCounterpickInsight | null>(null);
  const [lobbyInsight, setLobbyInsight] = useState<Awaited<ReturnType<typeof fetchLobbyChampionInsight>>>(null);
  const reliableLobbyCounters = lobbyInsight ? getReliableLobbyCounters(lobbyInsight.counters) : [];
  const hasLowConfidenceCounters = Boolean(lobbyInsight && lobbyInsight.counters.length > 0 && reliableLobbyCounters.length === 0);
  const hasReliableGlobalWinRate = Boolean(lobbyInsight && Number.isFinite(lobbyInsight.globalWinRate));
  const lobbyMatchupHint = lobbyInsight ? getLobbyMatchupHint(championLabel, reliableLobbyCounters) : null;

  useEffect(() => {
    let isCurrent = true;

    if (variant !== 'lobby' || !selectedChampion) {
      setLobbyInsight(null);
      return () => {
        isCurrent = false;
      };
    }

    fetchLobbyChampionInsight(championLabel, player.mainRole, lobbyRankBracket).then((insight) => {
      if (isCurrent) {
        setLobbyInsight(insight);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [championLabel, lobbyRankBracket, player.mainRole, selectedChampion, variant]);

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
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: variant === 'lobby' ? '54px minmax(0, 1fr)' : '54px auto minmax(0, 1fr)', gap: variant === 'lobby' ? '8px' : '10px', alignItems: 'center', marginBottom: variant === 'lobby' ? '6px' : '8px' }}>
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

        {variant !== 'lobby' && (
          <PlayerLoadoutIcons spells={playerLoadout.spells} runes={playerLoadout.runes} size={22} />
        )}

        <div style={{ minWidth: 0 }}>
          {variant === 'lobby' ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <div style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, minWidth: 0 }}>
                  {championLabel}
                </div>
              </div>
              {lobbyInsight ? (
                <div style={{
                  background: `linear-gradient(135deg, rgba(15, 23, 42, 0.74), ${lobbyInsight.tierColor}22)`,
                  padding: '7px 8px',
                  borderRadius: '7px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  minWidth: 0,
                  border: `1px solid ${lobbyInsight.tierColor}33`
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#94a3b8', fontSize: '8px', marginBottom: '3px' }}>Винрейт</div>
                    <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {Number.isFinite(lobbyInsight.globalWinRate) ? `${lobbyInsight.globalWinRate}%` : '—'}
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#94a3b8', fontSize: '8px', marginBottom: '3px' }}>Тир чемпиона</div>
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
                  <div style={{ color: '#6b7280', fontSize: '8px', marginBottom: '3px' }}>Нет мета-данных</div>
                  <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '10px', lineHeight: 1.35 }}>
                    Для этой роли и ранга пока нет данных по контрпикам и тиру.
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
        lobbyInsight && reliableLobbyCounters.length > 0 ? (
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.72), rgba(15, 23, 42, 0.58))',
          padding: '7px 8px',
          borderRadius: '8px',
          marginTop: 'auto',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
            <div style={{ color: '#94a3b8', fontSize: '8px', fontWeight: 700, letterSpacing: '0.04em' }}>УЯЗВИМ К</div>
            <div style={{ color: '#64748b', fontSize: '8px' }}>{lobbyInsight.sampleLabel.replace('Emerald+, ', '')}</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '5px' }}>
            {reliableLobbyCounters.map((counter) => (
              <div
                key={`${championLabel}-${counter.champion}`}
                onMouseEnter={() => setHoveredCounter(counter)}
                onMouseLeave={() => setHoveredCounter((current) => current?.champion === counter.champion ? null : current)}
                style={{ position: 'relative', minWidth: 0 }}
              >
                <img
                  src={getChampionIconUrl(counter.champion)}
                  alt={counter.champion}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = getChampionIconUrl('Aatrox');
                  }}
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    borderRadius: '6px',
                    border: '1px solid rgba(248, 113, 113, 0.35)',
                    display: 'block',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.28)'
                  }}
                />
                <div style={{
                  position: 'absolute',
                  right: '-2px',
                  bottom: '-2px',
                  padding: '1px 4px',
                  borderRadius: '999px',
                  background: 'rgba(127, 29, 29, 0.92)',
                  color: '#fecaca',
                  fontSize: '7px',
                  fontWeight: 800,
                  border: '1px solid rgba(254, 202, 202, 0.24)'
                }}>
                  {Math.round(counter.matchupWinRate)}%
                </div>
              </div>
            ))}
          </div>
          {lobbyMatchupHint && (
            <div style={{ color: '#cbd5e1', fontSize: '8px', lineHeight: 1.35, marginTop: '6px' }}>
              {lobbyMatchupHint}
            </div>
          )}
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
              <div style={{ color: '#9ca3af', fontSize: '9px' }}>Винрейт контрпика против {championLabel}: {hoveredCounter.matchupWinRate}%</div>
              {hoveredCounter.matches ? (
                <div style={{ color: '#64748b', fontSize: '8px', marginTop: '2px' }}>{hoveredCounter.matches.toLocaleString('ru-RU')} матчей</div>
              ) : null}
            </div>
          )}
        </div>
        ) : lobbyInsight ? (
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.68), rgba(30, 41, 59, 0.48))',
            padding: '7px 8px',
            borderRadius: '8px',
            marginTop: 'auto',
            border: '1px solid rgba(148, 163, 184, 0.12)'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '8px', marginBottom: '4px' }}>Мета-профиль</div>
            <div style={{ color: '#cbd5e1', fontSize: '9px', lineHeight: 1.35 }}>
              {hasLowConfidenceCounters
                ? 'Данные по матчапам есть, но выборка слишком маленькая для уверенного совета.'
                : hasReliableGlobalWinRate
                  ? 'Тир и винрейт есть, но надёжные данные по матчапам для этой роли пока не заполнены.'
                  : 'Тир есть, но надёжные винрейт и матчапы для этой роли пока не заполнены.'}
            </div>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.58), rgba(30, 41, 59, 0.38))',
            padding: '7px 8px',
            borderRadius: '8px',
            marginTop: 'auto',
            border: '1px solid rgba(148, 163, 184, 0.1)'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '8px', marginBottom: '4px' }}>Матчапы</div>
            <div style={{ color: '#cbd5e1', fontSize: '9px', lineHeight: 1.35 }}>
              Нет надёжного сигнала по этому пику. Показываем только проверенные данные, без выдуманных цифр.
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

export function MatchScreen({ onRequestAiAnalysis, isLoadingAi = false, aiAdvice = '', aiReview = null, lastCompletedMatch = null, reviewMode = false }: MatchScreenProps) {
  const lobbyState = useSelector((state: RootState) => state.lobby);
  const subscriptionState = useSelector((state: RootState) => state.subscription);
  const allies = lobbyState.players.allies;
  const enemies = lobbyState.players.enemies;
  const lobbyRankBracket = resolveLobbyRankBracket([...allies, ...enemies]);
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
    dispatchSearchPlayerCommand({ summonerName: player.summonerName, targetRegion: 'euw' });
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
  const aiInsightLines = aiReview
    ? [aiReview.strength, aiReview.risk, aiReview.nextFocus].filter(Boolean)
    : aiAdviceLines.filter((line) => line.startsWith('Сильная сторона:') || line.startsWith('Главный риск:') || line.startsWith('Фокус на следующую игру:'));
  const aiDetailLines = aiReview
    ? [aiReview.evidence].filter(Boolean)
    : aiAdviceLines.filter((line) => !line.startsWith('Сильная сторона:') && !line.startsWith('Главный риск:') && !line.startsWith('Фокус на следующую игру:'));
  const aiDetailText = aiDetailLines.join('\n');
  const aiSourceMeta = aiReview ? getAiSourceMeta(aiReview.source) : null;
  const isPremiumPlan = subscriptionState.plan === 'premium';
  const aiReviewsRemaining = Math.max(0, subscriptionState.aiReviewWeeklyLimit - subscriptionState.aiReviewsUsedThisWeek);
  const hasFreeAiCapacity = isPremiumPlan || aiReviewsRemaining > 0;
  const shouldShowAiUpgrade = !reviewMode && !isPremiumPlan && !hasFreeAiCapacity;
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
  const lobbyComplianceNotice = lobbyState.phase === 'champ-select'
    ? isRankedSoloDuoChampSelect
      ? 'В Ranked Solo/Duo имена непартийных союзников скрыты, lookup для них отключен, а сигналы ниже остаются нейтральными и без live-коучинга.'
      : 'Лобби-экран показывает только нейтральные сигналы и не дает live-команд во время матча.'
    : null;

  if (lobbyState.phase === 'post-game') {
    const completedDurationLabel = lastCompletedMatch?.gameDurationSeconds !== null && lastCompletedMatch?.gameDurationSeconds !== undefined
      ? `${Math.floor(lastCompletedMatch.gameDurationSeconds / 60)}:${Math.round(lastCompletedMatch.gameDurationSeconds % 60).toString().padStart(2, '0')}`
      : null;
    const allyScoreLine = `${allies.reduce((sum, player) => sum + (player.recentMatches?.[0]?.k ?? 0), 0)} / ${allies.reduce((sum, player) => sum + (player.recentMatches?.[0]?.d ?? 0), 0)} / ${allies.reduce((sum, player) => sum + (player.recentMatches?.[0]?.a ?? 0), 0)}`;
    const enemyScoreLine = `${enemies.reduce((sum, player) => sum + (player.recentMatches?.[0]?.k ?? 0), 0)} / ${enemies.reduce((sum, player) => sum + (player.recentMatches?.[0]?.d ?? 0), 0)} / ${enemies.reduce((sum, player) => sum + (player.recentMatches?.[0]?.a ?? 0), 0)}`;

    return (
      <div style={{
        padding: '8px',
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: 'linear-gradient(180deg, rgba(8, 11, 18, 0.66), rgba(10, 14, 22, 0.5))',
        borderRadius: '14px',
        border: '1px solid rgba(31, 41, 55, 0.8)',
        boxSizing: 'border-box',
        display: 'grid',
        gridTemplateRows: 'auto auto',
        gap: '8px'
      }}>
        {reviewNotice && (
          <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.35)', color: '#d1d5db', fontSize: '11px', lineHeight: 1.5 }}>
            <div style={{ color: '#fdba74', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '4px' }}>REVIEW MODE</div>
            {reviewNotice}
          </div>
        )}
        <div style={{
          padding: '12px',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.28)',
          border: '1px solid #1f2937',
          display: 'grid',
          gap: '10px'
        }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '10px' }}>
              <div>
                <div style={{ color: allyTeamWon === false ? '#ef4444' : '#10b981', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  {allyTeamWon === true ? 'ПОБЕДА' : 'ПОРАЖЕНИЕ'}
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
                  {allyScoreLine}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>Ранговая одиночная / парная</div>
                <div style={{ color: '#9ca3af', fontSize: '11px' }}>{completedDurationLabel ?? 'Матч завершен'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: allyTeamWon === true ? '#ef4444' : '#10b981', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  {allyTeamWon === true ? 'ПОРАЖЕНИЕ' : 'ПОБЕДА'}
                </div>
                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>
                  {enemyScoreLine}
                </div>
              </div>
            </div>

            {lastCompletedMatch && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '8px'
              }}>
                {(() => {
                  const reviewRole = allies.find((player) => player.recentMatches[0]?.champion === lastCompletedMatch.championName)?.mainRole ?? 'ADC';
                  const reviewBuild = getRecommendedItemBuild(lastCompletedMatch.championName, reviewRole);

                  return (
                    <>
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.16)' }}>
                        <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', marginBottom: '4px' }}>ТВОЙ ЧЕМПИОН</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{lastCompletedMatch.championName}</div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', marginBottom: '4px' }}>ТВОЙ KDA</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{lastCompletedMatch.kills}/{lastCompletedMatch.deaths}/{lastCompletedMatch.assists}</div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', marginBottom: '4px' }}>ЭКОНОМИКА</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{lastCompletedMatch.cs} CS{lastCompletedMatch.csPerMinute !== null ? ` • ${lastCompletedMatch.csPerMinute.toFixed(1)}/мин` : ''}</div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', marginBottom: '4px' }}>СБОРКА</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', lineHeight: 1.35 }}>{reviewBuild?.name ?? 'Стандартный сетап'}</div>
                      </div>
                      <div style={{ padding: '8px 10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', marginBottom: '4px' }}>СИГНАЛ</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', lineHeight: 1.35 }}>{progressSignal}</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 58px 84px 112px',
              gap: '8px',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em' }}>СОЮЗНИКИ</div>
              <div style={{ color: '#9ca3af', fontSize: '8px', letterSpacing: '0.08em' }}>ЛИНИЯ</div>
              <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', textAlign: 'right' }}>CS</div>
              <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', textAlign: 'right' }}>KDA</div>
              <div style={{ color: '#6b7280', fontSize: '8px', letterSpacing: '0.06em', textAlign: 'right' }}>ITEMS</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ display: 'grid', gap: '8px', alignContent: 'start' }}>
              {alliedByLane.map(({ lane, player, index }) => (
                <PostGamePlayerRow
                  key={`post-ally-${lane}`}
                  player={player}
                  displayName={getDisplayName(player, index, true)}
                  isWinner={allyTeamWon !== false}
                  laneLabel={laneLabels[lane]}
                  rowIndex={index}
                />
              ))}
            </div>
            <div style={{ display: 'grid', gap: '8px', alignContent: 'start' }}>
              {enemyByLane.map(({ lane, player, index }) => (
                <PostGamePlayerRow
                  key={`post-enemy-${lane}`}
                  player={player}
                  displayName={getDisplayName(player, index, false)}
                  isWinner={allyTeamWon === false}
                  laneLabel={laneLabels[lane]}
                  rowIndex={index}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '8px'
        }}>
          <div style={{ padding: '12px', borderRadius: '14px', background: 'linear-gradient(180deg, rgba(76, 29, 149, 0.24), rgba(15, 19, 26, 0.92))', border: '1px solid rgba(168, 85, 247, 0.28)', minHeight: 0, display: 'grid', gridTemplateRows: 'auto auto auto 1fr', gap: '10px', boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.04)' }}>
            <div>
              <div style={{ color: '#c084fc', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '5px' }}>AI-РАЗБОР</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>Что забрать в следующую игру</div>
              <div style={{ color: '#c4b5fd', fontSize: '11px', lineHeight: 1.45, maxWidth: '420px' }}>
                Короткая сводка по завершенному матчу: что уже получилось, где просел темп и какой один акцент брать дальше.
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 7px', borderRadius: '999px', background: isPremiumPlan ? 'rgba(245, 158, 11, 0.14)' : 'rgba(96, 165, 250, 0.12)', border: `1px solid ${isPremiumPlan ? 'rgba(245, 158, 11, 0.28)' : 'rgba(96, 165, 250, 0.26)'}`, color: isPremiumPlan ? '#fbbf24' : '#93c5fd', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                  {isPremiumPlan ? 'PREMIUM PLAN' : 'FREE PLAN'}
                </span>
                {!reviewMode && !isPremiumPlan && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 7px', borderRadius: '999px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)', color: '#d1d5db', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                    Осталось AI-разборов: {aiReviewsRemaining}/{subscriptionState.aiReviewWeeklyLimit}
                  </span>
                )}
              </div>
              {aiSourceMeta && (
                <div style={{ marginTop: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 7px', borderRadius: '999px', background: aiSourceMeta.background, border: `1px solid ${aiSourceMeta.border}`, color: aiSourceMeta.color, fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.04em' }}>
                    {aiSourceMeta.label}
                  </span>
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gap: '7px' }}>
              {shouldShowAiUpgrade ? (
                <div style={{ padding: '11px 12px', borderRadius: '12px', background: 'rgba(15, 19, 26, 0.54)', border: '1px solid rgba(251, 191, 36, 0.18)', color: '#d1d5db', fontSize: '10px', lineHeight: 1.45 }}>
                  <div style={{ color: '#fbbf24', fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '5px', textTransform: 'uppercase' }}>
                    Premium unlock
                  </div>
                  <div style={{ marginBottom: '6px' }}>
                    Бесплатный лимит полных AI-разборов на неделю закончился. Premium откроет полный post-game review без лимита, историю разборов и будущие weekly insights.
                  </div>
                  <div style={{ color: '#9ca3af' }}>
                    Базовая статистика, safe lobby summary и профиль игрока остаются бесплатными.
                  </div>
                </div>
              ) : aiInsightLines.length > 0 ? aiInsightLines.map((line, index) => {
                const tone = aiInsightTone[index] ?? aiInsightTone[aiInsightTone.length - 1];

                return (
                  <div
                    key={line}
                    style={{
                      padding: '9px 10px',
                      borderRadius: '12px',
                      background: tone.background,
                      border: `1px solid ${tone.border}`,
                      color: '#d1d5db',
                      fontSize: '10px',
                      lineHeight: 1.4
                    }}
                  >
                    <div style={{ color: tone.color, fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '4px', textTransform: 'uppercase' }}>
                      {tone.label}
                    </div>
                    <div>{line}</div>
                  </div>
                );
              }) : (
                <div style={{ padding: '9px 10px', borderRadius: '12px', background: 'rgba(15, 19, 26, 0.54)', border: '1px solid rgba(168, 85, 247, 0.16)', color: '#9ca3af', fontSize: '10px', lineHeight: 1.4 }}>
                  После генерации AI-разбора здесь появятся короткие тезисы: сильная сторона, главный риск и конкретный следующий фокус.
                </div>
              )}
            </div>
            <button
              onClick={onRequestAiAnalysis}
              disabled={!onRequestAiAnalysis || isLoadingAi || shouldShowAiUpgrade}
              style={{
                padding: '8px 12px',
                background: shouldShowAiUpgrade ? 'rgba(245, 158, 11, 0.4)' : isLoadingAi ? 'rgba(168, 85, 247, 0.35)' : '#a855f7',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: !onRequestAiAnalysis || isLoadingAi || shouldShowAiUpgrade ? 'default' : 'pointer',
                fontWeight: 'bold',
                fontSize: '12px',
                opacity: !onRequestAiAnalysis ? 0.7 : 1
              }}
            >
              {shouldShowAiUpgrade ? 'Доступен Premium AI-разбор' : isLoadingAi ? 'AI собирает тезисы...' : 'Обновить тезисы AI'}
            </button>
            <div style={{
              minHeight: 0,
              overflow: 'hidden',
              padding: '11px 12px',
              borderRadius: '12px',
              background: 'rgba(9, 12, 20, 0.82)',
              border: '1px solid rgba(168, 85, 247, 0.18)',
              color: '#d1d5db',
              fontSize: '11px',
              lineHeight: 1.45,
              whiteSpace: 'pre-line'
            }}>
              <div style={{ color: '#8b5cf6', fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.08em', marginBottom: '5px' }}>КОНТЕКСТ РАЗБОРА</div>
              {shouldShowAiUpgrade
                ? 'Free-план уже дал базовый лимит AI-разборов на эту неделю. Premium откроет полный AI review после каждого матча, историю прошлых разборов и долгосрочные тренды прогресса.'
                : aiDetailText || (aiInsightLines.length > 0
                ? 'Разбор собран по итогам завершенного матча и опирается только на локальные метрики: KDA, CS и общий паттерн темпа.'
                : 'После завершения матча здесь появятся три коротких тезиса: сильная сторона, главный риск и фокус на следующую игру.')}
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
      {lobbyComplianceNotice && (
        <div style={{ marginBottom: '8px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(96, 165, 250, 0.28)', color: '#dbeafe', fontSize: '11px', lineHeight: 1.5 }}>
          <div style={{ color: '#93c5fd', fontSize: '9px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '4px' }}>SAFE LOBBY MODE</div>
          {lobbyComplianceNotice}
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
                lobbyRankBracket={lobbyRankBracket}
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
                lobbyRankBracket={lobbyRankBracket}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
