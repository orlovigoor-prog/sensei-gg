import { useState } from 'react';
import {
  getKeystoneIconUrl,
  getKeystoneLabel,
  getRuneStyleIconUrl,
  getRuneStyleLabel,
  getSummonerSpellIconUrl,
  getSummonerSpellLabel
} from '../services/gameData';
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
  tooltipPlacement?: 'top' | 'bottom';
}

export function PlayerLoadoutIcons({ spells, runes, size = 18, compact = false, tooltipPlacement = 'top' }: PlayerLoadoutIconsProps) {
  const [tooltip, setTooltip] = useState<string | null>(null);
  const keystoneIcon = getKeystoneIconUrl(runes.keystoneId, runes.primaryStyleId);
  const secondaryRuneIcon = getRuneStyleIconUrl(runes.secondaryStyleId);
  const borderRadius = Math.max(4, Math.round(size * 0.28));
  const tooltipOffsetStyle = tooltipPlacement === 'top'
    ? { bottom: 'calc(100% + 7px)' }
    : { top: 'calc(100% + 7px)' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '3px' : '4px', flexShrink: 0, position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateRows: `repeat(2, ${size}px)`, gap: compact ? '2px' : '3px' }}>
        {spells.slice(0, 2).map((spellId) => (
          <img
            key={`spell-${spellId}`}
            src={getSummonerSpellIconUrl(spellId)}
            alt={getSummonerSpellLabel(spellId)}
            title={getSummonerSpellLabel(spellId)}
            onMouseEnter={() => setTooltip(getSummonerSpellLabel(spellId))}
            onMouseLeave={() => setTooltip(null)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ ...iconFrameStyle, width: `${size}px`, height: `${size}px`, borderRadius: `${borderRadius}px`, cursor: 'help' }}
          />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateRows: `repeat(2, ${size}px)`, gap: compact ? '2px' : '3px' }}>
        {keystoneIcon && (
          <img
            src={keystoneIcon}
            alt={getKeystoneLabel(runes.keystoneId, runes.primaryStyleId)}
            title={getKeystoneLabel(runes.keystoneId, runes.primaryStyleId)}
            onMouseEnter={() => setTooltip(`Ключевая руна: ${getKeystoneLabel(runes.keystoneId, runes.primaryStyleId)}`)}
            onMouseLeave={() => setTooltip(null)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ ...iconFrameStyle, width: `${size}px`, height: `${size}px`, borderRadius: '999px', padding: '1px', boxSizing: 'border-box', cursor: 'help' }}
          />
        )}
        {secondaryRuneIcon && (
          <img
            src={secondaryRuneIcon}
            alt={getRuneStyleLabel(runes.secondaryStyleId)}
            title={getRuneStyleLabel(runes.secondaryStyleId)}
            onMouseEnter={() => setTooltip(`Вторая ветка: ${getRuneStyleLabel(runes.secondaryStyleId)}`)}
            onMouseLeave={() => setTooltip(null)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ ...iconFrameStyle, width: `${size}px`, height: `${size}px`, borderRadius: '999px', padding: '1px', boxSizing: 'border-box', cursor: 'help' }}
          />
        )}
      </div>
      {tooltip && (
        <div style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          ...tooltipOffsetStyle,
          zIndex: 20,
          padding: '5px 7px',
          borderRadius: '7px',
          background: 'rgba(8, 12, 22, 0.98)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 8px 18px rgba(0, 0, 0, 0.35)',
          color: '#f8fafc',
          fontSize: '10px',
          lineHeight: 1.25,
          whiteSpace: 'nowrap',
          pointerEvents: 'none'
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}
