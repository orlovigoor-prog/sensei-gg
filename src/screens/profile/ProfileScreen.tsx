import { useEffect, useMemo, useState } from 'react';
import type { RankedStats, Summoner } from '../../services/riotApi';
import { getRankIconUrl, type RankTier } from '../../services/rankAssets';

type SearchRegion = 'ru' | 'euw' | 'eune' | 'tr' | 'na' | 'br' | 'la1' | 'la2' | 'kr' | 'jp';

interface ProfileScreenProps {
  reviewMode?: boolean;
}

interface DemoChampionStat {
  champion: string;
  games: number;
  winRate: number;
  kda: string;
  csPerMinute: number;
}

interface DemoRoleStat {
  role: string;
  games: number;
  winRate: number;
}

interface DemoRecentMatch {
  champion: string;
  result: 'Победа' | 'Поражение';
  kda: string;
  cs: number;
  duration: string;
}

const regionApiMap: Record<SearchRegion, string> = {
  ru: 'americas',
  na: 'americas',
  br: 'americas',
  la1: 'americas',
  la2: 'americas',
  euw: 'europe',
  eune: 'europe',
  tr: 'europe',
  kr: 'asia',
  jp: 'asia'
};

const demoSummoner: Summoner = {
  id: 'demo-summoner-id',
  accountId: 'demo-account-id',
  puuid: 'demo-puuid',
  name: 'DemoProfilePlayer',
  profileIconId: 4568,
  revisionDate: Date.now(),
  summonerLevel: 398
};

const demoRankedStats: RankedStats = {
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

const demoChampionPool: DemoChampionStat[] = [
  { champion: 'Jinx', games: 44, winRate: 61.4, kda: '6.9 / 3.1 / 7.8', csPerMinute: 7.8 },
  { champion: "Kai'Sa", games: 28, winRate: 57.1, kda: '7.1 / 3.8 / 6.9', csPerMinute: 7.3 },
  { champion: 'Xayah', games: 19, winRate: 52.6, kda: '5.8 / 3.4 / 8.2', csPerMinute: 7.0 },
  { champion: 'Ezreal', games: 16, winRate: 50.0, kda: '4.9 / 3.0 / 7.1', csPerMinute: 6.9 },
  { champion: 'Ashe', games: 12, winRate: 58.3, kda: '4.4 / 3.7 / 10.1', csPerMinute: 6.6 }
];

const demoRoleStats: DemoRoleStat[] = [
  { role: 'ADC', games: 104, winRate: 58.7 },
  { role: 'SUPPORT', games: 21, winRate: 52.3 },
  { role: 'MID', games: 11, winRate: 45.4 },
  { role: 'TOP', games: 6, winRate: 50.0 }
];

const demoRecentMatches: DemoRecentMatch[] = [
  { champion: 'Jinx', result: 'Победа', kda: '12 / 3 / 8', cs: 214, duration: '29:12' },
  { champion: "Kai'Sa", result: 'Победа', kda: '9 / 2 / 6', cs: 201, duration: '27:05' },
  { champion: 'Jinx', result: 'Поражение', kda: '4 / 6 / 5', cs: 186, duration: '31:44' }
];

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

const championAssetMap: Record<string, string> = {
  "Kai'Sa": 'Kaisa',
  KaiSa: 'Kaisa'
};

const getProfileIconUrl = (profileIconId: number) => `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${profileIconId}.png`;
const getChampionIconUrl = (champion: string) => {
  const assetName = championAssetMap[champion] || champion.replace(/[^A-Za-z0-9]/g, '');
  return `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${assetName}.png`;
};

export function ProfileScreen({ reviewMode = false }: ProfileScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState<SearchRegion>('ru');
  const [loading, setLoading] = useState(false);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [error, setError] = useState('');

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

    const apiKey = import.meta.env.VITE_RIOT_API_KEY as string | undefined;
    if (!apiKey) {
      setError('Поиск временно недоступен: Riot API ключ не настроен на стороне приложения.');
      setLoading(false);
      return;
    }

    try {
      const apiRegion = regionApiMap[region] || 'americas';
      const response = await fetch(
        `https://${apiRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'X-Riot-Token': apiKey
          }
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          setError('Riot API временно недоступен или не настроен корректно.');
        } else if (response.status === 404) {
          setError('Игрок не найден.');
        } else if (response.status === 429) {
          setError('Превышен лимит запросов. Подождите минуту.');
        } else {
          setError(`Ошибка ${response.status}. Поиск не удалось завершить.`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setSummoner(data);

      const rankedResponse = await fetch(
        `https://${apiRegion}.api.riotgames.com/lol/league/v4/entries/by-puuid/${data.puuid}`,
        {
          headers: {
            'X-Riot-Token': apiKey
          }
        }
      );

      if (rankedResponse.ok) {
        const rankedData = await rankedResponse.json();
        const soloRank = rankedData.find((item: RankedStats) => item.queueType === 'RANKED_SOLO_5x5');
        setRankedStats(soloRank || null);
      }
    } catch {
      setError('Ошибка сети. Попробуйте позже.');
    }

    setLoading(false);
  };

  const isDemoProfile = !summoner;
  const profile = summoner || demoSummoner;
  const profileRank = rankedStats || (summoner ? unrankedStats : demoRankedStats);
  const isUnrankedProfile = profileRank.tier === 'UNRANKED';
  const rankAccent = getTierAccent(profileRank.tier);
  const totalGames = profileRank.wins + profileRank.losses;
  const winRate = totalGames > 0 ? ((profileRank.wins / totalGames) * 100).toFixed(1) : '0.0';

  const topChampion = useMemo(() => demoChampionPool[0], []);

  return (
    <div style={{ padding: '10px', color: '#e0e6ed', height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'grid', gap: '14px' }}>
        <div style={{ background: '#161d2a', border: '1px solid #1f2937', borderRadius: '14px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ color: '#f3efe7', margin: '0 0 6px 0', fontSize: '22px' }}>Профиль игрока</h2>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>
                Поиск, обзор ранга и карточка профиля в одном месте. Пока профиль по умолчанию работает как демонстрационный сценарий.
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

          <form data-profile-search-form="true" onSubmit={handleSearch} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px 120px', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти игрока по никнейму..."
              style={{ width: '100%', padding: '12px 14px', background: '#0f131a', border: '1px solid #273244', borderRadius: '10px', color: '#fff', fontSize: '14px', boxSizing: 'border-box' }}
            />
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
                  : 'Сейчас реальный поиск даёт базовую карточку профиля и ранга. Более глубокая аналитика будет добавлена после production API key и привязки профиля пользователя.'}
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
                <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>ПОСЛЕДНИЕ МАТЧИ</div>
                {isDemoProfile ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {demoRecentMatches.map((match) => (
                      <div key={`${match.champion}-${match.duration}`} style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) auto', gap: '10px', alignItems: 'center', padding: '10px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <img src={getChampionIconUrl(match.champion)} alt={match.champion} style={{ width: '44px', height: '44px', borderRadius: '10px' }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{match.champion}</div>
                          <div style={{ color: '#9ca3af', fontSize: '11px' }}>{match.kda} · {match.cs} CS · {match.duration}</div>
                        </div>
                        <div style={{ color: match.result === 'Победа' ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>{match.result}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.6 }}>
                    Для найденного профиля сейчас доступны только базовые данные Riot API: ник, уровень и ranked-статистика. История матчей и пул чемпионов появятся позже.
                  </div>
                )}
              </div>
            </div>

            <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
              <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '12px', letterSpacing: '0.06em' }}>
                {isDemoProfile ? 'ПУЛ ЧЕМПИОНОВ' : 'ОБЗОР ПРОФИЛЯ'}
              </div>
              {isDemoProfile ? (
                <div style={{ display: 'grid', gap: '10px' }}>
                  {demoChampionPool.map((champion) => (
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
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0, 255, 204, 0.06)', border: '1px solid rgba(0, 255, 204, 0.16)' }}>
                    <div style={{ color: '#00ffcc', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>СЕЙЧАС ДОСТУПНО</div>
                    <div style={{ color: '#d1d5db', fontSize: '13px', lineHeight: 1.55 }}>Базовая карточка профиля, уровень и Solo Queue ранг по Riot API.</div>
                  </div>
                  <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ color: '#f3f4f6', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>После production API key</div>
                    <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.6 }}>
                      Здесь появятся расширенные breakdown-блоки: пул чемпионов, история матчей, role stats и персональные сигналы прогресса.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isDemoProfile && (
              <div style={{ display: 'grid', gap: '14px' }}>
                <div style={{ background: '#0f131a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
                  <div style={{ color: '#6b7280', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>РОЛИ И ТЕМП</div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {demoRoleStats.map((role) => (
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
