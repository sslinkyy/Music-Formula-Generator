// StepMania Parser for 3D Rhythm Tapper
// Converts .sm/.ssc files to game-compatible note format
// Supports ZIP packages containing .sm + audio files

// Load JSZip from CDN
let JSZip;
async function ensureJSZip() {
  if (window.JSZip) {
    JSZip = window.JSZip;
    console.log('JSZip already loaded');
    return;
  }

  console.log('Loading JSZip from CDN...');
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
    script.onload = () => {
      JSZip = window.JSZip;
      console.log('JSZip loaded successfully');
      resolve();
    };
    script.onerror = (err) => {
      console.error('Failed to load JSZip:', err);
      reject(new Error('Failed to load JSZip'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Parses a StepMania .sm or .ssc file content
 * @param {string} content - File content as text
 * @returns {Object} Parsed StepMania data
 */
export function parseSimfileContent(content) {
  const data = {
    metadata: {},
    timing: { offset: 0, bpms: [], stops: [] },
    charts: []
  };

  // Parse metadata tags (format: #TAG:value;)
  const tagRegex = /#([A-Z]+):([^;]*);/g;
  let match;

  while ((match = tagRegex.exec(content)) !== null) {
    const tag = match[1];
    const value = match[2].trim();

    switch (tag) {
      case 'TITLE':
        data.metadata.title = value;
        break;
      case 'ARTIST':
        data.metadata.artist = value;
        break;
      case 'SUBTITLE':
        data.metadata.subtitle = value;
        break;
      case 'MUSIC':
        data.metadata.musicFile = value;
        break;
      case 'BANNER':
        data.metadata.banner = value;
        break;
      case 'BACKGROUND':
        data.metadata.background = value;
        break;
      case 'DISPLAYBPM':
        data.metadata.displayBpm = value;
        break;
      case 'OFFSET':
        data.timing.offset = parseFloat(value) || 0;
        break;
      case 'BPMS':
        data.timing.bpms = parseBPMs(value);
        break;
      case 'STOPS':
        data.timing.stops = parseStops(value);
        break;
    }
  }

  // Ensure we have at least one BPM
  if (data.timing.bpms.length === 0) {
    data.timing.bpms.push({ beat: 0, bpm: 120 });
  }

  // DEBUG: Log raw content sample
  console.log('=== RAW CONTENT SAMPLE ===');
  console.log('First 500 chars:', content.substring(0, 500));
  console.log('Looking for #NOTES sections...');

  // Check if #NOTES exists at all
  const notesIndex = content.indexOf('#NOTES');
  console.log('#NOTES found at index:', notesIndex);
  if (notesIndex >= 0) {
    console.log('Content around #NOTES:', content.substring(notesIndex, notesIndex + 200));
  }

  // Parse NOTES sections (can have multiple charts)
  const notesRegex = /#NOTES:([^;]+);/g;
  console.log('Testing regex:', notesRegex);

  let matchCount = 0;
  while ((match = notesRegex.exec(content)) !== null) {
    matchCount++;
    console.log(`NOTES match ${matchCount} found at index ${match.index}`);
    console.log('Matched content length:', match[1].length);
    console.log('First 100 chars:', match[1].substring(0, 100));

    const notesContent = match[1];
    const chart = parseChart(notesContent);
    console.log('parseChart returned:', chart);

    if (chart) {
      data.charts.push(chart);
    }
  }

  console.log('Total NOTES matches found:', matchCount);
  console.log('Total charts parsed:', data.charts.length);

  return data;
}

/**
 * Parses BPMS tag (format: "0.000=120.000,8.000=140.000")
 */
function parseBPMs(value) {
  const bpms = [];
  const pairs = value.split(',');

  for (const pair of pairs) {
    const [beat, bpm] = pair.split('=').map(s => parseFloat(s.trim()));
    if (!isNaN(beat) && !isNaN(bpm)) {
      bpms.push({ beat, bpm });
    }
  }

  return bpms.sort((a, b) => a.beat - b.beat);
}

/**
 * Parses STOPS tag (format: "16.000=2.000")
 */
function parseStops(value) {
  const stops = [];
  const pairs = value.split(',');

  for (const pair of pairs) {
    const [beat, duration] = pair.split('=').map(s => parseFloat(s.trim()));
    if (!isNaN(beat) && !isNaN(duration)) {
      stops.push({ beat, duration });
    }
  }

  return stops.sort((a, b) => a.beat - b.beat);
}

/**
 * Parses a single NOTES section
 * Format: type:description:difficulty:meter:radarValues:noteData
 */
function parseChart(notesContent) {
  const lines = notesContent.split(/\r?\n/).map(l => l.trim()).filter(l => l);
  if (lines.length < 6) return null;

  // Strip trailing colons from each line (StepMania format ends lines with :)
  const chartType = lines[0].replace(/:\s*$/, '');
  const description = lines[1].replace(/:\s*$/, '');
  const difficulty = lines[2].replace(/:\s*$/, '');
  const meter = parseInt(lines[3].replace(/:\s*$/, '')) || 0;
  const radarValues = lines[4].replace(/:\s*$/, '');
  const noteData = lines.slice(5).join('\n');

  console.log('parseChart - chartType after trim:', chartType);
  console.log('parseChart - difficulty:', difficulty, 'meter:', meter);

  // Only support dance-single (4-panel)
  if (chartType !== 'dance-single') {
    console.log('parseChart - rejected:', chartType, '!== dance-single');
    return null;
  }

  console.log('parseChart - SUCCESS! Returning chart:', difficulty, meter);
  return {
    type: chartType,
    description,
    difficulty,
    meter,
    radarValues,
    noteData,
    displayName: `${difficulty} (${meter})`
  };
}

/**
 * Converts StepMania note data to game format
 * @param {string} noteData - Raw note data from chart
 * @param {Object} timing - Timing info (offset, bpms, stops)
 * @param {number} laneCount - Number of lanes (4)
 * @returns {Array} Array of note objects
 */
export function convertNotesToGameFormat(noteData, timing, laneCount = 4) {
  const notes = [];
  const { offset, bpms, stops } = timing;

  // Create beat-to-time converter
  const beatToTime = createBeatToTimeConverter(bpms, offset, stops);

  // Split into measures (separated by commas)
  const measures = noteData.split(',').map(m => m.trim().replace(/;$/, ''));

  let currentBeat = 0;

  for (const measure of measures) {
    const lines = measure.split(/\r?\n/)
      .map(l => l.trim())
      .filter(l => l.length >= laneCount);

    if (lines.length === 0) {
      currentBeat += 4; // Empty measure = 4 beats
      continue;
    }

    const beatsPerMeasure = 4;
    const beatIncrement = beatsPerMeasure / lines.length;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const beat = currentBeat + (lineIdx * beatIncrement);
      const timeMs = beatToTime(beat);

      // Parse each lane (4 lanes for dance-single)
      for (let lane = 0; lane < Math.min(laneCount, line.length); lane++) {
        const char = line[lane];
        const note = parseNoteCharacter(char, lane, timeMs);
        if (note) {
          notes.push(note);
        }
      }
    }

    currentBeat += beatsPerMeasure;
  }

  return notes;
}

/**
 * Creates a function to convert beat numbers to time in milliseconds
 * Handles BPM changes and stops
 */
function createBeatToTimeConverter(bpms, offset, stops = []) {
  const sortedBpms = [...bpms].sort((a, b) => a.beat - b.beat);
  const sortedStops = [...stops].sort((a, b) => a.beat - b.beat);

  return function(beat) {
    let timeSeconds = offset;
    let lastBeat = 0;
    let bpmIdx = 0;
    let stopIdx = 0;

    // Process BPM changes up to target beat
    for (let i = 0; i < sortedBpms.length; i++) {
      const bpmChange = sortedBpms[i];

      if (beat < bpmChange.beat) break;

      // Add time from lastBeat to this BPM change
      if (i > 0) {
        const prevBpm = sortedBpms[i - 1].bpm;
        const beatsElapsed = bpmChange.beat - lastBeat;
        const secondsPerBeat = 60 / prevBpm;
        timeSeconds += beatsElapsed * secondsPerBeat;
      }

      lastBeat = bpmChange.beat;
      bpmIdx = i;
    }

    // Add remaining time from last BPM change to target beat
    const currentBpm = sortedBpms[bpmIdx].bpm;
    const remainingBeats = beat - lastBeat;
    const secondsPerBeat = 60 / currentBpm;
    timeSeconds += remainingBeats * secondsPerBeat;

    // Add stop durations that occur before target beat
    for (const stop of sortedStops) {
      if (stop.beat <= beat) {
        timeSeconds += stop.duration;
      }
    }

    return timeSeconds * 1000; // Convert to milliseconds
  };
}

/**
 * Parses a single note character and returns game note object
 * StepMania note types:
 * 0 = No note
 * 1 = Tap note
 * 2 = Hold head
 * 3 = Hold tail
 * 4 = Roll head
 * M = Mine
 * L = Lift
 * F = Fake
 */
function parseNoteCharacter(char, lane, timeMs) {
  switch (char) {
    case '0': // No note
      return null;

    case '1': // Tap note -> short
      return { lane, timeMs, type: 'short' };

    case '2': // Hold head -> long
      return { lane, timeMs, type: 'long', lenMs: 500, isHoldHead: true };

    case '3': // Hold tail (handled separately)
      return { lane, timeMs, type: 'hold_tail', isHoldTail: true };

    case '4': // Roll head -> long
      return { lane, timeMs, type: 'long', lenMs: 500, isHoldHead: true };

    case 'M': // Mine -> hazard
      return { lane, timeMs, type: 'hazard' };

    case 'L': // Lift -> chip
      return { lane, timeMs, type: 'chip' };

    case 'F': // Fake -> ignore
      return null;

    case 'K': // Keysound -> chip
      return { lane, timeMs, type: 'chip' };

    default:
      return null;
  }
}

/**
 * Post-processes notes to calculate hold note durations
 */
export function calculateHoldDurations(notes) {
  const processed = [];

  for (let lane = 0; lane < 4; lane++) {
    const laneNotes = notes.filter(n => n.lane === lane).sort((a, b) => a.timeMs - b.timeMs);

    for (let i = 0; i < laneNotes.length; i++) {
      const note = laneNotes[i];

      // Skip hold tails (they're just markers)
      if (note.isHoldTail) continue;

      // If this is a hold head, find the tail
      if (note.isHoldHead) {
        // Find next hold tail in same lane
        for (let j = i + 1; j < laneNotes.length; j++) {
          if (laneNotes[j].isHoldTail) {
            note.lenMs = Math.max(200, laneNotes[j].timeMs - note.timeMs);
            break;
          }
        }
      }

      // Remove temporary flags
      delete note.isHoldHead;
      delete note.isHoldTail;

      processed.push(note);
    }
  }

  return processed.sort((a, b) => a.timeMs - b.timeMs);
}

/**
 * Loads a StepMania package (ZIP or single .sm/.ssc file)
 * @param {File} file - ZIP or simfile
 * @returns {Promise<Object>} Parsed data with audio URL
 */
export async function loadStepManiaPackage(file) {
  await ensureJSZip();

  if (file.name.endsWith('.zip')) {
    return await loadFromZip(file);
  } else if (file.name.endsWith('.sm') || file.name.endsWith('.ssc')) {
    return await loadFromSingleFile(file);
  } else {
    throw new Error('Unsupported file type. Use .sm, .ssc, or .zip');
  }
}

/**
 * Loads StepMania data from ZIP file
 */
async function loadFromZip(zipFile) {
  const zip = await JSZip.loadAsync(zipFile);

  // Find .sm or .ssc file
  const simfiles = Object.keys(zip.files).filter(name =>
    (name.endsWith('.sm') || name.endsWith('.ssc')) && !name.includes('__MACOSX')
  );

  if (simfiles.length === 0) {
    throw new Error('No .sm or .ssc file found in ZIP');
  }

  const simfileName = simfiles[0];
  console.log('Found simfile:', simfileName);

  const simfileContent = await zip.files[simfileName].async('text');
  const parsed = parseSimfileContent(simfileContent);

  // Find audio file
  const musicFileName = parsed.metadata.musicFile;
  if (!musicFileName) {
    throw new Error('No MUSIC tag found in simfile');
  }

  // Try to find audio file (case-insensitive)
  const audioFile = Object.keys(zip.files).find(name =>
    name.toLowerCase().endsWith(musicFileName.toLowerCase()) && !name.includes('__MACOSX')
  );

  if (!audioFile) {
    console.warn(`Audio file not found: ${musicFileName}`);
    return { ...parsed, audioUrl: null, requiresAudioFile: true };
  }

  console.log('Found audio:', audioFile);

  // Extract audio as blob
  const audioBlob = await zip.files[audioFile].async('blob');
  const audioUrl = URL.createObjectURL(audioBlob);

  // Extract banner/background if available
  let bannerUrl = null, backgroundUrl = null;

  if (parsed.metadata.banner) {
    const bannerFile = Object.keys(zip.files).find(name =>
      name.toLowerCase().endsWith(parsed.metadata.banner.toLowerCase())
    );
    if (bannerFile) {
      const bannerBlob = await zip.files[bannerFile].async('blob');
      bannerUrl = URL.createObjectURL(bannerBlob);
    }
  }

  if (parsed.metadata.background) {
    const bgFile = Object.keys(zip.files).find(name =>
      name.toLowerCase().endsWith(parsed.metadata.background.toLowerCase())
    );
    if (bgFile) {
      const bgBlob = await zip.files[bgFile].async('blob');
      backgroundUrl = URL.createObjectURL(bgBlob);
    }
  }

  return {
    ...parsed,
    audioUrl,
    bannerUrl,
    backgroundUrl,
    requiresAudioFile: false
  };
}

/**
 * Loads StepMania data from single .sm/.ssc file
 */
async function loadFromSingleFile(file) {
  const content = await file.text();
  const parsed = parseSimfileContent(content);

  return {
    ...parsed,
    audioUrl: null,
    requiresAudioFile: true
  };
}
