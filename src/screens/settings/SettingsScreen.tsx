import { useState, useEffect, useCallback } from 'react';
import {
  applyWindowSizePreset,
  getStoredWindowSizePreset,
  getWindowSizeOption,
  WINDOW_SIZE_OPTIONS,
  WINDOW_SIZE_STORAGE_KEY,
  type WindowSizePreset
} from '../../services/windowSize';

interface HotkeySettings {
  toggleOverlay: string[];
}

const DEFAULT_HOTKEYS: HotkeySettings = {
  toggleOverlay: ['Control', 'KeyX']
};

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
  const [hotkeys, setHotkeys] = useState<HotkeySettings>(DEFAULT_HOTKEYS);
  const [windowSizePreset, setWindowSizePreset] = useState<WindowSizePreset>(getStoredWindowSizePreset());
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Загрузка настроек при монтировании
  useEffect(() => {
    const savedHotkeys = localStorage.getItem('sensei_hotkeys');
    if (savedHotkeys) {
      try {
        setHotkeys(JSON.parse(savedHotkeys));
      } catch (e) {
        console.error('Failed to load hotkeys:', e);
      }
    }

    setWindowSizePreset(getStoredWindowSizePreset());
  }, []);

  // Сохранение настроек
  const saveSettings = () => {
    localStorage.setItem('sensei_hotkeys', JSON.stringify(hotkeys));
    localStorage.setItem(WINDOW_SIZE_STORAGE_KEY, windowSizePreset);
    applyWindowSizePreset(windowSizePreset);
    window.dispatchEvent(new CustomEvent('sensei-window-size-updated', { detail: windowSizePreset }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    
    // Отправляем сообщение в background script для обновления слушателя
    if ('Overwolf' in window) {
      window.postMessage({ type: 'SENSEI_HOTKEYS_UPDATED', hotkeys }, '*');
    }
  };

  // Запись нажатия клавиши
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (recordingKey === null) return;

    e.preventDefault();
    e.stopPropagation();

    const key = e.code;
    setHotkeys(prev => ({
      ...prev,
      [recordingKey]: [key]
    }));
    setRecordingKey(null);
  }, [recordingKey]);

  useEffect(() => {
    if (recordingKey !== null) {
      window.addEventListener('keydown', handleKeyDown, true);
      return () => window.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [recordingKey, handleKeyDown]);

  // Получение отображаемого имени клавиши
  const getKeyDisplayName = (code: string): string => {
    const keyMap: Record<string, string> = {
      'Control': 'Ctrl',
      'Alt': 'Alt',
      'Shift': 'Shift',
      'Meta': 'Win',
      'KeyX': 'X',
      'KeyC': 'C',
      'KeyV': 'V',
      'KeyB': 'B',
      'Space': 'Пробел',
      'Escape': 'Esc',
      'Enter': 'Enter'
    };
    return keyMap[code] || code.replace('Key', '');
  };

  // Форматирование горячих клавиш для отображения
  const formatHotkey = (keys: string[]): string => {
    return keys.map(getKeyDisplayName).join(' + ');
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
            Быстрый доступ к оверлею без переключения между окнами.
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ 
            display: 'block', 
            color: '#9ca3af', 
            fontSize: '14px', 
            marginBottom: '10px' 
          }}>
            Открыть/закрыть оверлей
          </label>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => setRecordingKey('toggleOverlay')}
              style={{
                padding: '12px 20px',
                background: recordingKey === 'toggleOverlay' 
                  ? '#00ffcc' 
                  : '#1f2937',
                color: recordingKey === 'toggleOverlay' ? '#0f131a' : '#fff',
                border: '1px solid #374151',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: '1 1 220px',
                width: '100%',
                maxWidth: '280px',
                textAlign: 'center'
              }}
            >
              {recordingKey === 'toggleOverlay' 
                ? 'Нажмите нужную комбинацию...' 
                : formatHotkey(hotkeys.toggleOverlay)}
            </button>
            
            <button
              onClick={() => setHotkeys(prev => ({ ...prev, toggleOverlay: DEFAULT_HOTKEYS.toggleOverlay }))}
              style={{
                padding: '12px 16px',
                background: 'rgba(139, 92, 246, 0.2)',
                color: '#a855f7',
                border: '1px solid #a855f7',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              Сброс
            </button>
          </div>
          
          <p style={{ 
            margin: '10px 0 0 0', 
            fontSize: '12px', 
            color: '#6b7280' 
          }}>
            Подсказка: нажмите на кнопку и введите желаемую комбинацию клавиш
          </p>
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
            const savedHotkeys = localStorage.getItem('sensei_hotkeys');
            if (savedHotkeys) {
              setHotkeys(JSON.parse(savedHotkeys));
            }
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
