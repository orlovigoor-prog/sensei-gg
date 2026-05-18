# Настройка GitHub и подача заявки на Production API Key

## 📋 Шаг 1: Подготовка проекта для GitHub

### 1.1 Инициализация Git репозитория

```bash
# Если ещё не инициализировано
git init

# Добавь все файлы
git add .

# Первый коммит
git commit -m "Initial commit: Sensei GG - AI League of Legends Coach"
```

### 1.2 Создай репозиторий на GitHub

1. Перейди на https://github.com/new
2. Имя репозитория: `sensei-gg`
3. Description: `AI-powered League of Legends coach with real-time match analysis`
4. Visibility: **Public** (обязательно!)
5. Не создавай README (.gitignore и LICENSE уже есть)
6. Нажми **"Create repository"**

### 1.3 Отправь код на GitHub

```bash
# Добавь удалённый репозиторий (замени `ваш-ник` на твой GitHub ник)
git remote add origin https://github.com/ваш-ник/sensei-gg.git

# Отправь код
git branch -M main
git push -u origin main
```

---

## 🔑 Шаг 2: Подача заявки на Production API Key

### 2.1 Перейди в панель разработчика

1. Открой https://developer.riotgames.com/dashboard
2. Авторизуйся через Riot аккаунт
3. Нажми **"Submit API Key Request"** или **"Request Production Access"**

### 2.2 Заполни форму заявки

#### Application Name:
```
Sensei GG
```

#### Application Description:
```
Sensei GG is a personal AI coach application for League of Legends that provides real-time match analysis, lobby tracking, and player statistics. The app uses advanced AI to give players instant advice during games, helps them track lobby information for 5x5 matches, and allows searching for any player's statistics across all regions.

Key Features:
- Real-time AI analysis during matches
- 5x5 lobby tracking with player information
- Player search and statistics across all regions
- Champion mastery and ability details

The application is built for personal use and educational purposes to help League of Legends players improve their gameplay through AI-powered insights.
```

#### URL to your application:
```
https://github.com/ваш-ник/sensei-gg
```

#### How will you use the Riot API?
```
The application will use Riot API to:
1. Fetch real-time match data to provide AI-powered advice during games
2. Retrieve lobby information to help players understand their opponents and teammates
3. Allow users to search for player statistics and track their progress
4. Display champion information and mastery data

All API calls are made directly from the client to Riot API servers. No data is stored or transmitted to third-party servers. The application respects all rate limits and follows Riot Games Developer Policy.
```

#### How will you share the data with users?
```
Data is displayed exclusively to the authenticated user who requested it. The application does not store, share, or publish any Riot API data. All information is shown in real-time and is not persisted on any server. User data remains private and is only visible to the user themselves.
```

#### Why do you need production access?
```
Development API keys have limitations that prevent proper testing and usage:
1. Development keys are often deactivated without notice
2. Rate limits are too restrictive for a smooth user experience
3. Some endpoints may not be fully accessible

Production access is needed to:
- Provide reliable service to users
- Test all features comprehensively
- Ensure consistent performance with appropriate rate limits
- Build a stable application for the League of Legends community

This application is intended for personal use and as a learning project. I understand and agree to comply with all Riot Games Developer Terms of Use and Policies.
```

### 2.3 Прикрепи скриншоты

Сделай скриншоты приложения:
1. Главный экран с вкладками
2. Вкладка "Поиск" с результатами
3. Вкладка "Лобби"
4. Вкладка "AI Советы"

Прикрепи их к заявке (если есть возможность).

---

## ⏱️ Шаг 3: Ожидай рассмотрения

- **Время рассмотрения**: 3-7 рабочих дней
- **Ответ придёт на email**, привязанный к Riot аккаунту
- **Могут задать уточняющие вопросы** — отвечай быстро и подробно

---

## ✅ Шаг 4: После одобрения

### 4.1 Получи Production API Key

1. Перейди в https://developer.riotgames.com/dashboard
2. Скопируй новый Production API Key
3. Сохрани его в безопасном месте

### 4.2 Обновите приложение

```typescript
// В файлах:
// - src/screens/desktop/DesktopWindow.tsx
// - src/screens/search/SearchScreen.tsx
// - src/services/riotApi.ts

// Замени development ключ на production:
const productionApiKey = 'твой-production-ключ';
```

### 4.3 Протестируй

Проверь все функции с новым ключом:
- Поиск игроков
- Трекер лобби
- Все регионы

---

## 📝 Важно!

### Riot Games Developer Policy:

✅ **Делай:**
- Указывай "Riot Games" в приложении
- Соблюдай rate limits
- Храни API ключи безопасно
- Используй данные только по назначению

❌ **Не делай:**
- Не продавай данные Riot Games
- Не храни данные дольше необходимо
- Не используй для коммерческих целей без лицензии
- Не нарушай Terms of Use

### Rate Limits для Production Keys:
- **100 запросов в 2 минуты** (на регион)
- **Более высокие лимиты** чем у development keys
- **Применяются к каждому routing value** (na1, euw1, и т.д.)

---

## 🆘 Если заявку отклонили

Частые причины отказа:
1. **Репозиторий не публичный** — сделай его public
2. **Недостаточно деталей** — переделай заявку с подробностями
3. **Нет README** — создай подробное описание
4. **Подозрение на коммерцию** — подчёркивай что это учебный проект

**Что делать:**
1. Получи обратную связь от Riot
2. Исправь замечания
3. Подожди 7 дней
4. Отправь новую заявку

---

## 📞 Поддержка

Если вопросы по заявке:
- Email: developer-support@riotgames.com
- Forum: https://boards Riotgames.com/en/developer

---

Удачи! 🚀
