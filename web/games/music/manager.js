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

export async function analyzeTrack(/* audioBufferOrUrl */) {
  // TODO (Step 2): Web Audio analysis → { bpm, offset, confidence, beatTimes }
  // For now, return a placeholder result so UI can render fields.
  return { bpm: null, offset: null, confidence: 0, beatTimes: [] };
}

