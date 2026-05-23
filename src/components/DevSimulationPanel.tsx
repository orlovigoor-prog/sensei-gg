import { useState } from 'react';
import type { LobbyPhase } from '../store/lobbySlice';

interface DevSimulationPanelProps {
  isLoadingAi: boolean;
  currentPhase: LobbyPhase;
  isExpanded?: boolean;
  onAskAi: () => void;
  onToggleExpanded?: () => void;
  onResetMatch: () => void;
  onSimulateLobby: () => void;
  onSetPhase: (phase: LobbyPhase) => void;
  getPhaseLabel: (phase: LobbyPhase) => string;
}

export function DevSimulationPanel({
  isLoadingAi,
  currentPhase,
  isExpanded,
  onAskAi,
  onToggleExpanded,
  onResetMatch,
  onSimulateLobby,
  onSetPhase,
  getPhaseLabel
}: DevSimulationPanelProps) {
  const phaseOptions: LobbyPhase[] = ['champ-select', 'in-game', 'post-game'];
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = isExpanded ?? internalExpanded;

  const handleToggleExpanded = () => {
    if (onToggleExpanded) {
      onToggleExpanded();
      return;
    }

    setInternalExpanded((prev) => !prev);
  };

  return (
    <div style={{ background: 'rgba(28, 25, 23, 0.94)', border: '1px dashed rgba(234, 88, 12, 0.55)', padding: '12px', borderRadius: '10px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.28)', backdropFilter: 'blur(8px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px 0', color: '#ea580c', fontSize: '18px' }}>Review Mode</h4>
          <p style={{ margin: 0, color: '#fdba74', fontSize: '11px', lineHeight: 1.45, maxWidth: '520px' }}>
            Этот режим предназначен для ревью и демонстрации будущих сценариев. Все показанные здесь игровые события и данные являются тестовыми.
          </p>
        </div>
        <div style={{ padding: '4px 8px', borderRadius: '999px', background: 'rgba(234, 88, 12, 0.16)', border: '1px solid rgba(234, 88, 12, 0.45)', color: '#fdba74', fontSize: '10px', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
          DEMO / REVIEW
        </div>
      </div>
      <button
        onClick={handleToggleExpanded}
        style={{ background: 'rgba(17, 24, 39, 0.8)', color: '#f3f4f6', border: '1px solid rgba(251, 146, 60, 0.25)', padding: '7px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
      >
        {expanded ? 'Свернуть управление Review Mode' : 'Расширить управление Review Mode'}
      </button>

      {expanded && (
        <>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
            <button onClick={onSimulateLobby} style={{ background: '#7c3aed', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Симулировать лобби 5x5</button>
            <button onClick={onAskAi} disabled={isLoadingAi} style={{ background: '#0891b2', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '11px', opacity: isLoadingAi ? 0.7 : 1 }}>
              {isLoadingAi ? 'Генерация разбора...' : 'Постматч-разбор'}
            </button>
            <button onClick={onResetMatch} style={{ background: '#334155', color: '#fff', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>Сбросить матч</button>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
            {phaseOptions.map((phaseKey) => (
              <button
                key={phaseKey}
                onClick={() => onSetPhase(phaseKey)}
                style={{
                  background: (currentPhase === phaseKey || (phaseKey === 'in-game' && currentPhase === 'loading')) ? '#00ffcc' : '#111827',
                  color: (currentPhase === phaseKey || (phaseKey === 'in-game' && currentPhase === 'loading')) ? '#0f131a' : '#d1d5db',
                  border: `1px solid ${(currentPhase === phaseKey || (phaseKey === 'in-game' && currentPhase === 'loading')) ? '#00ffcc' : '#374151'}`,
                  padding: '5px 9px',
                  borderRadius: '999px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                {getPhaseLabel(phaseKey)}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '10px', padding: '9px 10px', borderRadius: '8px', background: 'rgba(17, 24, 39, 0.7)', border: '1px solid rgba(251, 146, 60, 0.2)', color: '#9ca3af', fontSize: '11px', lineHeight: 1.45 }}>
            Review Mode не должен восприниматься как реальный матч. Он нужен, чтобы показать Riot и Overwolf навигацию, safe UX и постматч-сценарии без доступа к настоящей игровой сессии.
          </div>
        </>
      )}
    </div>
  );
}
