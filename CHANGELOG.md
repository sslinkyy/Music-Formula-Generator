# Changelog

## v0.3.0 – Artist Parsing, Production Block, Expanded Genres

### Added
- Artist Reference input with Parse action
  - Applies accent, genre mix weights, style tags, instruments, and keywords from curated profiles.
  - Profiles file: `web/data/artists.js` (Drake, The Weeknd, Bad Bunny, Burna Boy, Kendrick Lamar, Taylor Swift, Travis Scott, Pop Smoke, Central Cee, Fred again.., SZA, Dua Lipa, Ed Sheeran, Beyoncé).
- Production block in Suno export (now 5 blocks)
  - Includes tempo (~BPM + range), structure, instruments, sidechain, and mastering targets.
  - Lives in: `web/app.js` (buildSunoBlocks + helpers).
- Genres: UK Funky, Future Garage, Footwork, Juke, Liquid DnB, Neurofunk, Synth Pop, Shoegaze, Ambient Pop, Eurodance, Hard Trance, Minimal Techno.

### Changed
- Tuned instrument mappings for EDM/UK/Latin/pop/rock/new genres for better Suggestions & prompts.
- Added prompt guidance lines (instrumentation and production cues) in AI prompt workspace.

### Notes
- Suno export order is now: title, style, exclude, production, lyrics.
- If you need a four-block export for compatibility, we can add a toggle to omit the Production block.
