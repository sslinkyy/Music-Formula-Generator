# Beat Detection System

## Overview

The 3D Rhythm Tapper uses advanced audio analysis to synchronize gameplay with music, placing notes precisely on detected beats in the audio waveform.

## How It Works

### 1. Audio Analysis Phase

When a music track is selected (library or local file), the game performs these steps:

```javascript
// From start() function in index.js:703
const res = await analyzeTrack(target, { maxDurationSec: duration });
analysis = res;
bpm = res.bpm;           // Detected tempo
offset = res.offset;      // Time offset of first beat
beatTimes = res.beatTimes; // Array of exact beat timestamps in seconds
```

The `analyzeTrack()` function (from `../music/manager.js`):
- Loads the audio file into memory
- Analyzes the waveform using Web Audio API
- Detects peaks and patterns in the audio signal
- Returns:
  - `bpm`: Tempo in beats per minute
  - `offset`: When the first beat occurs (in seconds)
  - `beatTimes`: Array of timestamps for each detected beat
  - `confidence`: How confident the algorithm is in its detection

### 2. Beat Time Generation

If beat detection provides actual beat times:
```javascript
const beats = beatTimes; // Use detected beats directly
```

If only BPM is available (no beat times array):
```javascript
const beats = buildBeatsFromBpm(bpm, offset, duration);
```

The `buildBeatsFromBpm()` function generates a perfect grid:
```javascript
function buildBeatsFromBpm(bpm, offset, durationSec) {
  const period = 60 / bpm;  // Time between beats
  const beats = [];
  for (let t = offset; t < durationSec; t += period) {
    beats.push(t);
  }
  return beats;
}
```

### 3. Note Placement on Beats

Once beat times are established, notes are placed:

```javascript
notes = buildNotesFromBeats(beats, lanes, chosenBias, duration, rand);
```

This function:
- Iterates through each beat timestamp
- Places a note on each beat (with slight jitter for humanization)
- Adds special notes at intervals:
  - Every 8th beat: Long note (style tag)
  - Every 10th beat (offset 5): Chip note (keyword)
  - Every 12th beat (offset 9): Hazard note (forbidden word)

Example:
```javascript
for (let i = 0; i < beatTimes.length; i++) {
  const bt = beatTimes[i];  // Beat time in seconds

  // Regular note on this beat
  tempNotes.push({
    lane: weightedLaneIndex(weights),
    timeMs: bt * 1000,  // Convert to milliseconds
    type: 'short'
  });

  // Special note every 8 beats
  if (i % 8 === 0) {
    tempNotes.push({
      lane: weightedLaneIndex(weights),
      timeMs: bt * 1000,
      type: 'long'
    });
  }
}
```

### 4. Real-Time Synchronization

During gameplay, notes scroll toward the target line:

```javascript
// In animate() function
for (let i = 0; i < notes.length; i++) {
  const note = notes[i];
  const timeUntilHit = (note.timeMs - elapsed) / 1000;  // Seconds until player should hit

  // Calculate Z position based on time
  const targetZ = 5;      // Target line position
  const startZ = -30;     // Where notes spawn
  const travelTime = 3;   // 3 seconds of travel time

  const z = startZ + (startZ - targetZ) * (timeUntilHit / travelTime) * -1;
  note.mesh.position.z = z;
}
```

Notes reach the target line (Z=5) exactly when `note.timeMs === elapsed`, syncing perfectly with the music.

### 5. Audio Playback

The game plays the actual audio track synchronized with gameplay:

```javascript
audioCtx = new AudioContext();
const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
sourceNode = audioCtx.createBufferSource();
sourceNode.buffer = audioBuffer;

// Connect to destination and start
sourceNode.connect(audioCtx.destination);
sourceNode.start(audioCtx.currentTime + 0.05);  // Small delay for buffer
```

## Manual Overrides

### Tap Tempo
Players can manually set BPM by tapping a button to the beat:
- Tracks last 8 taps
- Calculates average interval
- Trims outliers (top/bottom 20%)
- Converts to BPM: `60000 / avgInterval`

This overrides automatic detection: `bpm = tappedBPM || detectedBPM`

### Offset Adjustment
Players can fine-tune sync with an offset input:
- Range: -1 to +1 seconds
- Shifts all beat times forward/backward
- Useful for tracks where first beat detection is slightly off

## Fallback Mode

When no music is selected:
- Uses synthetic beat generation
- Default BPM: 96 (modified by difficulty)
- Notes placed mathematically, not from audio analysis
- Still playable, just not synced to real music

## Technical Details

### Audio Analysis Algorithm
The `analyzeTrack()` function likely uses:
- **Onset Detection**: Identifies sudden increases in signal energy
- **Peak Picking**: Finds local maxima in the onset strength
- **Tempo Estimation**: Analyzes intervals between onsets
- **Beat Tracking**: Predicts beat positions using tempo

### Performance Considerations
- Analysis happens once at game start
- Beat times cached in memory
- No real-time analysis during gameplay
- Typical analysis time: 1-3 seconds for a 60-second track

### Precision
- Beat timestamps stored in seconds (floating point)
- Converted to milliseconds for gameplay timing
- Jitter added (±10ms) for natural feel
- Hit detection windows: Perfect (120ms), Good (220ms)

## Example Flow

1. User selects "Track.mp3" from library
2. Game calls `analyzeTrack("Track.mp3")`
3. Returns: `{ bpm: 128, offset: 0.1, beatTimes: [0.1, 0.569, 1.038, ...], confidence: 0.92 }`
4. Game generates notes at each beat time
5. Audio starts playing
6. Notes scroll toward target line
7. Player hits notes as they reach the line, perfectly in sync with music!

## Integration with Music Formula Generator

Beat-synced gameplay creates musically-relevant outputs:
- **Genre distribution**: Determined by which lanes player hits most
- **Style tags**: From long notes on strong beats
- **Keywords**: From chip notes on off-beats
- **Timing accuracy**: Reflects player's rhythm sense

The result is a formula that "feels" like the music you played to!
