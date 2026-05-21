# 🚀 Инструкция по загрузке в Overwolf

## Подготовка к публикации

### 1. Сборка приложения

```bash
npm run build
```

Это создаст папку `dist/` со всеми файлами.

### 2. Структура для Overwolf

Файлы должны быть в папке `dist/`:
```
dist/
├── index.html
├── manifest.json          (Overwolf manifest)
├── icon.png               (128x128 PNG иконка)
└── assets/
    └── *.js
```

### 3. manifest.json для Overwolf

Открыть `manifest.json` в корне проекта и убедиться:

```json
{
  "manifest_version": 1,
  "type": "WebApp",
  "meta": {
    "name": "SenseiGG",
    "version": "1.0.0.0",
    "minimum-overwolf-version": "0.195.0",
    "author": "Sensei",
    "description": "AI-powered League of Legends coach",
    "icon": "icon.png"
  },
  "data": {
    "start_window": "desktop",
    "windows": {
      "desktop": {
        "file": "index.html",
        "transparent": true,
        "resizable": true,
        "size": {
          "width": 800,
          "height": 600
        }
      }
    }
  },
  "required_capabilities": ["windows"],
  "overwolf_apis": [
    "Windows",
    "KeyboardShortcuts",
    "GameEvents"
  ]
}
```

## Загрузка в Overwolf Developer Hub

### Шаг 1: Зарегистрируйся как разработчик

1. Перейди на https://overwolf.github.io/
2. Нажми "Developer Hub" или "Sign In"
3. Войди через Discord или GitHub
4. Заполни профиль разработчика

### Шаг 2: Создай новое приложение

1. В Developer Hub нажми **"Create New App"**
2. Заполни форму:
   - **App Name**: SenseiGG
   - **App Type**: Overlay / Game Companion
   - **Game**: League of Legends
   - **Description**: AI-powered LoL coach with real-time match analysis

### Шаг 3: Загрузи файлы

1. В разделе **"App Files"** нажми **"Upload New Version"**
2. Выбери папку `dist/` или ZIP архив с файлами
3. Загрузи `icon.png` (128x128)

### Шаг 4: Настрой разрешения

В разделе **"Permissions"** укажи:
- ✅ `windows` - для управления окнами
- ✅ `keyboardShortcuts` - для горячих клавиш
- ✅ `gameEvents` - для отслеживания игры

### Шаг 5: Отправь на проверку

1. Перейди в раздел **"App Settings"**
2. Заполни:
   - Поддержка (email)
   - Политика конфиденциальности
   - Скриншоты приложения
3. Нажми **"Submit for Review"**

## Тестирование в Developer Mode

### Установка тестовой версии

1. Открой Overwolf
2. Нажми **F12** (или Alt+F12)
3. Перейди в **"Developer Console"**
4. Введи:
   ```
   overwolf.apps.settings.setDeveloperMode(true)
   ```

### Запуск приложения

**Способ 1: Через Overwolf**
1. Перейди в "My Apps"
2. Найди SenseiGG
3. Нажми **"Run"**

**Способ 2: Через Developer Hub**
1. В Developer Hub выбери своё приложение
2. Нажми **"Run App"**

## Горячие клавиши

| Комбинация | Действие |
|------------|----------|
| `Ctrl + X` | Открыть/закрыть оверлей |
| `Ctrl + Shift + Z` | Режим разработчика (симуляции) |

## Полезные команды

### Перезагрузка приложения
```
Ctrl + R (в окне приложения)
```

### Открыть консоль разработчика
```
F12 (в окне приложения)
```

### Проверка manifest
```
В консоли:
overwolf.apps.getInfo()
```

## Частые проблемы

### ❌ "App not found"
**Решение:** Проверь `manifest.json` в корне проекта

### ❌ "Icon not loading"
**Решение:** Убедись, что `icon.png` существует и 128x128

### ❌ "Windows not opening"
**Решение:** Проверь `start_window` в manifest

### ❌ "API permissions denied"
**Решение:** Добавь нужные API в `overwolf_apis`

## Публикация в Store

После одобрения проверки:
1. Ты получишь email от Overwolf
2. Приложение появится в Overwolf Store
3. Пользователи смогут установить его

## Поддержка

- **Documentation**: https://overwolf.github.io/docs
- **Discord**: https://discord.gg/overwolf
- **Email**: developers@overwolf.com

---

**Удачи с публикацией!** 🚀
