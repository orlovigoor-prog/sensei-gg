import { useEffect, useState } from 'react';
import { PlayerLoadoutIcons } from './PlayerLoadoutIcons';
import type { PlayerInfo } from '../store/lobbySlice';
import { getRankColor, getRankIconUrl } from '../services/rankAssets';
import { formatPlayerRankLabel } from '../services/rankLabel';
import {
  fetchLobbyChampionInsight,
  getChampionIconUrl,
  getReliableLobbyCounters
} from '../services/gameData';

interface LobbyPlayerCardProps {
  player: PlayerInfo;
  isAlly: boolean;
  onPlayerClick: (player: PlayerInfo, isAlly: boolean) => void;
  displayName: string;
  searchDisabled?: boolean;
  variant?: 'lobby' | 'in-game';
}

const formatLobbyPercent = (value: number) => `${value.toFixed(2).replace('.', ',')}%`;

const getPlayerLoadout = (player: PlayerInfo) => {
  const latestMatch = player.recentMatches?.[0];
  const spells = player.summonerSpells?.length === 2
    ? player.summonerSpells
    : latestMatch?.summonerSpells?.length === 2
      ? latestMatch.summonerSpells
      : undefined;
  const runes = player.runes ?? latestMatch?.runes;

  return spells && runes ? { spells, runes } : null;
};

export function LobbyPlayerCard({ player, isAlly, onPlayerClick, displayName, searchDisabled = false, variant = 'in-game' }: LobbyPlayerCardProps) {
  const winRate = typeof player.winRate === 'number' && Number.isFinite(player.winRate) ? player.winRate : null;
  const winRateColor = winRate === null ? '#94a3b8' : winRate >= 50 ? '#10b981' : '#ef4444';
  const cardTitle = displayName;
  const wins = typeof player.wins === 'number' && Number.isFinite(player.wins) ? player.wins : null;
  const losses = typeof player.losses === 'number' && Number.isFinite(player.losses) ? player.losses : null;
  const totalGames = wins !== null && losses !== null
    ? wins + losses
    : null;
  const selectedChampion = player.championName ?? player.recentMatches?.[0]?.champion;
  const championLabel = selectedChampion || 'Пик не выбран';
  const championIcon = selectedChampion ? getChampionIconUrl(selectedChampion) : null;
  const championStats = player.recentMatches?.filter((match) => match.champion === selectedChampion && match.gameType === 'RANKED') || [];
  const champWins = championStats.filter((match) => match.result === 'W').length;
  const champLosses = championStats.filter((match) => match.result === 'L').length;
  const champTotal = championStats.length;
  const totalKills = championStats.reduce((sum, match) => sum + (match.k || 0), 0);
  const totalDeaths = championStats.reduce((sum, match) => sum + (match.d || 0), 0);
  const totalAssists = championStats.reduce((sum, match) => sum + (match.a || 0), 0);
  const averageKills = champTotal > 0 ? (totalKills / champTotal).toFixed(1) : null;
  const averageDeaths = champTotal > 0 ? (totalDeaths / champTotal).toFixed(1) : null;
  const averageAssists = champTotal > 0 ? (totalAssists / champTotal).toFixed(1) : null;
  const averageKdaLabel = averageKills && averageDeaths && averageAssists ? [averageKills, averageDeaths, averageAssists]
    .map((value) => String(Number(value)))
    .join(' / ') : '—';
  const rankLabel = formatPlayerRankLabel(player);
  const playerLoadout = getPlayerLoadout(player);
  const [showChampTooltip, setShowChampTooltip] = useState(false);
  const lobbyInsightKey = variant === 'lobby' && selectedChampion ? `${championLabel}:${player.mainRole}` : null;
  const [lobbyInsightResult, setLobbyInsightResult] = useState<{ key: string; insight: Awaited<ReturnType<typeof fetchLobbyChampionInsight>> } | null>(null);
  const lobbyInsight = lobbyInsightResult?.key === lobbyInsightKey ? lobbyInsightResult.insight : null;
  const lobbyGlobalWinRate = lobbyInsight?.globalWinRate;
  const reliableLobbyCounters = lobbyInsight ? getReliableLobbyCounters(lobbyInsight.counters) : [];

  useEffect(() => {
    let isCurrent = true;

    if (!lobbyInsightKey) {
      return undefined;
    }

    fetchLobbyChampionInsight(championLabel, player.mainRole).then((insight) => {
      if (isCurrent) {
        setLobbyInsightResult({ key: lobbyInsightKey, insight });
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [championLabel, lobbyInsightKey, player.mainRole]);

  return (
    <div
      onClick={() => {
        if (!searchDisabled) {
          onPlayerClick(player, isAlly);
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
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'translateY(-2px)';
        event.currentTarget.style.boxShadow = `0 4px 12px ${isAlly ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`;
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'translateY(0)';
        event.currentTarget.style.boxShadow = 'none';
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
            {player.tier && <img
              src={getRankIconUrl(player.tier)}
              alt={player.tier}
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
              style={{ width: '14px', height: '14px', objectFit: 'contain', display: 'block' }}
            />}
            <span style={{ color: getRankColor(player.tier ?? 'UNRANKED'), fontWeight: 'bold', fontSize: '10px', whiteSpace: 'nowrap' }}>
              {rankLabel}
            </span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: variant === 'lobby' ? '54px minmax(0, 1fr)' : '54px auto minmax(0, 1fr)', gap: variant === 'lobby' ? '8px' : '10px', alignItems: 'center', marginBottom: variant === 'lobby' ? '6px' : '8px' }}>
        <div
          style={{ position: 'relative', cursor: 'help', width: '54px', height: '54px' }}
          onMouseEnter={() => setShowChampTooltip(true)}
          onMouseLeave={() => setShowChampTooltip(false)}
        >
          {championIcon ? <img
            src={championIcon}
            alt={championLabel}
            onError={(event) => {
              event.currentTarget.style.display = 'none';
            }}
            style={{ width: '54px', height: '54px', borderRadius: '8px', border: '2px solid #00ffcc', display: 'block' }}
          /> : <div style={{ width: '54px', height: '54px', borderRadius: '8px', border: '2px solid #475569', display: 'grid', placeItems: 'center', color: '#94a3b8', fontSize: '20px' }}>—</div>}
          {showChampTooltip && champTotal > 0 && null}
        </div>

        {variant !== 'lobby' && playerLoadout && (
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
              <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '5px 7px', borderRadius: '7px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px', minWidth: 0 }}>
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
        <div style={{ background: 'linear-gradient(135deg, rgba(2, 6, 23, 0.72), rgba(15, 23, 42, 0.58))', padding: '7px 8px', borderRadius: '8px', marginTop: 'auto', border: '1px solid rgba(148, 163, 184, 0.12)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '5px' }}>
            {reliableLobbyCounters.map((counter) => (
              <div key={`${championLabel}-${counter.champion}`} style={{ position: 'relative', minWidth: 0 }}>
                <img
                  src={getChampionIconUrl(counter.champion)}
                  alt={counter.champion}
                  onError={(event) => {
                    event.currentTarget.src = getChampionIconUrl('Aatrox');
                  }}
                  style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: '6px', border: '1px solid rgba(248, 113, 113, 0.35)', display: 'block', boxShadow: '0 4px 10px rgba(0,0,0,0.28)' }}
                />
                <div style={{ position: 'absolute', right: '-2px', bottom: '-2px', padding: '1px 4px', borderRadius: '999px', background: 'rgba(127, 29, 29, 0.92)', color: '#fecaca', fontSize: '7px', fontWeight: 800, border: '1px solid rgba(254, 202, 202, 0.24)' }}>
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
              {winRate === null ? '—' : `${winRate}%`}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '8px' }}>Винрейт</div>
          </div>
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '7px 6px', borderRadius: '6px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', boxSizing: 'border-box' }}>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
              {totalGames ?? '—'}
            </div>
            <div style={{ color: '#9ca3af', fontSize: '8px' }}>Матчи</div>
          </div>
        </div>
      )}
    </div>
  );
}
