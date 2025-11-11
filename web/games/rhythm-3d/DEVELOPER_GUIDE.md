# Developer Guide - 3D Rhythm Tapper

## Quick Start

### Running the Game

1. Launch the Music Formula Generator web app
2. Navigate to **Games** → **3D Rhythm Tapper**
3. Game loads automatically with Three.js from CDN

### Testing Beat Sync

**Test with synthetic beats:**
```
1. Keep "Music: none" selected
2. Click Start
3. Notes will use 96 BPM synthetic timing
```

**Test with real audio:**
```
1. Select "Music: local"
2. Upload an MP3/WAV file
3. Click Start
4. Wait for "Analyzing audio..." toast
5. Check console for: "Beat analysis: { bpm: 128, ... }"
```

**Test with debug mode:**
```
1. Click "Debug: Off" to enable
2. Start game
3. Watch bottom-right corner for timing info
4. Verify "Sync Mode: Audio"
```

## Architecture Overview

### Main Components

```
buildRhythm3DGameDialog()
├── UI Controls (lines 50-244)
├── Three.js Scene Setup (lines 295-363)
├── Game State (lines 364-381)
├── Note Creation (lines 383-419)
├── Note Generation (lines 426-459)
├── Input Handling (lines 465-538)
├── Animation Loop (lines 540-676)
├── Game Lifecycle (lines 678-801)
└── Audio Handling (lines 706-770)
```

### Data Flow

```
User selects music
    ↓
analyzeTrack() → { bpm, offset, beatTimes, confidence }
    ↓
buildNotesFromBeats() → notes[] array
    ↓
start() → Schedule audio + Begin animation
    ↓
animate() → Spawn notes + Move notes + Render
    ↓
onPress() → Hit detection + Scoring
    ↓
endGame() → buildOutput() → onFinish()
```

## Key Functions

### Audio Analysis
```javascript
// From ../music/manager.js
const res = await analyzeTrack(target, { maxDurationSec: 60 });
// Returns: { bpm, offset, beatTimes, confidence }
```

### Note Generation
```javascript
// Helper function (line 855)
buildNotesFromBeats(beatTimes, lanes, chosenBias, duration, rand)
// Returns: Array of { lane, timeMs, type, lenMs? }
```

### Timing Calculation
```javascript
// Core sync logic (line 553)
if (useAudioSync && audioCtx) {
  elapsed = (audioCtx.currentTime - audioStartOffset) * 1000;
} else {
  elapsed = performance.now() - gameStartTime;
}
```

### Note Spawning
```javascript
// Dynamic spawning (line 563)
const timeUntilNote = note.timeMs - elapsed;
if (timeUntilNote < 3000 && timeUntilNote > -100) {
  const noteObj = createNote(...);
  noteObjects.push(noteObj);
}
```

### Hit Detection
```javascript
// Input handling (line 468)
function onPress(laneIndex) {
  const elapsed = /* calculate current time */;
  for (note of noteObjects) {
    const delta = Math.abs(note.timeMs - elapsed);
    if (delta <= judgement.good) { /* HIT! */ }
  }
}
```

## Customization

### Changing Note Spawn Distance
```javascript
// Line 568: Change from 3000ms to desired value
if (timeUntilNote < 5000 && timeUntilNote > -100) {  // 5 seconds
  // ...
}

// Also update line 586 (travel time)
const travelTime = 5;  // Match spawn distance
```

### Adjusting Hit Windows
```javascript
// Line 16
const judgement = {
  perfect: 80,   // ±80ms (was 120ms)
  good: 150      // ±150ms (was 220ms)
};
```

### Adding New Note Types
```javascript
// 1. Define type in buildNotesFromBeats (line 855)
if (i % 16 === 0) {
  tempNotes.push({ lane, timeMs, type: 'mega' });
}

// 2. Handle in createNote (line 383)
if (type === 'mega') {
  geometry = new THREE.SphereGeometry(1, 32, 32);
  color = 0xff00ff;
}

// 3. Handle in onPress (line 468)
if (note.type === 'mega') {
  combo += 5;  // Bonus points
}
```

### Changing Lane Count
```javascript
// Update buildLaneMap (line 893) to return more lanes
return labels.slice(0, 6).map(...);  // 6 lanes instead of 4

// Update key mapping (line 465)
const laneForKey = {
  'a': 0, 's': 1, 'd': 2, 'f': 3, 'j': 4, 'k': 5
};
```

## Debugging

### Enable Console Logging

Add to start() function:
```javascript
console.log('Beat analysis:', { bpm, offset, beatCount: beatTimes.length });
console.log('Generated notes:', notes);
console.log('Audio start time:', audioStartTime);
```

Add to animate() function:
```javascript
if (frameCount++ % 60 === 0) {  // Every 60 frames
  console.log('Game state:', {
    elapsed,
    notesRemaining: notes.length,
    notesActive: noteObjects.length,
    combo
  });
}
```

### Visualize Beat Times

Add to scene after line 362:
```javascript
// Create visual markers at beat positions
beatTimes.forEach((bt, i) => {
  if (i % 4 === 0) {  // Only show every 4th beat
    const geometry = new THREE.BoxGeometry(10, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const marker = new THREE.Mesh(geometry, material);
    marker.position.z = -30 + (bt / duration) * 35;
    scene.add(marker);
  }
});
```

### Check Sync Accuracy

Add to onPress() after hit detection:
```javascript
if (bestIdx >= 0 && bestDelta <= judgement.good) {
  console.log('Hit accuracy:', {
    delta: bestDelta,
    noteTime: note.timeMs,
    currentTime: elapsed,
    accuracy: bestDelta <= judgement.perfect ? 'PERFECT' : 'GOOD'
  });
}
```

## Common Issues

### Issue: Three.js not loading
**Solution**: Check CDN in ensureThreeJS() (line 12)
```javascript
// Try alternative CDN
script.src = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
```

### Issue: Notes not spawning
**Cause**: Empty beatTimes array

**Debug**:
```javascript
console.log('Beat times:', beatTimes);
console.log('Notes generated:', notes.length);
```

**Fix**: Use buildNotes() fallback if analysis fails

### Issue: Audio plays but no notes
**Cause**: audioStartOffset not set correctly

**Debug**:
```javascript
console.log('useAudioSync:', useAudioSync);
console.log('audioStartOffset:', audioStartOffset);
console.log('audioCtx.currentTime:', audioCtx?.currentTime);
```

### Issue: Notes appear too early/late
**Cause**: Offset calibration needed

**Fix**: Adjust offset input or modify spawn timing

## Testing Checklist

### Unit-Level
- [ ] buildBeatsFromBpm() returns correct beat count
- [ ] buildNotesFromBeats() places notes at beat times
- [ ] weightedLaneIndex() respects bias weights
- [ ] createNote() creates proper Three.js mesh

### Integration-Level
- [ ] analyzeTrack() returns valid data
- [ ] Audio starts at scheduled time
- [ ] Notes spawn 3 seconds before hit
- [ ] Hit detection works within windows
- [ ] Combo increments correctly

### System-Level
- [ ] Full 60-second session stays in sync
- [ ] Memory doesn't leak (check DevTools)
- [ ] Frame rate stays stable
- [ ] Audio and visuals aligned on beat
- [ ] Output data matches gameplay

## Performance Profiling

### Measure Analysis Time
```javascript
const t0 = performance.now();
const res = await analyzeTrack(target);
const t1 = performance.now();
console.log('Analysis took:', t1 - t0, 'ms');
```

### Measure Note Generation
```javascript
const t0 = performance.now();
notes = buildNotesFromBeats(beats, lanes, bias, duration, rand);
const t1 = performance.now();
console.log('Generation took:', t1 - t0, 'ms');
```

### Monitor Frame Time
```javascript
let lastTime = performance.now();
function animate(timestamp) {
  const frameTime = timestamp - lastTime;
  if (frameTime > 16.67) {  // >60fps
    console.warn('Slow frame:', frameTime.toFixed(2), 'ms');
  }
  lastTime = timestamp;
  // ...
}
```

## API Reference

### External Dependencies

```javascript
// From ../music/manager.js
listTracks() → Promise<Track[]>
loadTrack(entry) → Promise<Track>
analyzeTrack(target, options) → Promise<Analysis>
getCachedAnalysis(id) → Analysis | null

// From ../data/genres.js
GENRE_LIBRARY: Genre[]

// From ../data/accents.js
ACCENT_LIBRARY: Accent[]

// From ../js/config.js
LANGUAGE_OPTIONS: string[]
```

### Internal Functions

```javascript
buildRhythm3DGameDialog(onFinish, options) → HTMLElement
buildLaneMap(bias) → Lane[]
buildBeatsFromBpm(bpm, offset, duration) → number[]
buildNotesFromBeats(beatTimes, lanes, bias, duration, rand) → Note[]
biasLaneWeights(lanes, bias) → number[]
weightedLaneIndex(weights, rand) → number
buildOutput(lanes, hits, extras) → Output
```

## Resources

- **Three.js Docs**: https://threejs.org/docs/
- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **Beat Detection Papers**: https://www.ee.columbia.edu/~dpwe/papers/
- **Rhythm Game Design**: https://gdkeys.com/rhythm-game-design/

## Contributing

When modifying the sync system:
1. Test with multiple BPMs (slow, medium, fast)
2. Test with different audio formats (MP3, WAV, OGG)
3. Verify no drift over 3+ minute sessions
4. Check memory usage (no leaks)
5. Update SYNC_SYSTEM.md if timing changes
6. Add console logging for major state changes

## License

Part of Music Formula Generator project. See root LICENSE file.
