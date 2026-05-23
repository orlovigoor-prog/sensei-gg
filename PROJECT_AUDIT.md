# PROJECT AUDIT: Sensei GG

## 1. Current product state

Sensei GG is no longer just a raw prototype, but it is not yet a release-ready product.

The project already has a usable structure:
- separate screens
- separate services
- separate Redux slices
- a working Overwolf bridge layer
- a consistent Riot-safe direction in product messaging

But the current app is still mixed:
- part of the UX is based on real integrations
- part is driven by local mock data
- part is static demo content presented as if it were product data

That means the main risk right now is not "missing one more feature".
The main risk is product ambiguity: what is real, what is simulated, and what can actually be shipped.

## 2. What is production-ready enough to keep

These parts are good enough as a base and should be preserved, then refined.

### 2.1 Overwolf lifecycle foundation
Files:
- [src/services/overwolfBridge.ts](/c:/Users/csnik/sensei-gg/src/services/overwolfBridge.ts)
- [src/services/overwolfLifecycleController.ts](/c:/Users/csnik/sensei-gg/src/services/overwolfLifecycleController.ts)
- [src/hooks/useOverwolfBridge.ts](/c:/Users/csnik/sensei-gg/src/hooks/useOverwolfBridge.ts)
- [src/screens/background/BackgroundWindow.tsx](/c:/Users/csnik/sensei-gg/src/screens/background/BackgroundWindow.tsx)

Why this is solid:
- there is a clear event bridge between background and desktop windows
- lifecycle messages are normalized into app-specific events
- the controller already pushes game start, game end, stats, and phase changes
- browser fallback exists, which is useful for local development

Main limitation:
- it still forwards only a narrow slice of game/lobby truth, so the product layer above it remains partially synthetic

### 2.2 Redux state split
Files:
- [src/store/gameSlice.ts](/c:/Users/csnik/sensei-gg/src/store/gameSlice.ts)
- [src/store/lobbySlice.ts](/c:/Users/csnik/sensei-gg/src/store/lobbySlice.ts)

Why this is good:
- game and lobby concerns are separated
- the state is small enough to reason about
- last completed match is already modeled explicitly

Main limitation:
- store types are UI-driven, not domain-driven
- `PlayerInfo` currently tries to serve both real data and demo-presentational data at the same time

### 2.3 Settings flow
File:
- [src/screens/settings/SettingsScreen.tsx](/c:/Users/csnik/sensei-gg/src/screens/settings/SettingsScreen.tsx)

Why this is good:
- bounded scope
- coherent product direction
- window-size settings actually affect app behavior
- no dangerous policy messaging mixed into user settings anymore

### 2.4 Post-match product direction
Files:
- [src/store/gameSlice.ts](/c:/Users/csnik/sensei-gg/src/store/gameSlice.ts)
- [src/screens/desktop/DesktopWindow.tsx](/c:/Users/csnik/sensei-gg/src/screens/desktop/DesktopWindow.tsx)

Why this is the correct direction:
- it is aligned with Riot-safe constraints
- it gives the app a defendable value proposition
- it avoids fake "AI coach in real time" claims

## 3. What is still mock, synthetic, or misleading

This is the most important section.

## 3.1 Lobby player data is still demo-shaped
Files:
- [src/services/mockLobby.ts](/c:/Users/csnik/sensei-gg/src/services/mockLobby.ts)
- [src/screens/desktop/DesktopWindow.tsx](/c:/Users/csnik/sensei-gg/src/screens/desktop/DesktopWindow.tsx)
- [src/screens/match/MatchScreen.tsx](/c:/Users/csnik/sensei-gg/src/screens/match/MatchScreen.tsx)

Observed facts:
- `handleSimulateLobby()` builds the lobby entirely from `createMockPlayers()`
- mock players include rank, LP, winrate, recent matches, mastery, champion data
- `MatchScreen` renders this as meaningful player intelligence

Problem:
- this is acceptable for dev simulation
- this is not acceptable as a user-facing default if the app cannot retrieve the same data reliably in production

Conclusion:
- the app needs an explicit boundary between `dev simulation` and `real runtime state`

## 3.2 Lobby insights are fabricated, not derived from real models
File:
- [src/screens/match/MatchScreen.tsx](/c:/Users/csnik/sensei-gg/src/screens/match/MatchScreen.tsx)

Observed facts:
- `getMockLobbyInsight()` fabricates:
  - counters
  - matchup winrate
  - global winrate
  - patch tier
- output is deterministic-looking, which makes it feel real to the user

Problem:
- this is polished fake data
- polished fake data is more dangerous than obvious placeholder text because it creates product dishonesty

Conclusion:
- these insights should either:
  1. be removed from production UX, or
  2. be relabeled as local training/demo data, or
  3. be replaced with real sourced, policy-safe data

## 3.3 Profile tab is mostly static demo content
File:
- [src/screens/desktop/DesktopWindow.tsx](/c:/Users/csnik/sensei-gg/src/screens/desktop/DesktopWindow.tsx)

Observed facts:
- `matchHistory` is hardcoded inside the component
- graph is based on that hardcoded array
- profile summary cards are hardcoded numbers
- `Sensei Score A+` is static

Problem:
- visually strong, but product-truth weak

Conclusion:
- the profile tab is currently a UI mock presented as a feature shell

## 3.4 Search flow bypasses the shared API layer
Files:
- [src/screens/search/SearchScreen.tsx](/c:/Users/csnik/sensei-gg/src/screens/search/SearchScreen.tsx)
- [src/services/riotApi.ts](/c:/Users/csnik/sensei-gg/src/services/riotApi.ts)

Observed facts:
- `SearchScreen` performs raw fetch calls itself
- `riotApi.ts` also has summoner and rank methods
- the two implementations do not follow the same request style

Problem:
- duplicated integration logic
- harder to test
- harder to evolve rate limiting, error handling, and region handling

Conclusion:
- search must move onto a single Riot data adapter

## 3.5 Riot API layer is inconsistent
File:
- [src/services/riotApi.ts](/c:/Users/csnik/sensei-gg/src/services/riotApi.ts)

Observed facts:
- base constant `RIOT_API_BASE` is hardcoded to `americas.api.riotgames.com`
- `getSummonerByName()` calls `/lol/summoner/v4/summoners/by-name/...` against that base
- `SearchScreen` separately builds region-specific hosts and uses `X-Riot-Token`
- `riotApi.ts` still sends `api_key` in query string

Problem:
- implementation mismatch
- region routing is not centralized
- one part of the app is more correct than the supposed shared service

Conclusion:
- `riotApi.ts` should become the single authoritative Riot adapter

## 3.6 Champion detail is not clearly justified in current product scope
File:
- [src/components/ChampionDetail.tsx](/c:/Users/csnik/sensei-gg/src/components/ChampionDetail.tsx)

Observed facts:
- it loads DDragon champion data on demand
- it is used from `PlayerCardWithChampion`
- it shows detailed spell/passive information

Concern:
- technically fine
- but it belongs more to a champion reference tool than to the current core promise of safe lobby analysis + post-match review

Conclusion:
- keep only if it supports the intended MVP
- otherwise reduce its prominence or move it behind a secondary flow

## 4. Architecture risks

## 4.1 `DesktopWindow` is too large and mixes too many responsibilities
File:
- [src/screens/desktop/DesktopWindow.tsx](/c:/Users/csnik/sensei-gg/src/screens/desktop/DesktopWindow.tsx)

Observed facts:
- handles layout scaling
- tab routing
- local chart rendering
- hardcoded profile data
- AI summary generation
- keyboard shortcuts
- dev simulation panel visibility
- footer legal notice

Risk:
- this file will become the main maintenance bottleneck
- every new feature will make regressions more likely

Recommendation:
- split into:
  - shell/layout component
  - top navigation component
  - profile tab component
  - ai tab component
  - keyboard shortcut hook

## 4.2 Too many inline styles

Observed facts:
- major screens are composed almost entirely with inline style objects

Risk:
- expensive visual maintenance
- repeated tokens drift over time
- small visual adjustments require touching many lines

Recommendation:
- do not rewrite everything
- extract a small design token layer first:
  - colors
  - card surface
  - button variants
  - text styles
  - badge styles

## 4.3 Domain model is still presentation-shaped

Observed facts:
- `PlayerInfo` includes rank, LP, mastery, recent matches, role, and display-ready values in one object

Risk:
- hard to know what is guaranteed by runtime data
- hard to merge Riot, Overwolf, and mock sources safely

Recommendation:
- split concepts:
  - raw runtime participant
  - enriched player profile
  - UI card model

## 5. Product-truth assessment by area

### Match tab
Status: mixed

Real enough:
- phase-driven rendering
- post-game summary direction
- ranked-solo/duo ally name hiding logic

Not yet real enough:
- many displayed player metrics depend on synthetic player objects
- lobby insight counters and tiers are fake

### Search tab
Status: partially real

Real enough:
- live search against Riot API
- ranked data retrieval

Weak points:
- adapter duplication
- direct fetches in UI
- some UX is still rough and overly prototype-like

### AI tab
Status: honest direction, simplified implementation

Real enough:
- safe post-match framing
- generated summary based on tracked end-of-game stats

Weak points:
- analysis logic is local heuristic text assembly
- no persistence, no progression model, no match history basis

### Profile tab
Status: demo-only

This is the clearest candidate for either:
- temporary hide, or
- explicit "demo analytics" labeling, or
- full rebuild on real stored match history

## 6. What should be done next

This is the practical roadmap.

## Phase 1: Product honesty pass
Goal: ensure every visible feature tells the truth.

Tasks:
1. Mark or remove all synthetic analytics from user-facing flows.
2. Decide whether Profile stays visible in current form.
3. Remove fabricated matchup/counter/tier insights from the lobby unless they are clearly labeled as demo.
4. Make dev simulation visibly dev-only.

Expected result:
- the app becomes smaller, but more credible
- easier future submission story for Riot/Overwolf

## Phase 2: Data architecture pass
Goal: unify real integrations.

Tasks:
1. Refactor Riot API access into one adapter layer.
2. Move `SearchScreen` off raw fetch logic.
3. Define domain types for:
   - runtime game state
   - searchable summoner profile
   - post-match summary
   - optional enriched lobby card model
4. Centralize region routing, request headers, and error handling.

Expected result:
- less duplication
- clearer boundaries between source data and UI

## Phase 3: UI shell refactor
Goal: reduce maintenance cost.

Tasks:
1. Split `DesktopWindow` into focused tab components.
2. Extract visual tokens and shared primitives.
3. Normalize card layout, button variants, headings, and empty states.
4. Remove remaining prototype-style console logging and incidental debug behavior where not needed.

Expected result:
- much safer iteration speed
- easier visual consistency across future features

## 7. Sharp recommendation

Do not rush into "more AI" right now.

That would be the wrong priority.

The app does not currently need more claims, more tabs, or more synthetic insights.
It needs a tighter contract with reality.

The best next investment is:
- make the current feature set honest
- make the data path coherent
- then build on top of that

## 8. Immediate actionable next task

Best next implementation task:

"Remove or relabel synthetic lobby/profile analytics, and make dev simulation explicitly dev-only."

That task gives the highest leverage because it improves:
- product trust
- policy defensibility
- future architecture decisions
- clarity for README, Riot review, and Overwolf submission
