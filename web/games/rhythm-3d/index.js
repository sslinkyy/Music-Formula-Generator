// 3D Rhythm Tapper using Three.js - Fully reimagined with 3D graphics
// Exports: buildRhythm3DGameDialog(onFinish, options)

import { GENRE_LIBRARY } from '../../data/genres.js';
import { ACCENT_LIBRARY } from '../../data/accents.js';
import { LANGUAGE_OPTIONS } from '../../js/config.js';
import { listTracks, loadTrack, getCachedAnalysis, analyzeTrack } from '../music/manager.js';

// Three.js will be loaded from CDN
let THREE;

async function ensureThreeJS() {
  if (window.THREE) {
    THREE = window.THREE;
    console.log('Three.js already loaded');
    return;
  }

  console.log('Loading Three.js from CDN...');
  return new Promise((resolve, reject) => {
    const importScript = document.createElement('script');
    importScript.type = 'module';
    importScript.textContent = `
      import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
      window.THREE = THREE;
      window.dispatchEvent(new Event('three-loaded'));
    `;
    importScript.onerror = (err) => {
      console.error('Failed to load Three.js:', err);
      reject(new Error('Failed to load Three.js'));
    };

    window.addEventListener('three-loaded', () => {
      THREE = window.THREE;
      console.log('Three.js loaded successfully');
      resolve();
    }, { once: true });

    document.head.appendChild(importScript);
  });
}

// Helper function for toast notifications (fallback if not available)
function showToastFallback(message) {
  try {
    if (window.showToast) {
      window.showToast(message);
    } else {
      console.log('TOAST:', message);
    }
  } catch(e) {
    console.log('TOAST:', message);
  }
}

export async function buildRhythm3DGameDialog(onFinish, options = {}) {
  console.log('Building 3D Rhythm Game Dialog...');

  // Ensure Three.js is loaded
  try {
    await ensureThreeJS();
  } catch(err) {
    console.error('Failed to load Three.js:', err);
    const errorDiv = document.createElement('div');
    errorDiv.style.padding = '20px';
    errorDiv.style.color = 'red';
    errorDiv.innerHTML = `<h3>Error Loading Game</h3><p>Failed to load Three.js library. Please check your internet connection and try again.</p><p>Error: ${err.message}</p>`;
    return errorDiv;
  }

  console.log('Three.js loaded, setting up game...');
  const prefsReduce = document.documentElement.getAttribute('data-reduce-motion') === 'true';
  let chosenBias = options.preset || 'none';
  let lanes = buildLaneMap(chosenBias);
  const duration = options.durationSec || 60;
  const difficulty = options.difficulty || 'normal';
  const speed = difficulty === 'hard' ? 1.35 : difficulty === 'easy' ? 0.85 : 1.0;
  const judgement = { perfect: 120, good: 220 };

  const wrap = document.createElement('div');
  const controls = document.createElement('div');
  controls.className = 'inline-buttons';

  // Difficulty select
  const diffSel = document.createElement('select');
  ['easy','normal','hard'].forEach(d => {
    const o = document.createElement('option');
    o.value = d;
    o.textContent = d;
    if (d === difficulty) o.selected = true;
    diffSel.appendChild(o);
  });
  diffSel.title = 'Difficulty';
  controls.appendChild(diffSel);

  // Preset bias
  const biasSel = document.createElement('select');
  ['none','street','club','backpack','streaming'].forEach(b => {
    const o = document.createElement('option');
    o.value = b;
    o.textContent = b;
    if (b === chosenBias) o.selected = true;
    biasSel.appendChild(o);
  });
  biasSel.title = 'Preset Bias';
  biasSel.addEventListener('change', () => {
    chosenBias = biasSel.value;
    lanes = buildLaneMap(chosenBias);
  });
  controls.appendChild(biasSel);

  // Music source controls
  let musicSource = 'none';
  let selectedTrack = null;
  let selectedFile = null;
  let trackMeta = null;
  let analysis = null;

  const musicSel = document.createElement('select');
  ['none','library','local'].forEach(m => {
    const o = document.createElement('option');
    o.value = m;
    o.textContent = 'Music: ' + m;
    if (m === 'none') o.selected = true;
    musicSel.appendChild(o);
  });
  musicSel.title = 'Music Source';
  controls.appendChild(musicSel);

  const libSel = document.createElement('select');
  libSel.style.display = 'none';
  libSel.title = 'Library Track';
  controls.appendChild(libSel);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'audio/*';
  fileInput.style.display = 'none';
  controls.appendChild(fileInput);

  // Tap tempo
  let tappedBPM = null;
  let lastTaps = [];
  const tapBtn = document.createElement('button');
  tapBtn.textContent = 'Tap Tempo';
  tapBtn.addEventListener('click', () => {
    const t = performance.now();
    lastTaps.push(t);
    if (lastTaps.length > 8) lastTaps.shift();
    if (lastTaps.length >= 3) {
      const intervals = [];
      for (let i = 1; i < lastTaps.length; i++) {
        intervals.push(lastTaps[i] - lastTaps[i-1]);
      }
      intervals.sort((a,b) => a - b);
      const start = Math.floor(intervals.length * 0.2);
      const end = Math.ceil(intervals.length * 0.8);
      const trimmed = intervals.slice(start, end);
      const avgMs = trimmed.reduce((a,b) => a + b, 0) / Math.max(1, trimmed.length);
      if (avgMs > 0) tappedBPM = Math.round(60000 / avgMs);
    }
    renderTrackInfo();
  });
  controls.appendChild(tapBtn);

  const clearTapBtn = document.createElement('button');
  clearTapBtn.textContent = 'Clear Tap';
  clearTapBtn.addEventListener('click', () => {
    tappedBPM = null;
    lastTaps = [];
    renderTrackInfo();
  });
  controls.appendChild(clearTapBtn);

  const offsetInput = document.createElement('input');
  offsetInput.type = 'number';
  offsetInput.step = '0.01';
  offsetInput.min = '-1';
  offsetInput.max = '1';
  offsetInput.value = '0';
  offsetInput.title = 'Offset seconds';
  offsetInput.style.width = '90px';
  controls.appendChild(offsetInput);

  const trackInfo = document.createElement('span');
  trackInfo.className = 'hint';
  trackInfo.style.marginLeft = '6px';
  controls.appendChild(trackInfo);

  function renderTrackInfo() {
    const bpm = tappedBPM || trackMeta?.bpm || analysis?.bpm || null;
    const conf = analysis?.confidence ? ` • conf ${analysis.confidence.toFixed(2)}` : '';
    const name = trackMeta?.title || selectedTrack?.title || '';
    trackInfo.textContent = bpm ? `Track: ${name} • BPM ${bpm}${conf}` : (name ? `Track: ${name}` : '');
  }

  // Sound toggle
  let soundOn = false;
  const soundBtn = document.createElement('button');
  soundBtn.textContent = 'Sound: Off';
  soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.textContent = `Sound: ${soundOn ? 'On' : 'Off'}`;
  });
  controls.appendChild(soundBtn);

  // Language/Accent
  let chosenLanguage = 'English';
  let chosenAccent = 'Neutral / Standard';

  const langSel = document.createElement('select');
  LANGUAGE_OPTIONS.forEach(L => {
    const o = document.createElement('option');
    o.value = L;
    o.textContent = L;
    if (L === chosenLanguage) o.selected = true;
    langSel.appendChild(o);
  });
  langSel.title = 'Language';
  langSel.addEventListener('change', () => {
    chosenLanguage = langSel.value;
  });
  controls.appendChild(langSel);

  const accSel = document.createElement('select');
  ACCENT_LIBRARY.forEach(a => {
    const o = document.createElement('option');
    o.value = a.name;
    o.textContent = a.name;
    if (a.name === chosenAccent) o.selected = true;
    accSel.appendChild(o);
  });
  accSel.title = 'Accent';
  accSel.addEventListener('change', () => {
    chosenAccent = accSel.value;
  });
  controls.appendChild(accSel);

  // Start/Restart/Quit buttons
  const startBtn = document.createElement('button');
  startBtn.className = 'btn-primary';
  startBtn.textContent = 'Start';

  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.disabled = true;

  const quitBtn = document.createElement('button');
  quitBtn.textContent = 'Quit';

  const debugBtn = document.createElement('button');
  debugBtn.textContent = 'Debug: Off';
  debugBtn.title = 'Toggle timing debug info';
  let debugMode = false;
  debugBtn.addEventListener('click', () => {
    debugMode = !debugMode;
    debugBtn.textContent = `Debug: ${debugMode ? 'On' : 'Off'}`;
    debugDiv.style.display = debugMode ? 'block' : 'none';
  });

  controls.appendChild(startBtn);
  controls.appendChild(restartBtn);
  controls.appendChild(quitBtn);
  controls.appendChild(debugBtn);
  wrap.appendChild(controls);

  // HUD
  const hud = document.createElement('div');
  hud.className = 'hint';
  hud.textContent = 'Keys: D F J K / Click lanes. Hit notes on the line! (3D Mode)';
  hud.style.margin = '6px 0';
  wrap.appendChild(hud);

  // Three.js container
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '420px';
  container.style.background = '#0f1115';
  container.style.borderRadius = '12px';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';
  wrap.appendChild(container);

  // Stats display
  const statsDiv = document.createElement('div');
  statsDiv.style.position = 'absolute';
  statsDiv.style.top = '10px';
  statsDiv.style.left = '10px';
  statsDiv.style.color = '#fff';
  statsDiv.style.fontFamily = 'monospace';
  statsDiv.style.fontSize = '14px';
  statsDiv.style.zIndex = '10';
  statsDiv.style.textShadow = '0 0 4px #000';
  statsDiv.style.pointerEvents = 'none';
  container.appendChild(statsDiv);

  // Debug timing display
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'absolute';
  debugDiv.style.bottom = '10px';
  debugDiv.style.right = '10px';
  debugDiv.style.color = '#0f0';
  debugDiv.style.fontFamily = 'monospace';
  debugDiv.style.fontSize = '11px';
  debugDiv.style.zIndex = '10';
  debugDiv.style.textShadow = '0 0 4px #000';
  debugDiv.style.background = 'rgba(0,0,0,0.5)';
  debugDiv.style.padding = '5px';
  debugDiv.style.borderRadius = '4px';
  debugDiv.style.pointerEvents = 'none';
  debugDiv.style.display = 'none'; // Hidden by default
  container.appendChild(debugDiv);

  // VU meter
  const vuWrap = document.createElement('div');
  vuWrap.style.margin = '8px 0';
  vuWrap.style.display = 'flex';
  vuWrap.style.alignItems = 'center';

  const vuLabel = document.createElement('span');
  vuLabel.className = 'hint';
  vuLabel.textContent = 'Audio:';
  vuLabel.style.marginRight = '8px';

  const vuBar = document.createElement('div');
  vuBar.style.height = '8px';
  vuBar.style.flex = '1';
  vuBar.style.background = '#1b1e27';
  vuBar.style.border = '1px solid var(--panel-border)';
  vuBar.style.borderRadius = '6px';
  vuBar.style.position = 'relative';

  const vuFill = document.createElement('div');
  vuFill.style.position = 'absolute';
  vuFill.style.left = '0';
  vuFill.style.top = '0';
  vuFill.style.bottom = '0';
  vuFill.style.width = '0%';
  vuFill.style.background = '#6BCB77';
  vuFill.style.borderRadius = '6px';

  const vuStatus = document.createElement('span');
  vuStatus.className = 'hint';
  vuStatus.textContent = 'Stopped';
  vuStatus.style.marginLeft = '8px';

  vuBar.appendChild(vuFill);
  vuWrap.appendChild(vuLabel);
  vuWrap.appendChild(vuBar);
  vuWrap.appendChild(vuStatus);
  wrap.appendChild(vuWrap);

  // Setup Three.js scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f1115, 10, 50);

  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 8, 12);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setClearColor(0x0f1115);
  container.appendChild(renderer.domElement);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5);
  scene.add(ambientLight);

  const mainLight = new THREE.DirectionalLight(0xffffff, 1);
  mainLight.position.set(5, 10, 5);
  scene.add(mainLight);

  const backLight = new THREE.DirectionalLight(0x4D96FF, 0.5);
  backLight.position.set(-5, 5, -5);
  scene.add(backLight);

  // Create lanes
  const laneWidth = 2;
  const laneSpacing = 0.2;
  const totalWidth = (laneWidth + laneSpacing) * lanes.length - laneSpacing;
  const laneObjects = [];
  const laneGeometry = new THREE.BoxGeometry(laneWidth, 0.1, 40);

  lanes.forEach((lane, i) => {
    const x = (i - lanes.length / 2) * (laneWidth + laneSpacing) + laneWidth / 2;

    const material = new THREE.MeshPhongMaterial({
      color: new THREE.Color(lane.color).multiplyScalar(0.3),
      transparent: true,
      opacity: 0.6,
      emissive: new THREE.Color(lane.color),
      emissiveIntensity: 0.2
    });

    const laneMesh = new THREE.Mesh(laneGeometry, material);
    laneMesh.position.set(x, 0, -10);
    scene.add(laneMesh);
    laneObjects.push({ mesh: laneMesh, x, color: lane.color });
  });

  // Hit line
  const hitLineGeometry = new THREE.PlaneGeometry(totalWidth + 2, 0.3);
  const hitLineMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ff88,
    transparent: true,
    opacity: 0.8,
    side: THREE.DoubleSide
  });
  const hitLine = new THREE.Mesh(hitLineGeometry, hitLineMaterial);
  hitLine.position.set(0, 0.2, 5);
  hitLine.rotation.x = -Math.PI / 2;
  scene.add(hitLine);

  // Initial render to make scene visible immediately
  // Use requestAnimationFrame to ensure container has proper dimensions
  requestAnimationFrame(() => {
    // Update renderer size in case container dimensions weren't ready
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    console.log('Initial scene rendered at', container.clientWidth, 'x', container.clientHeight);
  });

  // Game state
  let running = false;
  let t0 = 0;
  let now = 0;
  let notes = [];
  let noteObjects = [];
  const hits = new Array(lanes.length).fill(0);
  const totalNotes = new Array(lanes.length).fill(0);
  let misses = 0;
  let combo = 0;
  let bestCombo = 0;
  const tagCounts = {};
  const keywords = [];
  const forbidden = [];

  // Audio sync timing
  let audioStartOffset = 0; // Offset to sync audio context time with game time
  let useAudioSync = false;

  // Note creation
  function createNote(lane, timeMs, type, lenMs) {
    const laneObj = laneObjects[lane];
    const geometry = type === 'long'
      ? new THREE.BoxGeometry(laneWidth * 0.7, 0.5, 1.5)
      : new THREE.BoxGeometry(laneWidth * 0.7, 0.5, 0.5);

    let color;
    if (type === 'hazard') color = 0xff4d4d;
    else if (type === 'chip') color = 0xffd93d;
    else color = laneObj.color;

    const material = new THREE.MeshPhongMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(laneObj.x, 0.5, -30);
    scene.add(mesh);

    return {
      mesh,
      lane,
      timeMs,
      type,
      lenMs,
      judged: false
    };
  }

  // Build notes
  let rand = Math.random;
  const makeRng = (seed0) => {
    let seed = (seed0 >>> 0) || 0xA5A5A5A5;
    return function() {
      seed |= 0;
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  function buildNotes() {
    console.log('Building synthetic notes...');
    const bpm = 96 * (diffSel.value === 'hard' ? 1.35 : diffSel.value === 'easy' ? 0.85 : 1.0);
    const beatMs = 60000 / bpm;
    const end = duration * 1000;
    const tempNotes = [];
    console.log('Synthetic BPM:', bpm, 'Duration:', duration);

    for (let lane = 0; lane < lanes.length; lane++) {
      for (let t = (lane * beatMs) % (beatMs * 2); t < end; t += beatMs * 2) {
        const j = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 20;
        tempNotes.push({ lane, timeMs: t + j, type: 'short' });
        totalNotes[lane]++;
      }
    }

    const w = biasLaneWeights(lanes, chosenBias);
    for (let t = beatMs * 8; t < end; t += beatMs * 8) {
      const lane = weightedLaneIndex(w, rand);
      const j = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 20;
      tempNotes.push({ lane, timeMs: t + j, type: 'long', lenMs: beatMs * 2 });
    }
    for (let t = beatMs * 10; t < end; t += beatMs * 10) {
      const lane = weightedLaneIndex(w, rand);
      const j = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 20;
      tempNotes.push({ lane, timeMs: t + j, type: 'chip' });
    }
    for (let t = beatMs * 12; t < end; t += beatMs * 12) {
      const lane = weightedLaneIndex(w, rand);
      const j = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 20;
      tempNotes.push({ lane, timeMs: t + j, type: 'hazard' });
    }

    tempNotes.sort((a, b) => a.timeMs - b.timeMs);
    notes = tempNotes;
    console.log(`Generated ${notes.length} synthetic notes`);
  }

  // Input handling
  const laneForKey = { 'd': 0, 'f': 1, 'j': 2, 'k': 3 };

  function onPress(laneIndex) {
    if (!running) return;

    // Calculate current game time consistently with animate loop
    let elapsed;
    if (useAudioSync && audioCtx) {
      elapsed = (audioCtx.currentTime - audioStartOffset) * 1000;
    } else {
      elapsed = now - gameStartTime;
    }
    const t = elapsed;

    let bestIdx = -1;
    let bestDelta = 999999;
    for (let i = 0; i < noteObjects.length; i++) {
      const n = noteObjects[i];
      if (n.judged || n.lane !== laneIndex) continue;
      const d = Math.abs(n.timeMs - t);
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = i;
      }
      if (n.timeMs - t > judgement.good) break;
    }

    if (bestIdx >= 0 && bestDelta <= judgement.good) {
      const note = noteObjects[bestIdx];
      note.judged = true;

      // Visual feedback
      note.mesh.material.emissiveIntensity = 2;
      setTimeout(() => {
        if (note.mesh.parent) {
          scene.remove(note.mesh);
        }
      }, 100);

      if (note.type === 'short') {
        hits[laneIndex]++;
        combo++;
        bestCombo = Math.max(bestCombo, combo);
      } else if (note.type === 'long') {
        const tag = pickLaneTag(lanes[note.lane].label);
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        combo++;
        bestCombo = Math.max(bestCombo, combo);
      } else if (note.type === 'chip') {
        const kw = pickKeyword();
        if (!keywords.includes(kw)) keywords.push(kw);
        combo++;
        bestCombo = Math.max(bestCombo, combo);
      } else if (note.type === 'hazard') {
        const fw = pickForbidden();
        if (!forbidden.includes(fw)) forbidden.push(fw);
        combo = 0;
      }

      beep(soundOn, note.type === 'hazard' ? 200 : 440);
      noteObjects.splice(bestIdx, 1);
    } else {
      combo = 0;
      beep(soundOn, 120);
    }
  }

  function keydown(e) {
    const k = (e.key || '').toLowerCase();
    if (laneForKey.hasOwnProperty(k)) {
      onPress(laneForKey[k]);
      e.preventDefault();
    }
  }

  function click(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const lane = Math.floor((x + 1) / 2 * lanes.length);
    onPress(Math.max(0, Math.min(lanes.length - 1, lane)));
  }

  // Animation loop
  let raf = 0;
  let audioCtx = null;
  let sourceNode = null;
  let analyser = null;
  let vuData = null;
  let gameStartTime = 0; // When the game actually started (performance.now)

  let frameCount = 0;
  function animate(timestamp) {
    if (!gameStartTime) {
      gameStartTime = timestamp;
      console.log('First frame - game start time:', gameStartTime);
    }
    now = timestamp;

    // Calculate current game time
    let elapsed;
    if (useAudioSync && audioCtx) {
      // Use audio context time for perfect sync
      // Clamp to 0 to handle startup delay period
      elapsed = Math.max(0, (audioCtx.currentTime - audioStartOffset) * 1000);
    } else {
      // Use performance timer
      elapsed = now - gameStartTime;
    }

    // Log every 60 frames
    if (frameCount++ % 60 === 0) {
      const sampleNote = noteObjects.length > 0 ? noteObjects[0] : null;
      const noteZ = sampleNote ? sampleNote.mesh.position.z.toFixed(1) : 'N/A';
      console.log('Frame', frameCount, '- Elapsed:', elapsed.toFixed(0), 'ms, Notes pending:', notes.length, ', Active notes:', noteObjects.length, ', Sample note Z:', noteZ);
    }

    // Spawn notes from the pre-generated notes array
    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const timeUntilNote = note.timeMs - elapsed;

      // Spawn notes 3 seconds before they should be hit
      if (timeUntilNote < 3000 && timeUntilNote > -100) {
        const noteObj = createNote(note.lane, note.timeMs, note.type, note.lenMs);
        noteObjects.push(noteObj);
        notes.splice(i, 1);
        i--;
      } else if (timeUntilNote < -1000) {
        // Remove notes that are too far in the past
        notes.splice(i, 1);
        i--;
      }
    }

    // Update notes
    for (let i = noteObjects.length - 1; i >= 0; i--) {
      const note = noteObjects[i];
      const timeUntilHit = (note.timeMs - elapsed) / 1000;
      const targetZ = 5;      // Where note should be hit (in front of camera)
      const startZ = -30;     // Where note spawns (far away)
      const travelTime = 3;   // Seconds to travel from start to target

      // Calculate progress: 0 at spawn (3s away), 1 at target (0s away)
      const progress = 1 - (timeUntilHit / travelTime);
      const z = startZ + (targetZ - startZ) * progress;

      note.mesh.position.z = z;

      // Remove missed notes
      if (elapsed - note.timeMs > judgement.good + 100 && !note.judged) {
        misses++;
        combo = 0;
        scene.remove(note.mesh);
        noteObjects.splice(i, 1);
      }
    }

    // Update stats
    const sum = hits.reduce((a, b) => a + b, 0) || 1;
    const genreText = hits.map((h, i) => `${lanes[i].label}:${Math.round((h/sum)*100)}%`).join('  ');
    statsDiv.innerHTML = `${genreText}<br>Combo: ${combo}  Best: ${bestCombo}  Misses: ${misses}`;

    // Update debug info
    if (debugMode) {
      const audioTime = audioCtx ? (audioCtx.currentTime * 1000).toFixed(0) : 'N/A';
      const nextNote = notes.length > 0 ? notes[0].timeMs.toFixed(0) : 'none';
      const activeNotes = noteObjects.length;
      debugDiv.innerHTML = `
Elapsed: ${elapsed.toFixed(0)}ms<br>
Audio Time: ${audioTime}ms<br>
Audio Offset: ${audioStartOffset.toFixed(3)}s<br>
Sync Mode: ${useAudioSync ? 'Audio' : 'Performance'}<br>
Notes Pending: ${notes.length}<br>
Notes Active: ${activeNotes}<br>
Next Note: ${nextNote}ms
      `.trim();
    }

    // Update VU meter
    try {
      if (analyser && vuData) {
        analyser.getByteTimeDomainData(vuData);
        let peak = 0;
        for (let i = 0; i < vuData.length; i++) {
          const v = Math.abs(vuData[i] - 128);
          if (v > peak) peak = v;
        }
        const pct = Math.min(100, Math.max(0, Math.round((peak / 128) * 100)));
        vuFill.style.width = pct + '%';
      }
    } catch(_) {}

    // Animate hit line
    hitLine.material.opacity = 0.8 + Math.sin(elapsed * 0.003) * 0.2;

    renderer.render(scene, camera);

    if (elapsed < duration * 1000 && running) {
      raf = requestAnimationFrame(animate);
    } else if (running) {
      running = false;
      endGame();
    }
  }

  function endGame() {
    window.removeEventListener('keydown', keydown);
    renderer.domElement.removeEventListener('click', click);
    try {
      if (sourceNode) {
        sourceNode.stop();
        sourceNode.disconnect();
      }
      if (audioCtx) audioCtx.suspend?.();
      vuStatus.textContent = 'Stopped';
    } catch(_) {}

    startBtn.disabled = false;
    startBtn.textContent = 'Start';

    const output = buildOutput(lanes, hits, {
      tagCounts,
      keywords,
      forbidden,
      language: chosenLanguage,
      accent: chosenAccent,
      misses,
      combo: bestCombo,
      duration,
      track: trackMeta
    });

    if (onFinish) onFinish(output);
  }

  function stopPlayback() {
    try { if (sourceNode) { sourceNode.stop(); sourceNode.disconnect(); } } catch(_) {}
    try { window.removeEventListener('keydown', keydown); } catch(_) {}
    try { renderer.domElement.removeEventListener('click', click); } catch(_) {}
    try { if (raf) cancelAnimationFrame(raf); } catch(_) {}
    try { if (audioCtx) audioCtx.suspend?.(); } catch(_) {}

    running = false;
    raf = 0;
    t0 = 0;
    now = 0;
    gameStartTime = 0;
    audioStartOffset = 0;
    useAudioSync = false;
    vuStatus.textContent = 'Stopped';
    vuFill.style.width = '0%';

    // Clear all note objects
    noteObjects.forEach(note => {
      if (note.mesh.parent) scene.remove(note.mesh);
    });
    noteObjects = [];

    startBtn.disabled = false;
    startBtn.textContent = 'Start';
  }

  function start() {
    if (running) {
      console.log('Game already running');
      return;
    }

    console.log('Starting 3D Rhythm Game...');
    startBtn.disabled = true;
    startBtn.textContent = 'Playing…';

    // Start the game with proper async handling for music
    (async () => {
      try {
        rand = makeRng(Date.now());
        useAudioSync = false;
        console.log('Music source:', musicSource);

        // Check if music is selected
        if (musicSource !== 'none' && (selectedTrack || selectedFile)) {
          // Prefer manifest bpm/offset when present; else analyze now
          let bpm = trackMeta?.bpm || null;
          let offset = trackMeta?.offset || 0;
          let beatTimes = [];

          if (!bpm) {
            showToastFallback('Analyzing audio... please wait');
            const target = selectedFile || (selectedTrack && selectedTrack.url);
            const res = await analyzeTrack(target, { maxDurationSec: duration });
            analysis = res;
            bpm = res.bpm;
            offset = res.offset;
            beatTimes = res.beatTimes;
            console.log('Beat analysis:', { bpm, offset, beatCount: beatTimes.length, confidence: res.confidence });
          }

          // Use tapped BPM if available
          bpm = tappedBPM || bpm;
          const offOverride = Number(offsetInput.value || 0);
          offset = isFinite(offOverride) ? offOverride : offset;

          if (bpm) {
            // Use actual beat times or generate from BPM
            const beats = beatTimes.length ? beatTimes : buildBeatsFromBpm(bpm, offset, duration);
            notes = buildNotesFromBeats(beats, lanes, chosenBias, duration, rand);
            console.log(`Generated ${notes.length} notes from ${beats.length} beats`);

            // Setup audio playback with precise timing
            audioCtx = window.__rgfAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
            window.__rgfAudioCtx = audioCtx;
            try { await audioCtx.resume(); } catch(_) {}

            // Decode track
            let arr;
            if (selectedFile) {
              arr = await selectedFile.arrayBuffer();
            } else {
              const res = await fetch(selectedTrack.url, { cache: 'no-cache' });
              arr = await res.arrayBuffer();
            }

            const audioBuffer = await audioCtx.decodeAudioData(arr.slice(0));
            sourceNode = audioCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            vuData = new Uint8Array(analyser.fftSize);

            sourceNode.connect(analyser);
            analyser.connect(audioCtx.destination);

            // CRITICAL: Start audio and record the exact timing
            // We'll start audio slightly in the future to give time to start animation loop
            // and account for any decoding/scheduling latency
            const startDelay = 0.2; // 200ms delay for better sync
            const audioStartTime = audioCtx.currentTime + startDelay;

            // Record when audio will start in AudioContext time
            audioStartOffset = audioStartTime;
            useAudioSync = true;

            sourceNode.start(audioStartTime, 0);
            vuStatus.textContent = 'Playing';

            console.log('Audio will start at context time:', audioStartTime);
          } else {
            buildNotes();
          }
        } else {
          // No music selected - use synthetic beats
          buildNotes();
        }
      } catch (e) {
        console.error('3D Rhythm start error', e);
        buildNotes();
      }

      // Reset game state
      running = true;
      gameStartTime = 0; // Will be set on first animate frame
      t0 = 0;
      now = 0;
      hits.fill(0);
      misses = 0;
      combo = 0;
      noteObjects = []; // Clear any existing note objects

      console.log('Game state reset. Notes array length:', notes.length);
      console.log('Starting animation loop...');

      window.addEventListener('keydown', keydown);
      renderer.domElement.addEventListener('click', click);

      raf = requestAnimationFrame(animate);
      restartBtn.disabled = false;

      console.log('Game started successfully!');
    })();
  }

  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', () => {
    stopPlayback();
    start();
  });
  quitBtn.addEventListener('click', () => {
    stopPlayback();
  });

  // Music track loading
  listTracks().then(tracks => {
    try {
      libSel.innerHTML = '';
      const def = document.createElement('option');
      def.value = '';
      def.textContent = 'Select track';
      libSel.appendChild(def);
      tracks.forEach(tr => {
        const o = document.createElement('option');
        o.value = tr.id || tr.file;
        o.textContent = tr.title || tr.file;
        o.dataset.json = JSON.stringify(tr);
        libSel.appendChild(o);
      });
    } catch(_) {}
  });

  musicSel.addEventListener('change', async () => {
    musicSource = musicSel.value;
    libSel.style.display = musicSource === 'library' ? '' : 'none';
    fileInput.style.display = musicSource === 'local' ? '' : 'none';
    trackMeta = null;
    selectedTrack = null;
    selectedFile = null;
    analysis = null;
    trackInfo.textContent = '';
  });

  libSel.addEventListener('change', async () => {
    try {
      const opt = libSel.options[libSel.selectedIndex];
      if (!opt || !opt.dataset.json) return;
      const entry = JSON.parse(opt.dataset.json);
      selectedTrack = await loadTrack(entry);
      trackMeta = {
        id: selectedTrack.id,
        title: selectedTrack.title,
        bpm: entry.bpm || null,
        offset: entry.offset || null
      };
      const cached = getCachedAnalysis(selectedTrack.id);
      analysis = cached || null;
      renderTrackInfo();
    } catch(_) {}
  });

  fileInput.addEventListener('change', async (e) => {
    try {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      selectedFile = f;
      selectedTrack = await loadTrack(f);
      trackMeta = {
        id: selectedTrack.id,
        title: selectedTrack.title,
        bpm: null,
        offset: null
      };
      analysis = null;
      renderTrackInfo();
    } catch(_) {}
  });

  // Handle window resize
  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Re-render if game isn't running
    if (!running) {
      renderer.render(scene, camera);
    }
  }
  window.addEventListener('resize', onWindowResize);

  return wrap;
}

// Helper function to build beats from BPM
function buildBeatsFromBpm(bpm, offset, durationSec) {
  const period = 60 / bpm;
  const beats = [];
  for (let t = offset; t < durationSec; t += period) {
    beats.push(t);
  }
  return beats;
}

// Build notes from detected or calculated beat times
function buildNotesFromBeats(beatTimes, lanes, chosenBias, duration, rand) {
  const tempNotes = [];
  const end = duration; // seconds
  const w = biasLaneWeights(lanes, chosenBias);
  const minSpacing = 300; // Minimum 300ms between notes in same lane

  // Helper to find available lane (not occupied within minSpacing)
  function findAvailableLane(targetTime, weights) {
    const attempts = [];

    // Try up to 10 times to find a non-overlapping lane
    for (let attempt = 0; attempt < 10; attempt++) {
      const lane = weightedLaneIndex(weights, rand);

      // Check if this lane is clear around targetTime
      const hasConflict = tempNotes.some(n =>
        n.lane === lane && Math.abs(n.timeMs - targetTime) < minSpacing
      );

      if (!hasConflict) return lane;
      attempts.push(lane);
    }

    // If all lanes are busy, pick the one used least recently
    const laneCounts = attempts.reduce((acc, l) => {
      acc[l] = (acc[l] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(laneCounts).sort((a, b) => laneCounts[a] - laneCounts[b])[0] || 0;
  }

  // Place notes on beats
  for (let i = 0; i < beatTimes.length; i++) {
    const bt = beatTimes[i];
    if (bt > end) break;

    const lane = findAvailableLane(bt * 1000, w);
    const jitter = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 0.02; // ±10ms
    tempNotes.push({ lane, timeMs: (bt + jitter) * 1000, type: 'short' });

    // Add special notes at intervals
    if (i % 8 === 0) {
      const l2 = findAvailableLane((bt + 0.05) * 1000, w);
      const j = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 0.02;
      tempNotes.push({ lane: l2, timeMs: (bt + j) * 1000, type: 'long', lenMs: 500 });
    }
    if (i % 10 === 5) {
      const l3 = findAvailableLane((bt + 0.1) * 1000, w);
      const j = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 0.02;
      tempNotes.push({ lane: l3, timeMs: (bt + j) * 1000, type: 'chip' });
    }
    if (i % 12 === 9) {
      const l4 = findAvailableLane((bt + 0.15) * 1000, w);
      const j = ((typeof rand === 'function' ? rand() : Math.random()) - 0.5) * 0.02;
      tempNotes.push({ lane: l4, timeMs: (bt + j) * 1000, type: 'hazard' });
    }
  }

  tempNotes.sort((a, b) => a.timeMs - b.timeMs);
  console.log(`Built ${tempNotes.length} notes with spacing enforcement`);
  return tempNotes;
}

// Helper functions
function buildLaneMap(bias = 'none') {
  const lib = (GENRE_LIBRARY || []).slice(0, 48);
  const colors = ['#4D96FF','#6BCB77','#FFD93D','#FF6B6B'];
  const targetSets = {
    none: ['Drill','Afrobeats','Trap','R&B'],
    street: ['Drill','Trap','R&B','Afrobeats'],
    club: ['Afrobeats','House','EDM','Rap'],
    backpack: ['Boom Bap','Lo-fi','Rap','R&B'],
    streaming: ['Pop Rap','Trap','Afrobeats','R&B']
  };
  const targets = targetSets[bias] || targetSets.none;
  const labels = targets.map(name => pickClosestName(lib, name));
  return labels.slice(0, 4).map((label, i) => ({ label, color: colors[i % colors.length] }));
}

function pickClosestName(lib, desired) {
  const token = String(desired || '').toLowerCase();
  let found = lib.find(g => (g.name || '').toLowerCase() === token);
  if (found) return found.name;
  found = lib.find(g => (g.name || '').toLowerCase().includes(token.replace(/\s+/g,' ')));
  if (found) return found.name;
  return desired;
}

function biasLaneWeights(lanes, bias) {
  const base = new Array(lanes.length).fill(1 / lanes.length);
  if (bias === 'street') return [0.4, 0.3, 0.2, 0.1];
  if (bias === 'club') return [0.35, 0.3, 0.2, 0.15];
  if (bias === 'backpack') return [0.3, 0.3, 0.25, 0.15];
  if (bias === 'streaming') return [0.3, 0.25, 0.25, 0.2];
  return base;
}

function weightedLaneIndex(weights, randFunc) {
  const r = (typeof randFunc === 'function' ? randFunc() : Math.random());
  let acc = 0;
  for (let i = 0; i < weights.length; i++) {
    acc += weights[i];
    if (r <= acc) return i;
  }
  return weights.length - 1;
}

function buildOutput(lanes, hits, extras = {}) {
  const sum = hits.reduce((a, b) => a + b, 0) || 1;
  const genres = lanes.map((l, i) => ({
    name: l.label,
    influence: Math.round((hits[i] / sum) * 100)
  }));

  const left = ['love','heartbreak','hustle','betrayal','triumph','redemption'];
  const right = ['loyalty','healing','ambition','trust','celebration','growth'];
  const r1 = Math.random();
  const r2 = Math.random();
  const premise = `${left[((r1) * left.length) | 0]} & ${right[((r2) * right.length) | 0]}`;

  const tags = Object.entries(extras.tagCounts || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => k);
  const kws = (extras.keywords || []).slice(0, 8);
  const forb = (extras.forbidden || []).slice(0, 8);

  return {
    genres,
    premise,
    styleTags: tags,
    keywords: kws,
    language: extras.language || 'English',
    accent: extras.accent || 'Neutral / Standard',
    forbidden: forb,
    meta: {
      mode: 'rhythm-3d',
      difficulty: 'normal',
      duration: extras.duration || 0,
      accuracy: calcAccuracy(hits, extras.misses || 0),
      bestCombo: extras.combo || 0,
      track: extras.track || null
    }
  };
}

function calcAccuracy(hits, misses) {
  const totalHits = hits.reduce((a, b) => a + b, 0);
  const total = totalHits + (misses || 0);
  if (total <= 0) return 0;
  return Math.round((totalHits / total) * 100);
}

function pickLaneTag(label) {
  const map = {
    'Drill': ['dark bounce','street cinema','gritty flow'],
    'Afrobeats': ['sunny percussion','afro swing','island groove'],
    'Trap': ['808 slap','hihat rolls','sub heavy'],
    'R&B': ['silky hook','smooth vibe','melodic runs']
  };
  const list = map[label] || ['anthemic','modern','energetic'];
  return list[((Math.random() * list.length) | 0)];
}

function pickKeyword() {
  const pool = ['crowd','lights','stage','engine','midnight','street','city','radio','festival','basement'];
  return pool[((Math.random() * pool.length) | 0)];
}

function pickForbidden() {
  const pool = ['glow','glitch','pulse','brand names'];
  return pool[((Math.random() * pool.length) | 0)];
}

function beep(enabled, freq = 440) {
  try {
    if (!enabled) return;
    const C = window.__rgfAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
    window.__rgfAudioCtx = C;
    const o = C.createOscillator();
    const g = C.createGain();
    o.type = 'sine';
    o.frequency.value = freq;
    g.gain.value = 0.04;
    o.connect(g).connect(C.destination);
    o.start();
    o.stop(C.currentTime + 0.06);
  } catch(_) {}
}
