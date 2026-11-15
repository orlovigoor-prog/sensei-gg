# Горячая клавиша Sensei GG в Overwolf

## Что реализовано

Единственный источник настройки — корневой `manifest.json`. В нём объявлена custom hotkey:

- имя: `sensei_toggle_overlay`;
- область: game-specific для League of Legends (`gameId: 5426`);
- действие: background page получает `overwolf.settings.hotkeys.onPressed` и показывает или скрывает declared desktop window;
- default: `Ctrl+X`.

Это не глобальная браузерная клавиша и не обещание, что `Ctrl+X` всегда назначен. Overwolf может снять назначение при конфликте с другой комбинацией.

## Настройка и проверка

1. Откройте настройки Overwolf для Sensei GG и League of Legends.
2. Найдите действие **«Показать или скрыть Sensei GG»**.
3. Проверьте, что у действия есть фактическое назначение; при конфликте выберите разрешённую комбинацию.
4. В реальном запущенном LoL нажмите назначенную комбинацию и убедитесь, что desktop window переключается.

Экран **Настройки** в приложении открывает системный адрес `overwolf://settings/games-overlay?hotkey=sensei_toggle_overlay&gameId=5426`; он не сохраняет локальную имитацию hotkey.

## Ограничения

- Обычный браузер и GitHub Pages не имеют Overwolf API, поэтому game-specific hotkey там намеренно недоступна.
- `Ctrl+Shift+Z` — локальный shortcut для Review Mode/dev-панели. Он не зарегистрирован в manifest и не заменяет проверку custom hotkey.
- Работу hotkey, background page и GEP нельзя принять по браузерному тесту. Нужна ручная проверка в реальном Overwolf runtime без Developer Mode, unpacked mode и whitelist bypass.

## Если окно не переключается

1. Проверьте назначение hotkey в настройках Overwolf: конфликт может оставить её неназначенной.
2. Убедитесь, что запущен именно League of Legends и приложение открыто через штатный runtime Overwolf.
3. Проверьте, что в актуальном пакете используется единственный корневой `manifest.json` с `Hotkeys`, `GameInfo` и окном `background`.
4. Зафиксируйте результат как runtime-ограничение, а не добавляйте browser/localStorage обход.
