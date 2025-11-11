// Snake 3D — Three.js remake of classic snake
// Exports: buildSnake3DGameDialog(onFinish, options)
import { GENRE_LIBRARY } from '../../data/genres.js';
import * as THREE from 'https://unpkg.com/three@0.150.0/build/three.module.js';
import { addCredit } from '../../js/utils/assets.js';

export function buildSnake3DGameDialog(onFinish, options = {}) {
  try { addCredit({ name: 'Snake 3D (code)', url: 'https://github.com/sslinkyy/Music-Formula-Generator', license: 'Custom / Project Code' }); } catch(_) {}
  const wrap = document.createElement('div');
  const difficulty = options.difficulty || 'normal';
  const gridCols = 24, gridRows = 16; // logical grid
  const cell = 1; // world units per grid cell
  const tickMs = difficulty === 'hard' ? 90 : difficulty === 'easy' ? 150 : 120;

  // Controls
  const controls = document.createElement('div'); controls.className = 'inline-buttons';
  const diffSel = document.createElement('select'); ['easy','normal','hard'].forEach(d=>{ const o=document.createElement('option'); o.value=d; o.textContent=d; if(d===difficulty) o.selected=true; diffSel.appendChild(o); }); controls.appendChild(diffSel);
  const startBtn = document.createElement('button'); startBtn.className='btn-primary'; startBtn.textContent='Start';
  const restartBtn = document.createElement('button'); restartBtn.textContent='Restart'; restartBtn.disabled=true;
  const quitBtn = document.createElement('button'); quitBtn.textContent='Quit';
  controls.appendChild(startBtn); controls.appendChild(restartBtn); controls.appendChild(quitBtn);
  wrap.appendChild(controls);

  // 3D container
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '520px';
  container.style.position = 'relative';
  container.style.background = '#0f1115';
  container.style.borderRadius = '12px';
  container.style.overflow = 'hidden';
  wrap.appendChild(container);
  // HUD overlay inside container
  const scoreEl = document.createElement('div');
  scoreEl.style.position = 'absolute';
  scoreEl.style.left = '10px';
  scoreEl.style.top = '8px';
  scoreEl.style.color = '#9aa3b2';
  scoreEl.style.font = '12px system-ui, sans-serif';
  scoreEl.style.pointerEvents = 'none';
  container.appendChild(scoreEl);

  const hud = document.createElement('div'); hud.className='hint'; hud.textContent = 'Controls: Arrow keys / WASD / swipe. Avoid walls and yourself!'; hud.style.margin='6px 0'; wrap.appendChild(hud);

  // Game state
  let running=false, paused=false, tickHandle=0, lastTick=0, emojiMode = !!window.__rgfUseEmojis;
  let dirX=1, dirY=0, nextDirX=1, nextDirY=0; // unit direction on grid (x,z)
  let snake = []; // list of {x,y}
  let snakeMeshes = []; // parallel list of Meshes for segments [head,...]
  let food = null; // {x,y,type,label, mesh}
  let hazard = null; // {x,y, mesh}
  let score = 0; let steps = 0; let tags = new Set(); let kws = new Set(); let forb = new Set();
  const genreCounts = {}; // name -> count collected
  const isMobileUI = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || (Math.min(window.innerWidth, window.innerHeight) < 780);

  // Three.js scene
  let scene, camera, renderer, gridGroup, snakeGroup;
  let ambient, dirLight;

  function init3D() {
    if (renderer) return;
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f1115);

    const aspect = container.clientWidth / Math.max(1, container.clientHeight);
    camera = new THREE.PerspectiveCamera(55, aspect, 0.1, 100);
    const gridW = gridCols * cell, gridH = gridRows * cell;
    const cx = 0, cz = 0; // center
    camera.position.set(cx, Math.max(gridW, gridH) * 0.8, gridRows); // elevated and offset
    camera.lookAt(new THREE.Vector3(cx, 0, cz));

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights
    ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);
    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 20, 10);
    scene.add(dirLight);

    // Environment map (Poly Haven CC0 HDRI)
    try {
      const { RGBELoader } = await import('https://unpkg.com/three@0.150.0/examples/jsm/loaders/RGBELoader.js');
      const rgbe = new RGBELoader();
      // Small HDRI for speed; CC0 from Poly Haven
      const url = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr';
      rgbe.load(url, (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        scene.environment = tex;
        // Keep background as flat color for clarity
      });
      try { addCredit({ name: 'Studio Small 03 HDRI', url: 'https://polyhaven.com/a/studio_small_03', license: 'CC0', author: 'Poly Haven' }); } catch(_) {}
    } catch(_) {}

    // Ground + grid
    gridGroup = new THREE.Group();
    scene.add(gridGroup);
    const planeGeo = new THREE.PlaneGeometry(gridCols * cell, gridRows * cell);
    const planeMat = new THREE.MeshStandardMaterial({ color: 0x121621, roughness: 1, metalness: 0 });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI/2;
    gridGroup.add(plane);
    // Grid helper overlay
    const grid = new THREE.GridHelper(gridCols * cell, gridCols, 0x222a3a, 0x1b2231);
    grid.position.y = 0.002;
    grid.scale.z = (gridRows / gridCols);
    gridGroup.add(grid);

    // Snake group
    snakeGroup = new THREE.Group();
    snakeGroup.position.y = 0.5; // slightly above ground
    scene.add(snakeGroup);

    window.addEventListener('resize', onResize);
    onResize();
    requestAnimationFrame(loop);
  }

  function onResize(){
    if (!renderer || !camera) return;
    const w = container.clientWidth, h = Math.max(1, container.clientHeight);
    camera.aspect = w/h; camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  function gridToWorld(gx, gy){
    // Map grid (x,y) -> world (x,z)
    const wx = (gx - gridCols/2 + 0.5) * cell;
    const wz = (gy - gridRows/2 + 0.5) * cell;
    return new THREE.Vector3(wx, 0, wz);
  }

  function makeSegmentMesh(isHead=false){
    const geo = new THREE.BoxGeometry(cell*0.9, cell*0.9, cell*0.9);
    const mat = new THREE.MeshStandardMaterial({ color: isHead ? 0x4D96FF : 0x22D3EE });
    const m = new THREE.Mesh(geo, mat); m.castShadow=true; m.receiveShadow=true; return m;
  }
  function makeFoodMesh(type){
    const geo = new THREE.SphereGeometry(cell*0.38, 20, 16);
    let color = 0x6BCB77;
    if (type==='kw') color = 0xB084CC; else if (type==='genre') color = 0xFFD93D;
    const mat = new THREE.MeshStandardMaterial({ color });
    const m = new THREE.Mesh(geo, mat); m.position.y = 0.5; return m;
  }
  function makeHazardMesh(){
    const geo = new THREE.ConeGeometry(cell*0.36, cell*0.8, 20);
    const mat = new THREE.MeshStandardMaterial({ color: 0xFF6B6B });
    const m = new THREE.Mesh(geo, mat); m.position.y = 0.4; return m;
  }

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
  container.addEventListener('pointerdown', onPtrDown, { passive:false });
  container.addEventListener('pointerup', onPtrUp, { passive:false });
  container.addEventListener('pointercancel', ()=>{ swStart=null; }, { passive:false });

  document.addEventListener('rgf:prefs-changed', () => { try { emojiMode = !!window.__rgfUseEmojis; } catch(_){} });

  // Game control
  function start() {
    init3D();
    reset(); running=true; paused=false; restartBtn.disabled=false; schedule();
  }
  function reset() {
    // Clear snake visuals
    // clear meshes
    snakeMeshes.forEach(m => { if (m && snakeGroup) snakeGroup.remove(m); });
    snakeMeshes = [];
    snake = [ {x:3, y:Math.floor(gridRows/2)}, {x:2,y:Math.floor(gridRows/2)}, {x:1,y:Math.floor(gridRows/2)} ];
    dirX=1; dirY=0; nextDirX=1; nextDirY=0;
    score=0; steps=0; tags.clear(); kws.clear(); forb.clear();
    Object.keys(genreCounts).forEach(k => delete genreCounts[k]);
    // Build initial snake meshes
    snake.forEach((seg, idx) => {
      const m = makeSegmentMesh(idx===0);
      const p = gridToWorld(seg.x, seg.y); m.position.set(p.x, 0.5, p.z);
      snakeGroup.add(m); snakeMeshes.push(m);
    });
    // Spawn pickups
    if (food && food.mesh) scene.remove(food.mesh);
    if (hazard && hazard.mesh) scene.remove(hazard.mesh);
    food = spawnFood(); hazard = null;
    lastTick = performance.now();
    updateHud();
  }
  function endGame() {
    running=false; if (tickHandle) { clearTimeout(tickHandle); tickHandle=0; }
    const genres = buildGenresFromPickups();
    const out = {
      genres,
      premise: samplePremise(),
      styleTags: Array.from(tags).slice(0,8),
      keywords: Array.from(kws).slice(0,8),
      language: 'English',
      accent: 'Neutral / Standard',
      forbidden: Array.from(forb).slice(0,8),
      meta: { mode: 'snake-3d', difficulty: diffSel.value, duration: Math.round((steps*tickMs)/1000), score }
    };
    if (onFinish) onFinish(out);
  }
  function schedule() {
    if (!running || paused) return; const now = performance.now(); const elapsed = now - lastTick; const dt = Math.max(0, tickMs - elapsed);
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
    // Demote previous head color before adding new head
    if (snakeMeshes.length && snakeMeshes[0] && snakeMeshes[0].material) {
      snakeMeshes[0].material.color.set(0x22D3EE);
    }
    snake.unshift({ x: nx, y: ny });
    const headMesh = makeSegmentMesh(true);
    const hp = gridToWorld(nx, ny); headMesh.position.set(hp.x, 0.5, hp.z);
    snakeGroup.add(headMesh);
    snakeMeshes.unshift(headMesh);

    // Food/hazard
    if (food && nx===food.x && ny===food.y) {
      score += 10;
      if (food.type==='tag') tags.add(food.label);
      else if (food.type==='kw') kws.add(food.label);
      else if (food.type==='genre') { genreCounts[food.label] = (genreCounts[food.label] || 0) + 1; }
      if (food.mesh) scene.remove(food.mesh);
      food = spawnFood();
      if (!hazard && Math.random() < 0.18 + Math.min(0.12, steps/2000)) hazard = spawnHazard();
    } else {
      // remove tail segment
      snake.pop();
      const tailMesh = snakeMeshes.pop();
      if (tailMesh) snakeGroup.remove(tailMesh);
    }
    if (hazard && nx===hazard.x && ny===hazard.y) {
      forb.add('hazards');
      snake.splice(Math.max(1, Math.floor(snake.length/3)));
      // trim visuals as well
      while (snakeMeshes.length > snake.length) {
        const m = snakeMeshes.pop(); if (m) snakeGroup.remove(m);
      }
      if (hazard.mesh) { scene.remove(hazard.mesh); hazard = null; }
    }
    steps += 1;
    updateHud();
    schedule();
  }

  function spawnFood() {
    const r = Math.random();
    let type = 'tag';
    const genreBias = Math.min(0.35, score/300);
    if (r < 0.45 - genreBias/2) type = 'tag';
    else if (r < 0.90 - genreBias) type = 'kw';
    else type = 'genre';
    let label;
    if (type==='tag') label = sampleTag(); else if (type==='kw') label = sampleKeyword(); else label = sampleGenreName();
    let x=0,y=0; do { x = (Math.random()*gridCols)|0; y = (Math.random()*gridRows)|0; } while (snake.some(s=>s.x===x&&s.y===y));
    const mesh = makeFoodMesh(type); const p = gridToWorld(x,y); mesh.position.x = p.x; mesh.position.z = p.z; scene.add(mesh);
    return { x,y,type,label, mesh };
  }
  function spawnHazard() {
    let x=0,y=0; do { x = (Math.random()*gridCols)|0; y = (Math.random()*gridRows)|0; } while (snake.some(s=>s.x===x&&s.y===y) || (food && food.x===x && food.y===y));
    const mesh = makeHazardMesh(); const p = gridToWorld(x,y); mesh.position.x = p.x; mesh.position.z = p.z; scene.add(mesh);
    return { x,y, mesh };
  }

  // Render loop
  function loop(){
    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
    requestAnimationFrame(loop);
  }

  function updateHud(){
    const picked = Object.entries(genreCounts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${k}:${v}`).join('  ');
    scoreEl.textContent = `Score: ${score}  Length: ${snake.length}${picked?('  Genres '+picked):''}`;
  }

  // Output helpers
  function buildGenresFromPickups() {
    const entries = Object.entries(genreCounts);
    if (!entries.length) return buildGenresFallback();
    const top = entries.sort((a,b)=>b[1]-a[1]).slice(0,3);
    const sum = top.reduce((a,[,v])=>a+v,0) || 1;
    return top.map(([name,count]) => ({ name, influence: Math.max(10, Math.round((count/sum)*100)) }));
  }
  function buildGenresFallback() {
    const lib = (GENRE_LIBRARY||[]).map(g=>g.name);
    const base = ['Trap','R&B','Afrobeats','Drill','House'];
    const shuffled = base.sort(()=>Math.random()-0.5).slice(0,2);
    return shuffled.map(n => ({ name: closest(lib,n), influence: 50 }));
  }
  function sampleGenreName(){
    const lib = (GENRE_LIBRARY||[]).map(g=>g.name).filter(Boolean);
    const base = ['Trap','R&B','Afrobeats','Drill','House','Pop Rap','Boom Bap'];
    const candidates = lib.length ? lib : base;
    return candidates[(Math.random()*candidates.length)|0];
  }
  function closest(list, name) { const token=(name||'').toLowerCase(); const ex=list.find(n=>(n||'').toLowerCase()===token); if (ex) return ex; const lo=list.find(n=>(n||'').toLowerCase().includes(token)); return lo||name; }
  function sampleTag(){ const pool=['anthemic','modern','energetic','retro grit','warm vinyl','head-nod','street cinema','silky hook']; return pool[(Math.random()*pool.length)|0]; }
  function sampleKeyword(){ const pool=['city','radio','midnight','engine','festival','lights','basement']; return pool[(Math.random()*pool.length)|0]; }
  function samplePremise(){ const L=['ambition','nostalgia','identity','legacy','freedom','escape'], R=['growth','memory','balance','trust','celebration','yearning']; return `${L[(Math.random()*L.length)|0]} & ${R[(Math.random()*R.length)|0]}`; }

  // Wiring
  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', () => { reset(); running=true; paused=false; schedule(); });
  quitBtn.addEventListener('click', () => { running=false; if (tickHandle) clearTimeout(tickHandle); });

  return wrap;
}
