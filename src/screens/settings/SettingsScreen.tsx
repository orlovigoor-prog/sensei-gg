import { useState } from 'react';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store';
import { clearAiHistoryEntries } from '../../store/aiHistorySlice';
import { clearAiReviewHistory } from '../../services/aiReviewHistoryStorage';
import {
  applyWindowSizePreset,
  getStoredWindowSizePreset,
  getWindowSizeOption,
  WINDOW_SIZE_OPTIONS,
  WINDOW_SIZE_STORAGE_KEY,
  type WindowSizePreset
} from '../../services/windowSize';
import { isOverwolfAvailable } from '../../services/overwolfBridge';

const settingsCardStyle = {
  background: 'linear-gradient(180deg, rgba(22, 29, 42, 0.96), rgba(15, 19, 26, 0.98))',
  padding: '20px',
  borderRadius: '14px',
  border: '1px solid #1f2937',
  marginBottom: '20px',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.03)'
} as const;

const settingsSectionTitleStyle = {
  color: '#f3f4f6',
  margin: 0,
  fontSize: '18px',
  letterSpacing: '0.01em'
} as const;

const settingsSectionHintStyle = {
  margin: '6px 0 0 0',
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: 1.5
} as const;

export function SettingsScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [windowSizePreset, setWindowSizePreset] = useState<WindowSizePreset>(getStoredWindowSizePreset());
  const [saved, setSaved] = useState(false);
  const [reviewHistoryCleared, setReviewHistoryCleared] = useState(false);
  const overwolfAvailable = isOverwolfAvailable();

  // Сохранение настроек
  const saveSettings = () => {
    localStorage.setItem(WINDOW_SIZE_STORAGE_KEY, windowSizePreset);
    applyWindowSizePreset(windowSizePreset);
    window.dispatchEvent(new CustomEvent('sensei-window-size-updated', { detail: windowSizePreset }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const clearStoredAiReviews = () => {
    clearAiReviewHistory();
    dispatch(clearAiHistoryEntries());
    setReviewHistoryCleared(true);
    window.setTimeout(() => setReviewHistoryCleared(false), 2500);
  };

  return (
    <div style={{ 
      padding: '16px', 
      color: '#e0e6ed',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      height: '100%',
      overflow: 'auto',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ 
        color: '#f3efe7', 
        marginBottom: '6px', 
        fontSize: '24px',
        marginBlockStart: '0',
        letterSpacing: '0.03em'
      }}>
        Настройки
      </h2>

      <p style={{
        margin: '0 0 22px 0',
        color: '#6b7280',
        fontSize: '13px',
        lineHeight: 1.6,
        maxWidth: '520px'
      }}>
        Персональные параметры интерфейса, горячих клавиш и размера окна без лишних системных блоков.
      </p>

      {/* Горячие клавиши */}
      <div style={settingsCardStyle}>
        <div style={{ marginBottom: '18px' }}>
          <h3 style={settingsSectionTitleStyle}>
            Горячие клавиши
          </h3>
          <p style={settingsSectionHintStyle}>
            Назначение управляется только штатными настройками Overwolf для League of Legends.
          </p>
        </div>

        <div style={{ marginBottom: 0 }}>
          <div style={{ padding: '12px', borderRadius: '10px', background: overwolfAvailable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(148, 163, 184, 0.08)', border: `1px solid ${overwolfAvailable ? 'rgba(16, 185, 129, 0.28)' : 'rgba(148, 163, 184, 0.22)'}` }}>
            <div style={{ color: '#f8fafc', fontSize: '14px', fontWeight: 'bold', marginBottom: '6px' }}>Показать или скрыть Sensei GG</div>
            <div style={{ color: '#9ca3af', fontSize: '12px', lineHeight: 1.55 }}>
              {overwolfAvailable
                ? 'По умолчанию: Ctrl+X. Фактическая комбинация и её доступность определяются Overwolf; конфликт может оставить hotkey неназначенным.'
                : 'В обычном браузере game-specific hotkey недоступен. Здесь не сохраняется имитация глобальной комбинации.'}
            </div>
            {overwolfAvailable && (
              <button
                onClick={() => window.location.assign('overwolf://settings/games-overlay?hotkey=sensei_toggle_overlay&gameId=5426')}
                style={{ marginTop: '12px', padding: '9px 12px', background: '#1f2937', color: '#f8fafc', border: '1px solid #475569', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                Открыть настройки Overwolf
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Оверлей */}
      <div style={settingsCardStyle}>
        <div style={{ marginBottom: '18px' }}>
          <h3 style={settingsSectionTitleStyle}>
            Оверлей
          </h3>
          <p style={settingsSectionHintStyle}>
            Настройка читаемости и плотности интерфейса под твой экран.
          </p>
        </div>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            color: '#9ca3af', 
            fontSize: '14px', 
            marginBottom: '8px' 
          }}>
            Прозрачность фона
          </label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="85"
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: '#00ffcc'
            }}
          />
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '12px', 
            color: '#6b7280',
            marginTop: '5px'
          }}>
            <span>Прозрачный</span>
            <span>Полупрозрачный</span>
            <span>Непрозрачный</span>
          </div>
        </div>

        <div>
          <label style={{ 
            display: 'block', 
            color: '#9ca3af', 
            fontSize: '14px', 
            marginBottom: '8px' 
          }}>
            Размер окна
          </label>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '10px' 
          }}>
            {WINDOW_SIZE_OPTIONS.map((option) => {
              const isActive = windowSizePreset === option.preset;

              return (
                <button
                  key={option.preset}
                  onClick={() => setWindowSizePreset(option.preset)}
                  style={{
                    padding: '12px 10px',
                    background: isActive
                      ? 'linear-gradient(180deg, #00ffcc, #34d399)'
                      : 'rgba(31, 41, 55, 0.92)',
                    color: isActive ? '#0f131a' : '#d1d5db',
                    border: isActive ? '1px solid transparent' : '1px solid #374151',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: isActive ? 'bold' : 'normal',
                    fontSize: '13px',
                    boxShadow: isActive ? '0 10px 24px rgba(0, 255, 204, 0.14)' : 'none'
                  }}
                >
                  {option.label} ({option.width}x{option.height})
                </button>
              );
            })}
          </div>
          <p style={{ margin: '10px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
            Сейчас выбрано: {getWindowSizeOption(windowSizePreset).width}x{getWindowSizeOption(windowSizePreset).height}
          </p>
        </div>
      </div>

      {/* О приложении */}
      <div style={settingsCardStyle}>
        <div style={{ marginBottom: '18px' }}>
          <h3 style={settingsSectionTitleStyle}>
            О приложении
          </h3>
          <p style={settingsSectionHintStyle}>
            Коротко о продукте и его текущей сборке.
          </p>
        </div>
        
          <div style={{ display: 'grid', gap: '10px', fontSize: '14px', color: '#9ca3af' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(15, 19, 26, 0.72)', border: '1px solid #1f2937' }}>
            <span style={{ color: '#6b7280' }}>Версия</span>
            <strong style={{ color: '#f3f4f6', fontWeight: 600 }}>0.1.0</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(15, 19, 26, 0.72)', border: '1px solid #1f2937' }}>
            <span style={{ color: '#6b7280' }}>Разработчик</span>
            <strong style={{ color: '#f3f4f6', fontWeight: 600 }}>oLiERo / Sensei.GG</strong>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(15, 19, 26, 0.72)', border: '1px solid #1f2937', display: 'grid', gap: '10px' }}>
            <span style={{ color: '#6b7280' }}>Данные и документы</span>
            <span style={{ fontSize: '12px', lineHeight: 1.55 }}>
              Сохранённая история AI-разборов остаётся в локальном storage этого приложения. Её можно удалить в любой момент.
            </span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={clearStoredAiReviews}
                style={{ padding: '8px 10px', background: '#1f2937', color: '#d1d5db', border: '1px solid #475569', borderRadius: '7px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}
              >
                {reviewHistoryCleared ? 'История удалена' : 'Удалить историю AI-разборов'}
              </button>
              <a href="https://orlovigoor-prog.github.io/sensei-gg/privacy-policy.html" target="_blank" rel="noreferrer" style={{ color: '#5eead4', fontSize: '12px' }}>
                Privacy Policy
              </a>
              <a href="https://orlovigoor-prog.github.io/sensei-gg/terms-of-service.html" target="_blank" rel="noreferrer" style={{ color: '#5eead4', fontSize: '12px' }}>
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Кнопка сохранения */}
      <div style={{ 
        marginTop: '24px', 
        display: 'flex', 
        gap: '12px',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        paddingTop: '6px',
        paddingBottom: '4px',
        boxSizing: 'border-box',
        width: '100%',
        borderTop: '1px solid rgba(31, 41, 55, 0.85)'
      }}>
        <button
          onClick={() => {
            setWindowSizePreset(getStoredWindowSizePreset());
          }}
          style={{
            padding: '12px 22px',
            background: '#1f2937',
            color: '#9ca3af',
            border: '1px solid #374151',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '136px',
            flex: '1 1 160px',
            maxWidth: '180px'
          }}
        >
          Отменить
        </button>
        <button
          onClick={saveSettings}
          style={{
            padding: '12px 22px',
            background: '#00ffcc',
            color: '#0f131a',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px',
            minWidth: '136px',
            flex: '1 1 160px',
            maxWidth: '180px'
          }}
        >
          {saved ? 'Сохранено' : 'Сохранить'}
        </button>
      </div>
    </div>
  );
}
