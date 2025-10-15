// Snake (Arena Grid) — playable MVP
// Collect food to grow and build tags/keywords; avoid walls and your tail.
// Outputs map to app just like other games.

import { GENRE_LIBRARY } from '../../data/genres.js';

export function buildSnakeGameDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  const difficulty = options.difficulty || 'normal';
  const gridCols = 24, gridRows = 16; // logical grid
  const cell = 24; // px at 1x DPR
  const tickMs = difficulty === 'hard' ? 90 : difficulty === 'easy' ? 150 : 120;

  // Controls row
  const controls = document.createElement('div'); controls.className = 'inline-buttons';
  const diffSel = document.createElement('select'); ['easy','normal','hard'].forEach(d=>{ const o=document.createElement('option'); o.value=d; o.textContent=d; if(d===difficulty) o.selected=true; diffSel.appendChild(o); }); controls.appendChild(diffSel);
  const startBtn = document.createElement('button'); startBtn.className='btn-primary'; startBtn.textContent='Start';
  const restartBtn = document.createElement('button'); restartBtn.textContent='Restart'; restartBtn.disabled=true;
  const quitBtn = document.createElement('button'); quitBtn.textContent='Quit';
  controls.appendChild(startBtn); controls.appendChild(restartBtn); controls.appendChild(quitBtn);
  wrap.appendChild(controls);

  // Canvas with Hi-DPI scaling
  const canvas = document.createElement('canvas');
  const W = gridCols * cell, H = gridRows * cell;
  const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
  canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = '100%'; canvas.style.height = H + 'px';
  canvas.style.background = '#0f1115'; canvas.style.borderRadius = '12px';
  try { canvas.style.touchAction = 'none'; } catch(_) {}
  const frame = document.createElement('div'); frame.style.position='relative'; frame.style.width='100%'; frame.style.height= H + 'px';
  frame.appendChild(canvas); wrap.appendChild(frame);
  const ctx = canvas.getContext('2d');
  try { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } catch(_) { try { ctx.scale(dpr, dpr); } catch(_) {} }

  const hud = document.createElement('div'); hud.className='hint'; hud.textContent = 'Controls: Arrow keys / WASD / swipe. Avoid walls and yourself!'; hud.style.margin='6px 0'; wrap.appendChild(hud);

  // State
  let running=false, tickHandle=0, lastTick=0, emojiMode = !!window.__rgfUseEmojis;
  let dirX=1, dirY=0, nextDirX=1, nextDirY=0; // unit direction
  let snake = []; // list of {x,y}
  let food = null; // {x,y,type,label}
  let hazard = null; // {x,y}
  let score = 0; let steps = 0; let tags = new Set(); let kws = new Set(); let forb = new Set();
  const isMobileUI = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (Math.min(window.innerWidth, window.innerHeight) < 780);

  // Input
  const keys = {};
  window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    const k = (e.key||'').toLowerCase();
    if (k==='arrowup'||k==='w') { if (dirY!==1) { nextDirX=0; nextDirY=-1; } e.preventDefault(); }
    if (k==='arrowdown'||k==='s') { if (dirY!==-1) { nextDirX=0; nextDirY=1; } e.preventDefault(); }
    if (k==='arrowleft'||k==='a') { if (dirX!==1) { nextDirX=-1; nextDirY=0; } e.preventDefault(); }
    if (k==='arrowright'||k==='d') { if (dirX!==-1) { nextDirX=1; nextDirY=0; } e.preventDefault(); }
  });
  // Swipe
  let swStart=null;
  const onPtrDown = (e) => { try{ if(e.cancelable) e.preventDefault(); }catch(_){} swStart = { x: e.clientX, y: e.clientY }; };
  const onPtrUp = (e) => {
    if (!swStart) return;
    const dx = e.clientX - swStart.x; const dy = e.clientY - swStart.y;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (ax + ay < 24) { swStart = null; return; }
    if (ax > ay) {
      if (dx > 0 && dirX!==-1) { nextDirX=1; nextDirY=0; }
      else if (dx < 0 && dirX!==1) { nextDirX=-1; nextDirY=0; }
    } else {
      if (dy > 0 && dirY!==-1) { nextDirX=0; nextDirY=1; }
      else if (dy < 0 && dirY!==1) { nextDirX=0; nextDirY=-1; }
    }
    swStart = null;
  };
  canvas.addEventListener('pointerdown', onPtrDown, { passive:false });
  canvas.addEventListener('pointerup', onPtrUp, { passive:false });
  canvas.addEventListener('pointercancel', ()=>{ swStart=null; }, { passive:false });

  // Prefs update
  document.addEventListener('rgf:prefs-changed', () => { try { emojiMode = !!window.__rgfUseEmojis; } catch(_){} });

  // Game control
  function start() {
    reset(); running=true; restartBtn.disabled=false; schedule(); draw();
  }
  function reset() {
    snake = [ {x:3, y:Math.floor(gridRows/2)}, {x:2,y:Math.floor(gridRows/2)}, {x:1,y:Math.floor(gridRows/2)} ];
    dirX=1; dirY=0; nextDirX=1; nextDirY=0;
    score=0; steps=0; tags.clear(); kws.clear(); forb.clear();
    food = spawnFood(); hazard = null;
    lastTick = performance.now();
  }
  function endGame() {
    running=false; if (tickHandle) { clearTimeout(tickHandle); tickHandle=0; }
    const genres = buildGenresFromScore(score);
    const out = {
      genres,
      premise: samplePremise(),
      styleTags: Array.from(tags).slice(0,8),
      keywords: Array.from(kws).slice(0,8),
      language: 'English',
      accent: 'Neutral / Standard',
      forbidden: Array.from(forb).slice(0,8),
      meta: { mode: 'snake', difficulty: diffSel.value, duration: Math.round((steps*tickMs)/1000), score }
    };
    if (onFinish) onFinish(out);
  }
  function schedule() {
    if (!running) return; const now = performance.now(); const elapsed = now - lastTick; const dt = Math.max(0, tickMs - elapsed);
    tickHandle = setTimeout(tick, dt);
  }
  function tick() {
    lastTick = performance.now();
    // Update direction
    dirX = nextDirX; dirY = nextDirY;
    // Compute next head
    const head = snake[0];
    const nx = head.x + dirX; const ny = head.y + dirY;
    // Collisions: wall
    if (nx < 0 || ny < 0 || nx >= gridCols || ny >= gridRows) { endGame(); return; }
    // Collisions: self
    if (snake.some(seg => seg.x===nx && seg.y===ny)) { endGame(); return; }
    // Move
    snake.unshift({ x: nx, y: ny });
    // Food/hazard
    if (food && nx===food.x && ny===food.y) {
      score += 10;
      if (food.type==='tag') tags.add(food.label);
      else if (food.type==='kw') kws.add(food.label);
      food = spawnFood();
      // Occasionally drop hazard
      if (!hazard && Math.random() < 0.25) hazard = spawnHazard();
    } else {
      snake.pop();
    }
    if (hazard && nx===hazard.x && ny===hazard.y) {
      // Bite hazard: shorten snake and add forbidden tag
      forb.add('hazards');
      snake.splice(Math.max(1, Math.floor(snake.length/3))); // chop tail
      hazard = null;
    }
    steps += 1;
    draw();
    schedule();
  }

  // Spawns
  function spawnFood() {
    const type = Math.random() < 0.6 ? 'tag' : 'kw';
    const label = type==='tag' ? sampleTag() : sampleKeyword();
    let x=0,y=0; do { x = (Math.random()*gridCols)|0; y = (Math.random()*gridRows)|0; } while (snake.some(s=>s.x===x&&s.y===y));
    return { x,y,type,label };
  }
  function spawnHazard() {
    let x=0,y=0; do { x = (Math.random()*gridCols)|0; y = (Math.random()*gridRows)|0; } while (snake.some(s=>s.x===x&&s.y===y) || (food && food.x===x && food.y===y));
    return { x,y };
  }

  // Draw
  function draw() {
    // Background grid
    ctx.clearRect(0,0,W,H);
    ctx.strokeStyle = '#141824'; ctx.lineWidth = 1;
    for (let x=0; x<=W; x+=cell) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (let y=0; y<=H; y+=cell) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    const drawCell = (gx, gy, color, emoji) => {
      const px = gx * cell + cell/2; const py = gy * cell + cell/2;
      if (emojiMode && emoji) {
        ctx.save(); ctx.font = `${Math.floor(cell*0.9)}px Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(emoji, px, py); ctx.restore();
      } else {
        const x0 = gx * cell + 2, y0 = gy * cell + 2, w = cell - 4, h = cell - 4;
        const g = ctx.createLinearGradient(x0, y0, x0, y0+h);
        g.addColorStop(0, '#ffffff18'); g.addColorStop(1, color);
        ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
        ctx.strokeStyle = '#ffffff10'; ctx.strokeRect(x0, y0, w, h);
      }
    };
    // Draw hazard
    if (hazard) drawCell(hazard.x, hazard.y, '#ff6b6b', '☠️');
    // Draw food
    if (food) drawCell(food.x, food.y, food.type==='tag'?'#6BCB77':'#B084CC', food.type==='tag'?'🍏':'🔑');
    // Draw snake
    snake.forEach((seg, idx) => {
      const emoji = idx===0 ? '🐍' : '🟩';
      drawCell(seg.x, seg.y, idx===0?'#4D96FF':'#22D3EE', emoji);
    });
    // HUD overlay
    ctx.fillStyle = '#9aa3b2'; ctx.font = '12px system-ui';
    ctx.fillText(`Score: ${score}  Length: ${snake.length}`, 8, 16);
  }

  // Output helpers
  function buildGenresFromScore(sc) {
    const lib = (GENRE_LIBRARY||[]).map(g=>g.name);
    const pick = (n) => {
      const arr = ['Trap','R&B','Afrobeats','Drill','House'];
      const res = [];
      while (res.length < n && arr.length) {
        const i = Math.floor(Math.random()*arr.length);
        res.push(arr.splice(i,1)[0]);
      }
      return res.map(name => closest(lib,name));
    };
    const names = pick(2 + (sc>80?1:0));
    const total = names.length; return names.map((n,i)=>({ name:n, influence: Math.round(100/total) }));
  }
  function closest(list, name) { const token=(name||'').toLowerCase(); const ex=list.find(n=>(n||'').toLowerCase()===token); if (ex) return ex; const lo=list.find(n=>(n||'').toLowerCase().includes(token)); return lo||name; }
  function sampleTag(){ const pool=['anthemic','modern','energetic','retro grit','warm vinyl','head-nod','street cinema','silky hook']; return pool[(Math.random()*pool.length)|0]; }
  function sampleKeyword(){ const pool=['city','radio','midnight','engine','festival','lights','basement']; return pool[(Math.random()*pool.length)|0]; }
  function samplePremise(){ const L=['ambition','nostalgia','identity','legacy','freedom','escape'], R=['growth','memory','balance','trust','celebration','yearning']; return `${L[(Math.random()*L.length)|0]} & ${R[(Math.random()*R.length)|0]}`; }

  // Wiring
  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', () => { reset(); start(); });
  quitBtn.addEventListener('click', () => { running=false; if (tickHandle) clearTimeout(tickHandle); });

  return wrap;
}
