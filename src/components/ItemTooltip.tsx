import { createPortal } from 'react-dom';
import type { CSSProperties } from 'react';
import type { ItemCatalogEntry } from '../services/gameData/items';

const getItemStatColor = (stat: string) => {
  const normalized = stat.toLowerCase();

  if (normalized.includes('силы атаки') || normalized.includes('шанса критического удара')) {
    return '#f59e0b';
  }

  if (normalized.includes('силы умений') || normalized.includes('магического')) {
    return '#60a5fa';
  }

  if (normalized.includes('брони') || normalized.includes('сопротивления магии')) {
    return '#fca5a5';
  }

  if (normalized.includes('здоровья')) {
    return '#34d399';
  }

  if (normalized.includes('ускорения умений') || normalized.includes('восстановления маны')) {
    return '#c4b5fd';
  }

  if (normalized.includes('скорости атаки') || normalized.includes('скорости передвижения')) {
    return '#fcd34d';
  }

  if (normalized.includes('вампиризма')) {
    return '#fb7185';
  }

  return '#f8fafc';
};

const getItemStatMarker = (stat: string) => {
  const normalized = stat.toLowerCase();

  if (normalized.includes('силы атаки')) return 'AD';
  if (normalized.includes('силы умений')) return 'AP';
  if (normalized.includes('шанса критического удара')) return 'CRIT';
  if (normalized.includes('брони')) return 'AR';
  if (normalized.includes('сопротивления магии')) return 'MR';
  if (normalized.includes('здоровья')) return 'HP';
  if (normalized.includes('ускорения умений')) return 'AH';
  if (normalized.includes('восстановления маны')) return 'MP';
  if (normalized.includes('скорости атаки')) return 'AS';
  if (normalized.includes('скорости передвижения')) return 'MS';
  if (normalized.includes('вампиризма')) return 'LS';

  return 'STAT';
};

interface ItemTooltipProps {
  item: ItemCatalogEntry;
  fallbackDescription: string;
  positionStyle?: CSSProperties;
  anchorElement?: HTMLElement | null;
  footerLabel?: string;
  showArrow?: boolean;
  arrowStyle?: CSSProperties;
  arrowDirection?: 'up' | 'down';
}

interface ItemTooltipViewportPosition {
  positionStyle: CSSProperties;
  width: number;
  maxHeight: number;
  scale: number;
  transformOrigin: 'top left' | 'bottom left';
}

const TOOLTIP_WIDTH = 272;
const VIEWPORT_MARGIN = 12;
const TOOLTIP_GAP = 10;
const TOOLTIP_FONT_FAMILY = 'system-ui, -apple-system, sans-serif';

const clamp = (value: number, minimum: number, maximum: number) => Math.min(Math.max(value, minimum), maximum);

const getItemTooltipViewportPosition = (anchorElement: HTMLElement): ItemTooltipViewportPosition => {
  const anchorRect = anchorElement.getBoundingClientRect();
  const anchorWidth = anchorElement.offsetWidth || anchorRect.width || 1;
  const scale = clamp(anchorRect.width / anchorWidth, 0.5, 1.5);
  const availableWidth = Math.max(1, window.innerWidth - (VIEWPORT_MARGIN * 2));
  const width = Math.min(TOOLTIP_WIDTH, availableWidth / scale);
  const visualWidth = width * scale;
  const left = clamp(anchorRect.right - visualWidth, VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - visualWidth);
  const availableAbove = Math.max(1, anchorRect.top - VIEWPORT_MARGIN - TOOLTIP_GAP);
  const availableBelow = Math.max(1, window.innerHeight - anchorRect.bottom - VIEWPORT_MARGIN - TOOLTIP_GAP);
  const opensDownward = availableBelow >= availableAbove;

  return {
    positionStyle: opensDownward
      ? { left: `${left}px`, top: `${anchorRect.bottom + TOOLTIP_GAP}px` }
      : { left: `${left}px`, bottom: `${window.innerHeight - anchorRect.top + TOOLTIP_GAP}px` },
    width,
    maxHeight: Math.max(1, Math.floor((opensDownward ? availableBelow : availableAbove) / scale)),
    scale,
    transformOrigin: opensDownward ? 'top left' : 'bottom left'
  };
};

export function ItemTooltip({
  item,
  fallbackDescription,
  positionStyle,
  anchorElement,
  footerLabel = 'СТОИМОСТЬ',
  showArrow = false,
  arrowStyle,
  arrowDirection = 'down'
}: ItemTooltipProps) {
  const hasCosts = typeof item.totalCost === 'number' || typeof item.combineCost === 'number';
  const effectBlocks = item.effectBlocks?.length
    ? item.effectBlocks
    : item.passiveText
      ? [{ title: item.passiveTitle, text: item.passiveText }]
      : [];
  const showTags = effectBlocks.length === 0 && item.tags.length > 0;
  const viewportPosition = anchorElement ? getItemTooltipViewportPosition(anchorElement) : null;
  const usesViewportPosition = Boolean(viewportPosition);

  const tooltip = (
    <div
      style={{
        position: usesViewportPosition ? 'fixed' : 'absolute',
        width: `${viewportPosition?.width ?? TOOLTIP_WIDTH}px`,
        maxHeight: viewportPosition ? `${viewportPosition.maxHeight}px` : undefined,
        padding: '12px',
        borderRadius: '14px',
        background: 'linear-gradient(180deg, rgba(13, 18, 31, 0.98), rgba(8, 12, 22, 0.99))',
        border: '1px solid rgba(96, 165, 250, 0.22)',
        boxShadow: '0 20px 44px rgba(0, 0, 0, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(10px)',
        fontFamily: TOOLTIP_FONT_FAMILY,
        zIndex: usesViewportPosition ? 1100 : 5,
        pointerEvents: 'none',
        overflowX: 'hidden',
        overflowY: viewportPosition ? 'auto' : 'visible',
        boxSizing: 'border-box',
        transform: viewportPosition ? `scale(${viewportPosition.scale})` : undefined,
        transformOrigin: viewportPosition?.transformOrigin,
        ...(viewportPosition?.positionStyle ?? positionStyle)
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
        <div>
          <div style={{ color: '#f8fafc', fontWeight: 700, fontSize: '12px', lineHeight: 1.25 }}>
            {item.name}
          </div>
          <div style={{ color: '#7dd3fc', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' }}>
            Предмет
          </div>
        </div>
      </div>

      {item.shortStats?.length ? (
        <div style={{ display: 'grid', gap: '5px', marginBottom: '10px' }}>
          {item.shortStats.map((stat) => {
            const color = getItemStatColor(stat);
            return (
              <div key={`${item.id}-${stat}`} style={{ display: 'grid', gridTemplateColumns: '34px minmax(0, 1fr)', gap: '8px', alignItems: 'start' }}>
                <span style={{
                  color,
                  fontSize: '8px',
                  lineHeight: 1,
                  fontWeight: 700,
                  padding: '4px 0',
                  borderRadius: '999px',
                  background: 'rgba(148, 163, 184, 0.08)',
                  border: `1px solid ${color}33`,
                  textAlign: 'center',
                  letterSpacing: '0.03em'
                }}>
                  {getItemStatMarker(stat)}
                </span>
                <div style={{ color, fontSize: '11px', lineHeight: 1.35, fontWeight: 600 }}>
                  {stat}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ marginBottom: '10px', color: '#cbd5e1', fontSize: '11px', lineHeight: 1.45 }}>
          {item.description ?? fallbackDescription}
        </div>
      )}

      {effectBlocks.map((effect, index) => (
        <div
          key={`${item.id}-${effect.title ?? 'description'}-${index}`}
          style={{
            marginBottom: '10px',
            padding: '9px 10px',
            borderRadius: '10px',
            background: 'linear-gradient(180deg, rgba(56, 189, 248, 0.08), rgba(59, 130, 246, 0.06))',
            border: '1px solid rgba(96, 165, 250, 0.16)'
          }}
        >
          {effect.title && (
            <div style={{ color: '#93c5fd', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '5px', textTransform: 'uppercase' }}>
              {effect.title}
            </div>
          )}
          <div style={{ color: '#e5e7eb', fontSize: '11px', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
            {effect.text}
          </div>
        </div>
      ))}

      {showTags && (
        <div style={{
          marginBottom: '10px',
          padding: '8px 10px',
          borderRadius: '10px',
          background: 'rgba(148, 163, 184, 0.08)',
          border: '1px solid rgba(148, 163, 184, 0.14)',
          color: '#cbd5e1',
          fontSize: '11px',
          lineHeight: 1.45
        }}>
          Категории: {item.tags.join(', ')}.
        </div>
      )}

      {hasCosts && (
        <div style={{
          margin: '0 -12px -12px',
          padding: '9px 12px',
          borderTop: '1px solid rgba(96, 165, 250, 0.14)',
          background: 'rgba(59, 130, 246, 0.08)',
          borderBottomLeftRadius: '14px',
          borderBottomRightRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '8px',
          alignItems: 'center'
        }}>
          <span style={{ color: '#93c5fd', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em' }}>
            {footerLabel}
          </span>
          <span style={{ color: '#f8fafc', fontSize: '11px', fontWeight: 700 }}>
            {typeof item.totalCost === 'number' ? `${item.totalCost}g` : '--'}
          </span>
        </div>
      )}

      {item.purchasable === false && (
        <div style={{ marginTop: '9px', color: '#fbbf24', fontSize: '10px', lineHeight: 1.4 }}>
          Этот предмет недоступен для покупки в обычном магазине.
        </div>
      )}

      {showArrow && (
        <div
          style={{
            position: 'absolute',
            width: '10px',
            height: '10px',
            background: 'rgba(8, 12, 22, 0.99)',
            ...(arrowDirection === 'down'
              ? {
                  borderRight: '1px solid rgba(96, 165, 250, 0.22)',
                  borderBottom: '1px solid rgba(96, 165, 250, 0.22)',
                  transform: 'translateY(-5px) rotate(45deg)'
                }
              : {
                  borderLeft: '1px solid rgba(96, 165, 250, 0.22)',
                  borderTop: '1px solid rgba(96, 165, 250, 0.22)',
                  transform: 'translateY(5px) rotate(45deg)'
                }),
            ...arrowStyle
          }}
        />
      )}
    </div>
  );

  return usesViewportPosition ? createPortal(tooltip, document.body) : tooltip;
}
