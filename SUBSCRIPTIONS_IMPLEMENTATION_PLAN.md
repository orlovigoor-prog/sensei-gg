# Sensei GG - Overwolf Subscriptions Implementation Plan

## Цель

Подготовить monetization layer на базе официального Overwolf App Subscriptions API и Tebex без преждевременного внедрения paywall UI.

## Текущая стратегия

- Бесплатный слой остается вокруг safe stats, lobby summary, profile lookup и базовых итогов матча.
- Premium слой строится вокруг post-game AI review, истории разборов и progression insights.
- Покупка и проверка статуса подписки в production должны идти через официальный Overwolf Subscriptions flow.

## Что уже подготовлено

### Frontend foundation
- локальный subscription state
- free/premium gating для AI review
- weekly quota model для free-плана

### Backend foundation
- локальный AI server умеет отдавать subscription config scaffold
- локальный AI server умеет отдавать dev entitlements scaffold
- локальный AI server умеет переключать free/premium dev сценарии через test endpoints
- `.env.example` содержит переменные для будущего Tebex/Overwolf wiring

## План реализации по этапам

### Этап 1. Конфигурация магазина и планов
Нужно подготовить:
- Tebex store для Overwolf app
- public/private keys в Tebex
- Overwolf App Subscriptions setup
- premium package / plan ID
- webhook setup в Tebex по документации Overwolf

### Этап 2. Клиентская интеграция Overwolf API
Нужно добавить сервисный слой, без агрессивного UI:
- вызов `overwolf.profile.generateUserSessionToken()`
- чтение активных подписок через `subscriptions-api.overwolf.com`
- нормализация статусов:
  - ACTIVE
  - PENDING_CANCELLATION
  - EXPIRED
  - CANCELLED
- маппинг plan -> entitlements

### Этап 3. Entitlement synchronization
Нужно связать:
- local subscription state
- Overwolf active plan state
- fallback dev plan for local development

### Этап 4. Premium feature enforcement
После появления реального статуса подписки:
- заменить dev gating на entitlement gating
- free quota оставить только для free users
- premium users получать unlimited AI review, history и progression

### Этап 5. Purchase UX
Отдельно позже:
- `overwolf.profile.subscriptions.inapp.show(planId, theme)`
- subscription screen
- upgrade prompts
- manage subscription entry points

## Production data flow

1. App generates Overwolf user session token.
2. App requests active subscriptions from Overwolf Subscriptions API.
3. Active package state is normalized into Sensei entitlements.
4. Entitlements unlock premium AI capabilities.
5. Local backend remains responsible for AI generation and usage-aware business logic if needed.

## Development flow before production subscription wiring

Пока UI покупки не добавлен, локальная разработка идет так:
- `SUBSCRIPTION_DEV_PLAN=free` или `premium`
- локальный server отдает scaffold через `/api/subscription/config`
- локальный server отдает dev entitlements через `/api/subscription/entitlements`
- локальный server позволяет временно переключать сценарий через `POST /api/subscription/dev-state`
- локальный server отдает readiness-диагностику через `/api/subscription/diagnostics`
- локальный server отдает агрегированную foundation readiness-диагностику через `/api/subscription/foundation-diagnostics`
- локальный server отдает каталог готовых foundation fixtures через `/api/subscription/foundation-fixtures`
- локальный server позволяет выставлять комплексный subscription foundation fixture через `/api/subscription/foundation-fixture`
- локальный server отдает account-linked persistence contract через `/api/premium-persistence/config`
- локальный server отдает premium foundation stub через `/api/premium-capabilities/config`
- локальный server позволяет отдельно симулировать readiness foundation-слоя через `/api/premium-capabilities/dev-state`
- frontend позже будет использовать эти маршруты как dev fallback

## Нужные production env / config values

- `OVERWOLF_SUBSCRIPTION_STORE_ID`
- `OVERWOLF_SUBSCRIPTION_PREMIUM_PLAN_ID`
- Tebex public/private keys в инфраструктуре магазина
- webhook URL по документации Overwolf

## Следующий инженерный шаг

Следующим этапом стоит сделать service layer без UI:
- `src/services/overwolfSubscriptions.ts`
- `src/services/subscriptionEntitlements.ts`
- sync active Overwolf plans -> Redux subscription state

После этого можно будет подключать реальный subscription status без добавления paywall screen.
