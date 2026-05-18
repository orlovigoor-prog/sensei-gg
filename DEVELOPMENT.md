# Sensei GG - Development Guide

## 🚀 Быстрый старт

### Установка:
```bash
npm install
```

### Настройка API:
1. Скопируй `.env.example` в `.env`:
```bash
copy .env.example .env
```

2. Добавь свой Riot API ключ в `.env`:
```env
VITE_RIOT_API_KEY=RGAPI-your-key-here
```

### Запуск:
```bash
npm run dev
```

### Сборка для Overwolf:
```bash
npm run build
```

---

## 📋 Соответствие правилам

### Riot Games API Terms of Service:
✅ **Разрешено:**
- Личное использование
- Тестирование и разработка
- Отображение публичных данных

❌ **Запрещено:**
- Коммерческое использование без лицензии
- Продажа данных Riot Games
- Нарушение rate limits (1 запрос/сек для dev ключей)

**Credit Requirement:** 
Приложение должно указывать "Riot Games" в описании ✅

### Overwolf Developer Policy:
✅ **Требуется:**
- Четкое описание функционала
- Privacy Policy (ссылка в manifest)
- Стабильная работа без крашей
- Не запрашивать лишние разрешения

**Resources:**
- [Overwolf Developer Code of Conduct](https://dev.overwolf.com/docs/Developer_Code_of_Conduct)
- [Overwolf Manifest Reference](https://dev.overwolf.com/ow-native/reference/manifest/manifest-json)

---

## 🔐 Безопасность API ключей

### Никогда не делай:
- ❌ Не коммить `.env` в Git
- ❌ Не храни ключи в открытом коде
- ❌ Не используй production ключи на клиенте

### Всегда делай:
- ✅ Используй `.env` для локальной разработки
- ✅ Проверяй `.gitignore` перед коммитом
- ✅ Используй серверный прокси для production
- ✅ Реализуй кэширование для снижения нагрузки

---

## 🏗️ Архитектура

```
src/
├── services/
│   └── riotApi.ts          # Riot API и LCU сервис
├── components/
│   ├── ChampionDetail.tsx  # Детали чемпиона
│   └── PlayerCardWithChampion.tsx
├── screens/
│   ├── desktop/
│   ├── lobby/
│   └── background/
└── store/
    ├── gameSlice.ts
    └── lobbySlice.ts
```

---

## 🧪 Тестирование

### Dev режим:
1. Запусти `npm run dev`
2. Открой в Overwolf Developer Hub
3. Нажми `Ctrl+Shift+D` для dev-панели
4. Используй симуляцию лобби для тестов

### Production:
1. Собирай через `npm run build`
2. Тестируй в Overwolf лаунчере
3. Проверяй логи в Developer Hub

---

## 📦 Зависимости

### Основные:
- `@reduxjs/toolkit` - Управление состоянием
- `react` + `react-dom` - UI фреймворк
- `vite` - Сборка и dev сервер

### Dev dependencies:
- `typescript` - Типизация
- `eslint` - Линтинг
- `vite-plugin-static-copy` - Копирование ассетов

---

## 🎯 Roadmap

### MVP (Текущее):
- ✅ Лобби трекер 5x5
- ✅ Информация о чемпионах
- ✅ ИИ-советы во время игры
- ✅ Статистика игроков

### Future:
- ⏳ Real-time мониторинг через LCU API
- ⏳ Уведомления о начале игры
- ⏳ Анализ пиков/банов
- ⏳ История матчей с Riot API
- ⏳ Поиск игроков по никнейму

---

## 📞 Поддержка

При возникновении проблем:
1. Проверь логи в консоли браузера (F12)
2. Проверь статус API в правом верхнем углу
3. Убедись, что Riot API ключ активен
4. Проверь соответствие `.env` файлу
