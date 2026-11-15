# Публикация и runtime-приёмка Sensei GG в Overwolf

> Этот документ описывает только штатный путь Overwolf Native / Web App. Не используйте Developer Mode, unpacked extensions, неподписанные OPK или обход ограничений доступа.

## Текущий технический статус

- Sensei GG является Overwolf Native Web App: в корневом `manifest.json` задано `"type": "WebApp"`.
- Единственный manifest находится в корне проекта и копируется в release artifact Vite-конфигурацией.
- В приложении есть desktop window, background lifecycle, game targeting для League of Legends (`5426`) и game-specific hotkey.
- Исходники и browser/verifier-проверки уже можно проверять без production build. Их результаты не заменяют приёмку внутри Overwolf.
- В репозитории нет установленной или опубликованной reviewer/store-версии Sensei GG. Поэтому реальный GEP, назначение hotkey и окна нельзя принять из браузера.

## Обязательный путь к первой штатной проверке

### 1. Подать идею public app

Войдите в Overwolf Account и подайте app proposal через [форму Overwolf](https://dev.overwolf.com/app-idea-form).

В заявке укажите:

- **Framework:** Overwolf Native / Web App.
- **Game:** League of Legends.
- **Public value:** безопасный контекст лобби, privacy-aware представление участников и post-game review; приложение не даёт live coaching и не использует неразрешённые игровые данные.
- **Riot compliance:** приложите `RIOT_REVIEW_GUIDE.md`, ограничения Solo/Duo privacy и принцип fail-closed для live roster.
- **Visible UI:** desktop window существует и показывает приложение; это важно, потому что Overwolf не одобряет приложения, работающие только в background.
- **Монетизация:** public app должен использовать официальные Overwolf Ads, Overwolf App Subscriptions на Tebex или оба механизма. На момент написания эта интеграция в Sensei GG ещё требует настройки store, plan ID и server-side webhook/entitlement flow; не заявляйте её завершённой раньше времени.

Одобрение идеи и выдача разрешённого developer access от DevRel — официальный процесс Overwolf, а не whitelist bypass. До него нельзя устанавливать локальный архив как тестовую версию.

### 2. Закрыть release blockers до первой подачи сборки

1. Настройте выбранный официальный механизм монетизации:
   - для подписок — Tebex store, Overwolf subscription setup, premium plan ID и защищённую server-side обработку entitlement/webhook;
   - либо добавьте и проверьте Overwolf Ads в соответствии с Advertising Policy.
2. Убедитесь, что `meta.name` и `meta.author` не меняются между версиями: они определяют UID приложения.
3. Package icons уже подготовлены в `public/` и указаны в canonical manifest:
   - `icon.png` и `icon-gray.png`: PNG 256×256, каждый меньше 30 KB;
   - `launcher-icon.ico`: ICO с размерами 16×16, 32×32, 48×48 и 256×256, меньше 150 KB.
   При смене брендинга сохраните эти ограничения и обновите все три файла вместе.
4. Перед созданием release candidate проверьте корневой `manifest.json` по актуальной [Overwolf schema](https://raw.githubusercontent.com/overwolf/community-gists/master/overwolf-manifest-schema.json).
5. Сохраните evidence автоматических проверок из `DEVELOPMENT.md`, а также подготовьте скриншоты desktop window, hotkey settings и post-game flow.

### Riot production application and site verification

Для League of Legends Overwolf попросит приложить скриншот Riot production approval с тем же описанием продукта. Riot требует работающий публичный прототип, Privacy Policy, Terms of Service и verification token на доступном URL.

- Статический prototype: `https://orlovigoor-prog.github.io/sensei-gg/`.
- Policy pages: `privacy-policy.html` и `terms-of-service.html` находятся в `public/` и публикуются вместе с Pages artifact.
- Когда Riot Portal выдаст или подтвердит verification token, он должен быть в `public/riot.txt`; после GitHub Pages deploy проверочный URL будет `https://orlovigoor-prog.github.io/sensei-gg/riot.txt`.
- Не размещайте Riot API key в `riot.txt`, source code, Vite variables или OPK. Ключ остаётся только на защищённом server-side runtime.

### 3. Создать и подать release candidate

Для этой ветки не запускайте production build и не изменяйте существующую ignored-директорию `dist`. Когда release candidate будет одобрен для упаковки, создайте его из чистого checkout в CI или отдельной release-рабочей копии.

1. Соберите release artifact штатной командой проекта.
2. Убедитесь, что artifact включает `manifest.json` в корне, entry HTML, bundle и все manifest assets.
3. Упакуйте **содержимое** artifact в ZIP с обычным уровнем сжатия; `manifest.json` должен находиться в корне архива.
4. Переименуйте архив в `.opk` и проверьте его через VirusTotal: Overwolf не принимает OPK с предупреждениями.
5. Подайте актуальный OPK через [официальную форму первичной QA-подачи](https://wkf.ms/3KL8b1m), приложив описания, screenshots и policy evidence.

Не устанавливайте этот локальный OPK двойным кликом, пока нет разрешённого штатного канала Overwolf: для неподготовленных/не-store OPK это требует developer whitelist и не является заменой QA-процесса.

### 4. Использовать штатный Testing channel

После успешной initial QA Overwolf выдаёт доступ к Developer Console. Там можно загрузить QA-approved build в **Testing channel** и установить его штатным способом по выданной Overwolf ссылке/каналу. Только после этого появляется допустимая среда для ручной runtime-приёмки без unpacked mode.

## Обязательная ручная runtime-приёмка

На установленной через Testing channel или Store сборке проверьте:

1. Ровно один background lifecycle controller и запуск canonical root manifest.
2. Выданные GEP permissions и доступность requested League of Legends features.
3. Назначение game-specific hotkey в настройках Overwolf, событие `onPressed` и переключение declared desktop window.
4. Поведение overlay в full-screen и windowed League of Legends, включая Alt+Tab, DPI и разрешения из [чеклиста Overwolf](https://dev.overwolf.com/ow-native/guides/test-your-app/how-to-test-your-app).
5. Live roster только при полном реальном 5×5 наборе с уникальными ролями и local player; при неполных данных — отсутствие частичного roster.
6. Solo/Duo masking: non-party игроки не раскрываются и не открываются для lookup.
7. Post-game scoreboard только из реальных данных; AI доступен только после игры.
8. Отсутствие console errors, утечек background processes и неконтролируемого network traffic.

Сохраните видео и screenshots этой проверки для QA и Riot review.

## Что не является допустимой проверкой

- `Load unpacked extension`, Developer Mode, Developer client ради обхода ограничений или ручной whitelist bypass.
- Установка старого `.zip`/`.opk` как замена Testing channel.
- Проверка GEP, hotkey или roster в обычном браузере.
- Выдача fixture/review data за реальные данные.

## Официальные источники

- [Overwolf Native overview](https://dev.overwolf.com/ow-native/getting-started/overview/)
- [App idea and approval roadmap](https://dev.overwolf.com/ow-native/getting-started/project-roadmap)
- [Release and QA process](https://dev.overwolf.com/ow-native/getting-started/release-your-app)
- [Manifest validation](https://dev.overwolf.com/ow-native/reference/manifest/validate-your-manifest-json)
- [Runtime testing checklist](https://dev.overwolf.com/ow-native/guides/test-your-app/how-to-test-your-app)
