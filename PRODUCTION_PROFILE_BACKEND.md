# Production Profile Backend Contract

## Status and activation gate

This document specifies the future HTTPS backend for real Riot ID profile lookup. It is intentionally **not deployed** while the Riot production application is pending.

Riot's public guidance permits a functional prototype or clear mock-up during production-key review, but prohibits operating a public product with a personal/development key. Therefore the GitHub Pages application remains an explicitly labelled synthetic review experience until a production key is approved and this contract has been implemented and verified.

No current local development key, `.env` value, or `server/ai-review-server.mjs` instance may be exposed to the internet for this purpose.

Official references:

- [Riot Developer Portal FAQ](https://developer.riotgames.com/docs/faqs)
- [Riot Developer Portal overview](https://developer.riotgames.com/docs/portal)
- [Riot Developer Safety policy](https://developer.riotgames.com/policies/general)

## Service boundary

The production deployment is a separate HTTPS service, for example `https://api.example.com`. The provider and domain have not been selected yet; the selected platform must provide:

- an HTTPS custom domain;
- server-side secret storage with audited access controls;
- a trusted edge/WAF rate limiter keyed by canonical client IP;
- request logging controls and operational monitoring;
- a runtime compatible with the final production implementation.

It must expose only the public profile-search surface described below. It must **not** deploy or proxy the current local `ai-review-server.mjs`, its development-state routes, subscription fixtures, local AI routes, diagnostics, or any bind-to-loopback assumptions.

## Browser API contract

### `POST /v1/profile-search`

Request body, with a hard JSON-body limit of 1 KiB:

```json
{
  "region": "ru",
  "riotId": "GameName#TAG"
}
```

- `region` is restricted to the supported platform-routing values: `ru`, `euw`, `eune`, `tr`, `na`, `br`, `la1`, `la2`, `kr`, and `jp`.
- `riotId` is trimmed, limited to 100 characters, and must have non-empty game-name and tag-line components.
- The endpoint returns a filtered profile response compatible with the existing profile UI: displayed Riot ID, profile icon/level, Solo/Duo rank when available, up to three recent matches, up to five champion-mastery entries, champion pool, and derived profile summary.
- Raw Riot responses, `puuid`, account IDs, API routes, upstream response bodies, and provider errors are never returned to the browser.

`POST` keeps the Riot ID out of request URLs, browser history, referrer values, and ordinary access logs. Responses must send `Cache-Control: no-store`.

### Response and error rules

| Condition | HTTP status | Public response |
| --- | ---: | --- |
| Valid profile | `200` | Filtered profile payload only |
| Invalid body, region, or Riot ID | `400` | Actionable validation message |
| Account not found | `404` | `Игрок не найден.` |
| Edge or application rate limit | `429` | Generic retry message and `Retry-After` |
| Riot upstream unavailable/unauthorized/forbidden | `502` | Generic temporary-unavailable message |
| Production key missing or service disabled | `503` | Generic temporarily-unavailable message |

The response must not include diagnostics beyond a safe status category. It must never expose a Riot token, internal host, upstream URL, raw error, stack trace, cache key, or deployment configuration.

## Security controls

### Secrets and outbound access

- Store the production Riot key only in the chosen platform's secret manager, under `RIOT_API_KEY` or an equivalent server-only binding.
- Never pass the key through Git, GitHub Actions build variables, Vite `VITE_` variables, browser code, logs, screenshots, or distributed artifacts.
- The service calls Riot only through HTTPS and only to the fixed regional hosts required for account, summoner, league, match, and champion-mastery data.
- The production key is dedicated to Sensei GG; it is not reused for any other product.

### Browser boundary and abuse controls

- Allow CORS only for exact configured frontend origins, initially `https://orlovigoor-prog.github.io`; add future custom origins explicitly, never with `*`.
- Require `POST` with `Content-Type: application/json`; respond to narrowly scoped preflight requests only.
- CORS is not authentication. Apply an edge/WAF rate limit per canonical client IP before the application, and an independent application limiter after input validation.
- Rate-limit keys must come from the trusted hosting platform's proxy metadata, not an arbitrary browser-supplied header.
- Cache only successful identical normalized searches for a short period (initial target: 60 seconds). Do not use the Riot ID as a plaintext persistent-cache key; do not persist search history.
- Deduplicate matching in-flight requests. Bound memory cache size and expire entries.
- Reject cross-site browser requests, oversized bodies, unsupported methods, and malformed `Origin` values. Health checks must not disclose key configuration or platform details.

### Data minimization and privacy

- Do not persist profile results, Riot IDs, or upstream payloads in a database.
- Operational logs may record only timestamp, coarse outcome/status class, region, latency, and rate-limit decision. They must not log Riot IDs, `puuid`, account IDs, query URLs, request bodies, headers, or Riot upstream responses.
- Configure the host's shortest practical log retention and document it before go-live.
- Update the public Privacy Policy before activation if the selected host or retention behavior changes the currently disclosed processing.
- The existing client privacy gate remains authoritative for in-client roster interactions: Ranked Solo/Duo non-party allies and enemies must remain masked and must not dispatch lookup commands.

## Frontend integration after backend readiness

The endpoint address is public configuration, not a secret. After backend security verification succeeds, introduce only this dedicated configuration value in the Pages workflow:

```text
VITE_PUBLIC_PROFILE_API_ENDPOINT=https://api.example.com
```

The client must use this value only when all of the following are true:

1. it is running in Public Review Mode;
2. the endpoint is a valid `https:` origin with no path, query, fragment, credentials, or localhost address;
3. the profile backend readiness gate has been explicitly enabled in the Pages workflow.

The public review banner must continue to state that the roster, match phases, and post-game review are synthetic. If a reviewer performs a successful profile search after activation, the profile screen must identify that result as a live Riot API result rather than demo data. The static page must keep the lookup form disabled whenever the endpoint is absent or invalid.

Do not reuse `VITE_AI_REVIEW_ENDPOINT` for production profile lookup. The local AI/subscription development server is a separate development-only concern.

## Required pre-production verification

Before enabling the Pages endpoint configuration, verify all of the following in an isolated staging environment:

1. Production-key approval evidence is recorded and the key is installed only in the host secret manager.
2. HTTPS certificate, exact CORS origin, `POST`/preflight behavior, allowed methods, and security headers are confirmed.
3. Direct browser, foreign-origin, missing-origin, malformed body, oversized body, invalid-region, invalid-Riot-ID, per-IP rate-limit, cache, and upstream-timeout cases have automated tests.
4. No production route other than profile search is publicly reachable; development fixtures and diagnostics are absent.
5. Browser network inspection confirms the static frontend calls only the configured HTTPS profile endpoint and public Data Dragon/static resources; it never calls localhost or Riot API directly.
6. A production smoke test uses only a Riot ID explicitly authorized for the test. It confirms the filtering contract without printing private response data, API keys, or identifiers in CI logs.
7. Privacy Policy, Terms, reviewer guide, operational runbook, incident/rotation procedure, and data-retention statement match the selected provider.

## Go-live sequence

1. Receive Riot production approval and record the approval evidence.
2. Choose the hosting provider and production API domain; review its secret, WAF, logging, and deletion controls against this contract.
3. Implement and test the isolated service in staging. This requires a separate code-review and explicit approval before any deployment.
4. Deploy the service with the production key only in server-side secret storage.
5. Run the required staging and production smoke checks using explicitly authorized test data.
6. Add the public endpoint configuration to the Pages workflow, publish the client integration, and re-verify the public site.
7. Monitor rate-limit, upstream-error, and availability metrics without storing Riot IDs or raw profile data. Rotate/revoke the key immediately on suspected exposure.

Until all steps are complete, the public site must continue to show its labelled synthetic profile and disabled lookup explanation.
