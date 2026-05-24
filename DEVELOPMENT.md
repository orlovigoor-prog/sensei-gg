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

2. Для локальной разработки добавь Riot API ключ в `.env`:
```env
VITE_RIOT_API_KEY=RGAPI-your-key-here
```

Пользовательский ввод ключа из интерфейса отключен.

### Запуск:
```bash
npm run dev
```

### Локальный AI / subscription foundation server:
```bash
npm run ai:server
```

Сервер поддерживает:
- `POST /api/review` для post-game AI review
- `GET /api/subscription/config` для scaffolding Overwolf/Tebex integration
- `GET /api/subscription/entitlements` для локального dev entitlement state
- `GET /api/subscription/dev-state` для просмотра активного локального сценария подписки
- `POST /api/subscription/dev-state` для переключения `free` / `premium` без UI
- `DELETE /api/subscription/dev-state` для возврата к `SUBSCRIPTION_DEV_PLAN` из `.env`
- `GET /api/subscription/diagnostics` для readiness-диагностики перед тестами в Overwolf
- `GET /api/subscription/foundation-diagnostics` для агрегированного snapshot по subscription + AI history + premium capabilities
- `GET /api/subscription/foundation-fixtures` для списка готовых named fixtures
- `POST /api/subscription/foundation-fixture` для установки комплексного test scenario одним запросом
- `DELETE /api/subscription/foundation-fixture` для сброса fixture-сценария в baseline
- `GET /api/premium-persistence/config` для account-linked persistence foundation contract
- `GET /api/review-history/config` для foundation-конфига AI history
- `GET /api/premium-capabilities/config` для foundation-stub progression / weekly reports
- `GET /api/premium-capabilities/dev-state` для просмотра readiness override по progression / weekly reports
- `POST /api/premium-capabilities/dev-state` для локальной симуляции foundation sync readiness без UI
- `DELETE /api/premium-capabilities/dev-state` для сброса readiness override в baseline

Пример переключения локального сценария подписки:
```bash
curl -X POST http://127.0.0.1:8787/api/subscription/dev-state -H "Content-Type: application/json" -d "{\"plan\":\"premium\",\"scenario\":\"overwolf-local-test\"}"
```

Пример переключения foundation readiness для premium capabilities:
```bash
curl -X POST http://127.0.0.1:8787/api/premium-capabilities/dev-state -H "Content-Type: application/json" -d "{\"progressionSyncReady\":true,\"weeklyReportsSyncReady\":true,\"scenario\":\"foundation-sync-dry-run\"}"
```

Пример комплексного foundation fixture-сценария:
```bash
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-fixture -H "Content-Type: application/json" -d "{\"plan\":\"premium\",\"progressionSyncReady\":true,\"weeklyReportsSyncReady\":true,\"accountLinkageSyncReady\":true,\"scenario\":\"overwolf-premium-dry-run\"}"
```

Пример применения готового named fixture:
```bash
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-fixture -H "Content-Type: application/json" -d "{\"preset\":\"premium-account-linked\"}"
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
- ✅ Постматч AI-разбор
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
2. Убедись, что Riot API ключ задан в `.env` для локальной разработки
3. Проверь, что ключ активен и соответствует окружению
