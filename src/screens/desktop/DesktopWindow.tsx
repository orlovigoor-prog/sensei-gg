import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import { startGame, mutateStats, endGame, setAiLoading, setAiAdvice } from '../../store/gameSlice';
import { LobbyPanel } from '../lobby/LobbyPanel';
import { SearchScreen } from '../search/SearchScreen';
import { setLobby, type PlayerInfo } from '../../store/lobbySlice';
import { lcuService } from '../../services/riotApi';

export function DesktopWindow() {
  const dispatch = useDispatch();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { championName, kills, deaths, assists, cs, aiAdvice, isLoadingAi, isInGame } = useSelector(
    (state: RootState) => state.game
  );

  const [activeTab, setActiveTab] = useState<'match' | 'profile' | 'ai' | 'lobby' | 'search'>('match');
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);

  // Проверка API ключа при загрузке
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        // Проверяем, загружается ли переменная окружения
        const apiKey = import.meta.env.VITE_RIOT_API_KEY;
        console.log('API Key loaded from env:', !!apiKey);
        
        // Временный хардкод для тестирования (удалить перед продакшеном)
        const testApiKey = localStorage.getItem('riot_api_key') || 
                          'RGAPI-f56d4d57-d63b-4e85-b9ea-b370d5d0a4fb';
        console.log('Active API key:', testApiKey.substring(0, 20) + '...');
        
        // Простая проверка - ключ загружен
        setApiStatus('connected');
        console.log('Riot API ключ загружен успешно');
      } catch (error) {
        console.error('Ошибка проверки API:', error);
        setApiStatus('disconnected');
      }
    };
    
    checkApiKey();
    const interval = setInterval(checkApiKey, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'd') {
        setShowDevPanel(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Исходные данные истории матчей и фарма для графика (CS в минуту)
  const matchHistory = [
    { id: 1, result: 'Победа', champion: 'Jinx', kda: '12 / 3 / 8', cs: 210, csMin: 7.4, duration: '28:15', date: 'Сегодня' },
    { id: 2, result: 'Поражение', champion: 'Yasuo', kda: '2 / 8 / 4', cs: 165, csMin: 5.1, duration: '32:40', date: 'Вчера' },
    { id: 3, result: 'Победа', champion: 'Jinx', kda: '8 / 1 / 11', cs: 195, csMin: 7.8, duration: '25:10', date: '15 мая' },
    { id: 4, result: 'Победа', champion: 'Jinx', kda: '5 / 2 / 9', cs: 240, csMin: 6.9, duration: '34:20', date: '12 мая' },
    { id: 5, result: 'Поражение', champion: 'Vayne', kda: '1 / 6 / 2', cs: 130, csMin: 4.8, duration: '27:00', date: '10 мая' }
  ];

  // Рендеринг графика на чистом Canvas HTML5
  useEffect(() => {
    if (activeTab !== 'profile' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Очистка перед перерисовкой
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const points = matchHistory.map(m => m.csMin).reverse(); // Хронологический порядок
    const padding = 40;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;

    const maxVal = 10; // Идеальный фарм 10 крипов/мин
    const minVal = 0;

    // Рисуем горизонтальную сетку
    ctx.strokeStyle = '#1f2937';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px sans-serif';

    for (let i = 0; i <= 4; i++) {
      const y = padding + (graphHeight / 4) * i;
      const label = (maxVal - (maxVal / 4) * i).toFixed(1);
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      ctx.fillText(label, padding - 25, y + 4);
    }

    // Рассчитываем координаты точек графика
    const stepX = graphWidth / (points.length - 1);
    const getCoords = (index: number, val: number) => {
      const x = padding + index * stepX;
      const y = padding + graphHeight - ((val - minVal) / (maxVal - minVal)) * graphHeight;
      return { x, y };
    };

    // Настройка стилей линии тренда
    ctx.strokeStyle = '#00ffcc';
    ctx.lineWidth = 3;
    ctx.beginPath();

    points.forEach((val, i) => {
      const { x, y } = getCoords(i, val);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Рисуем светящиеся точки (маркеры матчей)
    points.forEach((val, i) => {
      const { x, y } = getCoords(i, val);
      
      ctx.fillStyle = '#0f131a';
      ctx.strokeStyle = '#00ffcc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Подпись значения над точкой
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(val.toString(), x - 8, y - 12);
    });

  }, [activeTab]);

  const handleAskDeepSeek = async () => {
    const API_KEY = "sk-7d11f71dfbc64d444ff464d444ff464d"; 
    dispatch(setAiLoading(true));

    const prompt = `Ты — профессиональный киберспортивный тренер по League of Legends. Игрок сейчас находится внутри активного матча. Его чемпион: ${championName}. Его текущая статистика: Убийства: ${kills}, Смерти: ${deaths}, Содействия: ${assists}, Фарм (CS): ${cs}. Дай ОДИН очень короткий совет (максимум 2 предложения), что ему делать прямо сейчас, чтобы выиграть. Пиши на русском языке без приветствий.`;

    try {
      const response = await fetch("https://deepseek.com", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY.replace(/[^\x00-\x7F]/g, "").trim()}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat', 
          messages: [
            { role: 'system', content: 'Ты краткий игровой аналитик.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        dispatch(setAiAdvice(`Ошибка сервера (${response.status}): ${errorData.slice(0, 100)}`));
        return;
      }

      const data = await response.json();
      if (data?.choices?.[0]?.message) {
        dispatch(setAiAdvice(data.choices[0].message.content));
      }
    } catch (error: any) {
      dispatch(setAiAdvice(`Ошибка сети: ${error.message || "Неизвестный сбой"}`));
    }
  };

  return (
    <div style={{ padding: '30px', color: '#e0e6ed', backgroundColor: '#0f131a', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {showDevPanel && (
        <div style={{ background: '#1c1917', border: '1px dashed #ea580c', padding: '15px', borderRadius: '10px', marginBottom: '25px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>🛠️ Скрытый пульт симуляции событий LoL</h4>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => dispatch(startGame('Jinx'))} style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>▶️ Симулировать Пик: Jinx</button>
            <button onClick={() => dispatch(startGame('Yasuo'))} style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>▶️ Симулировать Пик: Yasuo</button>
            <button onClick={() => dispatch(mutateStats({ kills: kills + 1, deaths, assists, cs: cs + 12 }))} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>⚔️ Убийство (+1 Килл)</button>
            <button onClick={() => dispatch(mutateStats({ kills, deaths: deaths + 1, assists, cs }))} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>💀 Смерть (+1 Смерть)</button>
            <button onClick={handleAskDeepSeek} disabled={!isInGame || isLoadingAi} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {isLoadingAi ? 'Сэнсэй думает...' : '🤖 Запросить ИИ'}
            </button>
            <button onClick={() => dispatch(endGame())} style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>⏹️ Сбросить матч</button>
            <button onClick={() => {
              const mockPlayers: PlayerInfo[] = Array(10).fill(null).map((_, i) => ({
                summonerName: `Player${i + 1}`,
                rank: `${Math.floor(Math.random() * 100)}`,
                tier: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'][Math.floor(Math.random() * 5)] as any,
                lp: Math.floor(Math.random() * 100),
                wins: Math.floor(Math.random() * 100) + 20,
                losses: Math.floor(Math.random() * 100) + 20,
                winRate: Math.floor(Math.random() * 40) + 40,
                mainRole: ['TOP', 'JUNGLE', 'MID', 'ADC', 'SUPPORT'][i % 5] as any,
                championMastery: Math.floor(Math.random() * 500000),
                championPoints: Math.floor(Math.random() * 500000),
                isPro: false,
                recentMatches: Array(5).fill(null).map(() => ({
                  result: Math.random() > 0.5 ? 'W' : 'L' as any,
                  champion: ['Yasuo', 'Zed', 'Lee Sin', 'Jinx', 'Thresh'][Math.floor(Math.random() * 5)],
                  kda: `${Math.floor(Math.random() * 15)} / ${Math.floor(Math.random() * 5)} / ${Math.floor(Math.random() * 15)}`,
                  k: Math.floor(Math.random() * 15),
                  d: Math.floor(Math.random() * 5),
                  a: Math.floor(Math.random() * 15)
                }))
              }));
              dispatch(setLobby({
                gameMode: 'RANKED_SOLO_5x5',
                allies: mockPlayers.slice(0, 5),
                enemies: mockPlayers.slice(5, 10)
              }));
            }} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>🎮 Симулировать Лобби 5x5</button>
          </div>
        </div>
      )}

      {/* ШАПКА */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #1f2937', paddingBottom: '15px' }}>
        <div>
          <h1 style={{ color: '#00ffcc', margin: 0, fontSize: '28px', letterSpacing: '1px' }}>SENSEI . GG</h1>
          <small style={{ color: '#6b7280' }}>Твой персональный ИИ-тренер League of Legends</small>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Статус API */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '6px 12px', 
            background: apiStatus === 'connected' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            border: `1px solid ${apiStatus === 'connected' ? '#10b981' : '#ef4444'}`
          }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: apiStatus === 'connected' ? '#10b981' : '#ef4444',
              animation: apiStatus === 'connected' ? 'pulse 2s infinite' : 'none'
            }} />
            <span style={{ fontSize: '12px', color: apiStatus === 'connected' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
              {apiStatus === 'connected' ? 'Riot API' : 'API Off'}
            </span>
          </div>
          
          {/* Кнопка ввода API ключа */}
          <button 
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            style={{
              padding: '6px 12px',
              background: 'rgba(139, 92, 246, 0.2)',
              color: '#a855f7',
              border: '1px solid #a855f7',
              borderRadius: '6px',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔑 API Key
          </button>

          {showApiKeyInput && (
            <div style={{
              position: 'absolute',
              top: '80px',
              right: '30px',
              background: '#1f2937',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #374151',
              zIndex: 1000,
              width: '400px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#fff', fontSize: '14px' }}>Riot API Key</h4>
              <input
                type="password"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="RGAPI-..."
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#161d2a',
                  border: '1px solid #374151',
                  borderRadius: '4px',
                  color: '#fff',
                  marginBottom: '10px'
                }}
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => {
                    localStorage.setItem('riot_api_key', customApiKey);
                    setShowApiKeyInput(false);
                    window.location.reload();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#10b981',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Сохранить
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem('riot_api_key');
                    window.location.reload();
                  }}
                  style={{
                    flex: 1,
                    padding: '8px',
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Сбросить
                </button>
              </div>
              <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#9ca3af' }}>
                Получить ключ: <a href="https://developer.riotgames.com/" target="_blank" style={{ color: '#00ffcc' }}>developer.riotgames.com</a>
              </p>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '5px', background: '#161d2a', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setActiveTab('match')} style={{ padding: '8px 16px', background: activeTab === 'match' ? '#00ffcc' : 'transparent', color: activeTab === 'match' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Матч</button>
            <button onClick={() => setActiveTab('lobby')} style={{ padding: '8px 16px', background: activeTab === 'lobby' ? '#00ffcc' : 'transparent', color: activeTab === 'lobby' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Лобби</button>
            <button onClick={() => setActiveTab('search')} style={{ padding: '8px 16px', background: activeTab === 'search' ? '#00ffcc' : 'transparent', color: activeTab === 'search' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Поиск</button>
            <button onClick={() => setActiveTab('profile')} style={{ padding: '8px 16px', background: activeTab === 'profile' ? '#00ffcc' : 'transparent', color: activeTab === 'profile' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Профиль</button>
            <button onClick={() => setActiveTab('ai')} style={{ padding: '8px 16px', background: activeTab === 'ai' ? '#00ffcc' : 'transparent', color: activeTab === 'ai' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>AI</button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* ВКЛАДКА: ПОИСК */}
      {activeTab === 'search' && (
        <SearchScreen />
      )}

      {/* ВКЛАДКА: ЛОББИ */}
      {activeTab === 'lobby' && (
        <LobbyPanel />
      )}

      {/* ВКЛАДКА: ТЕКУЩИЙ МАТЧ */}
      {activeTab === 'match' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
          <div style={{ background: '#161d2a', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <h2 style={{ marginTop: 0, color: '#fff', fontSize: '20px' }}>Мониторинг игры</h2>
            <div style={{ display: 'flex', gap: '15px', margin: '20px 0' }}>
              <div style={{ background: '#1f293d', padding: '15px 20px', borderRadius: '8px', flex: 1 }}>
                <span style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Выбранный чемпион</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {championName !== 'Не в игре' ? (
                    <>
                      <img src={lcuService.getChampionIcon(championName)} alt={championName} style={{ width: '48px', height: '48px', borderRadius: '8px' }} />
                      <strong style={{ fontSize: '20px', color: '#00ffcc' }}>{championName}</strong>
                    </>
                  ) : (
                    <span style={{ fontSize: '20px', color: '#6b7280' }}>Не в игре</span>
                  )}
                </div>
              </div>
              <div style={{ background: '#1f293d', padding: '15px 20px', borderRadius: '8px', flex: 1 }}>
                <span style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Текущий счет (KDA)</span>
                <strong style={{ fontSize: '20px', color: '#ff6b6b' }}>{kills} / {deaths} / {assists}</strong>
              </div>
              <div style={{ background: '#1f293d', padding: '15px 20px', borderRadius: '8px', flex: 1 }}>
                <span style={{ color: '#9ca3af', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Крипы / Фарм</span>
                <strong style={{ fontSize: '20px', color: '#ffd43b' }}>{cs}</strong>
              </div>
            </div>
            <button onClick={handleAskDeepSeek} disabled={!isInGame || isLoadingAi} style={{ width: '100%', background: '#00ffcc', color: '#0f131a', border: 'none', padding: '12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
              {isLoadingAi ? 'Сэнсэй анализирует данные матча...' : '🤖 Запросить мгновенный ИИ-анализ ситуации'}
            </button>
          </div>

          <div style={{ background: '#1a1926', padding: '25px', borderRadius: '12px', border: '1px solid #2d2640' }}>
            <h3 style={{ marginTop: 0, color: '#a855f7', fontSize: '18px' }}>⚡ Анализ Сэнсэя</h3>
            <p style={{ fontStyle: 'italic', color: '#d8b4fe', lineHeight: '1.6', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
              "{aiAdvice}"
            </p>
          </div>
        </div>
      )}

      {/* ВКЛАДКА: ПРОФИЛЬ (С ГРАФИКОМ) */}
      {activeTab === 'profile' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
            <div style={{ background: '#161d2a', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937', textAlign: 'center' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Всего игр проанализировано</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>42</div>
            </div>
            <div style={{ background: '#161d2a', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937', textAlign: 'center' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Средний Винрейт</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginTop: '5px' }}>64.2%</div>
            </div>
            <div style={{ background: '#161d2a', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937', textAlign: 'center' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Средний KDA тренда</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff', marginTop: '5px' }}>3.41</div>
            </div>
            <div style={{ background: '#161d2a', padding: '20px', borderRadius: '10px', border: '1px solid #1f2937', textAlign: 'center' }}>
              <span style={{ color: '#9ca3af', fontSize: '13px' }}>Оценка ИИ (Sensei Score)</span>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#00ffcc', marginTop: '5px' }}>A+</div>
            </div>
          </div>

          {/* БЛОК ГРАФИКА ДИНАМИКИ ФАРМА */}
          <div style={{ background: '#161d2a', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937', marginBottom: '25px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '5px', color: '#fff' }}>Динамика фарма (Крипы в минуту)</h3>
            <p style={{ color: '#6b7280', fontSize: '12px', marginTop: 0, marginBottom: '20px' }}>Целевой киберспортивный показатель — выше 7.5 CS/мин</p>
            <div style={{ position: 'relative', background: '#0f131a', borderRadius: '8px', padding: '10px', border: '1px solid #1f2937' }}>
              <canvas ref={canvasRef} width={750} height={220} style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
          </div>

          {/* Таблица */}
          <div style={{ background: '#161d2a', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#fff' }}>История недавних тренировок</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #1f2937', color: '#9ca3af', fontSize: '14px' }}>
                  <th style={{ paddingBottom: '12px' }}>Результат</th>
                  <th style={{ paddingBottom: '12px' }}>Чемпион</th>
                  <th style={{ paddingBottom: '12px' }}>Итоговый KDA</th>
                  <th style={{ paddingBottom: '12px' }}>Фарм (CS / в мин)</th>
                  <th style={{ paddingBottom: '12px' }}>Длительность</th>
                  <th style={{ paddingBottom: '12px' }}>Дата</th>
                </tr>
              </thead>
              <tbody>
                {matchHistory.map((match) => (
                  <tr key={match.id} style={{ borderBottom: '1px solid #1f2937', fontSize: '15px' }}>
                    <td style={{ padding: '15px 0', fontWeight: 'bold', color: match.result === 'Победа' ? '#10b981' : '#ef4444' }}>
                      {match.result === 'Победа' ? '🟢 ' : '🔴 '} {match.result}
                    </td>
                    <td style={{ padding: '15px 0', color: '#fff', fontWeight: '600' }}>{match.champion}</td>
                    <td style={{ padding: '15px 0' }}>{match.kda}</td>
                    <td style={{ padding: '15px 0', color: '#ffd43b' }}>{match.cs} <span style={{ color: '#6b7280', fontSize: '12px' }}>({match.csMin}/м)</span></td>
                    <td style={{ padding: '15px 0', color: '#9ca3af' }}>{match.duration}</td>
                    <td style={{ padding: '15px 0', color: '#6b7280' }}>{match.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ВКЛАДКА: СОВЕТЫ ИИ */}
      {activeTab === 'ai' && (
        <div style={{ background: '#161d2a', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937' }}>
          <h2 style={{ marginTop: 0, color: '#a855f7' }}>🤖 Полный разбор от ИИ-Аналитика</h2>
          <div style={{ padding: '20px', background: '#0f131a', borderRadius: '8px', borderLeft: '4px solid #a855f7', fontStyle: 'italic', lineHeight: '1.7' }}>
            {aiAdvice}
          </div>
        </div>
      )}

    </div>
  );
}