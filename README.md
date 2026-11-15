# Sensei GG - League of Legends Overlay Assistant

**Русский** | **English**

> **Riot / external review:** start with [REVIEW.md](REVIEW.md). The public source repository is https://github.com/orlovigoor-prog/sensei-gg and the public prototype is https://orlovigoor-prog.github.io/sensei-gg/.
> The public prototype is a static **Review Mode**: it starts with a labelled synthetic 5×5 scenario, includes phase controls and a local post-game review flow, and intentionally has no live Riot ID lookup.
>
> **Legal:** [Privacy Policy](https://orlovigoor-prog.github.io/sensei-gg/privacy-policy.html) and [Terms of Service](https://orlovigoor-prog.github.io/sensei-gg/terms-of-service.html).
>
> **Product boundaries:** [POROFESSOR_SCOPE.md](POROFESSOR_SCOPE.md) documents which public companion-app capability categories Sensei GG retains, defers, or intentionally excludes.

---

## 🎮 О проекте

**Sensei GG** — это оверлей-помощник для League of Legends на базе Overwolf с упором на безопасную аналитику и постматч-разбор:

- **Постматч AI-анализ** — разбор завершённой игры и рекомендации для роста
- **Состав 5×5** — только подтверждённые Overwolf live-client данные в loading/in-game; pre-game roster не заявляется
- **Профиль игрока** — нейтральный экран поиска без подмены реального профиля демо-данными
- **Review Mode** — явно маркированная демонстрация с синтетическими данными для повторяемой проверки UI
- **Горячая клавиша Overwolf** — custom, game-specific hotkey для League of Legends; её фактическое назначение подтверждается в runtime
- **Официальный справочник Riot** — чемпионы, предметы и иконки из Data Dragon с единым зафиксированным патчем

---

## 🌟 Основные функции

### ⚡ Постматч AI-анализ
- Разбор завершённого матча после окончания игры
- Короткие рекомендации по KDA, фарму и участию в боях
- Фокус на обучении игрока, а не на live-подсказках во время матча
- Поддержка backend endpoint для LLM с безопасным локальным fallback

### 👤 Профиль игрока
- Поиск профиля и обзор ранга в одном экране
- До поиска отображается нейтральное пустое состояние
- Демо-данные доступны только в Review Mode и постоянно помечены `REVIEW / DEMO DATA`

### 🎯 Трекер лобби
- Полный состав принимается только при строгой проверке 5×5, локального игрока и уникальных ролей
- Неизвестные rank, win rate, mastery и история не восстанавливаются косвенно и отображаются как `—` или скрываются
- Tier и контрпики показываются только из полного server-side снимка текущего патча; источник Lolalytics использует `rank=all`, Ranked Solo/Duo и не вызывается из клиента
- В Ranked Solo/Duo раскрываются и ищутся только локальный игрок и подтверждённые party ally

### ⌨️ Горячие клавиши
- В manifest задана game-specific custom hotkey `sensei_toggle_overlay` с default `Ctrl+X`
- Overwolf может оставить комбинацию неназначенной из-за конфликта; настройка и проверка выполняются в Overwolf
- Обычный браузер не эмулирует глобальную или игровую hotkey

### 🖥️ Компактный оверлей
- Несколько пресетов размера окна
- Полупрозрачный фон
- Не перекрывает игровой интерфейс

### 🌐 Публичная страница для review
- GitHub Pages запускается как явно маркированный **Public Review Mode** с синтетическими 5×5 roster, profile и match events
- Панель Review Mode позволяет переключать демонстрационные фазы и сгенерировать локальный post-game разбор
- Это не live-матч и не реальный профиль: live Riot ID search на статической странице отключён намеренно
- Реальный profile lookup требует отдельный защищённый backend; Pages не хранит ключи и не обращается к localhost или Riot API

---

## 🛠️ Технологии

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **API**: Riot Games API
- **UI**: Custom React components

---

## 🚀 Быстрый старт

### Требования
- Node.js 18+
- npm или yarn

### Установка

```bash
# Клонируйте репозиторий
git clone https://github.com/orlovigoor-prog/sensei-gg.git

# Перейдите в директорию проекта
cd sensei-gg

# Установите зависимости
npm install

# Скопируйте пример переменных окружения
cp .env.example .env

# При локальной разработке Riot ключ задается только через backend .env
# Пользовательский ввод ключа из интерфейса отключен
# RIOT_API_KEY=RGAPI-your-dev-key

# Запустите dev сервер
npm run dev

# Опционально: запустите локальный AI review server
# set AI_PROVIDER_API_KEY=your_key
# set AI_OPENROUTER_API_KEY=your_openrouter_key
# set AI_OPENROUTER_MODEL=deepseek/deepseek-v4-flash:free
# set VITE_AI_REVIEW_ENDPOINT=http://127.0.0.1:8787/api/review
# set OVERWOLF_SUBSCRIPTION_STORE_ID=your_store_id
# set OVERWOLF_SUBSCRIPTION_PREMIUM_PLAN_ID=12345
# set SUBSCRIPTION_DEV_PLAN=free
# npm run ai:server

# По умолчанию локальный server уже умеет читать AI_PROVIDER_* из .env
# и может работать с DeepSeek через https://api.deepseek.com/chat/completions
# Если основной provider недоступен, server может уйти в backup через OpenRouter
# Для подготовки monetization layer сервер также умеет отдавать subscription foundation endpoints:
# - http://127.0.0.1:8787/api/subscription/config
# - http://127.0.0.1:8787/api/subscription/entitlements

# Соберите для production
npm run build

# Пакет Overwolf использует единый корневой manifest.json.
# Перед выпуском проверьте manifest, lifecycle и hotkey в реальном Overwolf runtime
# штатным способом платформы — без Developer Mode, unpacked mode и whitelist bypass.
```

---

## 🎮 Горячие клавиши

### По умолчанию:
- **Ctrl + X** — default для game-specific Overwolf hotkey, если Overwolf не снял назначение из-за конфликта
- **Ctrl + Shift + Z** — локальный shortcut Review Mode; это не Overwolf/game hotkey

### Настройка:
В Overwolf откройте **Настройки** → **Горячие клавиши** для Sensei GG и проверьте фактическое назначение. В браузере назначение недоступно намеренно.

Подробная инструкция: [OVERWOLF_SHORTCUTS.md](OVERWOLF_SHORTCUTS.md)

---

## 📂 Структура проекта

```
sensei-gg/
├── src/
│   ├── components/        # React компоненты
│   ├── screens/           # Экраны приложения
│   ├── services/          # API сервисы
│   ├── store/             # Redux store
│   └── main.tsx           # Точка входа
├── public/                # Статические файлы
├── .env.example           # Пример переменных окружения
├── vite.config.ts         # Конфигурация Vite
└── package.json           # Зависимости
```

---

## 🔐 Безопасность

- Ключ Riot не выводится в интерфейс приложения
- Ключ LLM не должен храниться в `VITE_` переменных или клиентском коде
- Для реального AI review используется backend endpoint, а клиент получает только готовый текст разбора
- При недоступности backend Sensei GG падает обратно на локальный post-game fallback без раскрытия секретов
- Если LLM возвращает кривой JSON или markdown-обертку, server пытается нормализовать ответ и при неудаче падает обратно на локальный fallback
- Если основной AI provider недоступен, локальный server может попробовать OpenRouter backup и только потом уйти в локальный fallback

- Для локальной разработки Riot API ключ хранится только в `.env` и читается локальным backend
- Пользователь не имеет доступа к Riot API ключу через интерфейс приложения
- Локальный server привязан только к loopback, разрешает только точные локальные/настроенные origins и не использует wildcard CORS
- Profile proxy ограничивает частоту запросов, кратко кэширует успешные совпадающие запросы и не отдаёт клиенту внутренние host/path или сообщения Riot
- Этот server — development-инструмент с dev-state маршрутами, а не готовый production backend; для production нужен отдельный аутентифицированный HTTPS backend или платформенный способ хранения ключа
- Клиент не ходит в Riot API напрямую: профильный поиск идет через локальный backend proxy
- Все данные Riot profile lookup получаются через локальный backend без раскрытия ключа в клиенте
- AI-блок используется для постматч-разбора, а не для live-советов во время активной игры
- В Ranked Solo/Duo в champ select нельзя раскрывать имена непартийных союзников
- В Ranked Solo/Duo non-party ally и enemy не получают lookup; их имена маскируются во всех не-demo состояниях
- Обычный браузер без `VITE_AI_REVIEW_ENDPOINT` остаётся автономным: не делает localhost/API-запросов и не обращается к `overwolf`
- GitHub Pages собирается CI с публичным boolean `VITE_PUBLIC_REVIEW_MODE=true`: он включает только синтетический UI-сценарий, не является секретом и не разрешает Riot API/profile lookup
- Соответствие [Riot Games Developer Policy](https://developer.riotgames.com/policies/general)

---

## 📝 Лицензия

Этот проект создан исключительно для личных и образовательных целей.

**Riot Games** trademarks и логотипы принадлежат Riot Games, Inc.

---

## 🙏 Благодарности

- **Riot Games** — за публичное API
- **League of Legends Community** — за вдохновение

---

## 📞 Контакт для review

Публичные шаблонные контакты намеренно не публикуются. Для заявки Riot или Overwolf укажите актуальный контакт автора в форме подачи; порядок локальной проверки и границы продукта описаны в [REVIEW.md](REVIEW.md).

---

## 📜 Disclaimer

Это приложение не спонсируется, не поддерживается и не одобрено Riot Games. Riot Games не несёт ответственности за этот проект.

Приложение использует Riot Games API в соответствии с [Terms of Use](https://developer.riotgames.com/legal).

---

## 🎯 Roadmap

- [x] Базовое приложение
- [x] Постматч AI-анализ
- [x] Трекер лобби
- [x] Объединенный экран профиля и поиска
- [x] Оверлей для Overwolf
- [x] Горячие клавиши
- [x] Role-aware demo lobby и backend snapshot контрпиков
- [ ] Уведомления о начале игры
- [ ] Анализ пиков/банов
- [ ] История матчей
- [ ] Production-доступ к Riot API через серверный backend после одобрения Riot
- [ ] Удаление Review Mode после одобрения Riot/Overwolf и переход на реальные тестовые данные

---

Создано для игроков League of Legends, которым нужен аккуратный разбор без лишнего шума.
