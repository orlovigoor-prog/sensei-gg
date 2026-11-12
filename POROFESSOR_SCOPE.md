# Sensei GG and public Porofessor capability categories

This is a product-boundary comparison, not a feature-parity plan. It uses only publicly described capability categories; Sensei GG does not copy Porofessor UI, text, proprietary datasets, or analysis models.

## Product position

Sensei GG is a League of Legends companion for permitted lobby context, static reference data, and post-game improvement. Riot Data Dragon is the source for champion, ability, item, spell, and icon reference data. The reference set is pinned in [`game-data.config.json`](game-data.config.json) so the client, profile normalizer, and counterpick updater use the same patch.

| Public capability category | Sensei GG decision | Boundary |
| --- | --- | --- |
| Champion and item reference | Retained | Localized names, icons, descriptions, effects, prices, and availability come from official Riot Data Dragon. Static reference text is not live coaching. |
| Champion-select context | Retained, narrow | Five counter icons and inverse matchup percentages only where the documented source and privacy rules permit it. No tactical advice, picks, bans, or explanations are added to that block. |
| Player profile and rankings | Permitted future work | Only through a maintained, approved Riot-backed path, with truthful loading/error states and Ranked Solo/Duo privacy protections. |
| Post-game match summary | Retained | Review happens after the game and is based on completed-match facts. Synthetic Review Mode stays visibly marked. |
| Builds, runes, and meta recommendations | Not a current recommendation feature | Demonstration screens may render neutral, visibly labelled demo item sets. They are not current meta, build advice, or a maintained optimisation model. Actual match items use official reference details. |
| Real-time overlay analytics | Explicitly excluded | No enemy cooldown, ultimate, or summoner-spell timers; no jungle timers; no positioning, macro, or tactical calls during active play. |
| Scouting and hidden-player analysis | Explicitly excluded | In Ranked Solo/Duo champion select, non-party ally names remain hidden and lookup stays disabled. No attempt is made to infer hidden information or create a competitive advantage. |

## Safe next steps

1. Improve official static-data caching and graceful offline states.
2. Add post-game-only summaries sourced from completed match data after Riot approval and a maintained backend are available.
3. Improve transparent pre-game context only when the data source, sample, patch, privacy behavior, and policy scope can be documented.

## Non-goals

- reproducing another companion product's layout or proprietary meta dataset;
- expanding the overlay into a live coach;
- treating demo data or reference templates as live recommendations;
- using a static GitHub Pages preview as evidence of backend or Overwolf runtime readiness.
