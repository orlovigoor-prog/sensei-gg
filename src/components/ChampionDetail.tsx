import { useState, useEffect } from 'react';
import { lcuService } from '../services/riotApi';

interface ChampionDetailProps {
  championId: string;
  onClose: () => void;
}

export function ChampionDetail({ championId, onClose }: ChampionDetailProps) {
  const [champion, setChampion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChampion = async () => {
      setLoading(true);
      const data = await lcuService.getChampionData(championId);
      setChampion(data);
      setLoading(false);
    };

    fetchChampion();
  }, [championId]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(15, 19, 26, 0.98)',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #1f2937',
        color: '#00ffcc',
        textAlign: 'center'
      }}>
        Загрузка данных о чемпионе...
      </div>
    );
  }

  if (!champion) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(15, 19, 26, 0.98)',
        padding: '40px',
        borderRadius: '16px',
        border: '1px solid #1f2937',
        color: '#ef4444',
        textAlign: 'center'
      }}>
        Ошибка загрузки данных о чемпионе
      </div>
    );
  }

  const getSpellIconUrl = (spell: any) => {
    return `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/spell/${spell.image.full}`;
  };

  const getPassiveIconUrl = () => {
    return `https://ddragon.leagueoflegends.com/cdn/14.10.1/img/passive/${champion.passive.image.full}`;
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(15, 19, 26, 0.98)',
        borderRadius: '16px',
        border: '2px solid #00ffcc',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflow: 'auto',
        padding: '30px',
        color: '#e0e6ed'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.10.1/img/champion/${championId}.png`}
              alt={champion.name}
              style={{ width: '100px', height: '100px', borderRadius: '12px', border: '3px solid #00ffcc' }}
            />
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '32px' }}>
                {champion.name}
              </h2>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '16px', fontStyle: 'italic' }}>
                {champion.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            ✕ Закрыть
          </button>
        </div>

        {/* Passive */}
        <div style={{
          background: 'rgba(31, 41, 55, 0.5)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '25px',
          border: '1px solid #1f2937'
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <img
              src={getPassiveIconUrl()}
              alt={champion.passive.name}
              style={{ width: '64px', height: '64px', borderRadius: '8px' }}
            />
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: '18px' }}>
                {champion.passive.name}
              </h3>
              <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px', color: '#d1d5db' }}>
                {champion.passive.description}
              </p>
            </div>
          </div>
        </div>

        {/* Abilities */}
        <h3 style={{ color: '#00ffcc', margin: '0 0 20px 0', fontSize: '22px' }}>
          Способности
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {champion.spells.map((spell: any, index: number) => (
            <div
              key={spell.id}
              style={{
                background: 'rgba(31, 41, 55, 0.5)',
                padding: '15px',
                borderRadius: '12px',
                border: '1px solid #1f2937',
                display: 'flex',
                gap: '15px'
              }}
            >
              <div style={{ position: 'relative' }}>
                <img
                  src={getSpellIconUrl(spell)}
                  alt={spell.name}
                  style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px solid #00ffcc' }}
                />
                <span style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  background: '#00ffcc',
                  color: '#000',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {index === 0 ? 'Q' : index === 1 ? 'W' : index === 2 ? 'E' : 'R'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '16px' }}>
                  {spell.name}
                </h4>
                <p style={{ margin: '0 0 10px 0', lineHeight: '1.5', fontSize: '12px', color: '#9ca3af' }}>
                  {spell.description}
                </p>
                <div style={{ display: 'flex', gap: '15px', fontSize: '11px', color: '#6b7280' }}>
                  <span>⏱️ {spell.cooldown[0]}с</span>
                  <span>💙 {spell.cost[0]} маны</span>
                  <span>📏 {spell.range[0]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
