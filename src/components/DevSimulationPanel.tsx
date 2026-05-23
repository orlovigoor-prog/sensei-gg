import type { LobbyPhase } from '../store/lobbySlice';

interface DevSimulationPanelProps {
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  isLoadingAi: boolean;
  currentPhase: LobbyPhase;
  onSimulatePick: (championName: string) => void;
  onMutateStats: (stats: { kills: number; deaths: number; assists: number; cs: number }) => void;
  onAskAi: () => void;
  onResetMatch: () => void;
  onSimulateLobby: () => void;
  onSetPhase: (phase: LobbyPhase) => void;
  getPhaseLabel: (phase: LobbyPhase) => string;
}

export function DevSimulationPanel({
  kills,
  deaths,
  assists,
  cs,
  isLoadingAi,
  currentPhase,
  onSimulatePick,
  onMutateStats,
  onAskAi,
  onResetMatch,
  onSimulateLobby,
  onSetPhase,
  getPhaseLabel
}: DevSimulationPanelProps) {
  const phaseOptions: LobbyPhase[] = ['champ-select', 'in-game', 'post-game'];

  return (
    <div style={{ background: '#1c1917', border: '1px dashed #ea580c', padding: '15px', borderRadius: '10px', marginBottom: '25px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '10px' }}>
        <div>
          <h4 style={{ margin: '0 0 6px 0', color: '#ea580c' }}>Review Mode</h4>
          <p style={{ margin: 0, color: '#fdba74', fontSize: '12px', lineHeight: 1.5, maxWidth: '720px' }}>
            Этот режим предназначен для ревью и демонстрации будущих сценариев. Все показанные здесь игровые события и данные являются тестовыми.
          </p>
        </div>
        <div style={{ padding: '5px 9px', borderRadius: '999px', background: 'rgba(234, 88, 12, 0.16)', border: '1px solid rgba(234, 88, 12, 0.45)', color: '#fdba74', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          DEMO / REVIEW
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => onSimulatePick('Jinx')} style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>▶️ Симулировать Пик: Jinx</button>
        <button onClick={() => onSimulatePick('Yasuo')} style={{ background: '#ea580c', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>▶️ Симулировать Пик: Yasuo</button>
        <button onClick={() => onMutateStats({ kills: kills + 1, deaths, assists, cs: cs + 12 })} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>⚔️ Убийство (+1 Килл)</button>
        <button onClick={() => onMutateStats({ kills, deaths: deaths + 1, assists, cs })} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>💀 Смерть (+1 Смерть)</button>
        <button onClick={onAskAi} disabled={isLoadingAi} style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', opacity: isLoadingAi ? 0.7 : 1 }}>
          {isLoadingAi ? 'Сэнсэй думает...' : '🤖 Постматч-разбор'}
        </button>
        <button onClick={onResetMatch} style={{ background: '#4b5563', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>⏹️ Сбросить матч</button>
        <button onClick={onSimulateLobby} style={{ background: '#8b5cf6', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>🎮 Симулировать Лобби 5x5</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
        {phaseOptions.map((phaseKey) => (
          <button
            key={phaseKey}
            onClick={() => onSetPhase(phaseKey)}
            style={{
              background: (currentPhase === phaseKey || (phaseKey === 'in-game' && currentPhase === 'loading')) ? '#00ffcc' : '#111827',
              color: (currentPhase === phaseKey || (phaseKey === 'in-game' && currentPhase === 'loading')) ? '#0f131a' : '#d1d5db',
              border: `1px solid ${(currentPhase === phaseKey || (phaseKey === 'in-game' && currentPhase === 'loading')) ? '#00ffcc' : '#374151'}`,
              padding: '6px 10px',
              borderRadius: '999px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold'
            }}
          >
            {getPhaseLabel(phaseKey)}
          </button>
        ))}
      </div>
      <div style={{ marginTop: '12px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid rgba(251, 146, 60, 0.2)', color: '#9ca3af', fontSize: '12px', lineHeight: 1.5 }}>
        Review Mode не должен восприниматься как реальный матч. Он нужен, чтобы показать Riot и Overwolf навигацию, safe UX и постматч-сценарии без доступа к настоящей игровой сессии.
      </div>
    </div>
  );
}
