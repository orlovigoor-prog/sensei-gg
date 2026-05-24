# Sensei GG - League of Legends Overlay Assistant

**Русский** | **English**

---

## 🎮 О проекте

**Sensei GG** — это оверлей-помощник для League of Legends на базе Overwolf с упором на безопасную аналитику и постматч-разбор:

- **Постматч AI-анализ** — разбор завершённой игры и рекомендации для роста
- **Трекер лобби 5x5** — безопасная информация о составе лобби
- **Профиль игрока** — единый экран профиля с поиском и демо-сценарием по умолчанию
- **Review Mode** — безопасная демонстрация будущего профиля и post-game flow
- **Настраиваемые горячие клавиши** — открывайте приложение по Ctrl+X в любой момент

---

## 🌟 Основные функции

### ⚡ Постматч AI-анализ
- Разбор завершённого матча после окончания игры
- Короткие рекомендации по KDA, фарму и участию в боях
- Фокус на обучении игрока, а не на live-подсказках во время матча
- Поддержка backend endpoint для LLM с безопасным локальным fallback

### 👤 Профиль игрока
- Поиск профиля и обзор ранга в одном экране
- По умолчанию открыт демо-профиль `DemoProfilePlayer`
- Расширенные блоки профиля явно помечены как демо до production API key

### 🎯 Трекер лобби
- 5x5 лобби с безопасной сводкой по игрокам
- Информация о рангах и винрейте там, где это допустимо
- Нейтральные данные по чемпионам без запрещённых live-callouts

### ⌨️ Горячие клавиши
- **Ctrl + X** — Открыть/закрыть оверлей в игре
- Настраиваемая комбинация в настройках
- Работает даже когда LoL активна

### 🖥️ Компактный оверлей
- Несколько пресетов размера окна
- Полупрозрачный фон
- Не перекрывает игровой интерфейс

---

## 🛠️ Технологии

- **Frontend**: React 18 + TypeScript
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
git clone https://github.com/ваш-ник/sensei-gg.git

# Перейдите в директорию проекта
cd sensei-gg

# Установите зависимости
npm install

# Скопируйте пример переменных окружения
cp .env.example .env

# При локальной разработке ключ задается только через .env
# Пользовательский ввод ключа из интерфейса отключен
# VITE_RIOT_API_KEY=RGAPI-your-dev-key

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

# Для Overwolf
# 1. Откройте Overwolf Developer Console
# 2. Укажите путь к папке dist
# 3. Откройте manifest.json
# 4. Настройте горячие клавиши (см. OVERWOLF_SHORTCUTS.md)
```

---

## 🎮 Горячие клавиши

### По умолчанию:
- **Ctrl + X** — Открыть/закрыть оверлей
- **Ctrl + Shift + D** — Dev-панель (только dev режим)

### Настройка:
Откройте **Настройки** → **Горячие клавиши** и задайте удобную комбинацию.

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

- Для локальной разработки Riot API ключ хранится только в `.env`
- Пользователь не имеет доступа к Riot API ключу через интерфейс приложения
- Для production нужен серверный или платформенный способ хранения ключа
- Нет отправки данных на сторонние сервера
- Все данные получаются напрямую из Riot API
- AI-блок используется для постматч-разбора, а не для live-советов во время активной игры
- В Ranked Solo/Duo в champ select нельзя раскрывать имена непартийных союзников
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

## 📞 Контакты

- **Разработчик**: Ваш никнейм
- **Email**: ваш@email.com
- **Discord**: ваш#0000

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
- [ ] Уведомления о начале игры
- [ ] Анализ пиков/банов
- [ ] История матчей
- [ ] Интеграция с LCU API

---

Создано для игроков League of Legends, которым нужен аккуратный разбор без лишнего шума.
