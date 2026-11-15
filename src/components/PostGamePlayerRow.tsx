import { useEffect, useMemo, useState } from 'react';
import { ItemTooltip } from './ItemTooltip';
import { PlayerLoadoutIcons } from './PlayerLoadoutIcons';
import type { CompletedScoreboardPlayer } from '../store/lobbySlice';
import {
  getChampionIconUrl,
  getItemCatalogEntry,
  getItemIconUrl,
  resolveItemTooltipEntry
} from '../services/gameData';
import type { ItemCatalogEntry } from '../services/gameData/items';

interface PostGamePlayerRowProps {
  player: CompletedScoreboardPlayer;
  displayName: string;
  isWinner?: boolean;
  laneLabel: string;
  teamKills?: number;
}

const hasScoreValue = (value: number | undefined): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

const formatPostGameScoreValue = (value: number | undefined) => hasScoreValue(value) ? String(value) : '—';

export function PostGamePlayerRow({ player, displayName, isWinner, laneLabel, teamKills }: PostGamePlayerRowProps) {
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
        // Ignore tooltip enrichment failures in post-game card.
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
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
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
                        // Ignore tooltip enrichment failures on hover.
                      });
                    }
                  }}
                  onMouseLeave={() => setHoveredItem((current) => current?.itemId === itemId ? null : current)}
                  style={{ position: 'relative' }}
                >
                  <img
                    src={getItemIconUrl(itemId)}
                    alt={item?.name ?? `item-${itemId}`}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
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
                    // Ignore tooltip enrichment failures on hover.
                  });
                }
              }}
              onMouseLeave={() => setHoveredItem((current) => current?.itemId === trinketId ? null : current)}
              style={{ position: 'relative' }}
            >
              <img
                src={getItemIconUrl(trinketId)}
                alt={trinket?.name ?? `item-${trinketId}`}
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
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
