// Minimal Rhythm Tapper MVP (no audio). Builds a self-contained dialog content.
// Exports: buildRhythmGameDialog(onFinish, options)

import { GENRE_LIBRARY } from '../../data/genres.js';
import { ACCENT_LIBRARY } from '../../data/accents.js';
import { LANGUAGE_OPTIONS } from '../../js/config.js';

export function buildRhythmGameDialog(onFinish, options = {}) {
  const prefsReduce = document.documentElement.getAttribute('data-reduce-motion') === 'true';
  const lanes = buildLaneMap(); // [{label,color}]
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
    for (let t = beatMs*8; t < end; t += beatMs*8) {
      const lane = (Math.random()*lanes.length)|0; notes.push({ lane, timeMs: t, type: 'long', lenMs: beatMs*2 });
    }
    for (let t = beatMs*10; t < end; t += beatMs*10) {
      const lane = (Math.random()*lanes.length)|0; notes.push({ lane, timeMs: t, type: 'chip' });
    }
    for (let t = beatMs*12; t < end; t += beatMs*12) {
      const lane = (Math.random()*lanes.length)|0; notes.push({ lane, timeMs: t, type: 'hazard' });
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

function buildLaneMap() {
  // Choose 4 prominent genres from library or fallback labels
  const lib = (GENRE_LIBRARY || []).slice(0, 12);
  const picks = [];
  const colors = ['#4D96FF','#6BCB77','#FFD93D','#FF6B6B','#B084CC','#22D3EE'];
  function pickBy(pred, fallback) {
    const found = lib.find(pred);
    if (found) return found.name;
    return fallback;
  }
  const labels = [
    pickBy(g=>/drill/i.test(g.name||''),'Drill'),
    pickBy(g=>/afro/i.test(g.name||''),'Afrobeats'),
    pickBy(g=>/trap/i.test(g.name||''),'Trap'),
    pickBy(g=>/(r\s*&\s*b|rnb)/i.test(g.name||'') || /r&b/i.test(g.name||''),'R&B')
  ];
  return labels.slice(0,4).map((label,i)=>({ label, color: colors[i%colors.length] }));
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
    meta: { mode: 'rhythm', difficulty: 'normal', duration: extras.duration||0, accuracy: calcAccuracy(hits, extras.misses||0), bestCombo: extras.combo||0 }
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
