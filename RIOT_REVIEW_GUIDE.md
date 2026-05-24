# Riot Review Guide - Sensei GG

## Цель документа

Этот файл нужен для быстрого ревью функционала Sensei GG со стороны Riot.

Sensei GG не пытается давать запрещенные live-подсказки во время матча. Основная ценность продукта:

- безопасная сводка по лобби там, где это допустимо
- просмотр профиля игрока
- post-game AI review только после завершения матча
- review/demo flow для демонстрации интерфейса без маскировки демо под реальные live-данные

## Что именно делает приложение

### 1. Lobby summary
- Показывает состав лобби в safe-формате.
- Использует ранги, винрейт и нейтральные сведения по чемпионам там, где это допустимо.
- Не показывает live tactical coaching.

### 2. Profile screen
- Позволяет искать профиль игрока.
- Показывает ранг и связанные данные профиля.
- В review/demo-сценариях демо-данные явно помечены как демо.

### 3. Post-game AI review
- AI review доступен только после завершения матча.
- Разбор строится вокруг фактов матча: KDA, CS, CS/min, длительность, takedowns и безопасный контекст.
- Если внешний LLM недоступен, приложение переходит на локальный fallback, а не ломает UX.

### 4. Review Mode
- Нужен для демонстрации lobby/profile/post-game flow без обязательного прохождения полного матча.
- Review Mode не должен выдавать simulated data за реальные live-данные.

## Что приложение намеренно НЕ делает

Это критично для policy review.

- Не дает команды игроку во время активного матча.
- Не показывает enemy cooldown timers, ult timers или summoner spell timers.
- Не показывает запрещенные live callouts по позиционированию, объектам или макро-решениям во время игры.
- В Ranked Solo/Duo champ select не раскрывает имена непартийных союзников и не делает их lookup.
- Не маскирует demo/review data под настоящие live данные.

## Статусы внутри приложения

В приложении используется следующая карта состояний:

- `champ-select` -> `Лобби`
- `loading` + `in-game` -> `В игре`
- `post-game` -> `Итоги`

## Как быстро проверить приложение

### Сценарий A. Lobby flow
1. Открыть приложение.
2. Перейти на экран матча/лобби.
3. Убедиться, что отображается safe summary без запрещенных live-подсказок.
4. Проверить, что в Ranked Solo/Duo lookup непартийных союзников не используется.

### Сценарий B. Profile flow
1. Открыть экран профиля.
2. Проверить поиск игрока.
3. Если открыт demo-profile, убедиться, что он явно помечен как демо.

### Сценарий C. Post-game AI review
1. Довести матч до post-game состояния или включить Review Mode.
2. Открыть вкладку AI review.
3. Убедиться, что review доступен только после завершения матча.
4. Убедиться, что текст review опирается на метрики матча, а не на выдуманные live-факты.

### Сценарий D. Review Mode
1. Включить Review Mode.
2. Последовательно показать lobby, profile и post-game AI review.
3. Проверить, что simulated/demo data визуально отделены от реальных данных.

## Что стоит приложить к заявке Riot

Минимальный пакет:

1. Скрин главного окна приложения.
2. Скрин lobby state.
3. Скрин profile screen.
4. Скрин post-game AI review.
5. Скрин Review Mode с явной демо-маркировкой.
6. Короткое видео 1-3 минуты с показом основных сценариев.

## Что должно быть видно на скриншотах и видео

- Что AI используется только post-game.
- Что lobby insights не нарушают policy.
- Что demo/review state не выдается за реальный матч.
- Что приложение помогает игроку разбирать уже завершенную игру, а не подсказывает по ходу активной игры.

## Короткое описание для Riot

Sensei GG is a League of Legends overlay focused on safe lobby visibility, player profile lookup, and post-game review. The application does not provide prohibited real-time tactical coaching during active gameplay. AI is used only for post-game analysis after the match is finished, with clear fallback behavior and no exposure of API secrets in the client UI. Demo and review scenarios are explicitly marked and are not presented as live data.

## Почему production review имеет смысл

- Dev key недостаточен для стабильной проверки сценариев.
- Для нормального review нужен предсказуемый доступ к Riot API.
- Приложение строится вокруг безопасного UX, где ценность находится в post-game разборе, а не в live advantage.

## Перед отправкой на review проверить еще раз

- [ ] demo state везде явно помечен
- [ ] нет live tactical coaching в active game
- [ ] нет enemy timers
- [ ] нет lookup непартийных союзников в Ranked Solo/Duo champ select
- [ ] AI review доступен только post-game
- [ ] API keys не видны в UI
- [ ] `.env` не попал в git
- [ ] есть свежие скриншоты
- [ ] есть короткое demo video

