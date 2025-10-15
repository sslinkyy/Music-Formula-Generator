// Music Manager: lists library tracks, supports local files, and caches analysis
// Note: Analysis is stubbed in Step 1; TODOs marked below.

const ANALYSIS_KEY = 'rgf_music_analysis_v1';

export async function listTracks() {
  try {
    const res = await fetch('music/manifest.json', { cache: 'no-cache' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (_) { return []; }
}

export function getCachedAnalysis(idOrUrl) {
  try {
    const db = JSON.parse(localStorage.getItem(ANALYSIS_KEY) || '{}');
    return db[idOrUrl] || null;
  } catch (_) { return null; }
}

export function setCachedAnalysis(idOrUrl, result) {
  try {
    const db = JSON.parse(localStorage.getItem(ANALYSIS_KEY) || '{}');
    db[idOrUrl] = result;
    localStorage.setItem(ANALYSIS_KEY, JSON.stringify(db));
  } catch (_) {}
}

export async function loadTrack(trackEntryOrFile) {
  // Returns a playable URL and simple metadata
  if (!trackEntryOrFile) return null;
  if (trackEntryOrFile instanceof File || trackEntryOrFile instanceof Blob) {
    const url = URL.createObjectURL(trackEntryOrFile);
    return { id: 'local:' + (trackEntryOrFile.name || 'track'), title: trackEntryOrFile.name || 'Local Track', artist: '', url, source: 'local' };
  }
  const entry = trackEntryOrFile;
  if (entry && typeof entry === 'object' && entry.file) {
    return { id: entry.id || entry.file, title: entry.title || entry.file, artist: entry.artist || '', url: entry.file, source: 'library', bpm: entry.bpm || null, offset: entry.offset || null };
  }
  return null;
}

export async function analyzeTrack(fileOrUrl, options = {}) {
  // Web Audio analysis → { bpm, offset, confidence, beatTimes }
  // Simple onset-energy + autocorrelation estimator; optimized for 60–180 BPM.
  try {
    let arrayBuffer;
    if (fileOrUrl instanceof File || fileOrUrl instanceof Blob) {
      arrayBuffer = await fileOrUrl.arrayBuffer();
    } else if (typeof fileOrUrl === 'string') {
      const res = await fetch(fileOrUrl, { cache: 'no-cache' });
      arrayBuffer = await res.arrayBuffer();
    } else {
      return { bpm: null, offset: 0, confidence: 0, beatTimes: [] };
    }

    const AC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    // Fallback to AudioContext if Offline not available
    if (!AC) return { bpm: null, offset: 0, confidence: 0, beatTimes: [] };

    // Decode with a short offline context for speed
    const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await tmpCtx.decodeAudioData(arrayBuffer.slice(0));
    tmpCtx.close();
    const sr = audioBuffer.sampleRate;
    const dur = Math.min(audioBuffer.duration, options.maxDurationSec || 120);

    // Downmix to mono
    const ch0 = audioBuffer.getChannelData(0);
    let mono;
    if (audioBuffer.numberOfChannels > 1) {
      const ch1 = audioBuffer.getChannelData(1);
      mono = new Float32Array(Math.floor(sr * dur));
      for (let i=0;i<mono.length;i++) mono[i] = (ch0[i] + ch1[i]) * 0.5;
    } else {
      mono = ch0.subarray(0, Math.floor(sr * dur));
    }

    // Energy envelope over frames
    const win = 2048, hop = 512;
    const nFrames = Math.max(1, Math.floor((mono.length - win) / hop));
    const energy = new Float32Array(nFrames);
    let sum = 0;
    // First window
    for (let i=0;i<win;i++) { const s = mono[i]; sum += s*s; }
    energy[0] = sum;
    for (let f=1; f<nFrames; f++) {
      // Slide window by hop
      let addSum = 0, subSum = 0;
      const startPrev = (f-1)*hop;
      const start = f*hop;
      for (let i=0;i<hop;i++) {
        const idxAdd = start + win - hop + i;
        const idxSub = startPrev + i;
        const sAdd = mono[idxAdd] || 0; addSum += sAdd*sAdd;
        const sSub = mono[idxSub] || 0; subSum += sSub*sSub;
      }
      sum += addSum - subSum;
      energy[f] = sum;
    }
    // Onset strength (half-wave rectified diff)
    const onset = new Float32Array(nFrames);
    for (let f=1; f<nFrames; f++) {
      const d = energy[f] - energy[f-1];
      onset[f] = d > 0 ? d : 0;
    }
    // Normalize onset
    let maxOn = 0; for (let f=0; f<nFrames; f++) if (onset[f] > maxOn) maxOn = onset[f];
    if (maxOn > 0) for (let f=0; f<nFrames; f++) onset[f] /= maxOn;

    // Autocorrelation within BPM range 60–180
    const hopTime = hop / sr; // seconds per frame
    const bpmMin = 60, bpmMax = 180;
    const lagMin = Math.floor((60/bpmMax) / hopTime);
    const lagMax = Math.floor((60/bpmMin) / hopTime);
    const ac = new Float32Array(lagMax+1);
    for (let lag = lagMin; lag <= lagMax; lag++) {
      let s = 0; const limit = nFrames - lag;
      for (let f=0; f<limit; f++) s += onset[f] * onset[f+lag];
      ac[lag] = s;
    }
    // Find best lag and reduce octave errors (x2 / /2)
    let bestLag = lagMin, best = -1, second = -1;
    for (let lag = lagMin; lag <= lagMax; lag++) {
      const v = ac[lag];
      if (v > best) { second = best; best = v; bestLag = lag; }
      else if (v > second) { second = v; }
    }
    let bpm = Math.max(bpmMin, Math.min(bpmMax, Math.round(60 / (bestLag * hopTime))));
    // Snap to common multiples
    if (bpm < 80 && bpm*2 <= bpmMax) bpm *= 2;
    if (bpm > 160) bpm = Math.round(bpm/2);
    const confidence = best > 0 ? best / Math.max(1e-6, second || (best*0.5)) : 0;

    const period = 60 / bpm; // seconds
    // Estimate offset: find peak onset in first bars and mod by period
    let peakIdx = 0; let peakVal = 0;
    const searchFrames = Math.min(nFrames, Math.floor((8*period)/hopTime));
    for (let f=0; f<searchFrames; f++) if (onset[f] > peakVal) { peakVal = onset[f]; peakIdx = f; }
    let offset = (peakIdx * hopTime) % period;

    // Build beat times within duration
    const beatTimes = [];
    const maxTime = dur;
    let t = offset; const startGuard = 0.05;
    while (t < maxTime) { beatTimes.push(t); t += period; }

    return { bpm, offset, confidence, beatTimes };
  } catch (e) {
    console.error('analyzeTrack failed', e);
    return { bpm: null, offset: 0, confidence: 0, beatTimes: [] };
  }
}
