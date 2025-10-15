// Minimal Rhythm Tapper MVP (no audio). Builds a self-contained dialog content.
// Exports: buildRhythmGameDialog(onFinish, options)

import { GENRE_LIBRARY } from '../../data/genres.js';
import { ACCENT_LIBRARY } from '../../data/accents.js';
import { LANGUAGE_OPTIONS } from '../../js/config.js';
import { listTracks, loadTrack, getCachedAnalysis, analyzeTrack } from '../music/manager.js';

export function buildRhythmGameDialog(onFinish, options = {}) {
  const prefsReduce = document.documentElement.getAttribute('data-reduce-motion') === 'true';
  let chosenBias = options.preset || 'none';
  let lanes = buildLaneMap(chosenBias); // [{label,color}]
  const duration = options.durationSec || 60;
  const difficulty = options.difficulty || 'normal';
  const speed = difficulty === 'hard' ? 1.35 : difficulty === 'easy' ? 0.85 : 1.0;
  const judgement = { perfect: 120, good: 220 }; // ms windows

  const wrap = document.createElement('div');
  const controls = document.createElement('div'); controls.className = 'inline-buttons';
  // Difficulty select
  const diffSel = document.createElement('select'); ['easy','normal','hard'].forEach(d=>{ const o=document.createElement('option'); o.value=d; o.textContent=d; if(d===difficulty) o.selected=true; diffSel.appendChild(o); });
  diffSel.title = 'Difficulty';
  diffSel.addEventListener('change', ()=>{});
  controls.appendChild(diffSel);
  // Preset bias
  const biasSel = document.createElement('select');
  ['none','street','club','backpack','streaming'].forEach(b=>{ const o=document.createElement('option'); o.value=b; o.textContent=b; if(b===chosenBias) o.selected=true; biasSel.appendChild(o); });
  biasSel.title = 'Preset Bias'; biasSel.addEventListener('change', ()=>{ chosenBias = biasSel.value; lanes = buildLaneMap(chosenBias); });
  controls.appendChild(biasSel);
  // Music source
  let musicSource = 'none'; let selectedTrack = null; let selectedFile = null; let trackMeta = null; let analysis = null;
  const musicSel = document.createElement('select'); ['none','library','local'].forEach(m=>{ const o=document.createElement('option'); o.value=m; o.textContent = 'Music: ' + m; if(m==='none') o.selected=true; musicSel.appendChild(o); });
  musicSel.title = 'Music Source'; controls.appendChild(musicSel);
  // Library dropdown
  const libSel = document.createElement('select'); libSel.style.display='none'; libSel.title = 'Library Track'; controls.appendChild(libSel);
  // Local file
  const fileInput = document.createElement('input'); fileInput.type='file'; fileInput.accept='audio/*'; fileInput.style.display='none'; controls.appendChild(fileInput);
  // Track info
  const trackInfo = document.createElement('span'); trackInfo.className='hint'; trackInfo.style.marginLeft = '6px'; controls.appendChild(trackInfo);
  // Sound toggle
  let soundOn = false;
  const soundBtn = document.createElement('button'); soundBtn.textContent = 'Sound: Off';
  soundBtn.addEventListener('click', ()=>{ soundOn=!soundOn; soundBtn.textContent = `Sound: ${soundOn?'On':'Off'}`; });
  controls.appendChild(soundBtn);
  // Language / Accent quick selectors
  let chosenLanguage = 'English';
  let chosenAccent = 'Neutral / Standard';
  const langSel = document.createElement('select');
  LANGUAGE_OPTIONS.forEach(L=>{ const o=document.createElement('option'); o.value=L; o.textContent=L; if(L===chosenLanguage) o.selected=true; langSel.appendChild(o); });
  langSel.title = 'Language'; langSel.addEventListener('change', ()=>{ chosenLanguage = langSel.value; });
  controls.appendChild(langSel);
  const accSel = document.createElement('select');
  ACCENT_LIBRARY.forEach(a=>{ const o=document.createElement('option'); o.value=a.name; o.textContent=a.name; if(a.name===chosenAccent) o.selected=true; accSel.appendChild(o); });
  accSel.title = 'Accent'; accSel.addEventListener('change', ()=>{ chosenAccent = accSel.value; });
  controls.appendChild(accSel);
  // Start / Quit
  const startBtn = document.createElement('button'); startBtn.className = 'btn-primary'; startBtn.textContent = 'Start';
  const quitBtn = document.createElement('button'); quitBtn.textContent = 'Quit';
  controls.appendChild(startBtn); controls.appendChild(quitBtn);
  wrap.appendChild(controls);

  const hud = document.createElement('div'); hud.className = 'hint'; hud.textContent = 'Keys: D F   J K / Click lanes. Hit notes on the line!';
  hud.style.margin = '6px 0'; wrap.appendChild(hud);

  // Tutorial overlay (first view in dialog)
  const tut = document.createElement('div');
  tut.style.padding = '8px 10px'; tut.style.border = '1px solid var(--panel-border)'; tut.style.borderRadius = '10px'; tut.style.marginBottom = '6px';
  tut.innerHTML = '<strong>Tutorial</strong>:\n<ol style="margin:6px 0 0 18px">\n<li>Hit notes on the line (D/F/J/K or click).</li>\n<li>Long bars add style tags; yellow chips add keywords; red blocks add forbidden words.</li>\n<li>Choose language/accent before you start (top right).</li>\n</ol>';
  wrap.appendChild(tut);

  // Populate library tracks
  listTracks().then(tracks => {
    try {
      libSel.innerHTML='';
      const def = document.createElement('option'); def.value=''; def.textContent='Select track'; libSel.appendChild(def);
      tracks.forEach(tr => { const o=document.createElement('option'); o.value=tr.id||tr.file; o.textContent = tr.title || tr.file; o.dataset.json = JSON.stringify(tr); libSel.appendChild(o); });
    } catch(_){}
  });
  musicSel.addEventListener('change', async () => {
    musicSource = musicSel.value;
    libSel.style.display = musicSource==='library' ? '' : 'none';
    fileInput.style.display = musicSource==='local' ? '' : 'none';
    trackMeta = null; selectedTrack = null; selectedFile = null; analysis = null;
    trackInfo.textContent = '';
  });
  libSel.addEventListener('change', async () => {
    try {
      const opt = libSel.options[libSel.selectedIndex];
      if (!opt || !opt.dataset.json) return;
      const entry = JSON.parse(opt.dataset.json);
      selectedTrack = await loadTrack(entry);
      trackMeta = { id: selectedTrack.id, title: selectedTrack.title, bpm: entry.bpm||null, offset: entry.offset||null };
      const cached = getCachedAnalysis(selectedTrack.id);
      analysis = cached || null; // Step 1: rely on cached if present
      trackInfo.textContent = `Track: ${selectedTrack.title}${trackMeta.bpm?` • BPM ${trackMeta.bpm}`:''}`;
    } catch(_){}
  });
  fileInput.addEventListener('change', async (e) => {
    try {
      const f = e.target.files && e.target.files[0]; if (!f) return;
      selectedFile = f; selectedTrack = await loadTrack(f);
      trackMeta = { id: selectedTrack.id, title: selectedTrack.title, bpm: null, offset: null };
      analysis = null; // Step 1: no analysis yet
      trackInfo.textContent = `Track: ${selectedTrack.title}`;
    } catch(_){}
  });

  const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 420; canvas.style.width = '100%'; canvas.style.background = '#0f1115'; canvas.style.borderRadius = '12px';
  wrap.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let running = false, t0 = 0, now = 0;
  let notes = []; // {lane, timeMs, type, lenMs?}
  let scrollY = 0;
  const lineY = canvas.height - 80;
  const laneW = canvas.width / lanes.length;
  const hits = new Array(lanes.length).fill(0);
  const totalNotes = new Array(lanes.length).fill(0);
  let misses = 0;
  let combo = 0, bestCombo = 0;
  const tagCounts = {};
  const keywords = [];
  const forbidden = [];

  // Build a simple seed map (steady quarter notes per lane, staggered)
  function buildNotes() {
    notes = [];
    const bpm = 96 * (diffSel.value==='hard'?1.35:diffSel.value==='easy'?0.85:1.0);
    const beatMs = 60000 / bpm;
    const end = duration * 1000;
    for (let lane = 0; lane < lanes.length; lane++) {
      for (let t = (lane * beatMs) % (beatMs * 2); t < end; t += beatMs * 2) {
        notes.push({ lane, timeMs: t, type: 'short' }); totalNotes[lane]++;
      }
    }
    // sprinkle long notes (style tags), chips (keywords), and hazards (forbidden)
    const w = biasLaneWeights(lanes, chosenBias);
    for (let t = beatMs*8; t < end; t += beatMs*8) {
      const lane = weightedLaneIndex(w); notes.push({ lane, timeMs: t, type: 'long', lenMs: beatMs*2 });
    }
    for (let t = beatMs*10; t < end; t += beatMs*10) {
      const lane = weightedLaneIndex(w); notes.push({ lane, timeMs: t, type: 'chip' });
    }
    for (let t = beatMs*12; t < end; t += beatMs*12) {
      const lane = weightedLaneIndex(w); notes.push({ lane, timeMs: t, type: 'hazard' });
    }
    notes.sort((a,b) => a.timeMs - b.timeMs);
  }

  // Input
  const laneForKey = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };
  function onPress(laneIndex) {
    if (!running) return;
    const t = now - t0;
    // find nearest note in this lane that isn\'t judged yet
    let bestIdx = -1, bestDelta = 999999;
    for (let i = 0; i < notes.length; i++) {
      const n = notes[i];
      if (n.lane !== laneIndex) continue;
      const d = Math.abs(n.timeMs - t);
      if (d < bestDelta) { bestDelta = d; bestIdx = i; }
      if (n.timeMs - t > judgement.good) break; // future notes only get farther
    }
    if (bestIdx >= 0 && bestDelta <= judgement.good) {
      const note = notes[bestIdx];
      // register hit based on type
      if (note.type === 'short') {
        hits[laneIndex]++; combo++; bestCombo = Math.max(bestCombo, combo);
      } else if (note.type === 'long') {
        const tag = pickLaneTag(lanes[note.lane].label);
        tagCounts[tag] = (tagCounts[tag]||0) + 1; combo++; bestCombo = Math.max(bestCombo, combo);
      } else if (note.type === 'chip') {
        const kw = pickKeyword(); if (!keywords.includes(kw)) keywords.push(kw); combo++; bestCombo = Math.max(bestCombo, combo);
      } else if (note.type === 'hazard') {
        const fw = pickForbidden(); if (!forbidden.includes(fw)) forbidden.push(fw); combo = 0;
      }
      beep(soundOn, note.type==='hazard'? 200 : 440);
      notes.splice(bestIdx, 1);
    } else {
      combo = 0;
      beep(soundOn, 120);
    }
  }
  function keydown(e) {
    const k = (e.key || '').toLowerCase();
    if (laneForKey.hasOwnProperty(k)) { onPress(laneForKey[k]); e.preventDefault(); }
  }
  function click(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const lane = Math.floor((x / rect.width) * lanes.length);
    onPress(Math.max(0, Math.min(lanes.length - 1, lane)));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // lanes
    for (let i = 0; i < lanes.length; i++) {
      ctx.fillStyle = '#1b1e27';
      ctx.fillRect(i * laneW + 2, 0, laneW - 4, canvas.height);
      // lane label
      ctx.fillStyle = lanes[i].color; ctx.font = '12px system-ui'; ctx.fillText(lanes[i].label, i * laneW + 8, 16);
    }
    // judge line
    ctx.fillStyle = '#3c445a'; ctx.fillRect(0, lineY, canvas.width, 4);
    // notes
    const t = now - t0; const speedPx = 0.3 * canvas.height; // px per second
    // remove missed notes
    for (let i=notes.length-1; i>=0; i--) {
      const n = notes[i];
      const t = now - t0;
      if (t - n.timeMs > judgement.good + 50) { // missed
        misses++; combo=0; notes.splice(i,1);
      }
    }
    notes.forEach(n => {
      const dt = (n.timeMs - t) / 1000; // seconds until line
      const y = lineY - dt * speedPx;
      ctx.fillStyle = n.type==='hazard' ? '#ff4d4d' : (n.type==='chip' ? '#ffd93d' : lanes[n.lane].color);
      const x = n.lane * laneW + laneW * 0.2;
      if (n.type==='long') {
        const h = 28;
        ctx.fillRect(x, y - h/2, laneW * 0.6, h);
        ctx.fillStyle = '#ffffff20'; ctx.fillRect(x, y - h/2, laneW * 0.6, h);
      } else {
        ctx.fillRect(x, y - 10, laneW * 0.6, 20);
      }
    });
    // HUD: top genres summary
    ctx.fillStyle = '#9aa3b2'; ctx.font = '13px system-ui';
    const sum = hits.reduce((a,b)=>a+b,0) || 1;
    const txt = hits.map((h,i)=> `${lanes[i].label}:${Math.round((h/sum)*100)}%`).join('  ');
    ctx.fillText(txt, 8, canvas.height - 36);
    ctx.fillText(`Combo: ${combo}  Best: ${bestCombo}  Misses: ${misses}`, 8, canvas.height - 16);
  }

  let raf = 0;
  function loop(ts) {
    if (!t0) t0 = ts; now = ts;
    draw();
    if (ts - t0 < duration * 1000 && running) {
      raf = requestAnimationFrame(loop);
    } else {
      running = false; endGame();
    }
  }
  function endGame() {
    window.removeEventListener('keydown', keydown);
    canvas.removeEventListener('mousedown', click);
    const output = buildOutput(lanes, hits, { tagCounts, keywords, forbidden, language: chosenLanguage, accent: chosenAccent, misses, combo: bestCombo, duration });
    if (onFinish) onFinish(output);
  }
  function start() {
    buildNotes();
    running = true; t0 = 0; now = 0; hits.fill(0);
    window.addEventListener('keydown', keydown);
    canvas.addEventListener('mousedown', click);
    raf = requestAnimationFrame(loop);
  }

  startBtn.addEventListener('click', start);
  quitBtn.addEventListener('click', () => { try { window.removeEventListener('keydown', keydown); } catch(_){} });
  // clickable lanes (visual)
  canvas.addEventListener('click', click);
  return wrap;
}

function buildLaneMap(bias='none') {
  // Choose 4 prominent genres from library or fallback labels, biased by preset
  const lib = (GENRE_LIBRARY || []).slice(0, 48);
  const colors = ['#4D96FF','#6BCB77','#FFD93D','#FF6B6B','#B084CC','#22D3EE'];
  const targetSets = {
    none: ['Drill','Afrobeats','Trap','R&B'],
    street: ['Drill','Trap','R&B','Afrobeats'],
    club: ['Afrobeats','House','EDM','Rap'],
    backpack: ['Boom Bap','Lo-fi','Rap','R&B'],
    streaming: ['Pop Rap','Trap','Afrobeats','R&B']
  };
  const targets = targetSets[bias] || targetSets.none;
  const labels = targets.map(name => pickClosestName(lib, name));
  return labels.slice(0,4).map((label,i)=>({ label, color: colors[i%colors.length] }));
}
function pickClosestName(lib, desired) {
  const token = String(desired||'').toLowerCase();
  let found = lib.find(g => (g.name||'').toLowerCase() === token);
  if (found) return found.name;
  found = lib.find(g => (g.name||'').toLowerCase().includes(token.replace(/\s+/g,' ')));
  if (found) return found.name;
  // common variants
  if (token === 'boom bap') { const b = lib.find(g=>/boom\s*bap/i.test(g.name||'')); if (b) return b.name; }
  if (token === 'lo-fi' || token === 'lofi') { const b = lib.find(g=>/(lo\s*-?fi)/i.test(g.name||'')); if (b) return b.name; }
  if (token === 'pop rap') { const b = lib.find(g=>/pop\s*rap/i.test(g.name||'')); if (b) return b.name; }
  if (token === 'edm') { const b = lib.find(g=>/edm/i.test(g.name||'')); if (b) return b.name; }
  if (token === 'house') { const b = lib.find(g=>/house/i.test(g.name||'')); if (b) return b.name; }
  if (token === 'r&b' || token === 'rnb') { const b = lib.find(g=>/(r\s*&\s*b|rnb|r&b)/i.test(g.name||'')); if (b) return b.name; }
  if (token === 'rap') { const b = lib.find(g=>/rap/i.test(g.name||'')); if (b) return b.name; }
  return desired; // fallback label
}
function biasLaneWeights(lanes, bias) {
  // Return weights per lane index (sum 1)
  const base = new Array(lanes.length).fill(1/lanes.length);
  if (bias==='street') return [0.4,0.3,0.2,0.1];
  if (bias==='club') return [0.35,0.3,0.2,0.15];
  if (bias==='backpack') return [0.3,0.3,0.25,0.15];
  if (bias==='streaming') return [0.3,0.25,0.25,0.2];
  return base;
}
function weightedLaneIndex(weights) {
  const r = Math.random();
  let acc = 0;
  for (let i=0;i<weights.length;i++) { acc += weights[i]; if (r <= acc) return i; }
  return weights.length-1;
}

function buildOutput(lanes, hits, extras = {}) {
  const sum = hits.reduce((a,b)=>a+b,0) || 1;
  const genres = lanes.map((l,i)=>({ name: l.label, influence: Math.round((hits[i]/sum)*100) }));
  // Simple premise suggestion from curated pairs
  const left = ['love','heartbreak','hustle','betrayal','triumph','redemption','city pride','struggle','freedom','nostalgia','rebellion','identity','faith','ambition','legacy','loss','hope','party','distance','healing','money','fame','survival','recovery','underdog','gratitude','nature','technology','community','wanderlust'];
  const right = ['loyalty','healing','ambition','trust','celebration','growth','belonging','perseverance','escape','memory','defiance','self-discovery','doubt','sacrifice','family','remembrance','renewal','vibe','yearning','balance','power','pressure','street wisdom','comeback','come-up','humility','calm','isolation','solidarity','homecoming'];
  const premise = `${left[(Math.random()*left.length)|0]} & ${right[(Math.random()*right.length)|0]}`;
  // Build style tags from tagCounts (sorted by freq)
  const tags = Object.entries(extras.tagCounts||{}).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k])=>k);
  const kws = (extras.keywords||[]).slice(0,8);
  const forb = (extras.forbidden||[]).slice(0,8);
  return {
    genres,
    premise,
    styleTags: tags,
    keywords: kws,
    language: extras.language || 'English',
    accent: extras.accent || 'Neutral / Standard',
    forbidden: forb,
    meta: { mode: 'rhythm', difficulty: 'normal', duration: extras.duration||0, accuracy: calcAccuracy(hits, extras.misses||0), bestCombo: extras.combo||0, track: extras.track || null }
  };
}

function calcAccuracy(hits, misses) {
  const totalHits = hits.reduce((a,b)=>a+b,0);
  const total = totalHits + (misses||0);
  if (total <= 0) return 0;
  return Math.round((totalHits/total)*100);
}

function pickLaneTag(label) {
  const map = {
    'Drill': ['dark bounce','street cinema','gritty flow'],
    'Afrobeats': ['sunny percussion','afro swing','island groove'],
    'Trap': ['808 slap','hihat rolls','sub heavy'],
    'R&B': ['silky hook','smooth vibe','melodic runs']
  };
  const list = map[label] || ['anthemic','modern','energetic'];
  return list[(Math.random()*list.length)|0];
}
function pickKeyword() {
  const pool = ['crowd','lights','stage','engine','midnight','street','city','radio','festival','basement'];
  return pool[(Math.random()*pool.length)|0];
}
function pickForbidden() {
  const pool = ['glow','glitch','pulse','brand names'];
  return pool[(Math.random()*pool.length)|0];
}

function beep(enabled, freq=440) {
  try {
    if (!enabled) return;
    const C = window.__rgfAudioCtx || new (window.AudioContext||window.webkitAudioContext)();
    window.__rgfAudioCtx = C;
    const o = C.createOscillator(); const g = C.createGain();
    o.type = 'sine'; o.frequency.value = freq; g.gain.value = 0.04;
    o.connect(g).connect(C.destination);
    o.start(); o.stop(C.currentTime + 0.06);
  } catch(_) {}
}
