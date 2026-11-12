import { useEffect, useState } from 'react';
import {
  getChampionIconUrl,
  getChampionPassiveImageUrl,
  getChampionSpellImageUrl,
  loadChampionDetail,
  type DataDragonChampionDetail,
  type DataDragonChampionSpell,
  dragonVersion
} from '../services/gameData';

interface ChampionDetailProps {
  championId: string;
  onClose: () => void;
}

interface ChampionLoadState {
  championId: string;
  status: 'loading' | 'ready' | 'error';
  champion: DataDragonChampionDetail | null;
}

const cleanChampionText = (value: string) => value
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, '&')
  .replace(/\{\{[^}]+\}\}/g, '—')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n[ \t]+/g, '\n')
  .replace(/[ \t]{2,}/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

const getAbilityLabel = (index: number) => ['Q', 'W', 'E', 'R'][index] ?? '•';

const getAbilityStats = (spell: DataDragonChampionSpell) => [
  spell.cooldown?.[0] !== undefined ? `Перезарядка: ${spell.cooldown[0]} с` : null,
  spell.cost?.[0] !== undefined && spell.cost[0] > 0 ? `Стоимость: ${spell.cost[0]}` : null,
  spell.range?.[0] !== undefined && spell.range[0] > 0 ? `Дальность: ${spell.range[0]}` : null
].filter((value): value is string => Boolean(value));

export function ChampionDetail({ championId, onClose }: ChampionDetailProps) {
  const [loadState, setLoadState] = useState<ChampionLoadState>(() => ({
    championId,
    status: 'loading',
    champion: null
  }));
  const displayState = loadState.championId === championId
    ? loadState
    : { championId, status: 'loading' as const, champion: null };

  useEffect(() => {
    let cancelled = false;

    void loadChampionDetail(championId).then((champion) => {
      if (!cancelled) {
        setLoadState({
          championId,
          status: champion ? 'ready' : 'error',
          champion
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [championId]);

  if (displayState.status === 'loading') {
    return (
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(15, 19, 26, 0.98)', padding: '40px', borderRadius: '16px', border: '1px solid #1f2937', color: '#00ffcc', textAlign: 'center', zIndex: 1000 }}>
        Загрузка справочных данных Riot...
      </div>
    );
  }

  if (!displayState.champion) {
    return (
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(15, 19, 26, 0.98)', padding: '32px', borderRadius: '16px', border: '1px solid #1f2937', color: '#ef4444', textAlign: 'center', zIndex: 1000 }}>
        <div style={{ marginBottom: '16px' }}>Не удалось загрузить справочные данные чемпиона.</div>
        <button type="button" onClick={onClose} style={{ background: '#374151', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: '8px', cursor: 'pointer' }}>
          Закрыть
        </button>
      </div>
    );
  }

  const champion = displayState.champion;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'rgba(15, 19, 26, 0.98)', borderRadius: '16px', border: '2px solid #00ffcc', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', padding: '30px', color: '#e0e6ed' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '18px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <img src={getChampionIconUrl(champion.id)} alt={champion.name} style={{ width: '100px', height: '100px', borderRadius: '12px', border: '3px solid #00ffcc' }} />
            <div>
              <h2 style={{ margin: '0 0 5px 0', color: '#fff', fontSize: '32px' }}>{champion.name}</h2>
              <p style={{ margin: 0, color: '#9ca3af', fontSize: '16px', fontStyle: 'italic' }}>{champion.title}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>
            ✕ Закрыть
          </button>
        </div>

        <div style={{ marginBottom: '25px', color: '#94a3b8', fontSize: '11px', lineHeight: 1.5 }}>
          Статическая справка Riot Data Dragon, патч {dragonVersion}. Это не live-таймер и не игровая подсказка.
        </div>

        <div style={{ background: 'rgba(31, 41, 55, 0.5)', padding: '20px', borderRadius: '12px', marginBottom: '25px', border: '1px solid #1f2937' }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
            <img src={getChampionPassiveImageUrl(champion.passive.image.full)} alt={champion.passive.name} style={{ width: '64px', height: '64px', borderRadius: '8px' }} />
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#fbbf24', fontSize: '18px' }}>{champion.passive.name}</h3>
              <p style={{ margin: 0, lineHeight: '1.6', fontSize: '14px', color: '#d1d5db', whiteSpace: 'pre-line' }}>{cleanChampionText(champion.passive.description)}</p>
            </div>
          </div>
        </div>

        <h3 style={{ color: '#00ffcc', margin: '0 0 20px 0', fontSize: '22px' }}>Способности</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {champion.spells.map((spell, index) => {
            const abilityStats = getAbilityStats(spell);

            return (
              <div key={spell.id} style={{ background: 'rgba(31, 41, 55, 0.5)', padding: '15px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', gap: '15px' }}>
                <div style={{ position: 'relative' }}>
                  <img src={getChampionSpellImageUrl(spell.image.full)} alt={spell.name} style={{ width: '64px', height: '64px', borderRadius: '8px', border: '2px solid #00ffcc' }} />
                  <span style={{ position: 'absolute', bottom: '-8px', right: '-8px', background: '#00ffcc', color: '#000', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                    {getAbilityLabel(index)}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '16px' }}>{spell.name}</h4>
                  <p style={{ margin: '0 0 10px 0', lineHeight: '1.5', fontSize: '12px', color: '#9ca3af', whiteSpace: 'pre-line' }}>{cleanChampionText(spell.description)}</p>
                  {abilityStats.length > 0 && (
                    <div style={{ display: 'grid', gap: '3px', fontSize: '11px', color: '#6b7280' }}>
                      {abilityStats.map((stat) => <span key={stat}>{stat}</span>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
