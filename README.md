# Sensei GG - AI League of Legends Coach

**Русский** | **English**

---

## 🎮 О проекте

**Sensei GG** — это персональный AI-тренер для League of Legends, который предоставляет:

- **Real-time анализ матча** — мгновенные советы во время игры
- **Трекер лобби 5x5** — полная информация о союзниках и противниках
- **Поиск игроков** — статистика по любому игроку из всех регионов
- **AI-анализ** — умные рекомендации на основе текущей ситуации

---

## 🌟 Основные функции

### ⚡ ИИ-анализ в реальном времени
- Анализ текущей ситуации на карте
- Рекомендации по фарму, позиционированию, таргетам
- KDA и CS мониторинг

### 🔍 Поиск игроков
- Статистика по всем регионам (RU, EUW, NA, KR, и др.)
- WinRate, ранк, история матчей
- Чемпион-мастерство и пиковые способности

### 🎯 Трекер лобби
- 5x5 лобби в реальном времени
- Информация о рангах и винрейте
- Детали чемпионов и способностей

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

# Добавьте ваш Riot API ключ в .env
# VITE_RIOT_API_KEY=RGAPI-ваш-ключ

# Запустите dev сервер
npm run dev

# Соберите для production
npm run build
```

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

- API ключи хранятся в `.env` файле (игнорируется в Git)
- Нет отправки данных на сторонние сервера
- Все данные получаются напрямую из Riot API
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
- [x] ИИ-анализ матча
- [x] Трекер лобби
- [x] Поиск игроков
- [ ] Уведомления о начале игры
- [ ] Анализ пиков/банов
- [ ] История матчей
- [ ] Интеграция с LCU API

---

Made with ❤️ for the League of Legends community

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
