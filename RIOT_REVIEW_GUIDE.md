# Riot Review Guide - Sensei GG

## Публичная точка входа

- Репозиторий: https://github.com/orlovigoor-prog/sensei-gg
- Публичный прототип: https://orlovigoor-prog.github.io/sensei-gg/
- Privacy Policy: https://orlovigoor-prog.github.io/sensei-gg/privacy-policy.html
- Terms of Service: https://orlovigoor-prog.github.io/sensei-gg/terms-of-service.html
- Краткий англоязычный пакет для внешнего ревью: [REVIEW.md](REVIEW.md)
- Прямая ссылка после публикации в `main`: https://github.com/orlovigoor-prog/sensei-gg/blob/main/REVIEW.md

Репозиторий публичный и не требует collaborator access. Этот файл содержит подробный сценарий policy review; `REVIEW.md` — короткая точка входа для проверяющего.

## Цель документа

Этот файл нужен для быстрого ревью функционала Sensei GG со стороны Riot.

Sensei GG не пытается давать запрещенные live-подсказки во время матча. Основная ценность продукта:

- безопасная сводка по лобби там, где это допустимо
- просмотр профиля игрока
- post-game AI review только после завершения матча
- review/demo flow для демонстрации интерфейса без маскировки демо под реальные live-данные

## Что именно делает приложение

### 1. Lobby summary
- Принимает реальный состав только при строгой валидации live-client snapshot: 5×5, локальный игрок и по одной роли каждого типа на команду.
- Не заявляет pre-game/champ-select roster. Если snapshot неполный, состав не синхронизируется частично.
- Не фабрикует rank, win rate, mastery или историю: неизвестные данные скрыты или показаны как `—`.
- Tier и контрпики возможны только из полного текущего server-side snapshot (`rank=all`, Ranked Solo/Duo); при неполном или старом patch snapshot tier остаётся `—`, контрпики скрыты.
- Не показывает live tactical coaching.

### 2. Profile screen
- В обычном режиме до поиска показывает нейтральное пустое состояние.
- Позволяет искать только разрешённый профиль игрока.
- Показывает ранг и связанные данные профиля.
- В review/demo-сценариях демо-данные явно помечены как демо.
- Публичная GitHub Pages-версия до одобрения production key намеренно показывает только labelled synthetic profile и не отправляет Riot ID в сеть. Riot не разрешает публичное использование development key; production HTTPS backend и его activation gates описаны в [PRODUCTION_PROFILE_BACKEND.md](PRODUCTION_PROFILE_BACKEND.md).

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
- В Ranked Solo/Duo не раскрывает и не ищет non-party ally или enemy; разрешены только локальный игрок и подтверждённый party ally.
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
1. На публичной странице открыть экран профиля.
2. Убедиться, что synthetic profile явно помечен как demo, а Riot ID lookup объяснён как disabled до production-key approval.
3. После отдельного production backend deployment проверить lookup только по утверждённому production review-сценарию и без раскрытия ключа.

### Сценарий C. Post-game AI review
1. Довести матч до post-game состояния или включить Review Mode.
2. Открыть вкладку AI review.
3. Убедиться, что review доступен только после завершения матча.
4. Убедиться, что текст review опирается только на реальные scoreboard-метрики матча; неизвестные значения остаются `—` и не восстанавливаются косвенно.

### Сценарий D. Review Mode
1. Нажать `Ctrl+Shift+Z`, чтобы включить Review Mode.
2. Последовательно показать lobby, profile и post-game AI review.
3. Проверить маркировку `DEMO / REVIEW` и то, что simulated/demo data визуально отделены от реальных данных.

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

- Riot допускает работающий prototype или clear mock-up для review, но запрещает public consumption через personal/development key.
- Dev key недостаточен для стабильной проверки сценариев и не может обслуживать public Pages lookup.
- После approval production backend даст предсказуемый доступ к Riot API без раскрытия ключа в клиенте.
- Приложение строится вокруг безопасного UX, где ценность находится в post-game разборе, а не в live advantage.

## Перед отправкой на review проверить еще раз

- [ ] demo state везде явно помечен
- [ ] нет live tactical coaching в active game
- [ ] нет enemy timers
- [ ] нет lookup непартийных союзников в Ranked Solo/Duo champ select
- [ ] Real roster не показывается без строгого 5×5 live-client snapshot; pre-game roster не заявляется
- [ ] Custom hotkey, GEP events и lifecycle проверены вручную в реальном Overwolf runtime
- [ ] AI review доступен только post-game
- [ ] API keys не видны в UI
- [ ] `.env` не попал в git
- [ ] есть свежие скриншоты
- [ ] есть короткое demo video
- [ ] в форме Riot/Overwolf указан актуальный контакт автора
