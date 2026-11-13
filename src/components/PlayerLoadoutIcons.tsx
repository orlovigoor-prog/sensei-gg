import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
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
}

interface LoadoutTooltipState {
  label: string;
  anchorElement: HTMLElement;
}

const VIEWPORT_MARGIN = 12;
const TOOLTIP_GAP = 7;
const TOOLTIP_FONT_FAMILY = 'system-ui, -apple-system, sans-serif';
const TOOLTIP_FONT_SIZE = 12;
const TOOLTIP_FONT_WEIGHT = 700;
const TOOLTIP_HORIZONTAL_PADDING = 6;
const TOOLTIP_BORDER_WIDTH = 2;
const MAX_TOOLTIP_WIDTH = 196;

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

const getTooltipWidth = (label: string) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    return Math.ceil(label.length * 7.1) + (TOOLTIP_HORIZONTAL_PADDING * 2) + TOOLTIP_BORDER_WIDTH;
  }

  context.font = `${TOOLTIP_FONT_WEIGHT} ${TOOLTIP_FONT_SIZE}px ${TOOLTIP_FONT_FAMILY}`;
  return Math.ceil(context.measureText(label).width) + (TOOLTIP_HORIZONTAL_PADDING * 2) + TOOLTIP_BORDER_WIDTH;
};

const getViewportTooltipStyle = (label: string, anchorElement: HTMLElement): CSSProperties => {
  const anchorRect = anchorElement.getBoundingClientRect();
  const anchorWidth = anchorElement.offsetWidth || anchorRect.width || 1;
  const scale = clamp(anchorRect.width / anchorWidth, 0.5, 1.5);
  const availableWidth = (window.innerWidth - (VIEWPORT_MARGIN * 2)) / scale;
  const tooltipWidth = Math.min(MAX_TOOLTIP_WIDTH, availableWidth, getTooltipWidth(label));
  const visualWidth = tooltipWidth * scale;
  const left = clamp(anchorRect.left + ((anchorRect.width - visualWidth) / 2), VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - visualWidth);
  const opensDownward = window.innerHeight - anchorRect.bottom >= anchorRect.top;

  return {
    position: 'fixed',
    left: `${left}px`,
    ...(opensDownward
      ? { top: `${anchorRect.bottom + TOOLTIP_GAP}px`, transformOrigin: 'top left' }
      : { bottom: `${window.innerHeight - anchorRect.top + TOOLTIP_GAP}px`, transformOrigin: 'bottom left' }),
    width: `${tooltipWidth}px`,
    transform: `scale(${scale})`
  };
};

export function PlayerLoadoutIcons({ spells, runes, size = 18, compact = false }: PlayerLoadoutIconsProps) {
  const [tooltip, setTooltip] = useState<LoadoutTooltipState | null>(null);
  const keystoneIcon = getKeystoneIconUrl(runes.keystoneId, runes.primaryStyleId);
  const secondaryRuneIcon = getRuneStyleIconUrl(runes.secondaryStyleId);
  const borderRadius = Math.max(4, Math.round(size * 0.28));

  const showTooltip = (label: string, anchorElement: HTMLElement) => setTooltip({ label, anchorElement });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '3px' : '4px', flexShrink: 0, position: 'relative' }}>
      <div style={{ display: 'grid', gridTemplateRows: `repeat(2, ${size}px)`, gap: compact ? '2px' : '3px' }}>
        {spells.slice(0, 2).map((spellId) => (
          <img
            key={`spell-${spellId}`}
            src={getSummonerSpellIconUrl(spellId)}
            alt={getSummonerSpellLabel(spellId)}
            onMouseEnter={(event) => showTooltip(getSummonerSpellLabel(spellId), event.currentTarget)}
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
            onMouseEnter={(event) => showTooltip(`Ключевая руна: ${getKeystoneLabel(runes.keystoneId, runes.primaryStyleId)}`, event.currentTarget)}
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
            onMouseEnter={(event) => showTooltip(`Вторая ветка: ${getRuneStyleLabel(runes.secondaryStyleId)}`, event.currentTarget)}
            onMouseLeave={() => setTooltip(null)}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
            style={{ ...iconFrameStyle, width: `${size}px`, height: `${size}px`, borderRadius: '999px', padding: '1px', boxSizing: 'border-box', cursor: 'help' }}
          />
        )}
      </div>
      {tooltip && createPortal(
        <div style={{
          ...getViewportTooltipStyle(tooltip.label, tooltip.anchorElement),
          zIndex: 1100,
          padding: `4px ${TOOLTIP_HORIZONTAL_PADDING}px`,
          borderRadius: '7px',
          background: 'rgba(8, 12, 22, 0.98)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 8px 18px rgba(0, 0, 0, 0.35)',
          color: '#f8fafc',
          fontFamily: TOOLTIP_FONT_FAMILY,
          fontSize: `${TOOLTIP_FONT_SIZE}px`,
          fontWeight: TOOLTIP_FONT_WEIGHT,
          lineHeight: 1.25,
          boxSizing: 'border-box',
          whiteSpace: 'normal',
          pointerEvents: 'none'
        }}>
          {tooltip.label}
        </div>,
        document.body
      )}
    </div>
  );
}
