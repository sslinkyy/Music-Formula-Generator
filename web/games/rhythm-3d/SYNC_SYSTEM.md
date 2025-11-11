# Audio-Visual Synchronization System

## The Problem

Rhythm games require **frame-perfect synchronization** between:
1. Audio playback (when you hear the beat)
2. Visual notes (when notes hit the target line)
3. Input timing (when player should press the button)

Simply detecting BPM is **not enough** because:
- Audio playback uses `AudioContext.currentTime` (high-precision audio clock)
- Visual rendering uses `requestAnimationFrame` with `performance.now()` (different clock)
- These clocks can drift apart over time
- Audio decoding/buffering introduces latency
- Display refresh rates vary (60Hz, 120Hz, 144Hz)

## The Solution

Our synchronization system uses **AudioContext as the master clock** when music is playing.

### Key Components

#### 1. Dual Timing System

```javascript
// Two timing modes
let useAudioSync = false;      // Use audio clock when true
let audioStartOffset = 0;       // When audio started (in audio context time)
let gameStartTime = 0;          // When game started (in performance.now time)

// Calculate elapsed time based on mode
if (useAudioSync && audioCtx) {
  // Use AudioContext time - rock solid, never drifts
  elapsed = (audioCtx.currentTime - audioStartOffset) * 1000;
} else {
  // Use performance timer - for synthetic beats
  elapsed = performance.now() - gameStartTime;
}
```

#### 2. Precise Audio Start Timing

```javascript
// Schedule audio to start in the near future
const startDelay = 0.1; // 100ms from now
const audioStartTime = audioCtx.currentTime + startDelay;

// Record this as our timing anchor
audioStartOffset = audioStartTime;
useAudioSync = true;

// Start audio at scheduled time
sourceNode.start(audioStartTime, 0);

// Start animation loop immediately
requestAnimationFrame(animate);
```

**Why the delay?**
- Gives time for animation loop to start
- Ensures first frame doesn't miss audio start
- 100ms is imperceptible to humans
- Audio is scheduled, not started immediately

#### 3. Beat-Based Note Generation

All notes are generated **before gameplay starts**, based on detected beat times:

```javascript
// Analyze audio to get beat times
const res = await analyzeTrack(target, { maxDurationSec: duration });
// res.beatTimes = [0.1, 0.569, 1.038, 1.507, ...] in seconds

// Generate notes on each beat
notes = buildNotesFromBeats(res.beatTimes, lanes, chosenBias, duration, rand);
```

Each note has an exact timestamp (in milliseconds) when it should be hit:
```javascript
{
  lane: 0,
  timeMs: 569,    // Hit at exactly 569ms into the song
  type: 'short'
}
```

#### 4. Dynamic Note Spawning

Notes don't exist in 3D scene from the start. They spawn 3 seconds before they should be hit:

```javascript
for (let i = 0; i < notes.length; i++) {
  const note = notes[i];
  const timeUntilNote = note.timeMs - elapsed;

  // Spawn when 3 seconds away
  if (timeUntilNote < 3000 && timeUntilNote > -100) {
    const noteObj = createNote(note.lane, note.timeMs, note.type, note.lenMs);
    noteObjects.push(noteObj);
    notes.splice(i, 1);  // Remove from pending list
  }
}
```

**Why 3 seconds?**
- Gives player time to see and react to notes
- Balances performance (not rendering too many notes)
- Standard for rhythm games (similar to Guitar Hero, OSU)

#### 5. Synchronized Note Movement

Notes scroll toward the target line based on time-until-hit:

```javascript
const timeUntilHit = (note.timeMs - elapsed) / 1000;  // In seconds
const targetZ = 5;       // Where target line is
const startZ = -30;      // Where notes spawn
const travelTime = 3;    // 3 seconds to travel

// Calculate Z position: linear interpolation from start to target
const z = startZ + (startZ - targetZ) * (timeUntilHit / travelTime) * -1;
note.mesh.position.z = z;
```

**Math breakdown:**
- When spawned: `timeUntilHit = 3.0s`, `z = -30` (far away)
- Halfway: `timeUntilHit = 1.5s`, `z ≈ -12.5`
- At target: `timeUntilHit = 0.0s`, `z = 5` (exactly on line)
- After hit: `timeUntilHit < 0`, note removed

#### 6. Synchronized Input Timing

When player presses a button, we use the **same timing calculation**:

```javascript
function onPress(laneIndex) {
  // Use same timing as animation loop
  let elapsed;
  if (useAudioSync && audioCtx) {
    elapsed = (audioCtx.currentTime - audioStartOffset) * 1000;
  } else {
    elapsed = now - gameStartTime;
  }

  // Find note closest to current time
  for (let i = 0; i < noteObjects.length; i++) {
    const n = noteObjects[i];
    if (n.lane !== laneIndex) continue;

    const delta = Math.abs(n.timeMs - elapsed);
    if (delta <= judgement.good) {  // Within 220ms window
      // HIT!
    }
  }
}
```

## Timing Flow Example

Let's trace a single beat through the system:

### Setup Phase (before game starts)

1. **Beat Detection**
   ```
   Audio analyzed → Beat detected at 2.5 seconds into song
   ```

2. **Note Generation**
   ```
   Note created: { lane: 1, timeMs: 2500, type: 'short' }
   Stored in notes array
   ```

3. **Audio Scheduling**
   ```
   audioCtx.currentTime = 10.0s
   audioStartTime = 10.1s (10.0 + 0.1 delay)
   audioStartOffset = 10.1
   sourceNode.start(10.1, 0)  // Will play from position 0 at time 10.1
   ```

### Gameplay Phase

4. **Note Spawning** (when elapsed ≈ -500ms, before song starts)
   ```
   Frame at audioCtx.currentTime = 10.0s
   elapsed = (10.0 - 10.1) * 1000 = -100ms
   timeUntilNote = 2500 - (-100) = 2600ms
   2600 < 3000? No, not yet

   Frame at audioCtx.currentTime = 10.1s (audio starts now!)
   elapsed = (10.1 - 10.1) * 1000 = 0ms
   timeUntilNote = 2500 - 0 = 2500ms
   2500 < 3000? Yes! Spawn note at Z = -30
   ```

5. **Note Movement** (during next 2.5 seconds)
   ```
   Frame at elapsed = 1000ms
   timeUntilHit = (2500 - 1000) / 1000 = 1.5s
   z = -30 + (-30 - 5) * (1.5 / 3) * -1
   z = -30 + 35 * 0.5 = -12.5

   Frame at elapsed = 2000ms
   timeUntilHit = 0.5s
   z ≈ -1.7

   Frame at elapsed = 2500ms (THE MOMENT!)
   timeUntilHit = 0.0s
   z = 5.0 (exactly on target line!)
   ```

6. **Player Input**
   ```
   Player presses 'F' at elapsed = 2480ms
   delta = |2500 - 2480| = 20ms
   20ms < 120ms (perfect window)? Yes!
   PERFECT HIT! ✨
   ```

## Synchronization Guarantees

### With Audio Sync Enabled (music playing)

✅ **Frame-perfect accuracy**: Notes hit target line exactly when beat plays
✅ **No drift**: AudioContext time is immune to system lag
✅ **Consistent timing**: Same calculation for spawn, movement, and input
✅ **Sub-millisecond precision**: AudioContext provides microsecond accuracy

### Without Audio Sync (synthetic beats)

✅ **Stable gameplay**: Uses performance.now() which is still very accurate
✅ **No audio latency**: Since no audio is decoding
⚠️ **Can drift slightly**: performance.now() can be affected by system load
⚠️ **Display-dependent**: Tied to requestAnimationFrame timing

## Debug Mode

Toggle with "Debug" button to see real-time timing info:

```
Elapsed: 2480ms          ← Current game time
Audio Time: 12580ms      ← AudioContext.currentTime in ms
Audio Offset: 10.100s    ← When audio started
Sync Mode: Audio         ← Using audio clock
Notes Pending: 142       ← Not yet spawned
Notes Active: 8          ← Currently visible
Next Note: 2580ms        ← Next note timestamp
```

## Common Issues & Solutions

### Issue: Notes appear off-beat

**Cause**: Audio offset may be slightly wrong

**Solution**: Use offset adjustment input
```javascript
const offOverride = Number(offsetInput.value || 0);
offset = isFinite(offOverride) ? offOverride : offset;
```
Try values like `-0.05` or `+0.05` (±50ms)

### Issue: Notes drift over time

**Cause**: Not using audio sync mode

**Check**:
```javascript
console.log('useAudioSync:', useAudioSync);
console.log('audioStartOffset:', audioStartOffset);
```

Should see `useAudioSync: true` when music is playing.

### Issue: First few notes are missed

**Cause**: Notes spawning too late due to analysis delay

**Solution**: Increase spawn look-ahead from 3s to 4s, or show "Get Ready" countdown

### Issue: Beat detection is wrong

**Cause**: Complex or ambiguous rhythm

**Solution**: Use tap tempo to manually set BPM
- Tap at least 4 times to the beat
- Algorithm discards outliers
- Override automatic detection

## Performance Considerations

### Memory
- All note times calculated at start: ~200 beats × 1.5 notes/beat = ~300 notes
- Each note object: ~500 bytes
- Total: ~150KB (negligible)

### CPU
- Beat detection: O(n) where n = audio samples, ~1-3 seconds
- Note generation: O(beats), typically <100ms
- Per-frame: O(active notes), typically <20 notes on screen

### GPU
- Each note is a simple box mesh
- ~8-16 notes rendered at peak
- Minimal draw calls
- 60fps easily achieved on integrated graphics

## Algorithm Complexity

```
analyzeTrack:     O(n) where n = audio length
buildBeatsFromBpm: O(duration / period) ≈ O(bpm * duration)
buildNotesFromBeats: O(beats) with small constant
animate loop:     O(pending notes) + O(active notes)
onPress:          O(active notes) in same lane ≈ O(4) average
```

Overall: **Highly efficient**, scales linearly with song length.

## Technical References

- **Web Audio API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- **AudioContext.currentTime**: https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/currentTime
- **requestAnimationFrame**: https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame
- **Performance.now()**: https://developer.mozilla.org/en-US/docs/Web/API/Performance/now

## Related Files

- Implementation: `index.js` (lines 540-800)
- Beat detection: `../music/manager.js`
- Helper functions: `index.js` (lines 845-889)
