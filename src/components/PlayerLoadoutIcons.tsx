import { getKeystoneIconUrl, getRuneStyleIconUrl, getSummonerSpellIconUrl } from '../services/gameData';
import type { RuneLoadout } from '../services/gameData';

const iconFrameStyle = {
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'rgba(255, 255, 255, 0.04)',
  display: 'block',
  objectFit: 'cover'
} as const;

interface PlayerLoadoutIconsProps {
  spells: number[];
  runes: RuneLoadout;
  size?: number;
  compact?: boolean;
}

export function PlayerLoadoutIcons({ spells, runes, size = 18, compact = false }: PlayerLoadoutIconsProps) {
  const keystoneIcon = getKeystoneIconUrl(runes.keystoneId, runes.primaryStyleId);
  const secondaryRuneIcon = getRuneStyleIconUrl(runes.secondaryStyleId);
  const borderRadius = Math.max(4, Math.round(size * 0.28));

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '3px' : '4px', flexShrink: 0 }}>
      <div style={{ display: 'grid', gridTemplateRows: `repeat(2, ${size}px)`, gap: compact ? '2px' : '3px' }}>
        {spells.slice(0, 2).map((spellId) => (
          <img
            key={`spell-${spellId}`}
            src={getSummonerSpellIconUrl(spellId)}
            alt={`spell-${spellId}`}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ ...iconFrameStyle, width: `${size}px`, height: `${size}px`, borderRadius: `${borderRadius}px` }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateRows: `repeat(2, ${size}px)`, gap: compact ? '2px' : '3px' }}>
        {keystoneIcon && (
          <img
            src={keystoneIcon}
            alt="Основная руна"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ ...iconFrameStyle, width: `${size}px`, height: `${size}px`, borderRadius: '999px', padding: '1px', boxSizing: 'border-box' }}
          />
        )}
        {secondaryRuneIcon && (
          <img
            src={secondaryRuneIcon}
            alt="Вторая ветка рун"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ ...iconFrameStyle, width: `${size}px`, height: `${size}px`, borderRadius: '999px', padding: '1px', boxSizing: 'border-box' }}
          />
        )}
      </div>
    </div>
  );
}
