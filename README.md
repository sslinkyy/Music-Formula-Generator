# Music Formula Generator

This repository contains the **RGF f·p·e** VBA module for Excel. Import `RGF_Module.bas` into a workbook to build the scoring sheet, creative brief tools, Suno exporter, and AI prompt workflow for rapid lyric generation.

## Quick Start
1. Open Excel and press `Alt + F11` to open the VBA editor.
2. In the editor, choose **File → Import File…** and select `RGF_Module.bas` from this repository.
3. Return to Excel and run the macro `RGF_OneClickSetup` to create the full workspace.
4. Adjust the scoring inputs, choose a genre/premise, and use the generated buttons to create briefs or Suno-ready lyrics.

## Notes
- The AI integration requires an OpenAI-compatible API key; update the `AI_Settings` sheet before calling the API.
- Validate macro security settings in Excel to allow the module to run.
