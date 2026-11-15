# Sensei GG - External Review Entry Point

**Public source repository:** https://github.com/orlovigoor-prog/sensei-gg

**Stable review document URL (after this file is published to `main`):**
https://github.com/orlovigoor-prog/sensei-gg/blob/main/REVIEW.md

**Public prototype and legal pages:**

- https://orlovigoor-prog.github.io/sensei-gg/
- https://orlovigoor-prog.github.io/sensei-gg/privacy-policy.html
- https://orlovigoor-prog.github.io/sensei-gg/terms-of-service.html

**Detailed policy walkthrough:** [RIOT_REVIEW_GUIDE.md](RIOT_REVIEW_GUIDE.md)

The repository is public and can be inspected without collaborator access. This document is the shortest reliable starting point for Riot or external reviewers.

## Review scope

Sensei GG is a League of Legends companion focused on low-noise pre-game visibility and post-game improvement. The reviewable flows are:

- a fail-closed 5×5 live roster only when Overwolf live-client data confirms loading or in-game state (no pre-game roster claim);
- player-profile lookup where permitted;
- post-game AI review after a match has ended;
- a clearly labelled synthetic Review Mode for repeatable UI review.

## Public static review flow

Open https://orlovigoor-prog.github.io/sensei-gg/. GitHub Pages starts a visible **PUBLIC REVIEW MODE · SYNTHETIC DATA** scenario automatically: the roster, profile, match events and post-game data are test data, not a live game session or a real player profile.

Use the visible Review Mode panel to inspect the 5×5 screen, switch between lobby, in-game and post-game phases, then generate the local post-game review. The AI flow is deliberately post-game only. Riot ID lookup is intentionally unavailable on this static page, so it cannot send a reviewer input to Riot API, localhost or a hidden proxy.

## Local review flow

Use Node.js 18 or newer. Run the server and Vite in separate terminals:

```bash
npm ci
npm run ai:server
```

```bash
npm run dev
```

Open the local URL printed by Vite, then press `Ctrl+Shift+Z` to show **Review Mode**. The panel is visibly labelled `DEMO / REVIEW` and states that its game events and data are test data. It can simulate a 5v5 lobby, switch phases, and show the post-game review path without requiring a real match.

No Riot API key or LLM key is required to inspect the synthetic Review Mode. Secrets remain server-side and must not be placed in client-side `VITE_` variables or distributed artifacts.

## Policy boundaries

The application intentionally does **not** provide:

- live commands, tactical coaching, positioning advice, or macro calls during a match;
- enemy ability, ultimate, or summoner-spell timers;
- lookup or disclosure of non-party ally names in Ranked Solo/Duo champion select;
- synthetic data presented as live game data.

The in-app phase mapping is `champ-select` to `Лобби`, `loading` and `in-game` to `В игре`, and `post-game` to `Итоги`. AI review is restricted to the post-game path. In Ranked Solo/Duo, non-party identities are masked and cannot trigger a profile lookup; the policy is deliberately applied beyond champion select.

## Known review limitations

- GitHub Pages is static hosting only. It provides the repeatable synthetic Public Review Mode described above; it does not provide a live Riot profile backend or production API runtime.
- The canonical root manifest declares the background page, League of Legends targeting, required permissions and the `sensei_toggle_overlay` custom hotkey. Actual GEP events, live-client availability and hotkey assignment must still be checked manually in a real Overwolf runtime; this repository does not claim a Store-ready binary from browser checks alone.
- A submitter contact must be supplied in the Riot or Overwolf submission form; placeholder contact details are deliberately not published in this repository.

For the complete feature-by-feature policy walkthrough and review scenarios, see [RIOT_REVIEW_GUIDE.md](RIOT_REVIEW_GUIDE.md).
