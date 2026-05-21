import { useState, useEffect } from 'react';
import type { Summoner, RankedStats } from '../../services/riotApi';

export function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [region, setRegion] = useState<'ru' | 'euw' | 'eune' | 'tr' | 'na' | 'br' | 'la1' | 'la2' | 'kr' | 'jp'>('ru');
  const [loading, setLoading] = useState(false);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [error, setError] = useState('');
  const [autoSearch, setAutoSearch] = useState<string | null>(null);

  // Авто-поиск при передаче summonerName
  useEffect(() => {
    if (autoSearch && autoSearch.trim()) {
      setSearchQuery(autoSearch);
      // Имитируем отправку формы
      setTimeout(() => {
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true }));
        }
      }, 300);
      setAutoSearch(null);
    }
  }, [autoSearch]);

  // Обработка внешнего запроса на поиск
  useEffect(() => {
    const handleExternalSearch = (event: CustomEvent) => {
      const { summonerName, targetRegion } = event.detail;
      if (summonerName) {
        setSearchQuery(summonerName);
        if (targetRegion) {
          setRegion(targetRegion);
        }
        // Триггерим поиск
        setTimeout(() => {
          const form = document.querySelector('form') as HTMLFormElement;
          if (form) {
            form.dispatchEvent(new Event('submit', { cancelable: true }));
          }
        }, 100);
      }
    };

    window.addEventListener('sensei-search-player' as any, handleExternalSearch as any);
    return () => window.removeEventListener('sensei-search-player' as any, handleExternalSearch as any);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

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

    console.log('Using configured Riot API key');

    try {
      console.log('Search region:', region, 'Query:', searchQuery);
      
      // Для Americas ключа (RGAPI-c0812ae6...) нужно использовать правильный регион
      const regionApiMap: Record<string, string> = {
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
      
      const apiRegion = regionApiMap[region] || 'americas';
      console.log('Using API region:', apiRegion);
      
      // Riot API требует заголовок X-Riot-Token вместо api_key в URL
      const response = await fetch(
        `https://${apiRegion}.api.riotgames.com/lol/summoner/v4/summoners/by-name/${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'X-Riot-Token': apiKey
          }
        }
      );

      console.log('Response status:', response.status);

      if (!response.ok) {
        if (response.status === 403) {
          setError('Riot API временно недоступен или не настроен корректно.');
        } else if (response.status === 404) {
          setError('Игрок не найден');
        } else if (response.status === 429) {
          setError('Превышен лимит запросов. Подождите минуту');
        } else {
          const errorText = await response.text();
          setError(`Ошибка ${response.status}: ${errorText}`);
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      console.log('Summoner data:', data);
      setSummoner(data);

      // Получаем ранк через тот же регион
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
        console.log('Ranked data:', rankedData);
        const soloRank = rankedData.find((r: RankedStats) => r.queueType === 'RANKED_SOLO_5x5');
        setRankedStats(soloRank || null);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Ошибка сети. Попробуйте позже');
    }

    setLoading(false);
  };

  const getTierIcon = (tier: string) => {
    const icons: Record<string, string> = {
      IRON: '⬛',
      BRONZE: '🥉',
      SILVER: '🥈',
      GOLD: '🥇',
      PLATINUM: '💎',
      EMERALD: '🟢',
      DIAMOND: '💠',
      MASTER: '👑',
      GRANDMASTER: '🔥',
      CHALLENGER: '⭐'
    };
    return icons[tier] || '❓';
  };

  return (
    <div style={{ padding: '15px', color: '#e0e6ed', height: '100%', overflow: 'auto' }}>
      <h2 style={{ color: '#00ffcc', marginBottom: '20px', fontSize: '20px', marginBlockStart: '0' }}>
        🔍 Поиск игроков
      </h2>

      {/* Форма поиска */}
      <form onSubmit={handleSearch} style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Никнейм игрока..."
            style={{
              width: '100%',
              padding: '10px 12px',
              background: '#161d2a',
              border: '1px solid #1f2937',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as any)}
          style={{
            padding: '10px 12px',
            background: '#161d2a',
            border: '1px solid #1f2937',
            borderRadius: '6px',
            color: '#fff',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '100px'
          }}
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
          style={{
            padding: '10px 20px',
            background: loading ? '#6b7280' : '#00ffcc',
            color: '#0f131a',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            minWidth: '80px'
          }}
        >
          {loading ? '...' : 'Найти'}
        </button>
      </form>

      {/* Ошибка */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.2)',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '15px',
          color: '#ef4444',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', whiteSpace: 'pre-line' }}>{error}</div>
        </div>
      )}

      {/* Результаты */}
      {summoner && (
        <div style={{
          background: '#161d2a',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            {/* Аватар */}
            <div style={{ textAlign: 'center' }}>
              <img
                src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/profileicon/${summoner.profileIconId}.png`}
                alt={summoner.name}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '4px solid #00ffcc',
                  marginBottom: '10px'
                }}
              />
              <div style={{ color: '#9ca3af', fontSize: '12px' }}>
                Lvl. {summoner.summonerLevel}
              </div>
            </div>

            {/* Информация */}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '28px' }}>
                {summoner.name}
              </h3>
              
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <span style={{
                  background: 'rgba(31, 41, 55, 0.8)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: '#9ca3af'
                }}>
                  {region.toUpperCase()}
                </span>
              </div>

              {/* Ранк */}
              {rankedStats ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(0, 255, 204, 0.1), rgba(0, 255, 204, 0.05))',
                  border: '1px solid #00ffcc',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '15px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <div style={{ fontSize: '48px' }}>
                      {getTierIcon(rankedStats.tier)}
                    </div>
                    <div>
                      <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>
                        {rankedStats.tier} {rankedStats.rank}
                      </div>
                      <div style={{ color: '#00ffcc', fontSize: '18px', fontWeight: 'bold' }}>
                        {rankedStats.leaguePoints} LP
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div style={{ background: 'rgba(31, 41, 55, 0.5)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>
                        {rankedStats.wins}W
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '12px' }}>Победы</div>
                    </div>
                    <div style={{ background: 'rgba(31, 41, 55, 0.5)', padding: '12px', borderRadius: '8px' }}>
                      <div style={{ color: '#ef4444', fontSize: '24px', fontWeight: 'bold' }}>
                        {rankedStats.losses}L
                      </div>
                      <div style={{ color: '#9ca3af', fontSize: '12px' }}>Поражения</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <div style={{
                      display: 'inline-block',
                      padding: '8px 20px',
                      background: rankedStats.wins / (rankedStats.wins + rankedStats.losses) > 0.5 
                        ? 'rgba(16, 185, 129, 0.2)' 
                        : 'rgba(239, 68, 68, 0.2)',
                      borderRadius: '20px',
                      color: rankedStats.wins / (rankedStats.wins + rankedStats.losses) > 0.5 ? '#10b981' : '#ef4444',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      WinRate: {((rankedStats.wins / (rankedStats.wins + rankedStats.losses)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'rgba(31, 41, 55, 0.5)',
                  padding: '20px',
                  borderRadius: '12px',
                  textAlign: 'center',
                  color: '#9ca3af'
                }}>
                  Нет данных о ранке
                </div>
              )}

              {/* Бейджи */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {rankedStats?.hotStreak && (
                  <span style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    🔥 Hot Streak
                  </span>
                )}
                {rankedStats?.veteran && (
                  <span style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    color: '#a855f7',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Veteran
                  </span>
                )}
                {rankedStats?.freshBlood && (
                  <span style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    Fresh Blood
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Быстрые поиска */}
      {!summoner && !loading && (
        <div style={{
          background: '#161d2a',
          border: '1px solid #1f2937',
          borderRadius: '12px',
          padding: '25px',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, color: '#9ca3af', fontSize: '14px' }}>
            💡 Выберите регион и введите никнейм игрока для поиска статистики
          </p>
          <p style={{ margin: '10px 0 0 0', color: '#6b7280', fontSize: '12px' }}>
            Rate Limit: 20 запросов/сек | 100 запросов/2 мин
          </p>
        </div>
      )}
    </div>
  );
}
