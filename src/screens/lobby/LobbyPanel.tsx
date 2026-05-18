import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import type { PlayerInfo } from '../../store/lobbySlice';
import { clearLobby } from '../../store/lobbySlice';
import { PlayerCardWithChampion } from '../../components/PlayerCardWithChampion';
import { useState } from 'react';

export function LobbyPanel() {
  const dispatch = useDispatch();
  const { isInLobby, gameMode, players } = useSelector(
    (state: RootState) => state.lobby
  );
  const [selectedChampion, setSelectedChampion] = useState<string | null>(null);

  if (!isInLobby) {
    return (
      <div style={{ 
        background: 'rgba(22, 29, 42, 0.95)', 
        border: '1px solid #1f2937', 
        borderRadius: '12px', 
        padding: '20px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        <p>Ожидание лобби...</p>
      </div>
    );
  }

  const gameModeNames: Record<string, string> = {
    'RANKED_SOLO_5x5': '🏆 Solo/Duo',
    'RANKED_FLEX_SR': '🎯 Flex 5x5',
    'NORMAL_5x5_DRAFT': '⚔️ Draft',
    'NORMAL_5x5_BLIND': '👁️ Blind',
    'ARAM': '❄️ ARAM'
  };

  const renderPlayerCard = (player: PlayerInfo, isAlly: boolean) => (
    <PlayerCardWithChampion
      key={player.summonerName}
      player={player}
      isAlly={isAlly}
      selectedChampion={selectedChampion || undefined}
      onSelectChampion={setSelectedChampion}
    />
  );

  return (
    <div style={{ 
      background: 'rgba(22, 29, 42, 0.95)', 
      border: '1px solid #1f2937', 
      borderRadius: '12px', 
      padding: '20px',
      color: '#e0e6ed',
      maxHeight: '80vh',
      overflow: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: '#00ffcc', fontSize: '18px' }}>
          {gameModeNames[gameMode] || gameMode}
        </h3>
        <button 
          onClick={() => dispatch(clearLobby())}
          style={{ 
            background: '#dc2626', 
            color: '#fff', 
            border: 'none', 
            padding: '6px 12px', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Закрыть
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <h4 style={{ color: '#10b981', margin: '0 0 15px 0' }}>🔵 Союзники</h4>
          {players.allies.map(player => renderPlayerCard(player, true))}
        </div>

        <div>
          <h4 style={{ color: '#ef4444', margin: '0 0 15px 0' }}>🔴 Противники</h4>
          {players.enemies.map(player => renderPlayerCard(player, false))}
        </div>
      </div>
    </div>
  );
}
