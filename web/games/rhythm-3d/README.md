# 3D Rhythm Tapper

A fully reimagined rhythm tapper game using Three.js for stunning 3D graphics.

## Features

- **3D Graphics**: Built entirely with Three.js, featuring:
  - 3D lanes with colored lighting based on genre
  - 3D note objects that scroll towards the player
  - Dynamic camera perspective
  - Fog effects for depth
  - Real-time lighting with ambient, directional, and colored backlights

- **Gameplay**:
  - 4 lanes corresponding to different music genres
  - Multiple note types:
    - **Short notes**: Regular tap notes for genre influence
    - **Long notes**: Bar-shaped notes that add style tags
    - **Chip notes** (yellow): Add keywords to your track
    - **Hazard notes** (red): Add forbidden words (breaks combo)
  - Hit notes on the target line using D/F/J/K keys or click lanes
  - Combo system with accuracy tracking
  - Difficulty settings (easy/normal/hard)

- **Music Integration** (Beat-Synced Gameplay):
  - **Automatic beat detection**: Analyzes audio waveform to detect actual beat times
  - **BPM calculation**: Determines tempo from audio analysis
  - **Note placement**: Notes spawn precisely on detected beats or calculated beat grid
  - Support for library tracks or local audio files
  - Tap tempo feature for manual BPM override
  - Audio offset adjustment for sync fine-tuning
  - VU meter for real-time audio visualization
  - Falls back to synthetic beats when no music is selected

- **Customization**:
  - 5 preset biases (none, street, club, backpack, streaming)
  - Language and accent selection
  - Configurable difficulty levels
  - Music source selection

## Controls

- **D**: Lane 1 (leftmost)
- **F**: Lane 2
- **J**: Lane 3
- **K**: Lane 4 (rightmost)
- **Mouse Click**: Click on lanes to hit notes

## Output

After completing a session, the game generates:
- Genre mix based on hit distribution
- Suggested premise
- Style tags (from long notes)
- Keywords (from chip notes)
- Forbidden words (from hazards)
- Language and accent settings
- Performance stats (accuracy, combo, duration)

## Technical Details

- Uses Three.js (loaded from CDN)
- WebGL renderer with antialiasing
- Perspective camera with fog
- Phong materials with emissive lighting
- Real-time animation loop
- **Frame-perfect audio synchronization** using AudioContext as master clock
- Dual timing system (audio sync + performance timer fallback)
- Debug mode with real-time timing visualization
- Integrates with existing Music Formula Generator state system

### Synchronization System

The game uses a sophisticated timing system to ensure perfect sync between audio and visuals:

1. **AudioContext Master Clock**: Uses Web Audio API's high-precision timer as source of truth
2. **Pre-calculated Beat Times**: All notes generated before gameplay from detected beats
3. **Dynamic Spawning**: Notes spawn 3 seconds before hit time for optimal performance
4. **Consistent Timing**: Same clock used for audio, visuals, and input detection

For detailed technical information about the synchronization system, see [SYNC_SYSTEM.md](SYNC_SYSTEM.md).

For beat detection implementation details, see [BEAT_DETECTION.md](BEAT_DETECTION.md).

## Installation

The game is automatically loaded as part of the Music Formula Generator web app. Three.js is loaded dynamically from CDN when the game starts.

## Usage

1. Navigate to Games menu in the Music Formula Generator
2. Select "3D Rhythm Tapper"
3. (Optional) Configure music source, difficulty, and other settings
4. Click "Start" to begin
5. Hit notes as they reach the target line
6. View your generated music formula at the end!
