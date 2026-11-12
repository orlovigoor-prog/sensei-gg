# Sensei GG - External Review Entry Point

**Public source repository:** https://github.com/orlovigoor-prog/sensei-gg

**Stable review document URL (after this file is published to `main`):**
https://github.com/orlovigoor-prog/sensei-gg/blob/main/REVIEW.md

**Detailed policy walkthrough:** [RIOT_REVIEW_GUIDE.md](RIOT_REVIEW_GUIDE.md)

The repository is public and can be inspected without collaborator access. This document is the shortest reliable starting point for Riot or external reviewers.

## Review scope

Sensei GG is a League of Legends companion focused on low-noise pre-game visibility and post-game improvement. The reviewable flows are:

- a safe lobby summary during champion select;
- player-profile lookup where permitted;
- post-game AI review after a match has ended;
- a clearly labelled synthetic Review Mode for repeatable UI review.

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

The in-app phase mapping is `champ-select` to `Лобби`, `loading` and `in-game` to `В игре`, and `post-game` to `Итоги`. AI review is restricted to the post-game path.

## Known review limitations

- GitHub Pages is static hosting only and is not a substitute for the local review flow; it cannot exercise local backend-dependent features.
- The current Overwolf manifest/runtime integration still needs background game-event wiring and platform readiness work. This repository is a source and review package, not a claim of a Store-ready binary.
- A submitter contact must be supplied in the Riot or Overwolf submission form; placeholder contact details are deliberately not published in this repository.

For the complete feature-by-feature policy walkthrough and review scenarios, see [RIOT_REVIEW_GUIDE.md](RIOT_REVIEW_GUIDE.md).
