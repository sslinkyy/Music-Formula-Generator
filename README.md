# Music Formula Generator

The Music Formula Generator is a single VBA module (`RGF_Module.bas`) that builds an end-to-end songwriting cockpit inside Excel. When you import the module and run the setup macro, the workbook creates a scoring sheet, genre library, creative brief tooling, Suno export blocks, an AI prompt builder, and optional API integration for OpenAI-compatible services. The focus is speed: score ideas, lock lyrical sections, pick a vibe, and generate production-ready prompts in minutes.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [One-Click Setup](#one-click-setup)
4. [Workbook Overview](#workbook-overview)
    - [RGF_Sheet](#rgf_sheet)
    - [Creative_Brief](#creative_brief)
    - [Suno_Blocks](#suno_blocks)
    - [AI_Prompt](#ai_prompt)
    - [AI_Response](#ai_response)
    - [Genre_Library](#genre_library)
    - [AI_Settings](#ai_settings)
5. [Scoring Inputs Reference](#scoring-inputs-reference)
6. [Preset Buttons](#preset-buttons)
7. [Genre Workflow](#genre-workflow)
8. [Phonetic Mode](#phonetic-mode)
9. [Suno Export Blocks](#suno-export-blocks)
10. [AI Prompt Builder](#ai-prompt-builder)
11. [Calling the API](#calling-the-api)
12. [Troubleshooting](#troubleshooting)
13. [Development Notes](#development-notes)
14. [License](#license)

## Prerequisites
- **Microsoft Excel for Windows** with VBA enabled. (The module relies on ActiveX buttons and Windows-specific API calls.)
- Macro security configured to allow signed or trusted macros. If you import the module manually, mark the workbook as trusted or copy it into a trusted location.
- Optional but recommended: familiarity with pressing `Alt + F11` to enter the VBA editor, and `Alt + F8` to run macros.

## Installation
1. Clone or download the repository.
2. Open the target workbook (a new blank workbook is fine).
3. Press `Alt + F11` to open the VBA editor.
4. In the editor choose `File -> Import File...` and select `RGF_Module.bas` from this repository.
5. Confirm that `RGF_Module` now appears under *Modules* in your VBA project.

## One-Click Setup
After importing, return to Excel and run the macro `RGF_OneClickSetup` (press `Alt + F8`, select the macro, and click **Run**). This macro:
- Clears or creates the `RGF_Sheet` tab with the scoring layout, inputs, validations, buttons, and named ranges.
- Builds or refreshes the `Genre_Library` tab with curated styles, tempo hints, exclude lists, and weight presets.
- Adds quick-access buttons for building creative briefs, Suno lyric blocks, and AI prompts.
- Creates helper sheets (`Creative_Brief`, `Suno_Blocks`, `AI_Prompt`, `AI_Response`, `AI_Settings`) if they do not already exist.

Re-run `RGF_OneClickSetup` whenever you want a clean rebuild. Use `RGF_RebuildPreservingGenres` if you have custom edits in `Genre_Library` that you want to keep.

## Workbook Overview
### RGF_Sheet
The main control panel with all scoring inputs, weights, helper normalizations, buttons, and user override sections. Key areas:
- **Weights (C9:C14)**: core weightings that should sum to 1. Preset buttons update these automatically.
- **Base Inputs (C16:C26)**: 0-10 sliders for cadence, feel, performance, structure, etc.
- **Derived Inputs (C27:C38)**: 0-1 values for rhyme entropy, multis, chantability, crowd impact, originality, swagger phase, and more.
- **Normalized Columns**: automatically convert base inputs to 0-1 for the math blocks.
- **Blocks**: the intermediate algebra (core, tech, anthem, style signature, group alignment, performance, regularizer) that feed the final score.
- **Final Score**: raw RGF score and a clamped 0-100 value.
- **User Sections**: optional text boxes (Title, Intro, Hook, Verse 1, Verse 2, Bridge, Outro, Notes) that lock content for the prompt/export flows.
- **Side Controls**:
  - `Genre (E2)` dropdown fed by `Genre_Library`.
  - `Premise (E10)` dropdown or `(auto)` detection.
  - `Phonetic Mode (E13)` dropdown controlling accent/phonetic guidance.
  - Buttons in column J for presets, creative brief, Suno export, prompt builder, API call, and genre tools.

### Creative_Brief
Built via the `Make Brief` button. Summarizes the score, tempo, structure, hook plan, flow, rhyme strategy, ad-libs, audience notes, style vibe, and the phonetic mode guidance. Useful for human collaborators.

### Suno_Blocks
Generated with `Make Suno`. Produces four fenced code blocks that conform to Suno v5 expectations:
1. Title block.
2. Style block with pipe-separated tags (genre tags + phonetic accent if any).
3. Exclude block in lowercase.
4. Lyrics block, automatically inserting `[Pronunciation] ...` if a non-neutral phonetic mode is selected, and respecting locked sections.

### AI_Prompt
Created by `Build Prompt`. Contains the full set of instructions for an AI model (e.g., ChatGPT or Suno-compatible assistant) including formatting rules, sheet-derived guidance, phonetic instructions, and any locked user sections.

### AI_Response
Populated by `CallAI`. Displays the latest API result so you can copy the four Suno blocks directly into the Suno interface.

### Genre_Library
Curated list of genres with tempo, style tags, structures, exclude lists, SFX cues, and optional weight presets. The `Apply Genre` button copies these hints into `RGF_Sheet` and offers to apply the corresponding weights.

### AI_Settings
Exposes every field consumed by `CallAIFromSheet` so you can tune requests without touching VBA. The sheet includes:
- Provider (for reference)
- Endpoint URL
- Model
- API Key (Bearer) and optional Organization header
- Temperature (0-2) and Top P (0-1)
- Frequency and Presence penalties (-2 to 2)
- Max Tokens and Request Timeout (ms)
- System Prompt
- Stop Sequences (comma separated)
- User Label (passed as the `user` value)
- Response Format (raw JSON block such as `{"type":"text"}`)

## Scoring Inputs Reference
- **Base Inputs (0-10)**: Cadence, Feel, Wordplay, Lyrical Depth, Beat Fit, Performance, Structure, Versatility, Anthemic Factor, Complexity, Style.
- **Derived Inputs (0-1)**: Rhyme entropy, average multis per bar, flow variance, chantability, crowd response, originality, timbre cohesion, swagger phase, dynamic range, cosine match, phase drift, manual group fit.
- **Normalized Fields**: convert base scores to 0-1 for the block equations.
- **Helper `phi_f_rad`**: converts swagger phase into radians for trigonometric operations.

Every input range on `RGF_Sheet` has validation and tooltips:
- `Base Inputs` prompt for 0-10 entries.
- `Derived Inputs` prompt for 0-1 entries with hints (e.g., chantability target of 0.7-0.9).
- `Weights` prompt that the sum should remain near 1 (the preset buttons enforce this).

## Preset Buttons
Located on the right side of `RGF_Sheet`:
- **Street, Club, Backpack, Streaming, Reset Defaults**: call `SetWeights` with genre-specific weight combinations.
- **Make Brief**: generates `Creative_Brief`.
- **Make Suno**: generates `Suno_Blocks`.
- **Build Prompt**: builds the AI prompt sheet.
- **Call AI (API)**: hits the configured endpoint using the built prompt.
- **Open Genre Library / Apply Genre**: navigates to the genre table and applies the currently selected genre.

## Genre Workflow
1. Pick a genre from the dropdown (E2). This applies formatting and optionally weights.
2. Adjust base/derived inputs to taste.
3. Use presets if you want to start from a canned weighting style.
4. Apply phonetic mode to guide accent.
5. Generate creative briefs, Suno blocks, or AI prompts as needed.

The genre library can be edited manually. Each row contains:
- `Genre` name.
- `TempoHint`, `StyleTags`, `StructureHint`, `Exclude`, `SFX`.
- Weight presets (`w_c` through `w_p`).

## Phonetic Mode
Drop-down in `RGF_Sheet!E13` controls pronunciation guidance without translating the language. Options include:
- Neutral / Standard (default)
- American English (General, Southern, New York, Midwest)
- Spanish-Influenced English
- Indian English Accent
- Somali English Accent

When you select a non-neutral mode:
- The creative brief displays the phonetic instruction line.
- The AI prompt includes a `Phonetics` guidance section and updates the style block instruction with the accent tag.
- The Suno export inserts `[Pronunciation] ...` above the producer tag and ensures the style block carries the accent tag.
- The genre preview on the sheet shows the accent tag so you know what style will flow downstream.

## Suno Export Blocks
`GenerateSunoFromSheet` writes four code blocks ready to paste into Suno:
1. ```` `Title` ````: either the user-provided title or a smart default based on the final score.
2. ```` `[style tags | ...]` ````: the style tags derived from genre + phonetic mode.
3. ```` `exclude, list, lowercase` ````: genres to avoid.
4. ```` `[Producer Tag] ...` ````: full lyric body with optional locked sections, deterministic fallbacks for missing pieces, and enforced formatting (brackets for sections, parentheses for alternate voices, `[ * sfx * ]` for sounds).

## AI Prompt Builder
When you click `Build Prompt`, `AI_Prompt` receives a deeply structured instruction set:
- Role specification (?You are Suno v5 Lyrical Expert ...?).
- Mandatory formatting rules, including meta tags, parentheses usage, SFX notation, style block requirements, exclude block format, phonetic instructions, and runtime sanity checks.
- Sheet-derived guidance for feel, structure, hook plan, flow, rhyme plan, style/vibe, phonetics, audience targeting, premise, length target, and keywords/must-include/forbidden phrases.
- Locked sections if any user text boxes are filled on `RGF_Sheet`.

## Calling the API
`CallAIFromSheet` reads from `AI_Settings` and `AI_Prompt` to submit a POST request to an OpenAI-compatible endpoint. To use it:
1. Populate `AI_Settings!B4:B11` with your endpoint, model, API key (bearer token), temperature, max tokens, and system prompt.
2. Ensure `AI_Prompt!A3` contains text (click `Build Prompt` first).
3. Click `Call AI (API)` on `RGF_Sheet`. The macro sends the payload via `MSXML2.XMLHTTP`.
4. Responses populate `AI_Response!A3`. Check Excel?s status bar for notifications.

## Troubleshooting
- **Macros disabled**: enable macros or add the workbook to a trusted location.
- **Buttons missing after rebuild**: run `RGF_OneClickSetup` again; it clears and recreates shapes.
- **Named range errors**: the helper `ResolveLabelRange` auto-heals names. Run `Build Prompt` or `Make Suno` at least once to ensure names are refreshed.
- **API call fails**: verify network access, endpoint URL, and that your key is valid. The macro will display HTTP status codes in a message box.
- **Unicode glyphs**: the module ships in plain ASCII. Mathematical constants like phi, pi, kappa, lambda are spelled out to ensure compatibility.

## Development Notes
- The module is intentionally single-file to simplify import/export.
- All sheet references use named ranges to stay robust if the row order shifts.
- Presets and genre library are editable; just keep the header structure intact.
- Functions like `BuildVerseDeterministic` provide deterministic lyrical fallbacks so exports are never empty.
- The code normalizes style tags and meta tags to match Suno?s parser expectations.

## License
This repository is released under the MIT License. See `LICENSE` for full terms.
