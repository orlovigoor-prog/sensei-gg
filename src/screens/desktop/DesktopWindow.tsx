import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { startGame, mutateStats, endGame, setAiLoading, setAiAdvice } from '../../store/gameSlice';
import { SearchScreen } from '../search/SearchScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { MatchScreen } from '../match/MatchScreen';
import { setLobby, setLobbyPhase, type LobbyPhase, type PlayerInfo } from '../../store/lobbySlice';
import { useOverwolfBridge } from '../../hooks/useOverwolfBridge';
import { DevSimulationPanel } from '../../components/DevSimulationPanel';
import { createMockPlayers } from '../../services/mockLobby';
import { getStoredWindowSizePreset, getWindowSizeOption, type WindowSizePreset } from '../../services/windowSize';

const riotLegalText = "Sensei GG не одобрен Riot Games и не отражает взгляды или мнения Riot Games или лиц, официально связанных с производством или управлением продуктами Riot Games. Riot Games и все связанные свойства являются товарными знаками или зарегистрированными товарными знаками Riot Games, Inc.";

const complianceHighlights = [
  'Без таймеров ультимейтов, заклинаний призывателя и способностей врага.',
  'Без live-команд в активном матче.',
  'Фокус на постматч-разборе и нейтральной аналитике.'
];

const phaseLabels: Record<LobbyPhase, string> = {
  'champ-select': 'Лобби',
  loading: 'В игре',
  'in-game': 'В игре',
  'post-game': 'Итоги'
};

const DESIGN_WIDTH = 1600;
const DESIGN_HEIGHT = 900;

export function DesktopWindow() {
  const dispatch = useDispatch<AppDispatch>();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const { kills, deaths, assists, cs, aiAdvice, isLoadingAi, isInGame, lastCompletedMatch } = useSelector(
    (state: RootState) => state.game
  );
  const { isInLobby, phase } = useSelector((state: RootState) => state.lobby);

  const [activeTab, setActiveTab] = useState<'match' | 'search' | 'profile' | 'ai' | 'settings'>('match');
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);
  const [windowSizePreset, setWindowSizePreset] = useState<WindowSizePreset>(getStoredWindowSizePreset());
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const lobbyStatusLabel = !isInLobby
    ? 'Лобби не загружено'
    : phaseLabels[phase];
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const handleBridgeGameStart = useCallback(() => {
    setActiveTab('match');
  }, []);

  useOverwolfBridge(handleBridgeGameStart);

  const handleSimulatePhase = (nextPhase: LobbyPhase) => {
    dispatch(setLobbyPhase(nextPhase));

    if (nextPhase === 'in-game' && !isInGame) {
      dispatch(startGame('Jinx'));
    }

    if (nextPhase === 'post-game' && isInGame) {
      dispatch(endGame());
    }
  };

  const handleSimulateLobby = () => {
    const mockPlayers: PlayerInfo[] = createMockPlayers();
    dispatch(setLobby({
      gameMode: 'RANKED_SOLO_5x5',
      allies: mockPlayers.slice(0, 5),
      enemies: mockPlayers.slice(5, 10),
      phase: 'champ-select',
      partyMembers: ['Player1', 'Player2']
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log('Key pressed:', e.key, 'Ctrl:', e.ctrlKey, 'Shift:', e.shiftKey);
      
      if (e.ctrlKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle minimized');
        setIsMinimized(prev => !prev);
      }
      if (e.ctrlKey && e.shiftKey && (e.key.toLowerCase() === 'z' || e.code === 'KeyZ')) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Toggle dev panel');
        setShowDevPanel(prev => !prev);
      }
    };
window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, []);

  // Слушатель события переключения на вкладку поиска игрока
  useEffect(() => {
    const handleSearchPlayer = () => {
      setActiveTab('search');
    };
    window.addEventListener('sensei-search-player', handleSearchPlayer);
    return () => window.removeEventListener('sensei-search-player', handleSearchPlayer);
  }, []);

  useEffect(() => {
    const handleWindowSizeUpdated = (event: Event) => {
      const nextPreset = (event as CustomEvent<WindowSizePreset>).detail;

      if (nextPreset === '800x600' || nextPreset === '1280x720' || nextPreset === '1600x900') {
        setWindowSizePreset(nextPreset);
        return;
      }

      setWindowSizePreset(getStoredWindowSizePreset());
    };

    window.addEventListener('sensei-window-size-updated', handleWindowSizeUpdated);
    return () => window.removeEventListener('sensei-window-size-updated', handleWindowSizeUpdated);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const handleAskDeepSeek = () => {
    dispatch(setAiLoading(true));

    window.setTimeout(() => {
      if (isInGame) {
        dispatch(setAiAdvice('Во время активной игры постматч-разбор недоступен. Sensei GG не дает live-команды, чтобы соответствовать политике Riot.'));
        return;
      }

      if (!lastCompletedMatch) {
        dispatch(setAiAdvice('Постматч-разбор появится после первого завершенного матча.'));
        return;
      }

      const { championName: reviewedChampion, kills: reviewedKills, deaths: reviewedDeaths, assists: reviewedAssists, cs: reviewedCs } = lastCompletedMatch;
      const safeDeaths = reviewedDeaths <= 4;
      const strongFarm = reviewedCs >= 180;
      const teamPlay = reviewedAssists >= reviewedKills;
      const highDeaths = reviewedDeaths >= 7;
      const lowFarm = reviewedCs < 160;
      const soloSkew = reviewedKills > reviewedAssists + 3;

      const strength = safeDeaths && strongFarm
        ? `на ${reviewedChampion} ты держал чистый темп: мало смертей и стабильный фарм`
        : safeDeaths
          ? `на ${reviewedChampion} ты аккуратно сохранял темп и не отдавал лишние смерти`
          : teamPlay
            ? 'ты регулярно подключался к командным розыгрышам и не выпадал из общих действий'
            : strongFarm
              ? 'ты не просел по фарму и сохранил себе стабильный доход по игре'
              : 'матч прошел без явного провала по одной метрике, база для роста есть';

      const risk = highDeaths
        ? 'частые смерти ломали темп и отдавали сопернику слишком много пространства'
        : lowFarm
          ? 'просадка по фарму оставляла тебя без стабильного золота в спокойные отрезки'
          : soloSkew
            ? 'слишком много игры шло через личные входы, а не через общий темп команды'
            : 'не хватило более чистой конвертации давления в безопасное преимущество';

      const nextFocus = highDeaths
        ? 'до середины игры входи только в драки с численным преимуществом или сильной позицией'
        : lowFarm
          ? 'в тихие окна между драками добирай фарм до стабильного темпа, а не форсируй лишние размены'
          : teamPlay
            ? 'сохрани командный темп, но после удачных розыгрышей быстрее переводи его в объекты'
            : 'после первого преимущества играй от следующей волны и ближайшей цели, а не от случайного файта';

      const advice = [
        `Сильная сторона: ${strength}.`,
        `Главный риск: ${risk}.`,
        `Фокус на следующую игру: ${nextFocus}.`
      ].join('\n');

      dispatch(setAiAdvice(advice));
    }, 350);
  };

  const selectedWindowSize = getWindowSizeOption(windowSizePreset);
  const frameWidth = Math.min(selectedWindowSize.width, viewportSize.width);
  const frameHeight = Math.min(selectedWindowSize.height, viewportSize.height);
  const frameInset = 8;
  const interfaceScale = Math.min((frameWidth - frameInset) / DESIGN_WIDTH, (frameHeight - frameInset) / DESIGN_HEIGHT);
  const scaledWidth = DESIGN_WIDTH * interfaceScale;
  const scaledHeight = DESIGN_HEIGHT * interfaceScale;

  return (
    <div style={{ 
      width: `${frameWidth}px`,
      height: `${frameHeight}px`,
      margin: '0 auto',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start'
    }}>
      <div style={{
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        position: 'relative',
        flexShrink: 0,
        borderRadius: `${12 * interfaceScale}px`
      }}>
      <div style={{
        width: `${DESIGN_WIDTH}px`,
        height: `${DESIGN_HEIGHT}px`,
        transform: `scale(${interfaceScale})`,
        transformOrigin: 'top left',
        padding: '16px 16px 24px',
        color: '#e0e6ed',
        background: 'linear-gradient(180deg, rgba(18, 23, 32, 0.98), rgba(15, 19, 26, 0.96) 22%, rgba(15, 19, 26, 0.95) 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '12px',
        border: '1px solid #1f2937',
        position: 'absolute',
        top: 0,
        left: 0,
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05), inset 0 -18px 28px rgba(0, 0, 0, 0.12), inset 12px 0 18px rgba(255, 255, 255, 0.015)',
        zIndex: 1
      }}>
        
        {/* Мини-версия при сворачивании */}
        {isMinimized && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: '#00ffcc',
            borderRadius: '8px',
            padding: '8px 16px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 255, 204, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onClick={() => setIsMinimized(false)}
          >
            <span style={{ color: '#0f131a', fontWeight: 'bold', fontSize: '14px' }}>
              🎮 Sensei
            </span>
          </div>
        )}

      {showDevPanel && (
        <DevSimulationPanel
          kills={kills}
          deaths={deaths}
          assists={assists}
          cs={cs}
          isLoadingAi={isLoadingAi}
          currentPhase={phase}
          onSimulatePick={(championName) => dispatch(startGame(championName))}
          onMutateStats={(stats) => dispatch(mutateStats(stats))}
          onAskAi={handleAskDeepSeek}
          onResetMatch={() => dispatch(endGame())}
          onSimulateLobby={handleSimulateLobby}
          onSetPhase={handleSimulatePhase}
          getPhaseLabel={(phaseKey) => phaseLabels[phaseKey]}
        />
      )}

      {/* ШАПКА */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #1f2937', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0 }}>
          <img
            src="/brand-mark.svg"
            alt="Sensei logo"
            style={{ width: '38px', height: '38px', flexShrink: 0, display: 'block', marginTop: '-2px' }}
          />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ color: '#f3efe7', margin: 0, fontSize: '28px', letterSpacing: '0.08em', lineHeight: 1 }}>SENSEI.GG</h1>
            <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>аналитика без лишнего шума</small>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '5px', background: '#161d2a', padding: '4px', borderRadius: '8px' }}>
            <button onClick={() => setActiveTab('match')} style={{ padding: '8px 12px', background: activeTab === 'match' ? '#00ffcc' : 'transparent', color: activeTab === 'match' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Матч</button>
            <button onClick={() => setActiveTab('search')} style={{ padding: '8px 12px', background: activeTab === 'search' ? '#00ffcc' : 'transparent', color: activeTab === 'search' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Поиск</button>
            <button onClick={() => setActiveTab('profile')} style={{ padding: '8px 12px', background: activeTab === 'profile' ? '#00ffcc' : 'transparent', color: activeTab === 'profile' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>Профиль</button>
            <button onClick={() => setActiveTab('ai')} style={{ padding: '8px 12px', background: activeTab === 'ai' ? '#00ffcc' : 'transparent', color: activeTab === 'ai' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>AI</button>
            <button onClick={() => setActiveTab('settings')} style={{ padding: '8px 12px', background: activeTab === 'settings' ? '#00ffcc' : 'transparent', color: activeTab === 'settings' ? '#0f131a' : '#9ca3af', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>⚙️</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ padding: '6px 10px', borderRadius: '999px', background: 'rgba(0, 255, 204, 0.08)', border: '1px solid rgba(0, 255, 204, 0.3)', color: '#00ffcc', fontSize: '12px', fontWeight: 'bold' }}>
          {lobbyStatusLabel}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      <div style={{
        flex: 1,
        minHeight: 0,
        overflowX: 'hidden',
        overflowY: activeTab === 'profile' || activeTab === 'ai' ? 'auto' : 'hidden'
      }}>

      {/* ВКЛАДКА: ПОИСК */}
      {activeTab === 'search' && (
        <SearchScreen />
      )}

      {/* ВКЛАДКА: МАТЧ (Оверлей 5x5) */}
      {activeTab === 'match' && (
        <MatchScreen
          onRequestAiAnalysis={handleAskDeepSeek}
          isLoadingAi={isLoadingAi}
          aiAdvice={aiAdvice}
          lastCompletedMatch={lastCompletedMatch}
        />
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

      {/* ВКЛАДКА: НАСТРОЙКИ */}
      {activeTab === 'settings' && (
        <SettingsScreen />
      )}

      {/* ВКЛАДКА: СОВЕТЫ ИИ */}
      {activeTab === 'ai' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ background: '#161d2a', padding: '20px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <h2 style={{ marginTop: 0, marginBottom: '8px', color: '#a855f7' }}>🤖 AI Coach</h2>
            <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px', lineHeight: 1.6 }}>
              Этот блок намеренно ограничен безопасным сценарием: постматч-разбор и нейтральная аналитика без live-callouts во время активной игры.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {complianceHighlights.map((item) => (
              <div key={item} style={{ background: '#161d2a', padding: '16px', borderRadius: '12px', border: '1px solid #1f2937' }}>
                <div style={{ color: '#00ffcc', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>SAFE</div>
                <div style={{ color: '#d1d5db', fontSize: '13px', lineHeight: 1.5 }}>{item}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#161d2a', padding: '25px', borderRadius: '12px', border: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', color: '#fff' }}>Постматч-разбор</h3>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '13px' }}>
                  После завершения матча Sensei GG собирает короткий разбор по KDA, участию в боях и объему фарма.
                </p>
              </div>
              <button
                onClick={handleAskDeepSeek}
                disabled={isLoadingAi}
                style={{
                  padding: '10px 14px',
                  background: '#a855f7',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  whiteSpace: 'nowrap',
                  opacity: isLoadingAi ? 0.7 : 1
                }}
              >
                {isLoadingAi ? 'Анализ...' : 'Сгенерировать разбор'}
              </button>
            </div>

            {lastCompletedMatch && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: '#0f131a', padding: '14px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Чемпион</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{lastCompletedMatch.championName}</div>
                </div>
                <div style={{ background: '#0f131a', padding: '14px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>KDA</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{lastCompletedMatch.kills}/{lastCompletedMatch.deaths}/{lastCompletedMatch.assists}</div>
                </div>
                <div style={{ background: '#0f131a', padding: '14px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>CS</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{lastCompletedMatch.cs}</div>
                </div>
                <div style={{ background: '#0f131a', padding: '14px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Завершен</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{new Date(lastCompletedMatch.endedAt).toLocaleString('ru-RU')}</div>
                </div>
              </div>
            )}

            <div style={{ padding: '20px', background: '#0f131a', borderRadius: '8px', borderLeft: '4px solid #a855f7', lineHeight: '1.7', whiteSpace: 'pre-line' }}>
              {aiAdvice}
            </div>
          </div>
        </div>
      )}

      </div>

        <div style={{ marginTop: '10px', paddingTop: '14px', borderTop: '1px solid #1f2937', color: '#6b7280', fontSize: '11px', lineHeight: 1.6, flexShrink: 0 }}>
          <div style={{ marginBottom: '6px', color: '#9ca3af' }}>Riot / Overwolf compliance notice</div>
          <div>{riotLegalText}</div>
        </div>
      </div>
      </div>
    </div>
  );
}
