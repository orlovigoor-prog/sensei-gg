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
      <h4 style={{ margin: '0 0 10px 0', color: '#ea580c' }}>🛠️ Скрытый пульт симуляции событий LoL</h4>
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
    </div>
  );
}
