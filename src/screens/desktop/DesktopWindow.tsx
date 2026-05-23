import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch, RootState } from '../../store';
import { startGame, endGame, resetGame, setAiLoading, setAiAdvice, setAiReview } from '../../store/gameSlice';
import { ProfileScreen } from '../profile/ProfileScreen';
import { SettingsScreen } from '../settings/SettingsScreen';
import { MatchScreen } from '../match/MatchScreen';
import { clearLobby, setLobby, setLobbyPhase, type LobbyPhase, type PlayerInfo } from '../../store/lobbySlice';
import { useOverwolfBridge } from '../../hooks/useOverwolfBridge';
import { DevSimulationPanel } from '../../components/DevSimulationPanel';
import { createMockPlayers } from '../../services/mockLobby';
import { getStoredWindowSizePreset, getWindowSizeOption, type WindowSizePreset } from '../../services/windowSize';
import { requestPostGameAnalysis } from '../../services/aiReviewGateway';

const getAiSourceMeta = (source: 'provider' | 'local-server-fallback' | 'local-client-fallback') => {
  switch (source) {
    case 'provider':
      return {
        label: 'DeepSeek',
        color: '#10b981',
        border: 'rgba(16, 185, 129, 0.32)',
        background: 'rgba(16, 185, 129, 0.12)'
      };
    case 'local-server-fallback':
      return {
        label: 'Server Fallback',
        color: '#f59e0b',
        border: 'rgba(245, 158, 11, 0.3)',
        background: 'rgba(245, 158, 11, 0.12)'
      };
    default:
      return {
        label: 'Client Fallback',
        color: '#60a5fa',
        border: 'rgba(96, 165, 250, 0.3)',
        background: 'rgba(96, 165, 250, 0.12)'
      };
  }
};

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
  
  const { aiAdvice, aiReview, isLoadingAi, isInGame, lastCompletedMatch } = useSelector(
    (state: RootState) => state.game
  );
  const { isInLobby, phase, players } = useSelector((state: RootState) => state.lobby);

  const [activeTab, setActiveTab] = useState<'match' | 'profile' | 'ai' | 'settings'>('match');
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);
  const [isDevPanelExpanded, setIsDevPanelExpanded] = useState<boolean>(true);
  const [windowSizePreset, setWindowSizePreset] = useState<WindowSizePreset>(getStoredWindowSizePreset());
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const aiSourceMeta = aiReview ? getAiSourceMeta(aiReview.source) : null;

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

  const handleResetReviewMode = () => {
    dispatch(resetGame());
    dispatch(clearLobby());
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
        setShowDevPanel(prev => {
          const nextValue = !prev;
          if (nextValue && activeTab === 'match') {
            setIsDevPanelExpanded(true);
          }
          return nextValue;
        });
      }
    };
 window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [activeTab]);

  useEffect(() => {
    if (!showDevPanel) {
      return;
    }

    setIsDevPanelExpanded(activeTab === 'match');
  }, [activeTab, showDevPanel]);

  // Слушатель события переключения на вкладку поиска игрока
  useEffect(() => {
    const handleSearchPlayer = () => {
      setActiveTab('profile');
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

  const handleGeneratePostGameAnalysis = () => {
    dispatch(setAiLoading(true));

    window.setTimeout(async () => {
      if (isInGame) {
        dispatch(setAiAdvice('Во время активной игры постматч-разбор недоступен. Sensei GG не дает live-команды, чтобы соответствовать политике Riot.'));
        return;
      }

      if (!lastCompletedMatch) {
        dispatch(setAiAdvice('Постматч-разбор появится после первого завершенного матча.'));
        return;
      }

      const review = await requestPostGameAnalysis({
          lastCompletedMatch,
          allies: players.allies,
          enemies: players.enemies,
          reviewMode: showDevPanel
        });

      dispatch(setAiReview(review));
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
        <div
          style={{
            position: 'absolute',
            top: '72px',
            right: '16px',
            zIndex: 20,
            width: 'min(420px, calc(100% - 32px))'
          }}
        >
          <DevSimulationPanel
            isLoadingAi={isLoadingAi}
            currentPhase={phase}
            isExpanded={isDevPanelExpanded}
            onAskAi={handleGeneratePostGameAnalysis}
            onToggleExpanded={() => setIsDevPanelExpanded((prev) => !prev)}
            onResetMatch={handleResetReviewMode}
            onSimulateLobby={handleSimulateLobby}
            onSetPhase={handleSimulatePhase}
            getPhaseLabel={(phaseKey) => phaseLabels[phaseKey]}
          />
        </div>
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

      {/* ВКЛАДКА: МАТЧ (Оверлей 5x5) */}
      {activeTab === 'match' && (
        <MatchScreen
          onRequestAiAnalysis={handleGeneratePostGameAnalysis}
          isLoadingAi={isLoadingAi}
          aiAdvice={aiAdvice}
          aiReview={aiReview}
          lastCompletedMatch={lastCompletedMatch}
          reviewMode={showDevPanel}
        />
      )}

      {/* ВКЛАДКА: ПРОФИЛЬ */}
      {activeTab === 'profile' && (
        <ProfileScreen reviewMode={showDevPanel} />
      )}

      {/* ВКЛАДКА: НАСТРОЙКИ */}
      {activeTab === 'settings' && (
        <SettingsScreen />
      )}

      {/* ВКЛАДКА: СОВЕТЫ ИИ */}
      {activeTab === 'ai' && (
        <div style={{ display: 'grid', gap: '16px' }}>
          {showDevPanel && (
            <div style={{ background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.35)', borderRadius: '12px', padding: '14px 16px' }}>
              <div style={{ color: '#fdba74', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.06em', marginBottom: '6px' }}>REVIEW MODE</div>
              <div style={{ color: '#d1d5db', fontSize: '13px', lineHeight: 1.6 }}>
                В этом режиме AI-разбор генерируется на тестовых событиях, запущенных через Review Mode. Это демонстрация safe UX и post-game flow, а не live-коучинг.
              </div>
            </div>
          )}
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
                {aiSourceMeta && (
                  <div style={{ marginTop: '8px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', borderRadius: '999px', background: aiSourceMeta.background, border: `1px solid ${aiSourceMeta.border}`, color: aiSourceMeta.color, fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.04em' }}>
                      {aiSourceMeta.label}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={handleGeneratePostGameAnalysis}
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px', marginBottom: '16px' }}>
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
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>CS/мин</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{lastCompletedMatch.csPerMinute !== null ? lastCompletedMatch.csPerMinute.toFixed(1) : '—'}</div>
                </div>
                <div style={{ background: '#0f131a', padding: '14px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Длительность</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{lastCompletedMatch.gameDurationSeconds !== null ? `${Math.floor(lastCompletedMatch.gameDurationSeconds / 60)}:${Math.round(lastCompletedMatch.gameDurationSeconds % 60).toString().padStart(2, '0')}` : '—'}</div>
                </div>
                <div style={{ background: '#0f131a', padding: '14px', borderRadius: '10px', border: '1px solid #1f2937' }}>
                  <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>Завершен</div>
                  <div style={{ color: '#fff', fontWeight: 'bold' }}>{new Date(lastCompletedMatch.endedAt).toLocaleString('ru-RU')}</div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '10px' }}>
              {aiReview ? (
                <>
                  <div style={{ padding: '14px', background: '#0f131a', borderRadius: '8px', borderLeft: '4px solid #10b981', lineHeight: '1.6' }}>{aiReview.strength}</div>
                  <div style={{ padding: '14px', background: '#0f131a', borderRadius: '8px', borderLeft: '4px solid #ef4444', lineHeight: '1.6' }}>{aiReview.risk}</div>
                  <div style={{ padding: '14px', background: '#0f131a', borderRadius: '8px', borderLeft: '4px solid #a855f7', lineHeight: '1.6' }}>{aiReview.nextFocus}</div>
                  {aiReview.evidence ? (
                    <div style={{ padding: '14px', background: '#0f131a', borderRadius: '8px', borderLeft: `4px solid ${showDevPanel ? '#ea580c' : '#334155'}`, lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                      {aiReview.evidence}
                    </div>
                  ) : null}
                </>
              ) : (
                <div style={{ padding: '20px', background: '#0f131a', borderRadius: '8px', borderLeft: `4px solid ${showDevPanel ? '#ea580c' : '#a855f7'}`, lineHeight: '1.7', whiteSpace: 'pre-line' }}>
                  {aiAdvice}
                </div>
              )}
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
