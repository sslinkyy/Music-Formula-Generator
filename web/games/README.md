# Game Modes: Wireframes + Specs

This document describes the planned game experiences that translate play into a structured song prompt in the existing RGF web app. It focuses on a minimal, offline, Canvas/DOM implementation that respects accessibility and integrates with the current state/prompt pipeline.

## Hub Flow (shared)
- Entry: Toolbar `Play` → Game Hub dialog with three modes: Shooter (concept), Rhythm Tapper, Grid Picker.
- Options: Difficulty (easy/normal/hard) and Preset Bias (Street/Club/Backpack/Streaming) to teach weighting concepts.
- End-of-game Summary: shows selected genres/weights, premise, style tags, keywords, language/accent, forbidden. Actions: `Apply to App`, `Apply + Build`.

## Data Contract (gameOutput)
All modes export the same contract; the app adapter merges this into the existing state.

```
{
  "genres": [ { "name": "Drill", "influence": 62 }, { "name": "Afrobeats", "influence": 38 } ],
  "premise": "triumph & celebration",
  "styleTags": ["anthemic rap", "chant hook", "confident bounce"],
  "keywords": ["crowd", "lights"],
  "language": "English",
  "accent": "Neutral / Standard",
  "forbidden": [],
  "meta": { "mode": "rhythm", "difficulty": "normal", "duration": 72, "score": 8200, "accuracy": 92 }
}
```

- `genres`: influence values are normalized to 100 and mapped to current genre slots (fuzzy match to library names; else custom).
- `premise`: text of the paired concepts.
- `styleTags`, `keywords`, `forbidden`: arrays deduped/trimmed; merged with existing app values.
- `language`, `accent`: single-select each.
- `meta`: lightweight telemetry only; stored locally.

A JSON Schema is provided at `web/games/schema.json`.

## Rhythm Tapper (MVP)
- Canvas lanes (3–5), judge line. Notes scroll to timing line; user taps/presses to hit.
- Mapping:
  - Lanes → genre families; hit counts → influence per lane → normalized.
  - Long notes → style tag pickups (perfect-hold increases priority).
  - Off-beat taps → add tokens to `forbidden` list.
  - Combo banks → two concept streams; top two concepts combine into the `premise`.
  - Portals (single active) → set `language` and `accent`.
- UX: 60–90s round; HUD shows top genres, combo, recent tags. Tutorial overlay at start.
- Accessibility: reduced motion (flat scroll, no trails), wide timing windows in easy mode, high-contrast color+shape coding.

## Grid Picker (MVP)
- 3–4 turn draft of “cards” that represent musical facets. DOM-based grid, mobile-friendly.
- Mapping:
  - Turn 1: Genre or dual-genre card → influence deltas.
  - Turn 2: Premise card (paired concepts) or reroll.
  - Turn 3: Style tag set; optional keyword pack.
  - Turn 4 (optional): Language/accent card; hazard card (adds to `forbidden`) for a power-up.
- Synergy highlights (e.g., genre+tag combos) with short hints.
- End Summary: normalize influences; cap and dedupe tags/keywords.

## Shooter (Concept)
- 60–90s arena; hits add influence to genre-tagged objects; pickups add tags/keywords; portals set language/accent.
- Included as a stretch goal once Rhythm + Grid are complete.

## Accessibility & Preferences
- Respect `Reduce Motion` (toolbar) and OS `prefers-reduced-motion` throughout; provide high-contrast palettes; avoid shake.
- Controls: tap/click-only options; generous hitboxes; auto-fire/assist modes for Rhythm.

## Achievements (learning-focused)
- Rhythm: First Round, Accuracy tiers, Combo Master, Polyglot Flight.
- Grid: Perfect Draft (no hazard), Synergy Hunter, Curator+ (preset usage via hub bias).
- Shared: Game Explorer (play all modes), difficulty clears, time-on-task streaks.

## Milestones
1) Wireframes + final contract (this doc + schema) — approved
2) Hub + contracts scaffold (no gameplay)
3) Rhythm MVP → summary → Apply to App
4) Grid MVP → summary → Apply to App
5) Polish: difficulty, preset bias, achievements, reduced-motion pass, tutorials

## File Structure (planned)
- `web/games/core/` — engine utils (loop, input, timing), shared types
- `web/games/rhythm/` — lanes, judge, seed maps
- `web/games/grid/` — card logic, synergies
- `web/games/adapter.js` — contract ⇒ app state mapper (currently integrated in app.js; can be extracted later)

## Notes
- No external libraries; offline-friendly.
- Keep rounds short; avoid overwhelming first-time users.
- Always allow editing in the normal form after applying results.

