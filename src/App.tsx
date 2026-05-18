import { useEffect, useState } from 'react';
import { BackgroundWindow } from './screens/background/BackgroundWindow';
import { DesktopWindow } from './screens/desktop/DesktopWindow';

export default function App() {
  const [currentWindow, setCurrentWindow] = useState<string>('loading');

  useEffect(() => {
    // Если открыли в обычном браузере
    if (typeof overwolf === 'undefined') {
      setCurrentWindow('desktop');
      return;
    }

    // Запрашиваем имя текущего окна у Overwolf
    overwolf.windows.getCurrentWindow((result) => {
      if (result.success && result.window && result.window.name) {
        const windowName = result.window.name;
        
        // Если это фоновое окно — включаем фон
        if (windowName === 'background') {
          setCurrentWindow('background');
        } else {
          // Для ВСЕХ остальных окон (desktop, MainWindow и т.д.) принудительно включаем интерфейс
          setCurrentWindow('desktop');
        }
      } else {
        // Запасной вариант на случай сбоя API Overwolf
        setCurrentWindow('desktop');
      }
    });
  }, []);

  if (currentWindow === 'background') {
    return <BackgroundWindow />;
  }

  if (currentWindow === 'desktop') {
    return <DesktopWindow />;
  }

  return (
    <div style={{ 
      color: '#00ffcc', 
      backgroundColor: '#0f131a', 
      height: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      fontFamily: 'sans-serif',
      fontSize: '18px',
      fontWeight: 'bold'
    }}>
      Инициализация Sensei GG...
    </div>
  );
}
