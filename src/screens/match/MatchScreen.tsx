import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useEffect, useMemo, useState } from 'react';
import { ItemTooltip } from '../../components/ItemTooltip';
import { PlayerLoadoutIcons } from '../../components/PlayerLoadoutIcons';
import type { CompletedScoreboardPlayer, PlayerInfo } from '../../store/lobbySlice';
import { getRankColor, getRankIconUrl } from '../../services/rankAssets';
import { formatPlayerRankLabel } from '../../services/rankLabel';
import { dispatchSearchPlayerCommand } from '../../services/appCommands';
import {
  getChampionIconUrl,
  getItemCatalogEntry,
  getItemIconUrl,
  resolveItemTooltipEntry,
  getDefaultRuneLoadout,
  getDefaultSummonerSpells,
  fetchLobbyChampionInsight,
  getReliableLobbyCounters
} from '../../services/gameData';
import type { LobbyRankBracket } from '../../services/gameData';
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
  reviewMode?: boolean;
}

interface PostGamePlayerRowProps {
  player: CompletedScoreboardPlayer;
  displayName: string;
  isWinner?: boolean;
  laneLabel: string;
  teamKills?: number;
}

const formatLobbyPercent = (value: number) => `${value.toFixed(2).replace('.', ',')}%`;

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

const toPostGameScoreboardPlayer = (player: PlayerInfo): CompletedScoreboardPlayer => {
  const latestMatch = player.recentMatches?.[0];

  return {
    summonerName: player.summonerName,
    championName: latestMatch?.champion ?? '',
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

function PostGamePlayerRow({ player, displayName, isWinner, laneLabel, teamKills }: PostGamePlayerRowProps) {
  const championName = player.championName;
  const hasChampion = championName.length > 0;
  const kdaText = `${formatPostGameScoreValue(player.kills)} / ${formatPostGameScoreValue(player.deaths)} / ${formatPostGameScoreValue(player.assists)}`;
  const killParticipation = hasScoreValue(player.kills) && hasScoreValue(player.assists) && hasScoreValue(teamKills) && teamKills > 0
    ? `${Math.round(((player.kills + player.assists) / teamKills) * 100)}%`
    : '—';
  const formatGold = (goldEarned: number | undefined) => goldEarned === undefined
    ? '—'
    : goldEarned >= 1000
      ? `${(goldEarned / 1000).toFixed(1)}k`
      : String(goldEarned);
  const itemIds = useMemo(
    () => player.items?.filter((itemId) => Number.isInteger(itemId) && itemId > 0).slice(0, 6) ?? [],
    [player.items]
  );
  const trinketId = Number.isInteger(player.trinketId) && (player.trinketId ?? 0) > 0
    ? player.trinketId
    : null;
  const displayedItemIds = useMemo(
    () => trinketId ? [...itemIds, trinketId] : itemIds,
    [itemIds, trinketId]
  );
  const matchLoadout = player.summonerSpells?.length === 2 && player.runes
    ? { spells: player.summonerSpells, runes: player.runes }
    : null;
  const isDemoProfile = player.summonerName === 'DemoProfilePlayer';
  const [hoveredItem, setHoveredItem] = useState<{ itemId: number; anchorElement: HTMLElement } | null>(null);
  const [resolvedItemTooltips, setResolvedItemTooltips] = useState<Record<number, ItemCatalogEntry>>({});
  const hoveredItemDetails = hoveredItem
    ? resolvedItemTooltips[hoveredItem.itemId] ?? getItemCatalogEntry(hoveredItem.itemId) ?? null
    : null;

  useEffect(() => {
    const missingItemIds = displayedItemIds.filter((itemId) => !resolvedItemTooltips[itemId]);

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
  }, [displayedItemIds, resolvedItemTooltips]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '44px 42px minmax(82px, 1fr) 86px 168px 116px',
      gap: '7px',
      alignItems: 'center',
      padding: '7px 8px',
      minHeight: '42px',
      height: '100%',
      boxSizing: 'border-box',
      borderRadius: '10px',
      background: isDemoProfile
        ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.16), rgba(15, 19, 26, 0.8))'
        : isWinner === true
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(15, 19, 26, 0.72))'
          : isWinner === false
            ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(15, 19, 26, 0.72))'
            : 'rgba(15, 19, 26, 0.72)',
      border: `1px solid ${isDemoProfile ? 'rgba(34, 211, 238, 0.36)' : isWinner === true ? 'rgba(16, 185, 129, 0.3)' : isWinner === false ? 'rgba(239, 68, 68, 0.24)' : 'rgba(148, 163, 184, 0.2)'}`,
      boxShadow: isDemoProfile ? 'inset 0 0 0 1px rgba(125, 211, 252, 0.14)' : 'none',
      position: 'relative',
      zIndex: hoveredItem ? 8 : 1
    }}>
      <div style={{ width: '44px', height: '44px', flexShrink: 0 }}>
        {hasChampion ? (
          <img
            src={getChampionIconUrl(championName)}
            alt={championName}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.visibility = 'hidden';
            }}
            style={{ width: '44px', height: '44px', borderRadius: '9px', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'block' }}
          />
        ) : (
          <div style={{ width: '44px', height: '44px', display: 'grid', placeItems: 'center', borderRadius: '9px', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#6b7280', fontSize: '18px', fontWeight: 'bold' }}>—</div>
        )}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0
      }}>
        {matchLoadout ? (
          <PlayerLoadoutIcons spells={matchLoadout.spells} runes={matchLoadout.runes} size={16} compact />
        ) : (
          <span style={{ color: '#6b7280', fontSize: '13px', fontWeight: 'bold' }}>—</span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0, marginBottom: '3px' }}>
          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {displayName}
          </div>
          {isDemoProfile && (
            <span style={{ color: '#67e8f9', fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.05em', flexShrink: 0 }}>YOU</span>
          )}
        </div>
        <div style={{ color: '#9ca3af', fontSize: '10px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{laneLabel} · {championName || '—'}</div>
      </div>
      <div style={{
        alignSelf: 'center',
        minWidth: 0
      }}>
        <div style={{ color: '#6b7280', fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.07em', marginBottom: '3px' }}>
          K / D / A
        </div>
        <div style={{ color: '#ffffff', fontWeight: 'bold', fontSize: '15px', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
          {kdaText}
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: '5px',
        alignSelf: 'center'
      }}>
        {[
          ['KP', killParticipation],
          ['CS', formatPostGameScoreValue(player.cs)],
          ['GOLD', formatGold(player.goldEarned)],
          ['VISION', formatPostGameScoreValue(player.visionScore)]
        ].map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div style={{ color: '#6b7280', fontSize: '8px', fontWeight: 'bold', letterSpacing: '0.04em', marginBottom: '3px', whiteSpace: 'nowrap' }}>{label}</div>
            <div style={{ color: '#e5e7eb', fontSize: '12px', fontWeight: 'bold', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</div>
          </div>
        ))}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: '116px',
        gap: '6px',
        position: 'relative'
      }}>
        {displayedItemIds.length === 0 && (
          <div style={{ color: '#6b7280', fontSize: '13px', fontWeight: 'bold', textAlign: 'center' }}>—</div>
        )}
        {itemIds.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 26px)', gridTemplateRows: 'repeat(2, 26px)', gap: '3px' }}>
            {itemIds.map((itemId, itemIndex) => {
              const item = resolvedItemTooltips[itemId] ?? getItemCatalogEntry(itemId);

              return (
                <div
                  key={`${displayName}-item-${itemIndex}`}
                  onMouseEnter={(event) => {
                    setHoveredItem({ itemId, anchorElement: event.currentTarget });
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
                  onMouseLeave={() => setHoveredItem((current) => current?.itemId === itemId ? null : current)}
                  style={{ position: 'relative' }}
                >
                  <img
                    src={getItemIconUrl(itemId)}
                    alt={item?.name ?? `item-${itemId}`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(255, 255, 255, 0.04)', display: 'block', cursor: 'help' }}
                  />
                </div>
              );
            })}
          </div>
        )}
        {trinketId && (() => {
          const trinket = resolvedItemTooltips[trinketId] ?? getItemCatalogEntry(trinketId);

          return (
            <div
              onMouseEnter={(event) => {
                setHoveredItem({ itemId: trinketId, anchorElement: event.currentTarget });
                if (!resolvedItemTooltips[trinketId]) {
                  resolveItemTooltipEntry(trinketId).then((entry) => {
                    if (entry) {
                      setResolvedItemTooltips((current) => current[trinketId] ? current : { ...current, [trinketId]: entry });
                    }
                  }).catch(() => {
                    // ignore tooltip enrichment failures on hover
                  });
                }
              }}
              onMouseLeave={() => setHoveredItem((current) => current?.itemId === trinketId ? null : current)}
              style={{ position: 'relative' }}
            >
              <img
                src={getItemIconUrl(trinketId)}
                alt={trinket?.name ?? `item-${trinketId}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid rgba(251, 191, 36, 0.56)', background: 'rgba(255, 255, 255, 0.04)', display: 'block', cursor: 'help' }}
              />
            </div>
          );
        })()}
        {hoveredItemDetails && hoveredItem && (
          <ItemTooltip
            item={hoveredItemDetails}
            fallbackDescription="Официальные сведения о предмете из Riot Data Dragon загружаются."
            anchorElement={hoveredItem.anchorElement}
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
  const averageKdaLabel = [averageKills, averageDeaths, averageAssists]
    .map((value) => String(Number(value)))
    .join(' / ');
  const rankLabel = formatPlayerRankLabel(player);
  const playerLoadout = getPlayerLoadout(player, championLabel);
  
  const [showChampTooltip, setShowChampTooltip] = useState(false);
  const lobbyInsightKey = variant === 'lobby' && selectedChampion ? `${championLabel}:${player.mainRole}:${lobbyRankBracket}` : null;
  const [lobbyInsightResult, setLobbyInsightResult] = useState<{ key: string; insight: Awaited<ReturnType<typeof fetchLobbyChampionInsight>> } | null>(null);
  const lobbyInsight = lobbyInsightResult?.key === lobbyInsightKey ? lobbyInsightResult.insight : null;
  const lobbyGlobalWinRate = lobbyInsight?.globalWinRate;
  const reliableLobbyCounters = lobbyInsight ? getReliableLobbyCounters(lobbyInsight.counters) : [];

  useEffect(() => {
    let isCurrent = true;

    if (!lobbyInsightKey) {
      return undefined;
    }

    fetchLobbyChampionInsight(championLabel, player.mainRole, lobbyRankBracket).then((insight) => {
      if (isCurrent) {
        setLobbyInsightResult({ key: lobbyInsightKey, insight });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [championLabel, lobbyInsightKey, lobbyRankBracket, player.mainRole]);

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
        {variant !== 'lobby' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <img
              src={getRankIconUrl(player.tier)}
              alt={player.tier}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
              style={{
                width: '14px',
                height: '14px',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            <span style={{
              color: getRankColor(player.tier),
              fontWeight: 'bold',
              fontSize: '10px',
              whiteSpace: 'nowrap'
            }}>
              {rankLabel}
            </span>
          </div>
        )}
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
              (e.target as HTMLImageElement).src = getChampionIconUrl('Aatrox');
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
              <div style={{
                background: `linear-gradient(135deg, rgba(15, 23, 42, 0.74), ${lobbyInsight?.tierColor ?? '#94a3b8'}22)`,
                padding: '7px 8px',
                borderRadius: '7px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                minWidth: 0,
                border: `1px solid ${lobbyInsight?.tierColor ?? '#94a3b8'}33`
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#94a3b8', fontSize: '8px', marginBottom: '3px' }}>Винрейт</div>
                  <div style={{ color: '#f3f4f6', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {Number.isFinite(lobbyGlobalWinRate) ? `${lobbyGlobalWinRate}%` : '—'}
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#94a3b8', fontSize: '8px', marginBottom: '3px' }}>Тир чемпиона</div>
                  <div style={{ color: lobbyInsight?.tierColor ?? '#94a3b8', fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lobbyInsight?.patchTier || '—'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div title={championLabel} style={{ color: '#d1d5db', fontSize: '14px', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2, marginBottom: '6px' }}>
                {championLabel}
              </div>
              <div style={{ 
                background: 'rgba(0, 0, 0, 0.3)', 
                padding: '5px 7px',
                borderRadius: '7px', 
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '6px',
                minWidth: 0
              }}>
                <div style={{ flex: '1 1 0', minWidth: 0 }}>
                  <div title="Средняя K/D/A" style={{ color: '#6b7280', fontSize: '8px', marginBottom: '2px' }}>K / D / A</div>
                  <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '9px', lineHeight: 1.2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {averageKdaLabel}
                  </div>
                </div>
                <div style={{ flex: '0 0 auto', minWidth: '32px', textAlign: 'right' }}>
                  <div title="Победы / поражения" style={{ color: '#6b7280', fontSize: '8px', marginBottom: '2px' }}>W / L</div>
                  <div style={{ color: '#d1d5db', fontWeight: 'bold', fontSize: '9px', lineHeight: 1.2, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {champWins}W / {champLosses}L
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {variant === 'lobby' && lobbyInsight && reliableLobbyCounters.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.72), rgba(15, 23, 42, 0.58))',
          padding: '7px 8px',
          borderRadius: '8px',
          marginTop: 'auto',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '5px' }}>
            {reliableLobbyCounters.map((counter) => (
              <div
                key={`${championLabel}-${counter.champion}`}
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
                  {formatLobbyPercent(counter.matchupWinRate)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {variant !== 'lobby' && (
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

export function MatchScreen({ reviewMode = false }: MatchScreenProps) {
  const lobbyState = useSelector((state: RootState) => state.lobby);
  const allies = lobbyState.players.allies;
  const enemies = lobbyState.players.enemies;
  const completedScoreboard = !reviewMode && lobbyState.completedScoreboard?.source === 'overwolf-live-client-data'
    && isCompletedScoreboardTeam(lobbyState.completedScoreboard.allies)
    && isCompletedScoreboardTeam(lobbyState.completedScoreboard.enemies)
    ? lobbyState.completedScoreboard
    : null;
  const lobbyRankBracket = resolveLobbyRankBracket([...allies, ...enemies]);
  const isRankedSoloDuo = !reviewMode && lobbyState.gameMode === 'RANKED_SOLO_5x5';
  const isRankedSoloDuoChampSelect = isRankedSoloDuo && lobbyState.phase === 'champ-select';

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

  const getPostGameDisplayName = (player: CompletedScoreboardPlayer, index: number, isAlly: boolean) => {
    if (!isRankedSoloDuo) {
      return player.summonerName;
    }

    if (
      isAlly
      && (player.summonerName === completedScoreboard?.localSummonerName || lobbyState.partyMembers.includes(player.summonerName))
    ) {
      return player.summonerName;
    }

    return `${isAlly ? 'Ally' : 'Enemy'} ${index + 1}`;
  };

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
  const showKeySignals = lobbyState.phase === 'loading' || lobbyState.phase === 'in-game';
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
      {showKeySignals && (
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
