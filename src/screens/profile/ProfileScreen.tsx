import { useEffect, useState } from 'react';
import { ItemTooltip } from '../../components/ItemTooltip';
import { PlayerLoadoutIcons } from '../../components/PlayerLoadoutIcons';
import type { RankedStats, Summoner } from '../../services/riotApi';
import { getRankIconUrl, type RankTier } from '../../services/rankAssets';
import { getChampionIconUrl, getDefaultRuneLoadout, getDefaultSummonerSpells, getProfileIconUrl } from '../../services/gameData';
import type { RuneLoadout } from '../../services/gameData';
import { getItemCatalogEntry, getItemIconUrl, resolveItemTooltipEntry, type ItemCatalogEntry } from '../../services/gameData/items';
import { fetchSubscriptionServiceResponse } from '../../services/subscriptionDevTools';
import {
  reviewModeChampionPool,
  reviewModeRecentMatches,
  reviewModeRoleStats,
  reviewModeRankedStats,
  reviewModeSummoner
} from '../../services/mockLobby';

type SearchRegion = 'ru' | 'euw' | 'eune' | 'tr' | 'na' | 'br' | 'la1' | 'la2' | 'kr' | 'jp';

interface ProfileScreenProps {
  reviewMode?: boolean;
}

interface RiotProfileSearchResponse {
  ok: boolean;
  region: SearchRegion;
  summoner: Summoner;
  rankedStats: RankedStats | null;
  recentMatches?: ProfileRecentMatch[];
  championMasteries?: ProfileChampionMastery[];
  championPool?: ProfileChampionPoolEntry[];
  profileSummary?: ProfileMatchSummary | null;
  riotId?: {
    gameName: string;
    tagLine: string;
  };
  error?: string;
  diagnostics?: {
    upstreamStatus: number | null;
    upstreamMessage: string | null;
    requestRegion: SearchRegion;
    requestRiotId: string;
    requestPath: string | null;
    requestHost: string | null;
  };
}

interface ProfileRecentMatch {
  matchId: string | null;
  champion: string;
  queueId?: number | null;
  result: 'Победа' | 'Поражение';
  kda: string;
  cs: number;
  duration: string;
  goldEarned?: number;
  goldLabel?: string;
  items?: number[];
  summonerSpells?: number[];
  runes?: RuneLoadout;
}

interface ProfileChampionMastery {
  championId: number;
  champion: string;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
}

interface ProfileChampionPoolEntry {
  champion: string;
  games: number;
  winRate: number;
  kda: string;
  csPerMinute: number;
  averageGoldEarned: number;
  averageGoldLabel: string;
}

interface ProfileMatchSummary {
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  averageKda: string;
  averageCs: number;
  csPerMinute: number;
  averageGoldEarned: number;
  averageGoldLabel: string;
}

interface HoveredItemState {
  itemId: number;
  anchorIndex: number;
}

const unrankedStats: RankedStats = {
  queueType: 'RANKED_SOLO_5x5',
  tier: 'UNRANKED',
  rank: '',
  leaguePoints: 0,
  wins: 0,
  losses: 0,
  hotStreak: false,
  veteran: false,
  freshBlood: false,
  inactive: false
};

const getTierAccent = (tier: string) => {
  const accents: Record<string, string> = {
    IRON: '#6b7280',
    BRONZE: '#b45309',
    SILVER: '#94a3b8',
    GOLD: '#f59e0b',
    PLATINUM: '#14b8a6',
    EMERALD: '#10b981',
    DIAMOND: '#60a5fa',
    MASTER: '#a855f7',
    GRANDMASTER: '#ef4444',
    CHALLENGER: '#f8fafc'
  };

  return accents[tier] || '#38bdf8';
};

const getQueueLabel = (queueId: number | null | undefined) => {
  switch (queueId) {
    case 420:
      return 'Одиночная/парная';
    case 440:
      return 'Гибкая 5x5';
    case 450:
      return 'ARAM';
    default:
      return 'Обычная игра';
  }
};

const getResultAccent = (result: ProfileRecentMatch['result']) => result === 'Победа' ? '#10b981' : '#ef4444';

const getKdaAccent = (match: ProfileRecentMatch) => {
  const [killsText, deathsText, assistsText] = match.kda.split('/').map((part) => part.trim());
  const kills = Number(killsText || 0);
  const deaths = Number(deathsText || 0);
  const assists = Number(assistsText || 0);

  if (deaths === 0 && (kills > 0 || assists > 0)) {
    return '#f59e0b';
  }

  return kills + assists >= deaths ? '#f8fafc' : '#fca5a5';
};

export function ProfileScreen({ reviewMode = false }: ProfileScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState<SearchRegion>('ru');
  const [loading, setLoading] = useState(false);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [recentMatches, setRecentMatches] = useState<ProfileRecentMatch[]>([]);
  const [championMasteries, setChampionMasteries] = useState<ProfileChampionMastery[]>([]);
  const [championPool, setChampionPool] = useState<ProfileChampionPoolEntry[]>([]);
  const [profileSummary, setProfileSummary] = useState<ProfileMatchSummary | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredItemState | null>(null);
  const [resolvedItemTooltips, setResolvedItemTooltips] = useState<Record<number, ItemCatalogEntry>>({});
  const [resolvedRiotId, setResolvedRiotId] = useState<string>('');
  const [error, setError] = useState('');

  const hoveredItemDetails = hoveredItem
    ? resolvedItemTooltips[hoveredItem.itemId] ?? getItemCatalogEntry(hoveredItem.itemId) ?? null
    : null;

  useEffect(() => {
    const missingItemIds = Array.from(new Set(
      recentMatches.flatMap((match) => Array.isArray(match.items) ? match.items : [])
    )).filter((itemId) => !resolvedItemTooltips[itemId]);

    if (missingItemIds.length === 0) {
      return;
    }

    let cancelled = false;

    const loadMissingItems = async () => {
      try {
        const resolvedEntries = await Promise.all(
          missingItemIds.map(async (itemId) => ({ itemId, entry: await resolveItemTooltipEntry(itemId) }))
        );

        if (cancelled) {
          return;
        }

        const nextEntries: Record<number, ItemCatalogEntry> = {};

        resolvedEntries.forEach(({ itemId, entry }) => {
          if (entry) {
            nextEntries[itemId] = entry;
          }
        });

        if (Object.keys(nextEntries).length > 0) {
          setResolvedItemTooltips((current) => ({ ...current, ...nextEntries }));
        }
      } catch {
        // ignore network/catalog fallback errors for tooltip enrichment
      }
    };

    loadMissingItems();

    return () => {
      cancelled = true;
    };
  }, [recentMatches, resolvedItemTooltips]);

  useEffect(() => {
    const handleExternalSearch = (event: Event) => {
      const customEvent = event as CustomEvent<{ summonerName?: string; targetRegion?: SearchRegion }>;
      const { summonerName, targetRegion } = customEvent.detail || {};

      if (!summonerName) {
        return;
      }

      setSearchQuery(summonerName);
      if (targetRegion) {
        setRegion(targetRegion);
      }

      window.setTimeout(() => {
        const form = document.querySelector('[data-profile-search-form="true"]') as HTMLFormElement | null;
        form?.requestSubmit();
      }, 60);
    };

    window.addEventListener('sensei-search-player', handleExternalSearch);
    return () => window.removeEventListener('sensei-search-player', handleExternalSearch);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }

    setLoading(true);
    setError('');
    setSummoner(null);
    setRankedStats(null);
    setRecentMatches([]);
    setChampionMasteries([]);
    setChampionPool([]);
    setProfileSummary(null);
    setHoveredItem(null);
    setResolvedRiotId('');

    const normalizedQuery = searchQuery.trim();

    if (!normalizedQuery.includes('#')) {
      setError('Введи Riot ID в формате Name#TAG, например oLiERo#SAKH.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetchSubscriptionServiceResponse(
        `/api/riot/profile-search?region=${encodeURIComponent(region)}&riotId=${encodeURIComponent(normalizedQuery)}`,
        {},
        8000
      );

      if (!response) {
        setError('Локальный backend недоступен. Проверь, что server запущен на 127.0.0.1:8787.');
        setLoading(false);
        return;
      }

      const payload = await response.json() as RiotProfileSearchResponse;

      if (!response.ok || !payload?.ok || !payload.summoner) {
        const upstreamStatus = payload?.diagnostics?.upstreamStatus;

        if (upstreamStatus === 401) {
          setError('Riot API вернул 401: backend отправил ключ, который Riot не смог авторизовать. Проверь актуальность RIOT_API_KEY в .env.');
        } else if (upstreamStatus === 403) {
          setError('Riot API вернул 403: ключ отклонён Riot как invalid или blocked. Проверь ключ в Riot Developer Portal.');
        } else if (upstreamStatus === 429) {
          setError('Riot API вернул 429: превышен лимит запросов. Подождите минуту и повторите.');
        } else if (response.status === 404) {
          setError('Игрок не найден.');
        } else {
          setError(payload?.error || 'Поиск временно недоступен. Проверь локальный backend и Riot API ключ на сервере.');
        }

        if (payload?.diagnostics?.upstreamStatus) {
          console.warn('Riot profile search diagnostics', payload.diagnostics);
        }

        setLoading(false);
        return;
      }

      setSummoner(payload.summoner);
      setRankedStats(payload.rankedStats || null);
      setRecentMatches(Array.isArray(payload.recentMatches) ? payload.recentMatches : []);
      setChampionMasteries(Array.isArray(payload.championMasteries) ? payload.championMasteries : []);
      setChampionPool(Array.isArray(payload.championPool) ? payload.championPool : []);
      setProfileSummary(payload.profileSummary || null);
      setResolvedRiotId(payload.riotId ? `${payload.riotId.gameName}#${payload.riotId.tagLine}` : normalizedQuery);
    } catch {
      setError('Ошибка сети. Попробуйте позже.');
    }

    setLoading(false);
  };

  const isDemoProfile = !summoner;
  const profile = summoner || reviewModeSummoner;
  const profileRank = rankedStats || (summoner ? unrankedStats : reviewModeRankedStats);
  const isUnrankedProfile = profileRank.tier === 'UNRANKED';
  const rankAccent = getTierAccent(profileRank.tier);
  const totalGames = profileRank.wins + profileRank.losses;
  const winRate = totalGames > 0 ? ((profileRank.wins / totalGames) * 100).toFixed(1) : '0.0';

  const topChampion = reviewModeChampionPool[0];

  return (
    <div style={{ padding: '10px', color: '#e0e6ed', minHeight: '100%' }}>
      <div style={{ display: 'grid', gap: '14px' }}>
        <div style={{ background: '#161d2a', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ color: '#f3efe7', margin: '0 0 6px 0', fontSize: '22px' }}>Профиль игрока</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>
                Поиск по Riot ID, обзор ранга и карточка профиля в одном месте. Пока профиль по умолчанию работает как демонстрационный сценарий.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {isDemoProfile && (
                <span style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.35)', color: '#fdba74', fontSize: '11px', fontWeight: 'bold' }}>
                  DEMO PROFILE
                </span>
              )}
              {reviewMode && (
                <span style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(0, 255, 204, 0.08)', border: '1px solid rgba(0, 255, 204, 0.3)', color: '#00ffcc', fontSize: '11px', fontWeight: 'bold' }}>
                  REVIEW MODE
                </span>
              )}
            </div>
          </div>

          <form data-profile-search-form="true" onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: '120px minmax(0, 1fr) 120px', gap: '10px', alignItems: 'center' }}>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as SearchRegion)}
              style={{ padding: '12px 14px', background: '#0f131a', border: '1px solid #273244', borderRadius: '10px', color: '#fff', fontSize: '14px' }}
            >
              <option value="ru">RU</option>
              <option value="euw">EUW</option>
              <option value="eune">EUNE</option>
              <option value="tr">TR</option>
              <option value="na">NA</option>
              <option value="br">BR</option>
              <option value="la1">LAN</option>
              <option value="la2">LAS</option>
              <option value="kr">KR</option>
              <option value="jp">JP</option>
            </select>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Игровое имя #RU1"
              style={{ width: '100%', padding: '12px 14px', background: '#0f131a', border: '1px solid #273244', borderRadius: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              style={{ padding: '12px 14px', background: loading ? '#334155' : '#00ffcc', color: '#0f131a', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: loading ? 'default' : 'pointer' }}
            >
              {loading ? 'Поиск...' : 'Найти'}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.32)', color: '#fca5a5', fontSize: '13px' }}>
              {error}
            </div>
          )}

          {!error && resolvedRiotId && (
            <div style={{ marginTop: '12px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(0, 255, 204, 0.06)', border: '1px solid rgba(0, 255, 204, 0.16)', color: '#b6f7e8', fontSize: '13px' }}>
              Профиль найден по Riot ID: <strong>{resolvedRiotId}</strong>
            </div>
          )}
        </div>

        <div style={{ background: 'linear-gradient(180deg, rgba(22, 29, 42, 0.96), rgba(15, 19, 26, 0.98))', border: '1px solid #1f2937', borderRadius: '16px', padding: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', minWidth: 0 }}>
              <img
                src={getProfileIconUrl(profile.profileIconId)}
                alt={profile.name}
                style={{ width: '88px', height: '88px', borderRadius: '20px', border: '2px solid rgba(255, 255, 255, 0.08)', flexShrink: 0 }}
              />
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '30px', lineHeight: 1.1 }}>{profile.name}</h3>
                  <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', color: '#9ca3af', fontSize: '11px', fontWeight: 'bold' }}>
                    {region.toUpperCase()}
                  </span>
                  {!isDemoProfile && resolvedRiotId && (
                    <span style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(0,255,204,0.08)', color: '#9fead9', fontSize: '11px', fontWeight: 'bold' }}>
                      {resolvedRiotId}
                    </span>
                  )}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '13px' }}>Уровень {profile.summonerLevel}</div>
              </div>
            </div>

            <div style={{ minWidth: '220px', padding: '14px 16px', borderRadius: '14px', background: 'rgba(15, 19, 26, 0.75)', border: '1px solid #1f2937' }}>
              <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>ОБЩИЙ СИГНАЛ</div>
              <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '16px', marginBottom: '6px' }}>
                {isDemoProfile ? 'Демо-профиль для визуального сценария' : 'Базовый профиль загружен из Riot API'}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.55 }}>
                {isDemoProfile
                  ? 'Расширенные блоки ниже построены на демо-данных, чтобы заранее показать будущий формат профиля в стиле Sensei GG.'
                  : 'Сейчас реальный поиск даёт карточку профиля, Solo Queue ранг и последние матчи по Riot API через локальный backend.'}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isDemoProfile ? '360px minmax(0, 1fr) 300px' : '360px minmax(0, 1fr)', gap: '14px', alignItems: 'start' }}>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
                <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>СЕЗОННЫЙ РАНГ</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                  <div style={{ width: isUnrankedProfile ? '96px' : '84px', height: isUnrankedProfile ? '72px' : '84px', borderRadius: '18px', background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 19, 26, 0.98))', border: `1px solid ${rankAccent}`, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isUnrankedProfile ? '6px 4px' : '10px', boxSizing: 'border-box', boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 24px ${rankAccent}22`, overflow: 'hidden' }}>
                    <img
                      src={getRankIconUrl(profileRank.tier as RankTier)}
                      alt={`${profileRank.tier} crest`}
                      style={{ width: isUnrankedProfile ? '120%' : '100%', height: isUnrankedProfile ? '120%' : '100%', objectFit: 'contain', transform: isUnrankedProfile ? 'translateY(2px)' : 'none' }}
                    />
                  </div>
                  <div>
                    <div style={{ color: rankAccent, fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
                      {isUnrankedProfile ? 'UNRANKED' : `${profileRank.tier} ${profileRank.rank}`.trim()}
                    </div>
                    <div style={{ color: '#fff', fontSize: '28px', fontWeight: 'bold', marginBottom: '2px' }}>
                      {isUnrankedProfile ? 'Нет ранга' : `${profileRank.leaguePoints} LP`}
                    </div>
                    <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                      {isUnrankedProfile ? 'Solo Queue ещё не калиброван' : `${profileRank.wins} побед · ${profileRank.losses} поражений`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                    <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '18px' }}>{winRate}%</div>
                    <div style={{ color: '#9ca3af', fontSize: '11px' }}>Win Rate</div>
                  </div>
                  <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.18)' }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '18px' }}>{totalGames}</div>
                    <div style={{ color: '#9ca3af', fontSize: '11px' }}>Ранговых игр</div>
                  </div>
                </div>
              </div>

              <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
                <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '12px', letterSpacing: '0.06em' }}>
                  {isDemoProfile ? 'ПУЛ ЧЕМПИОНОВ' : 'CHAMPION POOL'}
                </div>
                {isDemoProfile ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {reviewModeChampionPool.map((champion) => (
                      <div key={champion.champion} style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr) 80px', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <img src={getChampionIconUrl(champion.champion)} alt={champion.champion} style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{champion.champion}</div>
                            <div style={{ color: '#9ca3af', fontSize: '11px' }}>{champion.games} игр</div>
                          </div>
                          <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ width: `${champion.winRate}%`, height: '100%', background: 'linear-gradient(90deg, #00ffcc, #34d399)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#9ca3af', fontSize: '11px' }}>
                            <span>{champion.kda}</span>
                            <span>{champion.csPerMinute.toFixed(1)} CS/м</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: champion.winRate >= 55 ? '#10b981' : '#d1d5db', fontWeight: 'bold', fontSize: '15px' }}>{champion.winRate}%</div>
                          <div style={{ color: '#6b7280', fontSize: '10px' }}>WR</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : championPool.length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {championPool.map((champion) => (
                      <div key={champion.champion} style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr) auto', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <img src={getChampionIconUrl(champion.champion)} alt={champion.champion} onError={(e) => {
                          (e.target as HTMLImageElement).src = getChampionIconUrl('Aatrox');
                        }} style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '6px' }}>
                            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{champion.champion}</div>
                            <div style={{ color: '#9ca3af', fontSize: '11px' }}>{champion.games} игр</div>
                          </div>
                          <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ width: `${champion.winRate}%`, height: '100%', background: 'linear-gradient(90deg, #00ffcc, #34d399)' }} />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', color: '#9ca3af', fontSize: '11px', flexWrap: 'wrap' }}>
                            <span>{champion.kda}</span>
                            <span>{champion.csPerMinute.toFixed(1)} CS/м</span>
                            <span>{champion.averageGoldLabel}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ color: champion.winRate >= 55 ? '#10b981' : '#d1d5db', fontWeight: 'bold', fontSize: '15px' }}>{champion.winRate}%</div>
                          <div style={{ color: '#6b7280', fontSize: '10px' }}>WR</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.6 }}>
                    Riot API не вернул champion pool для этого профиля. Карточка профиля и ranked-статистика при этом загружены корректно.
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
              <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '12px', letterSpacing: '0.06em' }}>ПОСЛЕДНИЕ МАТЧИ</div>
              {isDemoProfile ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {reviewModeRecentMatches.map((match) => {
                    const demoSpells = getDefaultSummonerSpells(undefined, match.champion);
                    const demoRunes = getDefaultRuneLoadout(undefined, match.champion);

                    return (
                      <div key={`${match.champion}-${match.duration}`} style={{ display: 'grid', gridTemplateColumns: '44px auto minmax(0, 1fr) auto', gap: '10px', alignItems: 'center', padding: '10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <img src={getChampionIconUrl(match.champion)} alt={match.champion} style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
                        <PlayerLoadoutIcons spells={demoSpells} runes={demoRunes} size={18} compact />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{match.champion}</div>
                          <div style={{ color: '#9ca3af', fontSize: '11px' }}>{match.kda} · {match.cs} CS · {match.duration}</div>
                        </div>
                        <div style={{ color: match.result === 'Победа' ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>{match.result}</div>
                      </div>
                    );
                  })}
                </div>
              ) : recentMatches.length > 0 ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {recentMatches.map((match, index) => (
                    <div key={match.matchId || `${match.champion}-${index}`} style={{ display: 'grid', gap: '10px', padding: '12px', borderRadius: '14px', background: 'linear-gradient(180deg, rgba(20, 27, 42, 0.96), rgba(13, 18, 31, 0.98))', border: '1px solid rgba(96, 165, 250, 0.14)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)', position: 'relative', overflow: 'visible' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '52px auto minmax(0, 1fr) auto', gap: '12px', alignItems: 'center' }}>
                        <img src={getChampionIconUrl(match.champion)} alt={match.champion} onError={(e) => {
                          (e.target as HTMLImageElement).src = getChampionIconUrl('Aatrox');
                        }} style={{ width: '52px', height: '52px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }} />
                        <PlayerLoadoutIcons
                          spells={match.summonerSpells?.length === 2 ? match.summonerSpells : getDefaultSummonerSpells(undefined, match.champion)}
                          runes={match.runes ?? getDefaultRuneLoadout(undefined, match.champion)}
                          size={20}
                          compact
                        />
                        <div style={{ minWidth: 0, display: 'grid', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ color: getResultAccent(match.result), fontWeight: 'bold', fontSize: '24px', lineHeight: 1 }}>{match.result}</span>
                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>{getQueueLabel(match.queueId)}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                            <span style={{ color: getKdaAccent(match), fontWeight: 'bold', fontSize: '28px', lineHeight: 1 }}>{match.kda}</span>
                            <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{match.cs} CS</span>
                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{match.goldLabel || '0 G'}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', color: '#8ea0c0', fontSize: '12px' }}>
                            <span>{match.duration}</span>
                            <span>·</span>
                            <span>{match.champion}</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '230px' }}>
                          {Array.isArray(match.items) && match.items.length > 0 ? match.items.map((itemId) => (
                            <img key={`${match.matchId || match.champion}-item-${itemId}`} src={getItemIconUrl(itemId)} alt={`item-${itemId}`} onMouseEnter={() => {
                              setHoveredItem({ itemId, anchorIndex: index });
                              if (!resolvedItemTooltips[itemId]) {
                                resolveItemTooltipEntry(itemId).then((entry) => {
                                  if (entry) {
                                    setResolvedItemTooltips((current) => current[itemId] ? current : { ...current, [itemId]: entry });
                                  }
                                }).catch(() => {
                                  // ignore tooltip enrichment failures on hover
                                });
                              }
                            }} onMouseLeave={() => setHoveredItem((current) => current?.itemId === itemId && current.anchorIndex === index ? null : current)} onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }} style={{ width: '30px', height: '30px', borderRadius: '9px', border: '1px solid rgba(148,163,184,0.18)', background: 'linear-gradient(180deg, rgba(15,19,26,0.96), rgba(12,16,24,0.98))', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)', cursor: 'help' }} />
                          )) : null}
                        </div>
                      </div>
                      {hoveredItemDetails && hoveredItem?.anchorIndex === index && (
                        <ItemTooltip
                          item={hoveredItemDetails}
                          fallbackDescription="Для этого предмета в локальном каталоге пока нет детального описания."
                          positionStyle={{
                            right: '12px',
                            bottom: 'calc(100% + 10px)'
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.6 }}>
                  Riot API не вернул последние матчи для этого профиля. Карточка профиля и ranked-статистика при этом загружены корректно.
                </div>
              )}
            </div>

            <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
              <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>ОБЗОР ПРОФИЛЯ</div>
              {!isDemoProfile && profileSummary ? (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ color: '#10b981', fontWeight: 'bold', fontSize: '17px' }}>{profileSummary.winRate}%</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>{profileSummary.wins}-{profileSummary.losses} за {profileSummary.games} матчей</div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(96, 165, 250, 0.08)', border: '1px solid rgba(96, 165, 250, 0.18)' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '17px' }}>{profileSummary.averageKda}</div>
                      <div style={{ color: '#9ca3af', fontSize: '11px' }}>Средний KDA</div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#d1d5db', fontSize: '12px' }}>Средний фарм</span>
                      <span style={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}>{profileSummary.averageCs} CS · {profileSummary.csPerMinute.toFixed(1)} CS/м</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ color: '#d1d5db', fontSize: '12px' }}>Среднее золото</span>
                      <span style={{ color: '#f8fafc', fontSize: '12px', fontWeight: 'bold' }}>{profileSummary.averageGoldLabel}</span>
                    </div>
                  </div>
                </div>
              ) : isDemoProfile ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Сильная сторона</div>
                    <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.55 }}>
                      {topChampion.champion} выглядит как главный комфортный пик: хороший фарм, устойчивый урон и высокий винрейт на дистанции.
                    </div>
                  </div>
                  <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Следующий шаг</div>
                    <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.55 }}>
                      После привязки реального профиля этот блок будет строиться не на демо-данных, а на персональной истории матчей и post-game сигналах Sensei GG.
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.6 }}>
                  Для этого профиля обзор по матчам пока недоступен.
                </div>
              )}
            </div>

            {!isDemoProfile && championMasteries.length > 0 && (
              <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
                <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '12px', letterSpacing: '0.06em' }}>CHAMPION MASTERY</div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {championMasteries.map((mastery) => (
                    <div key={`${mastery.championId}-${mastery.champion}`} style={{ display: 'grid', gridTemplateColumns: '48px minmax(0, 1fr) auto', gap: '12px', alignItems: 'center', padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <img src={getChampionIconUrl(mastery.champion)} alt={mastery.champion} onError={(e) => {
                        (e.target as HTMLImageElement).src = getChampionIconUrl('Aatrox');
                      }} style={{ width: '48px', height: '48px', borderRadius: '10px' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{mastery.champion}</div>
                        <div style={{ color: '#9ca3af', fontSize: '11px' }}>Мастерство {mastery.championLevel} · {mastery.championPoints.toLocaleString('en-US')} pts</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ color: '#00ffcc', fontWeight: 'bold', fontSize: '15px' }}>Lv {mastery.championLevel}</div>
                        <div style={{ color: '#6b7280', fontSize: '10px' }}>Mastery</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isDemoProfile && (
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>РОЛИ И ТЕМП</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {reviewModeRoleStats.map((role) => (
                      <div key={role.role}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '5px' }}>
                          <span style={{ color: '#d1d5db', fontSize: '12px', fontWeight: 'bold' }}>{role.role}</span>
                          <span style={{ color: '#9ca3af', fontSize: '11px' }}>{role.games} игр · {role.winRate}%</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                          <div style={{ width: `${role.winRate}%`, height: '100%', background: role.winRate >= 50 ? 'linear-gradient(90deg, #10b981, #00ffcc)' : 'linear-gradient(90deg, #ef4444, #f97316)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>КРАТКИЙ ПРОФИЛЬ</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Сильная сторона</div>
                      <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.55 }}>
                        {topChampion.champion} выглядит как главный комфортный пик: хороший фарм, устойчивый урон и высокий винрейт на дистанции.
                      </div>
                    </div>
                    <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>Следующий шаг</div>
                      <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.55 }}>
                        После привязки реального профиля этот блок будет строиться не на демо-данных, а на персональной истории матчей и post-game сигналах Sensei GG.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
