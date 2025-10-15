// Minimal Rhythm Tapper MVP (no audio). Builds a self-contained dialog content.
// Exports: buildRhythmGameDialog(onFinish, options)

import { GENRE_LIBRARY } from '../../data/genres.js';

export function buildRhythmGameDialog(onFinish, options = {}) {
  const prefsReduce = document.documentElement.getAttribute('data-reduce-motion') === 'true';
  const lanes = buildLaneMap(); // [{label,color}]
  const duration = options.durationSec || 60;
  const difficulty = options.difficulty || 'normal';
  const speed = difficulty === 'hard' ? 1.35 : difficulty === 'easy' ? 0.85 : 1.0;
  const judgement = { perfect: 120, good: 220 }; // ms windows

  const wrap = document.createElement('div');
  const top = document.createElement('div'); top.className = 'inline-buttons';
  const startBtn = document.createElement('button'); startBtn.className = 'btn-primary'; startBtn.textContent = 'Start';
  const quitBtn = document.createElement('button'); quitBtn.textContent = 'Quit';
  top.appendChild(startBtn); top.appendChild(quitBtn);
  wrap.appendChild(top);

  const hud = document.createElement('div'); hud.className = 'hint'; hud.textContent = 'Keys: D F   J K / Click lanes. Hit notes on the line!';
  hud.style.margin = '6px 0'; wrap.appendChild(hud);

  const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 420; canvas.style.width = '100%'; canvas.style.background = '#0f1115'; canvas.style.borderRadius = '12px';
  wrap.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let running = false, t0 = 0, now = 0;
  let notes = []; // {lane, timeMs}
  let scrollY = 0;
  const lineY = canvas.height - 80;
  const laneW = canvas.width / lanes.length;
  const hits = new Array(lanes.length).fill(0);
  const totalNotes = new Array(lanes.length).fill(0);

  // Build a simple seed map (steady quarter notes per lane, staggered)
  function buildNotes() {
    notes = [];
    const bpm = 96 * speed; const beatMs = 60000 / bpm;
    const end = duration * 1000;
    for (let lane = 0; lane < lanes.length; lane++) {
      for (let t = (lane * beatMs) % (beatMs * 2); t < end; t += beatMs * 2) {
        notes.push({ lane, timeMs: t }); totalNotes[lane]++;
      }
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
      // register hit — remove note and increment lane hit
      hits[laneIndex]++;
      notes.splice(bestIdx, 1);
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
    notes.forEach(n => {
      const dt = (n.timeMs - t) / 1000; // seconds until line
      const y = lineY - dt * speedPx;
      ctx.fillStyle = lanes[n.lane].color;
      const x = n.lane * laneW + laneW * 0.2;
      ctx.fillRect(x, y - 10, laneW * 0.6, 20);
    });
    // HUD: top genres summary
    ctx.fillStyle = '#9aa3b2'; ctx.font = '13px system-ui';
    const sum = hits.reduce((a,b)=>a+b,0) || 1;
    const txt = hits.map((h,i)=> `${lanes[i].label}:${Math.round((h/sum)*100)}%`).join('  ');
    ctx.fillText(txt, 8, canvas.height - 16);
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
    const output = buildOutput(lanes, hits);
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

function buildOutput(lanes, hits) {
  const sum = hits.reduce((a,b)=>a+b,0) || 1;
  const genres = lanes.map((l,i)=>({ name: l.label, influence: Math.round((hits[i]/sum)*100) }));
  // Simple premise suggestion from curated pairs
  const left = ['love','heartbreak','hustle','betrayal','triumph','redemption','city pride','struggle','freedom','nostalgia','rebellion','identity','faith','ambition','legacy','loss','hope','party','distance','healing','money','fame','survival','recovery','underdog','gratitude','nature','technology','community','wanderlust'];
  const right = ['loyalty','healing','ambition','trust','celebration','growth','belonging','perseverance','escape','memory','defiance','self-discovery','doubt','sacrifice','family','remembrance','renewal','vibe','yearning','balance','power','pressure','street wisdom','comeback','come-up','humility','calm','isolation','solidarity','homecoming'];
  const premise = `${left[(Math.random()*left.length)|0]} & ${right[(Math.random()*right.length)|0]}`;
  return {
    genres,
    premise,
    styleTags: [],
    keywords: [],
    language: 'English',
    accent: 'Neutral / Standard',
    forbidden: [],
    meta: { mode: 'rhythm', difficulty: 'normal' }
  };
}

