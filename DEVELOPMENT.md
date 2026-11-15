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

2. Для локальной разработки добавь Riot API ключ в `.env` для локального backend:
```env
RIOT_API_KEY=RGAPI-your-key-here
```

Пользовательский ввод ключа из интерфейса отключен, клиент не должен использовать `VITE_RIOT_API_KEY`.

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
- `GET /api/riot/profile-search?region=ru&summonerName=nickname` для безопасного profile lookup через локальный backend
- `GET /api/lol/meta/champion-insight?champion=Aatrox&role=TOP` для серверного снимка тира и контрпиков; endpoint принудительно использует `rank=all`, Ranked Solo/Duo и current-patch contract, а без доступного снимка клиент не подменяет данные демо-каталогом
- `GET /api/subscription/config` для scaffolding Overwolf/Tebex integration
- `GET /api/subscription/entitlements` для локального dev entitlement state
- `GET /api/subscription/dev-state` для просмотра активного локального сценария подписки
- `POST /api/subscription/dev-state` для переключения `free` / `premium` без UI
- `DELETE /api/subscription/dev-state` для возврата к `SUBSCRIPTION_DEV_PLAN` из `.env`
- `GET /api/subscription/diagnostics` для readiness-диагностики перед тестами в Overwolf
- `GET /api/subscription/foundation-diagnostics` для агрегированного snapshot по subscription + AI history + premium capabilities
- `GET /api/subscription/foundation-fixtures` для списка готовых named fixtures
- `GET /api/subscription/foundation-orchestrations` для каталога multi-layer foundation orchestration presets
- `GET /api/subscription/foundation-sync-matrix` для каталога step-by-step readiness matrix сценариев
- `GET /api/subscription/foundation-test-cases` для единого каталога dry-run / automated test case bundles
- `POST /api/subscription/foundation-fixture` для установки комплексного test scenario одним запросом
- `POST /api/subscription/foundation-orchestration` для применения связанного identity/session + foundation сценария одним запросом
- `POST /api/subscription/foundation-sync-matrix` для применения одного readiness-combination сценария под automated tests
- `DELETE /api/subscription/foundation-fixture` для сброса fixture-сценария в baseline
- `GET /api/account-session/config` для foundation-контракта identity/session state
- `GET /api/account-session/dev-state` для просмотра локального identity/session сценария
- `GET /api/account-session/presets` для каталога готовых identity/session named presets
- `POST /api/account-session/dev-state` для симуляции authenticated user / session token / account id без UI
- `DELETE /api/account-session/dev-state` для сброса identity/session сценария
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

Пример применения orchestration preset:
```bash
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-orchestration -H "Content-Type: application/json" -d "{\"orchestration\":\"premium-account-linked-ready\"}"
```

Примеры промежуточных orchestration preset-сценариев:
```bash
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-orchestration -H "Content-Type: application/json" -d "{\"orchestration\":\"account-linkage-dry-run\"}"
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-orchestration -H "Content-Type: application/json" -d "{\"orchestration\":\"persistence-readiness-dry-run\"}"
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-orchestration -H "Content-Type: application/json" -d "{\"orchestration\":\"identity-authenticated-token-pending\"}"
```

Примеры sync matrix сценариев:
```bash
curl http://127.0.0.1:8787/api/subscription/foundation-sync-matrix
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-sync-matrix -H "Content-Type: application/json" -d "{\"matrix\":\"linkage-ready\"}"
curl -X POST http://127.0.0.1:8787/api/subscription/foundation-sync-matrix -H "Content-Type: application/json" -d "{\"matrix\":\"full-sync-ready\"}"
```

Matrix catalog и apply-response теперь также отдают machine-readable metadata:
- `stage`
- `expectedReadiness`
- `blockingReason`
- `testAssertions.entitlements`
- `testAssertions.purchaseAvailability`
- `testAssertions.persistenceEligibility`
- `testAssertions.readinessGates`

Это нужно для будущих automated tests, чтобы проверять не только выставленное состояние, но и ожидаемый readiness gate без ручной интерпретации.

`GET /api/subscription/foundation-test-cases` дополнительно отдает:
- как применить test case
- как его валидировать
- как вернуть baseline
- expected assertions как source of truth для dry-run и automated checks
- fixture, sync-matrix и orchestration bundles в одном machine-readable каталоге
- grouping metadata для automated selection: `bundleFamily`, `covers`, `recommendedFor`
- relationship metadata для orchestration order и deduplication: `dependencies`, `supersedes`, `equivalentTo`
- deterministic `automationSequence` для будущих no-UI automation runs: порядок, phase, default selection и machine-readable skip reasons

Пример identity/session сценария:
```bash
curl -X POST http://127.0.0.1:8787/api/account-session/dev-state -H "Content-Type: application/json" -d "{\"authenticated\":true,\"sessionTokenReady\":true,\"accountId\":\"ow-dev-user-001\",\"scenario\":\"authenticated-session-dry-run\"}"
```

Пример применения identity/session preset:
```bash
curl -X POST http://127.0.0.1:8787/api/account-session/dev-state -H "Content-Type: application/json" -d "{\"preset\":\"identity-session-ready\"}"
```

### Сборка для Overwolf:
```bash
npm run build
```

### Обновление мета-снимка

Статические ресурсы Riot Data Dragon и мета-статистика обновляются раздельно. `dataDragonVersion` в `game-data.config.json` задаёт иконки и локализованные описания. Актуальность tier- и counterpick-снимков определяется официальным Riot Data Dragon realm: его build (например, `16.22.1`) нормализуется до игрового patch (`16.22`) и передаётся в Lolalytics как `patch=16.22`. Realm по умолчанию — `na`; для серверного окружения его можно явно задать через `LOL_META_RIOT_REALM`.

Перед обновлением сначала проверь последнюю версию через официальный endpoint Data Dragon и после изменения конфига запусти `npm run verify:game-data`. Для полного серверного снимка текущего игрового patch используй:

```bash
npm run meta:update-tiers
npm run meta:coverage-tiers
npm run meta:update-counterpicks
npm run meta:coverage-counterpicks
npm run verify:meta-patch
```

`meta:update-tiers` запрашивает официальный Riot realm, принимает только текущий game patch и получает пять role-specific tier-list страниц с контрактом `tier=all`, `patch=<current-game-patch>`. Перед публикацией каждая страница должна явно подтвердить тот же patch в HTML, а снимок должен иметь полное server-rendered покрытие каждой роли (не менее 50 строк источника), без невалидных или повторяющихся matrix-строк. `meta:update-counterpicks` применяет тот же patch-contract к build и counter pages и требует ровно пять role-valid контрпиков на строку. После выхода нового patch старый snapshot не выдаётся: пока полный снимок нового patch не собран, tier остаётся `—`, а контрпики скрываются. Возраст снимка не заменяет проверку patch identity. `meta:coverage-tiers` и `meta:coverage-counterpicks` только печатают статус текущего patch-contract. Клиентский runtime scraping намеренно не используется.

#### Ежедневное автоматическое обновление

`.github/workflows/refresh-lol-meta.yml` ежедневно запускает `npm run meta:daily-update` в изолированном GitHub Actions runner. [Официальный график Riot](https://support-leagueoflegends.riotgames.com/hc/en-us/articles/360018987893-Patch-Schedule-League-of-Legends) указывает, что патчи обычно выходят по средам в Pacific Time, но допускает переносы и не задаёт единого точного часа. Поэтому календарь используется только для дополнительной попытки: job выполняется ежедневно в `19:17 UTC` и повторно по средам в `23:17 UTC`. Единственный источник решения об обновлении — текущий build из официального Riot Data Dragon realm, а не расписание.

Оркестратор сначала сравнивает realm build со статическим конфигом и обоими полными снимками. Если все три уже относятся к тому же build, он ничего не записывает и не обращается к Lolalytics. При смене build или неполном снимке он проверяет доступность Data Dragon champion/item ресурсов, обновляет `game-data.config.json`, получает новый tier list и все counterpick role rows, затем повторно выполняет coverage, game-data, patch-contract, lobby-domain, lint и production build проверки. Создавать PR разрешено только после успешного завершения этого набора и повторной проверки опубликованных файлов. При недоступном или неполном Lolalytics наборе job завершается с ошибкой, PR не создаётся, а `main` и опубликованные данные остаются нетронутыми.

Для локальной диагностической проверки доступны:

```bash
npm run verify:daily-lol-meta-update
npm run meta:daily-update -- --dry-run
npm run meta:daily-update
```

Последняя команда изменяет рабочие файлы при обнаружении обновления, поэтому в production используется только внутри изолированного CI job. Ручной запуск с `--force` выполняет полный refresh даже без смены build.

Workflow требует разрешений `contents: write` и `pull-requests: write` для `GITHUB_TOKEN`; он создаёт или обновляет ветку `automation/lol-meta-refresh`, а не пушит в `main`. После merge существующий `deploy-pages.yml` пересобирает только статический GitHub Pages. Workflow не развёртывает и не конфигурирует API runtime. Если Data Dragon добавляет нового чемпиона, а локальные `champions.ts` или `champion-role-matrix.json` требуют ручного обновления, `verify:game-data` не пропустит PR — это намеренный stop-the-line, а не публикация неполного каталога.

Foundation verification helpers:
```bash
npm run verify:foundation-catalog
npm run verify:foundation-smoke
npm run verify:foundation-matrix
npm run verify:foundation-all
```

- `verify:foundation-catalog` проверяет catalog builder, consistency rules и deterministic `automationSequence` без запуска полного backend.
- `verify:foundation-smoke` проверяет live foundation endpoints через локальный server на `http://127.0.0.1:8787`.
- `verify:foundation-matrix` выбирает representative cases по явному `verificationRole`, а catalog builder гарантирует, что каждый required role матчит ровно один case. Текущие роли: `matrix-premium-fixture`, `matrix-session-gate`, `matrix-orchestration-readiness-gate`.
- `verify:foundation-all` последовательно прогоняет catalog verify, build, smoke checks и matrix verification.

### Проверки без production build

Для изменений frontend/политик не используйте `verify:foundation-all`: он вызывает `npm run build`. Вместо него выполните:

```bash
npx tsc -b
npm run lint
npm run verify:overwolf-scoreboard
npm run verify:player-privacy
npm run verify:game-data
npm run verify:meta-patch
npm run verify:daily-lol-meta-update
```

`verify:overwolf-scoreboard` проверяет wrapped live-client payload, строгий 5×5 roster, локального игрока, уникальность ролей и отсутствие вымышленных rank/WR/mastery/history. `verify:player-privacy` проверяет masking и запрет lookup для non-party игроков в Ranked Solo/Duo.

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
│   ├── gameData/           # Статический справочник Riot Data Dragon
│   └── riotApi.ts          # Общие типы профиля и матчей Riot
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
2. Открой URL Vite в обычном браузере для нейтрального fallback; без `VITE_AI_REVIEW_ENDPOINT` не должно быть localhost/API-запросов и обращения к `overwolf`.
3. Нажми `Ctrl+Shift+Z` для Review Mode / dev-панели
4. Используй симуляцию лобби для тестов. Review Mode остается временным демонстрационным слоем и должен быть удален после green light от Riot/Overwolf для реальных тестов.
5. Перед изменениями в demo lobby запускай `npm run verify:lobby-domain`, чтобы проверить role-aware пулы и наличие counterpick rows.

### Production:
1. Собирай через `npm run build`
2. Проверяй пакет в реальном штатном Overwolf runtime без Developer Mode, unpacked mode и whitelist bypass.
3. Вручную проверь canonical manifest, background lifecycle, GEP features, assigned custom hotkey, desktop toggle, 5×5 roster и post-game scoreboard.

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
- ✅ Role-aware demo lobby и проверка domain correctness

### Future:
- ⏳ Production-доступ к Riot API через серверный backend после одобрения Riot
- ⏳ Уведомления о начале игры
- ⏳ Анализ пиков/банов
- ⏳ История матчей с Riot API
- ⏳ Поиск игроков по никнейму
- ⏳ Полное удаление Review Mode после одобрения Riot/Overwolf

---

## 📞 Поддержка

При возникновении проблем:
1. Проверь логи в консоли браузера (F12)
2. Убедись, что Riot API ключ задан в `.env` для локальной разработки
3. Проверь, что ключ активен и соответствует окружению
