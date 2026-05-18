import { useState } from 'react';
import type { PlayerInfo } from '../store/lobbySlice';
import { ChampionDetail } from './ChampionDetail';
import { lcuService } from '../services/riotApi';

interface PlayerCardWithChampionProps {
  player: PlayerInfo;
  isAlly: boolean;
  selectedChampion?: string | null;
  onSelectChampion?: (championId: string) => void;
}

export function PlayerCardWithChampion({ player, isAlly, selectedChampion, onSelectChampion }: PlayerCardWithChampionProps) {
  const [showChampionDetail, setShowChampionDetail] = useState(false);

  const getRankColor = (tier: string) => {
    const colors: Record<string, string> = {
      IRON: '#5C606C',
      BRONZE: '#7C4D3B',
      SILVER: '#9EA7B3',
      GOLD: '#C9B037',
      PLATINUM: '#59C8DE',
      EMERALD: '#2ECC71',
      DIAMOND: '#2E98CC',
      MASTER: '#9B59B6',
      GRANDMASTER: '#E74C3C',
      CHALLENGER: '#F1C40F'
    };
    return colors[tier] || '#6b7280';
  };

  const roleIcons: Record<string, string> = {
    TOP: '🗡️',
    JUNGLE: '🐺',
    MID: '⚡',
    ADC: '🔫',
    SUPPORT: '💚'
  };

  const getSummonerSpellIcon = (spellId: number) => {
    return lcuService.getSummonerSpellIcon(spellId);
  };

  const handleChampionClick = () => {
    if (selectedChampion && onSelectChampion) {
      setShowChampionDetail(true);
    }
  };

  return (
    <>
      <div style={{
        background: isAlly ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        border: `1px solid ${isAlly ? '#10b981' : '#ef4444'}`,
        borderRadius: '12px',
        padding: '15px',
        marginBottom: '12px',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 255, 204, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Верхняя часть */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Роль */}
          <div style={{
            background: 'rgba(31, 41, 55, 0.8)',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '18px'
          }}>
            {roleIcons[player.mainRole]}
          </div>
          
          {/* Имя */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '15px' }}>
                {player.summonerName}
              </span>
              {player.isPro && (
                <span style={{
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  color: '#000'
                }}>
                  ⭐ PRO
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <span style={{ color: '#9ca3af', fontSize: '11px' }}>
                {player.wins}W / {player.losses}L
              </span>
              <span style={{ color: '#6b7280', fontSize: '11px' }}>
                Lvl.{Math.floor(player.championPoints / 10000) + 1}
              </span>
            </div>
          </div>
        </div>

        {/* Ранг */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            background: getRankColor(player.tier),
            color: player.tier === 'IRON' ? '#fff' : '#000',
            padding: '4px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            display: 'inline-block'
          }}>
            {player.tier} {player.rank}
          </div>
          <div style={{ color: '#00ffcc', fontSize: '13px', fontWeight: 'bold', marginTop: '2px' }}>
            {player.lp} LP
          </div>
        </div>
      </div>

      {/* Винрейт и мастерство */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>WinRate</div>
          <div style={{
            fontSize: '18px',
            fontWeight: 'bold',
            color: player.winRate > 50 ? '#10b981' : player.winRate < 45 ? '#ef4444' : '#fbbf24'
          }}>
            {player.winRate}%
          </div>
        </div>
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          padding: '10px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '11px', marginBottom: '4px' }}>Mastery</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffd43b' }}>
            {(player.championPoints / 1000).toFixed(1)}K
          </div>
        </div>
      </div>

      {/* Чемпион и заклинания */}
      {selectedChampion && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '12px', padding: '10px', background: 'rgba(31, 41, 55, 0.3)', borderRadius: '8px' }}>
          <div 
            onClick={handleChampionClick}
            style={{
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src={lcuService.getChampionIcon(selectedChampion)}
              alt="Champion"
              style={{ width: '56px', height: '56px', borderRadius: '8px', border: '2px solid #00ffcc' }}
            />
            <div style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              background: '#00ffcc',
              color: '#000',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 'bold'
            }}>
              👆
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <img src={getSummonerSpellIcon(4)} alt="Flash" style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />
            <img src={getSummonerSpellIcon(14)} alt="Ignite" style={{ width: '40px', height: '40px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.2)' }} />
          </div>
        </div>
      )}

      {/* История матчей */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {player.recentMatches.slice(0, 5).map((match: any, idx: number) => (
          <div
            key={idx}
            style={{
              background: match.result === 'W' 
                ? 'linear-gradient(135deg, #10b981, #059669)' 
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 'bold',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={`KDA: ${match.kda}`}
          >
            {match.result === 'W' ? '✓' : '✗'} {match.champion}
          </div>
        ))}
      </div>
    </div>

    {showChampionDetail && selectedChampion && (
      <ChampionDetail championId={selectedChampion} onClose={() => setShowChampionDetail(false)} />
    )}
    </>
  );
}
