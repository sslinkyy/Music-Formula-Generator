# StepMania Server Packs

This folder contains StepMania packs that are automatically available to all users of the game.

## How to Add Server Packs

### Option 1: Auto-Generate Manifest (Recommended)

Simply drop your ZIP files in this folder and run the auto-generator:

```bash
cd web/stepmania-packs
npm install
npm run generate
```

The script will:
- Scan all ZIP files in the folder
- Extract metadata (title, artist, BPM, chart count) from the .sm files inside
- Auto-generate `manifest.json` with all discovered packs
- Display a summary of what was added

**Then commit:**
```bash
git add web/stepmania-packs/
git commit -m "Add [Pack Name] to server library"
git push
```

### Option 2: Manual Entry

If you prefer manual control, add your ZIP file and edit `manifest.json`:

#### 1. Add Your ZIP File
Place your StepMania pack ZIP file in this directory:
```
web/stepmania-packs/your-pack-name.zip
```

#### 2. Update manifest.json
Add an entry to the `packs` array in `manifest.json`:

```json
{
  "id": "your-pack-id",
  "title": "Your Pack Title",
  "artist": "Artist Name",
  "path": "your-pack-name.zip",
  "description": "Brief description of the pack",
  "chartCount": 10,
  "size": "~50MB",
  "enabled": true
}
```

**Fields:**
- `id`: Unique identifier (lowercase, no spaces)
- `title`: Display name shown in dropdown
- `artist`: Artist or pack creator
- `path`: Filename of ZIP in this folder
- `description`: Short description (optional)
- `chartCount`: Number of charts (optional)
- `size`: Approximate file size (optional)
- `enabled`: Set to `true` to make available, `false` to hide

#### 3. Commit and Push
```bash
git add web/stepmania-packs/
git commit -m "Add [Pack Name] to server library"
git push
```

## Pack Format Requirements

Each ZIP should contain StepMania `.sm` or `.ssc` files with:
- At least one `dance-single` chart (4-panel)
- Audio file (`.ogg`, `.mp3`, or `.wav`)
- Optional: Banner and background images

**Example structure:**
```
your-pack.zip
├── Song1/
│   ├── Song1.sm
│   ├── Song1.ogg
│   ├── banner.png
│   └── bg.jpg
└── Song2/
    ├── Song2.sm
    └── Song2.mp3
```

## File Size Considerations

- GitHub has a 100MB file size limit
- Large packs may slow down initial load
- Consider splitting large collections into multiple packs
- Recommended: Keep individual packs under 50MB

## Copyright Notice

Only upload packs you have permission to distribute. Most StepMania simfiles are fan-created and distributed freely, but always respect copyright and creators' wishes.

## Testing

After adding a pack:
1. Reload the game
2. Select "Music: stepmania"
3. Your pack should appear in the dropdown with "[Server]" prefix
4. Select it to verify it loads correctly

## Disabling Packs

To temporarily hide a pack without deleting it:
- Set `"enabled": false` in manifest.json
- The pack will not appear in the dropdown
- Can be re-enabled anytime by setting back to `true`
