// 3D Rhythm Tapper using Three.js - Fully reimagined with 3D graphics
// Exports: buildRhythm3DGameDialog(onFinish, options)

import { GENRE_LIBRARY } from '../../data/genres.js';
import { ACCENT_LIBRARY } from '../../data/accents.js';
import { LANGUAGE_OPTIONS } from '../../js/config.js';
import { listTracks, loadTrack, getCachedAnalysis, analyzeTrack } from '../music/manager.js';
import { loadStepManiaPackage, convertNotesToGameFormat, calculateHoldDurations } from './stepmania-parser.js';
import { listPacks, loadPackFromLibrary, savePackToLibrary, deletePackFromLibrary, getStorageInfo, getAllPacks, loadServerPack } from './stepmania-library.js';

const KEYBOARD_LAYOUTS = {
  dual: {
    label: 'Classic (DFJK + Arrows)',
    map: {
      'd': 0, 'f': 1, 'j': 2, 'k': 3,
      'arrowleft': 0, 'arrowdown': 1, 'arrowup': 2, 'arrowright': 3
    }
  },
  arrows: {
    label: 'Arrow Keys Only',
    map: {
      'arrowleft': 0, 'arrowdown': 1, 'arrowup': 2, 'arrowright': 3
    }
  },
  left: {
    label: 'Left Hand (ASDF)',
    map: { 'a': 0, 's': 1, 'd': 2, 'f': 3 }
  },
  right: {
    label: 'Right Hand (JKL;)',
    map: { 'j': 0, 'k': 1, 'l': 2, ';': 3 }
  }
};

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
  let chosenBias = options.preset || 'random';
  let lanes = buildLaneMap(chosenBias);
  let duration = options.durationSec || 60; // Default, will be updated with actual duration
  const difficulty = options.difficulty || 'normal';
  const speed = difficulty === 'hard' ? 1.35 : difficulty === 'easy' ? 0.85 : 1.0;

  // Timing windows based on DDR/StepMania standards (in milliseconds)
  // DDR: Marvelous ±16.7ms, Perfect ±33ms, Great ±92ms, Good ±142ms
  // We use slightly more forgiving windows for web gameplay
  const judgement = {
    marvelous: 22,  // ±22ms - tight window for perfect hits
    perfect: 45,    // ±45ms - good timing
    great: 90,      // ±90ms - decent timing
    good: 135,      // ±135ms - acceptable
    miss: 180       // ±180ms - outside this is a miss
  };
  const NOTE_START_Z = -30;
  const NOTE_TARGET_Z = 9;
  const NOTE_TRAVEL_TIME = 3;
  const MAX_NOTE_POINTS = 160;
  const NOTE_READY_WINDOW = 0.28;

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const wrap = document.createElement('div');
  wrap.className = 'rhythm-game-shell';
  wrap.dataset.game = 'rhythm-3d';
  wrap.style.position = 'relative';

  const headerRow = document.createElement('div');
  headerRow.className = 'rhythm-game-header';

  const hud = document.createElement('div');
  hud.className = 'rhythm-hud-text';
  hud.textContent = isTouchDevice
    ? 'Touch the glowing buttons below to land the beat.'
    : 'Use DFJK, arrow keys, or the buttons at the bottom to tap notes in sync.';

  const headerActions = document.createElement('div');
  headerActions.className = 'rhythm-header-actions';

  const fullscreenBtn = document.createElement('button');
  fullscreenBtn.type = 'button';
  fullscreenBtn.className = 'rhythm-header-btn';
  fullscreenBtn.textContent = 'Fullscreen';

  const settingsBtn = document.createElement('button');
  settingsBtn.type = 'button';
  settingsBtn.className = 'rhythm-header-btn';
  settingsBtn.textContent = 'Settings';

  headerActions.append(fullscreenBtn, settingsBtn);
  headerRow.append(hud, headerActions);
  wrap.appendChild(headerRow);

  const controls = document.createElement('div');
  controls.className = 'rhythm-settings-grid';

  // Helper function to style select elements for mobile-friendliness
  function styleSelectElement(selectElement) {
    selectElement.style.minHeight = '36px';
    selectElement.style.fontSize = '14px';
    selectElement.style.padding = '4px 8px';
    selectElement.style.minWidth = '120px';
  }

  // Difficulty select (unified for both game difficulties and StepMania charts)
  const diffSel = document.createElement('select');
  const defaultDifficulties = ['easy','normal','hard'];

  // Populate with default difficulties
  function populateDefaultDifficulties() {
    diffSel.innerHTML = '';
    defaultDifficulties.forEach(d => {
      const o = document.createElement('option');
      o.value = d;
      o.textContent = d;
      if (d === difficulty) o.selected = true;
      diffSel.appendChild(o);
    });
  }

  populateDefaultDifficulties();
  diffSel.title = 'Difficulty';
  styleSelectElement(diffSel);
  controls.appendChild(diffSel);

  // Preset bias
  const biasSel = document.createElement('select');
  ['random','none','street','club','backpack','streaming'].forEach(b => {
    const o = document.createElement('option');
    o.value = b;
    o.textContent = b;
    if (b === chosenBias) o.selected = true;
    biasSel.appendChild(o);
  });
  biasSel.title = 'Preset Bias';
  styleSelectElement(biasSel);
  biasSel.addEventListener('change', () => {
    chosenBias = biasSel.value;
    const manualGenres = getManualGenreSelections();
    lanes = buildLaneMap(chosenBias, manualGenres);
    updateLaneVisuals();
  });
  controls.appendChild(biasSel);

  // Manual lane genre selections
  const manualLaneSelections = [null, null, null, null];
  const laneSelectors = [];

  // Create a wrapper for lane selectors to center them
  const laneSelectorsWrapper = document.createElement('div');
  laneSelectorsWrapper.style.display = 'flex';
  laneSelectorsWrapper.style.flexWrap = 'wrap';
  laneSelectorsWrapper.style.justifyContent = 'center';
  laneSelectorsWrapper.style.alignItems = 'center';
  laneSelectorsWrapper.style.gap = '8px';
  laneSelectorsWrapper.style.width = '100%';
  laneSelectorsWrapper.style.marginTop = '8px';
  laneSelectorsWrapper.style.marginBottom = '8px';

  // Get all genres from library
  const allGenres = (GENRE_LIBRARY || []).map(g => g.name);

  // Create 4 lane selection dropdowns
  for (let i = 0; i < 4; i++) {
    const laneSel = document.createElement('select');

    // Add "Auto" option as default
    const autoOption = document.createElement('option');
    autoOption.value = '';
    autoOption.textContent = `Lane ${i + 1}: Auto`;
    laneSel.appendChild(autoOption);

    // Add all genres
    allGenres.forEach(genre => {
      const o = document.createElement('option');
      o.value = genre;
      o.textContent = genre;
      laneSel.appendChild(o);
    });

    laneSel.title = `Lane ${i + 1} Genre`;
    styleSelectElement(laneSel);

    // Store the lane index for the event listener
    const laneIndex = i;
    laneSel.addEventListener('change', () => {
      manualLaneSelections[laneIndex] = laneSel.value || null;
      const manualGenres = getManualGenreSelections();
      lanes = buildLaneMap(chosenBias, manualGenres);
      updateLaneVisuals();
    });

    laneSelectors.push(laneSel);
    laneSelectorsWrapper.appendChild(laneSel);
  }

  controls.appendChild(laneSelectorsWrapper);

  // Helper function to get manual genre selections (null if all are auto)
  function getManualGenreSelections() {
    const hasManualSelection = manualLaneSelections.some(s => s !== null && s !== '');
    if (!hasManualSelection) return null;

    // Fill in any auto slots with current lane values or random
    return manualLaneSelections.map((selection, i) => {
      if (selection) return selection;
      // If no manual selection, use current lane or pick random
      return lanes[i]?.label || pickRandomGenre(GENRE_LIBRARY || []);
    });
  }

  // Helper function to update lane visuals after genre change
  function updateLaneVisuals() {
    // Update lane colors and materials in the 3D scene (if scene is already created)
    if (typeof laneObjects !== 'undefined' && laneObjects.length > 0) {
      lanes.forEach((lane, i) => {
        if (laneObjects[i]) {
          laneObjects[i].color = lane.color;
          laneObjects[i].mesh.material.color.set(lane.color);
          laneObjects[i].mesh.material.emissive.set(lane.color);
        }
      });
    }
  }

  // Music source controls
  let musicSource = 'none';
  let selectedTrack = null;
  let selectedFile = null;
  let trackMeta = null;
  let analysis = null;

  const musicSel = document.createElement('select');
  ['none','library','local','stepmania'].forEach(m => {
    const o = document.createElement('option');
    o.value = m;
    o.textContent = 'Music: ' + m;
    if (m === 'none') o.selected = true;
    musicSel.appendChild(o);
  });
  musicSel.title = 'Music Source';
  styleSelectElement(musicSel);
  controls.appendChild(musicSel);

  const libSel = document.createElement('select');
  libSel.style.display = 'none';
  libSel.title = 'Library Track';
  styleSelectElement(libSel);
  controls.appendChild(libSel);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'audio/*';
  fileInput.style.display = 'none';
  controls.appendChild(fileInput);

  // StepMania library selector
  const smLibSel = document.createElement('select');
  smLibSel.style.display = 'none';
  smLibSel.title = 'StepMania Library';
  styleSelectElement(smLibSel);
  controls.appendChild(smLibSel);

  // StepMania file input
  const smFileInput = document.createElement('input');
  smFileInput.type = 'file';
  smFileInput.accept = '.sm,.ssc,.zip';
  smFileInput.style.display = 'none';
  smFileInput.title = 'StepMania file (.sm, .ssc, or .zip)';
  controls.appendChild(smFileInput);

  // Save to library button (shown after upload)
  const smSaveBtn = document.createElement('button');
  smSaveBtn.textContent = 'Save to Library';
  smSaveBtn.style.display = 'none';
  smSaveBtn.title = 'Save current pack to library';
  controls.appendChild(smSaveBtn);

  // StepMania state
  let stepmaniaData = null;
  let stepmaniaAudioUrl = null;
  let currentUploadedFile = null; // Store the uploaded file for saving to library

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
  let chosenAccent = 'Auto/Random';

  const langSel = document.createElement('select');
  LANGUAGE_OPTIONS.forEach(L => {
    const o = document.createElement('option');
    o.value = L;
    o.textContent = L;
    if (L === chosenLanguage) o.selected = true;
    langSel.appendChild(o);
  });
  langSel.title = 'Language';
  styleSelectElement(langSel);
  langSel.addEventListener('change', () => {
    chosenLanguage = langSel.value;
  });
  controls.appendChild(langSel);

  const accSel = document.createElement('select');
  // Add Auto/Random option first
  const autoAccent = document.createElement('option');
  autoAccent.value = 'Auto/Random';
  autoAccent.textContent = 'Auto/Random';
  autoAccent.selected = true;
  accSel.appendChild(autoAccent);

  ACCENT_LIBRARY.forEach(a => {
    const o = document.createElement('option');
    o.value = a.name;
    o.textContent = a.name;
    accSel.appendChild(o);
  });
  accSel.title = 'Accent';
  styleSelectElement(accSel);
  accSel.addEventListener('change', () => {
    chosenAccent = accSel.value;
  });
  controls.appendChild(accSel);

  const layoutSel = document.createElement('select');
  Object.entries(KEYBOARD_LAYOUTS).forEach(([key, value]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = value.label;
    layoutSel.appendChild(option);
  });
  layoutSel.value = 'dual';
  layoutSel.title = 'Keyboard Layout';
  styleSelectElement(layoutSel);
  layoutSel.addEventListener('change', () => {
    setKeyboardLayout(layoutSel.value);
  });
  controls.appendChild(layoutSel);

  // Helper function to get actual accent (random if Auto/Random selected)
  function getActualAccent() {
    if (chosenAccent === 'Auto/Random') {
      const randomIndex = Math.floor(Math.random() * ACCENT_LIBRARY.length);
      return ACCENT_LIBRARY[randomIndex].name;
    }
    return chosenAccent;
  }

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

  const playControlsRow = document.createElement('div');
  playControlsRow.className = 'rhythm-play-controls';
  playControlsRow.append(startBtn, restartBtn, quitBtn, debugBtn);

  // Three.js container
  const container = document.createElement('div');
  container.className = 'rhythm-game-stage';
  const defaultStageHeight = Math.min(520, Math.max(280, Math.round(window.innerHeight * 0.35)));
  container.style.height = `${defaultStageHeight}px`;
  wrap.appendChild(container);

  const stageSizeSlider = document.createElement('input');
  stageSizeSlider.type = 'range';
  stageSizeSlider.min = '280';
  stageSizeSlider.max = '640';
  stageSizeSlider.step = '10';
  stageSizeSlider.className = 'rhythm-stage-slider';
  stageSizeSlider.value = `${Math.round(defaultStageHeight)}`;
  stageSizeSlider.title = 'Adjust stage height';

  const stageSizeValue = document.createElement('span');
  stageSizeValue.className = 'rhythm-stage-value';
  stageSizeValue.textContent = `${Math.round(defaultStageHeight)}px`;
  stageSizeSlider.addEventListener('input', () => {
    const height = parseInt(stageSizeSlider.value, 10);
    stageSizeValue.textContent = `${height}px`;
    updateStageHeight(height);
  });

  function handleFullscreenChange() {
    const active = document.fullscreenElement === container;
    fullscreenBtn.textContent = active ? 'Exit Fullscreen' : 'Fullscreen';
  }

  fullscreenBtn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement && container.requestFullscreen) {
        await container.requestFullscreen({ navigationUI: 'hide' });
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed', err);
    }
  });

  document.addEventListener('fullscreenchange', handleFullscreenChange);
  handleFullscreenChange();

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
  wrap.appendChild(playControlsRow);

  const settingsOverlay = document.createElement('div');
  settingsOverlay.className = 'rhythm-settings-overlay';
  settingsOverlay.hidden = true;
  settingsOverlay.tabIndex = -1;

  const settingsCard = document.createElement('div');
  settingsCard.className = 'rhythm-settings-card';

  const settingsHeader = document.createElement('div');
  settingsHeader.className = 'rhythm-settings-card-header';

  const settingsTitle = document.createElement('h3');
  settingsTitle.textContent = 'Settings';

  const closeSettingsBtn = document.createElement('button');
  closeSettingsBtn.type = 'button';
  closeSettingsBtn.className = 'rhythm-settings-close';
  closeSettingsBtn.textContent = 'Done';

  settingsHeader.append(settingsTitle, closeSettingsBtn);
  settingsCard.append(settingsHeader);

  const settingsScroll = document.createElement('div');
  settingsScroll.className = 'rhythm-settings-scroll';

  const stageSection = document.createElement('div');
  stageSection.className = 'rhythm-settings-section';

  const stageLabelRow = document.createElement('div');
  stageLabelRow.className = 'rhythm-settings-row';

  const stageLabelText = document.createElement('span');
  stageLabelText.className = 'rhythm-settings-label';
  stageLabelText.textContent = 'Stage height';
  stageLabelRow.append(stageLabelText, stageSizeValue);

  stageSection.append(stageLabelRow, stageSizeSlider);

  const settingsNote = document.createElement('p');
  settingsNote.className = 'rhythm-settings-note';
  settingsNote.textContent = 'Touch buttons auto-appear on mobiles and match the lane art below.';
  settingsScroll.append(stageSection, settingsNote, controls);

  settingsCard.append(settingsScroll);
  settingsOverlay.append(settingsCard);
  wrap.append(settingsOverlay);

  let settingsOpen = false;
  function toggleSettingsMenu(show) {
    settingsOpen = show;
    settingsOverlay.hidden = !show;
    settingsBtn.textContent = show ? 'Close' : 'Settings';
    settingsBtn.setAttribute('aria-expanded', String(show));
    wrap.classList.toggle('rhythm-settings-open', show);
    if (show) {
      settingsOverlay.focus({ preventScroll: true });
    }
  }

  settingsBtn.addEventListener('click', () => toggleSettingsMenu(!settingsOpen));
  closeSettingsBtn.addEventListener('click', () => toggleSettingsMenu(false));
  settingsOverlay.addEventListener('click', (event) => {
    if (event.target === settingsOverlay) toggleSettingsMenu(false);
  });

  const handleSettingsKey = (event) => {
    if (event.key === 'Escape' && settingsOpen) {
      toggleSettingsMenu(false);
    }
  };
  document.addEventListener('keydown', handleSettingsKey);

  // Setup Three.js scene
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0f1115, 10, 50);

  const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 10, 10);
  camera.lookAt(0, 0, 2);

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
  const overlayProjector = new THREE.Vector3();
  const laneDirections = ['left', 'down', 'up', 'right'];

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


  // Initial render to make scene visible immediately
  // Use requestAnimationFrame to ensure container has proper dimensions
  requestAnimationFrame(() => {
    // Update renderer size in case container dimensions weren't ready
    renderer.setSize(container.clientWidth, container.clientHeight);
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    console.log('Initial scene rendered at', container.clientWidth, 'x', container.clientHeight);
    updateLaneProjection();
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
  let score = 0;
  let lastHitAccuracy = 0;
  let lastPointsEarned = 0;
  let lastHitDelta = 0;
  let lastJudgment = '';
  const tagCounts = {};
  const keywords = [];
  const forbidden = [];

  // Audio sync timing
  let audioStartOffset = 0; // Offset to sync audio context time with game time
  let useAudioSync = false;

  // Arrow geometry creation helper - creates bold, easy-to-see arrows
  function createArrowGeometry(direction) {
    // Create arrow shape using triangles
    // Direction: 'left', 'down', 'up', 'right'
    const shape = new THREE.Shape();

    // Arrow pointing up (we'll rotate for other directions)
    // Made bigger and bolder for visibility
    const scale = 1.5; // Make arrow 1.5x bigger
    shape.moveTo(0, 0.45 * scale);      // Top point
    shape.lineTo(-0.3 * scale, 0);      // Bottom left (wider)
    shape.lineTo(-0.12 * scale, 0);     // Neck left (thicker)
    shape.lineTo(-0.12 * scale, -0.3 * scale); // Bottom left of stem
    shape.lineTo(0.12 * scale, -0.3 * scale);  // Bottom right of stem
    shape.lineTo(0.12 * scale, 0);      // Neck right (thicker)
    shape.lineTo(0.3 * scale, 0);       // Bottom right (wider)
    shape.lineTo(0, 0.45 * scale);      // Back to top

    const geometry = new THREE.ShapeGeometry(shape);

    // Rotate based on direction
    if (direction === 'down') {
      geometry.rotateZ(Math.PI); // 180 degrees
    } else if (direction === 'left') {
      geometry.rotateZ(Math.PI / 2); // 90 degrees
    } else if (direction === 'right') {
      geometry.rotateZ(-Math.PI / 2); // -90 degrees
    }
    // 'up' needs no rotation

    return geometry;
  }

  // Create 3D arrow markers at the hit line for each lane
  const hitLineMarkers = [];
  lanes.forEach((lane, i) => {
    const laneObj = laneObjects[i];
    const direction = laneDirections[i];

    // Create arrow outline (dark background for contrast)
    const outlineGeometry = createArrowGeometry(direction);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6
    });
    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.scale.set(2.2, 2.2, 1);
    outlineMesh.position.set(laneObj.x, 0.12, NOTE_TARGET_Z);
    outlineMesh.rotation.x = -Math.PI / 2;
    scene.add(outlineMesh);

    // Create main arrow marker (bright white with lane color glow)
    const markerGeometry = createArrowGeometry(direction);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(lane.color),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      emissive: new THREE.Color(lane.color),
      emissiveIntensity: 0.5
    });
    const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
    markerMesh.scale.set(2.0, 2.0, 1);
    markerMesh.position.set(laneObj.x, 0.15, NOTE_TARGET_Z);
    markerMesh.rotation.x = -Math.PI / 2;
    scene.add(markerMesh);

    hitLineMarkers.push({ outline: outlineMesh, marker: markerMesh });
  });

  const activePointers = new Map();
  const laneBounds = [];

  function updateLaneProjection() {
    if (laneObjects.length === 0) return;
    const stageWidth = renderer.domElement.clientWidth;
    if (stageWidth <= 0) return;

    const clampX = (value) => Math.max(0, Math.min(value, stageWidth));
    const projectX = (worldX) => {
      overlayProjector.set(worldX, 0, NOTE_TARGET_Z);
      overlayProjector.project(camera);
      return clampX((overlayProjector.x * 0.5 + 0.5) * stageWidth);
    };

    laneObjects.forEach((laneObj, idx) => {
      const leftWorld = laneObj.x - laneWidth / 2;
      const rightWorld = laneObj.x + laneWidth / 2;
      const leftPx = projectX(leftWorld);
      const rightPx = projectX(rightWorld);
      laneBounds[idx] = {
        left: Math.max(0, Math.min(leftPx, rightPx)),
        right: Math.min(stageWidth, Math.max(leftPx, rightPx))
      };
    });
  }

  function getLaneForPoint(clientX) {
    if (laneBounds.length === 0) return undefined;
    const rect = renderer.domElement.getBoundingClientRect();
    const x = clientX - rect.left;
    const padding = 10;
    for (let i = 0; i < laneBounds.length; i++) {
      const bounds = laneBounds[i];
      if (!bounds) continue;
      if (x >= bounds.left - padding && x <= bounds.right + padding) {
        return i;
      }
    }
    return undefined;
  }

  function handlePointerDown(event) {
    if (!running) return;
    event.preventDefault();
    const lane = getLaneForPoint(event.clientX);
    if (lane === undefined) return;
    activePointers.set(event.pointerId, lane);
    onPress(lane);
  }

  function handlePointerMove(event) {
    if (!running) return;
    event.preventDefault();
    const newLane = getLaneForPoint(event.clientX);
    const currentLane = activePointers.get(event.pointerId);
    if (newLane !== undefined && newLane !== currentLane) {
      activePointers.set(event.pointerId, newLane);
      onPress(newLane);
    } else if (newLane === undefined) {
      activePointers.delete(event.pointerId);
    }
  }

  function handlePointerEnd(event) {
    activePointers.delete(event.pointerId);
  }

  container.style.touchAction = 'none';
  container.addEventListener('pointerdown', handlePointerDown, { passive: false });
  container.addEventListener('pointermove', handlePointerMove, { passive: false });
  container.addEventListener('pointerup', handlePointerEnd);
  container.addEventListener('pointercancel', handlePointerEnd);

  updateLaneProjection();

  function updateHitLineMarkers(laneReady) {
    hitLineMarkers.forEach((marker, idx) => {
      if (!marker) return;
      const ready = Boolean(laneReady[idx]);
      marker.outline.material.opacity = ready ? 0.95 : 0.5;
      marker.marker.material.opacity = ready ? 1 : 0.65;
      const scale = ready ? 2.3 : 2.0;
      marker.marker.scale.set(scale, scale, 1);
    });
  }


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
    mesh.position.set(laneObj.x, 0.5, NOTE_START_Z);
    scene.add(mesh);

    // Add directional arrow on top of note
    const direction = laneDirections[lane] || 'up';

    // Create arrow outline (dark background for contrast)
    const outlineGeometry = createArrowGeometry(direction);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000, // Black outline
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const outlineMesh = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineMesh.scale.set(1.15, 1.15, 1); // Slightly larger for outline effect
    outlineMesh.position.set(0, 0.29, 0); // Slightly below main arrow
    outlineMesh.rotation.x = -Math.PI / 2;
    mesh.add(outlineMesh);

    // Create main arrow (bright white)
    const arrowGeometry = createArrowGeometry(direction);
    const arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1.0,
      emissive: 0xffffff,
      emissiveIntensity: 0.3 // Add glow
    });
    const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);

    // Position arrow on top of the note box
    arrowMesh.position.set(0, 0.3, 0); // Relative to parent mesh
    arrowMesh.rotation.x = -Math.PI / 2; // Rotate to face up (horizontal)

    mesh.add(arrowMesh); // Add as child so it moves with the note

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
  let laneForKey = { ...KEYBOARD_LAYOUTS.dual.map };

  function setKeyboardLayout(layoutKey) {
    const layout = KEYBOARD_LAYOUTS[layoutKey];
    if (layout) {
      laneForKey = { ...layout.map };
    }
  }

  setKeyboardLayout('dual');

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
      if (n.timeMs - t > judgement.miss) break;
    }

    if (bestIdx >= 0 && bestDelta <= judgement.miss) {
      const note = noteObjects[bestIdx];
      note.judged = true;

      // Visual feedback
      note.mesh.material.emissiveIntensity = 2;
      setTimeout(() => {
        if (note.mesh.parent) {
          scene.remove(note.mesh);
        }
      }, 100);

      const isHazard = note.type === 'hazard';

      // Determine judgment tier based on timing accuracy (DDR-style)
      let judgmentTier;
      let pointsMultiplier;
      if (bestDelta <= judgement.marvelous) {
        judgmentTier = 'MARVELOUS';
        pointsMultiplier = 1.0;
      } else if (bestDelta <= judgement.perfect) {
        judgmentTier = 'PERFECT';
        pointsMultiplier = 0.95;
      } else if (bestDelta <= judgement.great) {
        judgmentTier = 'GREAT';
        pointsMultiplier = 0.75;
      } else if (bestDelta <= judgement.good) {
        judgmentTier = 'GOOD';
        pointsMultiplier = 0.5;
      } else {
        judgmentTier = 'OK';
        pointsMultiplier = 0.25;
      }

      const pointsEarned = isHazard ? 0 : Math.round(MAX_NOTE_POINTS * pointsMultiplier);
      lastHitAccuracy = isHazard ? 0 : Math.round(pointsMultiplier * 100);
      lastHitDelta = isHazard ? 0 : bestDelta;
      lastJudgment = isHazard ? 'HAZARD' : judgmentTier;
      lastPointsEarned = pointsEarned;
      if (!isHazard) score += pointsEarned;

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

      beep(soundOn, isHazard ? 200 : 440);
      noteObjects.splice(bestIdx, 1);
    } else {
      combo = 0;
      lastHitAccuracy = 0;
      lastHitDelta = 0;
      lastJudgment = '';
      lastPointsEarned = 0;
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

  // Gamepad support
  let gamepadConnected = false;
  let gamepadIndex = -1;
  const gamepadButtonStates = [false, false, false, false]; // Track previous frame button states

  // Gamepad button mapping
  // D-pad: buttons[12]=up, [13]=down, [14]=left, [15]=right
  // Face buttons: [0]=A(bottom), [1]=B(right), [2]=X(left), [3]=Y(top)
  // Mapping: Lane 0=Left, Lane 1=Down, Lane 2=Up, Lane 3=Right
  const gamepadButtonMap = {
    14: 0, // D-pad Left → Lane 0
    2: 0,  // X button → Lane 0
    13: 1, // D-pad Down → Lane 1
    0: 1,  // A button → Lane 1
    12: 2, // D-pad Up → Lane 2
    3: 2,  // Y button → Lane 2
    15: 3, // D-pad Right → Lane 3
    1: 3   // B button → Lane 3
  };

  window.addEventListener('gamepadconnected', (e) => {
    console.log('Gamepad connected:', e.gamepad.id);
    gamepadConnected = true;
    gamepadIndex = e.gamepad.index;
    showToastFallback(`Controller connected: ${e.gamepad.id}`);
  });

  window.addEventListener('gamepaddisconnected', (e) => {
    console.log('Gamepad disconnected');
    gamepadConnected = false;
    gamepadIndex = -1;
    showToastFallback('Controller disconnected');
  });

  function pollGamepad() {
    if (!gamepadConnected || gamepadIndex < 0) return;

    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadIndex];
    if (!gamepad) return;

    // Check each mapped button
    for (const [buttonIdx, lane] of Object.entries(gamepadButtonMap)) {
      const buttonIndex = parseInt(buttonIdx);
      const button = gamepad.buttons[buttonIndex];

      if (button && button.pressed && !gamepadButtonStates[buttonIndex]) {
        // Button just pressed (wasn't pressed last frame)
        onPress(lane);
        gamepadButtonStates[buttonIndex] = true;
      } else if (button && !button.pressed && gamepadButtonStates[buttonIndex]) {
        // Button released
        gamepadButtonStates[buttonIndex] = false;
      }
    }
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

    // Poll gamepad input
    pollGamepad();

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
    const laneReady = new Array(lanes.length).fill(false);
    for (let i = noteObjects.length - 1; i >= 0; i--) {
      const note = noteObjects[i];
      const timeUntilHit = (note.timeMs - elapsed) / 1000;
      laneReady[note.lane] = laneReady[note.lane] || Math.abs(timeUntilHit) <= NOTE_READY_WINDOW;

      // Calculate progress: 0 at spawn, 1 as it reaches the button line
      const progress = 1 - (timeUntilHit / NOTE_TRAVEL_TIME);
      const clampedProgress = Math.min(Math.max(progress, 0), 1);
      const z = NOTE_START_Z + (NOTE_TARGET_Z - NOTE_START_Z) * clampedProgress;
      note.mesh.position.z = z;

      // Remove missed notes (past the miss window)
      if (elapsed - note.timeMs > judgement.miss && !note.judged) {
        misses++;
        combo = 0;
        scene.remove(note.mesh);
        noteObjects.splice(i, 1);
      }
    }

    updateHitLineMarkers(laneReady);
    // Update stats
    const sum = hits.reduce((a, b) => a + b, 0) || 1;
    const genreText = hits.map((h, i) => `${lanes[i].label}:${Math.round((h/sum)*100)}%`).join('  ');
    const currentTimeSec = Math.floor(elapsed / 1000);
    const totalTimeSec = Math.floor(duration);
    const timeDisplay = `${Math.floor(currentTimeSec / 60)}:${(currentTimeSec % 60).toString().padStart(2, '0')} / ${Math.floor(totalTimeSec / 60)}:${(totalTimeSec % 60).toString().padStart(2, '0')}`;
    const scoreDisplay = score.toLocaleString();
    const judgmentText = lastJudgment || '—';
    const timingText = lastHitDelta ? `±${Math.round(lastHitDelta)}ms` : '—';
    statsDiv.innerHTML = `${genreText}<br>Time: ${timeDisplay}  Combo: ${combo}  Best: ${bestCombo}  Misses: ${misses}<br>Score: ${scoreDisplay} (+${lastPointsEarned})  ${judgmentText}  ${timingText}`;

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

    renderer.render(scene, camera);

    // Continue until time is up
    // If audio is playing, wait for full duration regardless of notes
    // If no audio, end when all notes complete OR time is up
    const allNotesComplete = notes.length === 0 && noteObjects.length === 0;
    const timeUp = elapsed >= duration * 1000;

    let shouldEnd = false;
    if (useAudioSync) {
      // With audio: only end when time is up (let full track play)
      shouldEnd = timeUp;
    } else {
      // Without audio: end when notes complete or time is up
      shouldEnd = allNotesComplete || timeUp;
    }

    if (!shouldEnd && running) {
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
      accent: getActualAccent(),
      misses,
      combo: bestCombo,
      score,
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
    score = 0;
    lastHitAccuracy = 0;
    lastPointsEarned = 0;
    lastHitDelta = 0;
    lastJudgment = '';

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
    if (isTouchDevice && document.fullscreenEnabled && container.requestFullscreen) {
      container.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
    }

    // Start the game with proper async handling for music
    (async () => {
      try {
        rand = makeRng(Date.now());
        useAudioSync = false;
        console.log('Music source:', musicSource);

        // Handle StepMania charts
        if (musicSource === 'stepmania' && stepmaniaData) {
          console.log('Starting with StepMania chart');

          // Extract chart index from unified difficulty selector (format: 'sm:0', 'sm:1', etc.)
          let chartIdx = -1;
          if (diffSel.value.startsWith('sm:')) {
            chartIdx = parseInt(diffSel.value.substring(3));
          }

          if (isNaN(chartIdx) || chartIdx < 0 || !stepmaniaData.charts[chartIdx]) {
            showToastFallback('Please select a chart difficulty');
            startBtn.disabled = false;
            startBtn.textContent = 'Start';
            return;
          }

          const chart = stepmaniaData.charts[chartIdx];
          const timing = stepmaniaData.timing;

          // Convert StepMania notes to game format
          console.log('Converting StepMania chart to notes...');
          const rawNotes = convertNotesToGameFormat(chart.noteData, timing, lanes.length);
          notes = calculateHoldDurations(rawNotes);

          console.log(`Loaded ${notes.length} notes from StepMania chart "${chart.displayName}"`);

          // Calculate chart duration from last note time (add buffer for holds)
          const maxNoteTime = notes.length > 0 ? Math.max(...notes.map(n => n.timeMs + (n.lenMs || 0))) : 60000;
          const chartDuration = (maxNoteTime / 1000) + 3; // Add 3 seconds buffer after last note

          // Setup audio playback if available
          if (stepmaniaAudioUrl) {
            audioCtx = window.__rgfAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
            window.__rgfAudioCtx = audioCtx;
            try { await audioCtx.resume(); } catch(_) {}

            const res = await fetch(stepmaniaAudioUrl);
            const arr = await res.arrayBuffer();
            const audioBuffer = await audioCtx.decodeAudioData(arr.slice(0));

            sourceNode = audioCtx.createBufferSource();
            sourceNode.buffer = audioBuffer;

            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 512;
            vuData = new Uint8Array(analyser.fftSize);

            sourceNode.connect(analyser);
            analyser.connect(audioCtx.destination);

            const startDelay = 0.2;
            const audioStartTime = audioCtx.currentTime + startDelay;
            audioStartOffset = audioStartTime;
            useAudioSync = true;

            sourceNode.start(audioStartTime, 0);
            vuStatus.textContent = 'Playing';

            // Use full audio duration (use longer of audio or chart)
            duration = Math.max(audioBuffer.duration, chartDuration);
            console.log('StepMania audio started at:', audioStartTime, 'Duration:', duration + 's');
          } else {
            // No audio - use chart duration
            duration = chartDuration;
            console.log('No audio - playing chart without music. Duration:', duration + 's');
          }
        }
        // Check if music is selected
        else if (musicSource !== 'none' && (selectedTrack || selectedFile)) {
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

            // Use full audio duration
            duration = audioBuffer.duration;
            console.log('Audio will start at context time:', audioStartTime, 'Duration:', duration + 's');
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
      score = 0;
      lastHitAccuracy = 0;
      lastPointsEarned = 0;
      lastHitDelta = 0;
      lastJudgment = '';

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
    smLibSel.style.display = musicSource === 'stepmania' ? '' : 'none';
    smFileInput.style.display = musicSource === 'stepmania' ? '' : 'none';
    smSaveBtn.style.display = 'none'; // Hide save button when switching sources

    // Load StepMania library when selected
    if (musicSource === 'stepmania') {
      await populateStepManiaLibrary();
    }

    // Restore default difficulties when switching away from StepMania
    if (musicSource !== 'stepmania') {
      populateDefaultDifficulties();
    }

    trackMeta = null;
    selectedTrack = null;
    selectedFile = null;
    stepmaniaData = null;
    stepmaniaAudioUrl = null;
    currentUploadedFile = null;
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

  // Function to populate StepMania library selector
  async function populateStepManiaLibrary() {
    try {
      const { server, local, all } = await getAllPacks();
      smLibSel.innerHTML = '<option value="">-- Select Pack --</option>';

      if (all.length === 0) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '(No packs available - upload one below)';
        opt.disabled = true;
        smLibSel.appendChild(opt);
      } else {
        // Add server packs first
        if (server.length > 0) {
          const serverGroup = document.createElement('optgroup');
          serverGroup.label = '📦 Server Packs';
          server.forEach(pack => {
            const opt = document.createElement('option');
            opt.value = `server:${pack.id}`;
            opt.textContent = pack.displayTitle;
            opt.dataset.isServer = 'true';
            serverGroup.appendChild(opt);
          });
          smLibSel.appendChild(serverGroup);
        }

        // Add local packs
        if (local.length > 0) {
          const localGroup = document.createElement('optgroup');
          localGroup.label = '💾 My Library';
          local.forEach(pack => {
            const opt = document.createElement('option');
            opt.value = `local:${pack.id}`;
            opt.textContent = pack.displayTitle;
            opt.dataset.isServer = 'false';
            localGroup.appendChild(opt);
          });
          smLibSel.appendChild(localGroup);
        }
      }

      console.log(`Loaded ${server.length} server packs, ${local.length} local packs`);
    } catch (err) {
      console.error('Failed to load StepMania library:', err);
      showToastFallback('Failed to load library: ' + err.message);
    }
  }

  // StepMania library selector handler
  smLibSel.addEventListener('change', async () => {
    try {
      const value = smLibSel.value;
      if (!value) return;

      // Parse value to determine source (server: or local:)
      const [source, packId] = value.split(':');
      if (!source || !packId) return;

      const isServer = source === 'server';
      showToastFallback(`Loading pack from ${isServer ? 'server' : 'library'}...`);
      console.log(`Loading pack from ${source}:`, packId);

      // Load pack from server or IndexedDB
      const packData = isServer
        ? await loadServerPack(packId)
        : await loadPackFromLibrary(parseInt(packId));

      // Handle folder packs (server-only)
      if (packData.isFolderPack) {
        console.log('Loading folder pack from server');
        // Parse the .sm content directly
        const { parseSimfileContent } = await import('./stepmania-parser.js');
        stepmaniaData = parseSimfileContent(packData.smContent);
        stepmaniaData.metadata = stepmaniaData.metadata || {};
        stepmaniaData.audioUrl = packData.audioUrl;
        stepmaniaData.requiresAudioFile = !packData.audioUrl;

        // Copy pack metadata for display
        Object.assign(stepmaniaData.metadata, {
          title: packData.packMetadata.title,
          artist: packData.packMetadata.artist
        });

        console.log('StepMania folder data loaded:', stepmaniaData);
      } else {
        // Handle ZIP/blob packs (both server and local)
        const file = new File([packData], packData.packMetadata.fileName, { type: 'application/zip' });

        // Parse the pack
        stepmaniaData = await loadStepManiaPackage(file);
        console.log('StepMania data loaded from library:', stepmaniaData);
      }

      // Populate difficulty selector
      diffSel.innerHTML = '';
      if (!stepmaniaData.charts || stepmaniaData.charts.length === 0) {
        console.error('No charts found in pack!');
        showToastFallback('No dance-single charts found in pack');
        populateDefaultDifficulties();
        return;
      }

      stepmaniaData.charts.forEach((chart, idx) => {
        const opt = document.createElement('option');
        opt.value = `sm:${idx}`;
        opt.textContent = chart.displayName || `Chart ${idx + 1}`;
        diffSel.appendChild(opt);
      });

      // Auto-select first chart
      if (stepmaniaData.charts.length > 0) {
        diffSel.value = 'sm:0';
      }

      // Setup track metadata
      if (stepmaniaData.audioUrl) {
        stepmaniaAudioUrl = stepmaniaData.audioUrl;
        trackMeta = {
          id: 'stepmania:' + stepmaniaData.metadata.title,
          title: stepmaniaData.metadata.title,
          artist: stepmaniaData.metadata.artist,
          bpm: stepmaniaData.timing.bpms[0]?.bpm || null,
          offset: stepmaniaData.timing.offset || 0
        };
        selectedTrack = { url: stepmaniaAudioUrl, title: trackMeta.title };

        if (stepmaniaData.charts.length > 0) {
          trackMeta.chart = stepmaniaData.charts[0].displayName;
          trackMeta.meter = stepmaniaData.charts[0].meter;
        }

        renderTrackInfo();
        showToastFallback(`Loaded from library: ${trackMeta.title}`);
      } else {
        trackMeta = {
          id: 'stepmania:' + stepmaniaData.metadata.title,
          title: stepmaniaData.metadata.title,
          artist: stepmaniaData.metadata.artist
        };

        if (stepmaniaData.charts.length > 0) {
          trackMeta.chart = stepmaniaData.charts[0].displayName;
          trackMeta.meter = stepmaniaData.charts[0].meter;
        }

        renderTrackInfo();
        showToastFallback('Loaded from library (no audio)');
      }

      // Hide save button since it's already in library
      smSaveBtn.style.display = 'none';
      currentUploadedFile = null;
    } catch (err) {
      console.error('Failed to load pack from library:', err);
      showToastFallback('Failed to load pack: ' + err.message);
    }
  });

  // Save to library button handler
  smSaveBtn.addEventListener('click', async () => {
    if (!currentUploadedFile || !stepmaniaData) {
      showToastFallback('No pack to save');
      return;
    }

    try {
      smSaveBtn.disabled = true;
      smSaveBtn.textContent = 'Saving...';

      // Save pack to library
      const packId = await savePackToLibrary(stepmaniaData, currentUploadedFile, currentUploadedFile.name);

      console.log('Pack saved to library with ID:', packId);
      showToastFallback(`Saved "${stepmaniaData.metadata.title}" to library!`);

      // Hide save button and clear uploaded file
      smSaveBtn.style.display = 'none';
      smSaveBtn.disabled = false;
      smSaveBtn.textContent = 'Save to Library';

      // Refresh library selector
      await populateStepManiaLibrary();

      // Select the newly saved pack
      smLibSel.value = packId;
    } catch (err) {
      console.error('Failed to save pack to library:', err);
      showToastFallback('Failed to save: ' + err.message);
      smSaveBtn.disabled = false;
      smSaveBtn.textContent = 'Save to Library';
    }
  });

  // StepMania file upload handler
  smFileInput.addEventListener('change', async (e) => {
    try {
      const f = e.target.files && e.target.files[0];
      if (!f) return;

      showToastFallback('Loading StepMania file...');
      console.log('Loading StepMania file:', f.name);

      // Load and parse StepMania package
      stepmaniaData = await loadStepManiaPackage(f);
      console.log('StepMania data loaded:', stepmaniaData);
      console.log('Number of charts:', stepmaniaData.charts?.length || 0);

      // Populate unified difficulty selector with StepMania charts
      diffSel.innerHTML = '';

      if (!stepmaniaData.charts || stepmaniaData.charts.length === 0) {
        console.error('No charts found in StepMania file!');
        showToastFallback('No dance-single charts found in file');
        populateDefaultDifficulties();
        return;
      }

      stepmaniaData.charts.forEach((chart, idx) => {
        console.log(`Adding chart ${idx}:`, chart.displayName);
        const opt = document.createElement('option');
        opt.value = `sm:${idx}`; // Prefix with 'sm:' to distinguish from game difficulties
        opt.textContent = chart.displayName || `Chart ${idx + 1}`;
        diffSel.appendChild(opt);
      });

      console.log('Difficulty selector now has', diffSel.options.length, 'options');

      // Auto-select first chart
      if (stepmaniaData.charts.length > 0) {
        diffSel.value = 'sm:0';
        console.log('Auto-selected first chart:', diffSel.value);
      }

      // Check if audio is available
      if (stepmaniaData.audioUrl) {
        stepmaniaAudioUrl = stepmaniaData.audioUrl;
        trackMeta = {
          id: 'stepmania:' + stepmaniaData.metadata.title,
          title: stepmaniaData.metadata.title,
          artist: stepmaniaData.metadata.artist,
          bpm: stepmaniaData.timing.bpms[0]?.bpm || null,
          offset: stepmaniaData.timing.offset || 0
        };
        selectedTrack = { url: stepmaniaAudioUrl, title: trackMeta.title };

        // Add selected chart info if auto-selected
        if (stepmaniaData.charts.length > 0) {
          const firstChart = stepmaniaData.charts[0];
          trackMeta.chart = firstChart.displayName;
          trackMeta.meter = firstChart.meter;
        }

        renderTrackInfo();
        showToastFallback(`Loaded: ${trackMeta.title} - ${stepmaniaData.charts.length} charts available`);
      } else {
        showToastFallback('StepMania file loaded. Audio not found in package - will use synthetic notes.');
        trackMeta = {
          id: 'stepmania:' + stepmaniaData.metadata.title,
          title: stepmaniaData.metadata.title,
          artist: stepmaniaData.metadata.artist
        };

        // Add selected chart info if auto-selected
        if (stepmaniaData.charts.length > 0) {
          const firstChart = stepmaniaData.charts[0];
          trackMeta.chart = firstChart.displayName;
          trackMeta.meter = firstChart.meter;
        }

        renderTrackInfo();
      }

      // Store uploaded file and show save button
      currentUploadedFile = f;
      smSaveBtn.style.display = '';
      console.log('File stored for saving to library:', f.name);
    } catch (err) {
      console.error('StepMania load error:', err);
      showToastFallback('Error loading StepMania file: ' + err.message);
      stepmaniaData = null;
      stepmaniaAudioUrl = null;
      currentUploadedFile = null;
      smSaveBtn.style.display = 'none';
    }
  });

  // Unified difficulty selector change handler
  diffSel.addEventListener('change', () => {
    // Check if this is a StepMania chart selection
    if (stepmaniaData && diffSel.value.startsWith('sm:')) {
      const chartIdx = parseInt(diffSel.value.substring(3)); // Remove 'sm:' prefix
      const chart = stepmaniaData.charts[chartIdx];

      if (trackMeta && chart) {
        trackMeta.chart = chart.displayName;
        trackMeta.meter = chart.meter;
        renderTrackInfo();
      }
    }
    // Otherwise it's a regular game difficulty change (easy/normal/hard)
    // No action needed here as it's handled in the game start logic
  });

  // Handle window resize
  function updateStageHeight(height) {
    container.style.height = `${height}px`;
    onWindowResize();
  }

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
    // Re-render if game isn't running
    if (!running) {
      renderer.render(scene, camera);
    }
    updateLaneProjection();
  }
  window.addEventListener('resize', onWindowResize);

  // Expose cleanup function for when dialog closes
  wrap._cleanup = function() {
    console.log('[3D Rhythm] Cleanup called - stopping audio and removing listeners');
    stopPlayback();
    window.removeEventListener('resize', onWindowResize);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    document.removeEventListener('keydown', handleSettingsKey);
    toggleSettingsMenu(false);
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    container.removeEventListener('pointerdown', handlePointerDown);
    container.removeEventListener('pointermove', handlePointerMove);
    container.removeEventListener('pointerup', handlePointerEnd);
    container.removeEventListener('pointercancel', handlePointerEnd);
  };

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
function buildLaneMap(bias = 'none', manualGenres = null) {
  const lib = (GENRE_LIBRARY || []).slice(0, 48);
  const colors = ['#4D96FF','#6BCB77','#FFD93D','#FF6B6B'];

  // If manual genres are provided, use them
  if (manualGenres && Array.isArray(manualGenres) && manualGenres.length === 4) {
    return manualGenres.map((genre, i) => ({
      label: genre || pickRandomGenre(lib),
      color: colors[i % colors.length]
    }));
  }

  // If bias is 'random', pick 4 random genres
  if (bias === 'random') {
    const randomGenres = [];
    const usedIndices = new Set();
    while (randomGenres.length < 4 && randomGenres.length < lib.length) {
      const idx = Math.floor(Math.random() * lib.length);
      if (!usedIndices.has(idx)) {
        usedIndices.add(idx);
        randomGenres.push(lib[idx].name);
      }
    }
    return randomGenres.map((label, i) => ({ label, color: colors[i % colors.length] }));
  }

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

function pickRandomGenre(lib) {
  if (!lib || lib.length === 0) return 'Unknown';
  return lib[Math.floor(Math.random() * lib.length)].name;
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

  const left = [
    'love','heartbreak','hustle','betrayal','triumph','redemption',
    'struggle','revenge','ambition','desire','freedom','power',
    'loss','pain','fear','doubt','hope','dreams',
    'pride','rage','passion','loneliness','desperation','survival',
    'corruption','temptation','sacrifice','rebellion','justice','chaos',
    'legacy','identity','destiny','honor','shame','regret',
    'transformation','awakening','discovery','madness','obsession','addiction',
    'vulnerability','resilience','defiance','surrender','conflict','peace'
  ];
  const right = [
    'loyalty','healing','ambition','trust','celebration','growth',
    'glory','wisdom','strength','courage','unity','revolution',
    'change','redemption','vengeance','acceptance','forgiveness','understanding',
    'elevation','dominance','escape','recognition','validation','belonging',
    'truth','illusion','fate','choice','consequence','opportunity',
    'evolution','legacy','impact','influence','memory','eternity',
    'balance','harmony','discord','reckoning','salvation','damnation',
    'enlightenment','darkness','light','shadow','reality','fantasy'
  ];
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
      score: extras.score || 0,
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
    // Hip-Hop & Rap
    'Drill': ['dark bounce','street cinema','gritty flow','menacing bass','raw energy'],
    'Trap': ['808 slap','hihat rolls','sub heavy','triplet flow','hard-hitting'],
    'Boom Bap': ['dusty drums','vinyl scratch','head nod','classic break','raw sample'],
    'Lo-fi': ['tape hiss','jazzy loop','chill vibes','vinyl crackle','lazy beat'],
    'Pop Rap': ['catchy hook','mainstream appeal','radio ready','melodic rap','crossover sound'],
    'Rap': ['lyrical flow','wordplay','rhyme scheme','conscious bars','storytelling'],

    // R&B & Soul
    'R&B': ['silky hook','smooth vibe','melodic runs','sultry vocal','neo soul'],
    'Soul': ['heartfelt vocal','church organ','emotional depth','gospel roots','warm harmonies'],
    'Neo-Soul': ['jazzy chord','modern groove','introspective','smooth production','vintage soul'],

    // Afro & Caribbean
    'Afrobeats': ['sunny percussion','afro swing','island groove','polyrhythm','dance vibe'],
    'Afro-Caribbean': ['tropical bounce','carnival energy','steel drum','island riddim','coastal sound'],
    'Dancehall': ['riddim bounce','bashment energy','caribbean flow','sound system','ragga style'],
    'Reggae': ['one drop','roots reggae','dub echo','skank rhythm','conscious message'],
    'Reggaeton': ['dembow rhythm','latin heat','perreo beat','urban latino','party anthem'],

    // Electronic & Dance
    'EDM': ['festival drop','big room','anthem build','euphoric lead','crowd pleaser'],
    'House': ['four on floor','groovy bass','disco sample','dance floor','uplifting piano'],
    'Deep House': ['soulful vocal','smooth groove','late night','warm pads','minimal beat'],
    'Tech House': ['rolling groove','funky bass','club weapon','hypnotic loop','warehouse vibe'],
    'Drum and Bass': ['breakbeat','amen break','neurofunk','liquid flow','jungle sound'],
    'Dubstep': ['wobble bass','half-time','aggressive drop','glitch hop','bass weight'],
    'Future Bass': ['lush chords','vocal chops','melodic drop','dreamy synth','emotional build'],
    'Synthwave': ['retro synth','80s nostalgia','neon lights','outrun aesthetic','analog warmth'],
    'Techno': ['industrial pulse','driving kick','warehouse rave','hypnotic loop','minimal groove'],

    // Pop & Mainstream
    'Pop': ['catchy melody','hook driven','radio hit','mainstream appeal','earworm chorus'],
    'Indie Pop': ['quirky melody','lo-fi charm','bedroom production','alternative sound','dreamy vocal'],
    'K-Pop': ['synchronized','production polish','colorful sound','choreographed','global appeal'],
    'Synth Pop': ['retro synth','electronic pop','new wave','melodic hook','vintage keys'],

    // Rock & Alternative
    'Rock': ['guitar riff','power chord','drum fill','raw energy','live sound'],
    'Indie Rock': ['garage sound','alternative vibe','DIY spirit','fuzzy guitar','authentic feel'],
    'Alternative': ['experimental edge','unique sound','non-conformist','artistic vision','genre blend'],
    'Punk': ['fast tempo','raw aggression','three chords','rebellious','DIY ethic'],
    'Grunge': ['distorted guitar','angst','heavy drop D','flannel aesthetic','90s nostalgia'],

    // Jazz & Blues
    'Jazz': ['swing rhythm','improvisation','blue note','brass section','sophisticated'],
    'Blues': ['twelve bar','bent note','soulful guitar','emotional depth','raw feeling'],
    'Smooth Jazz': ['mellow sax','laid back','easy listening','soft groove','relaxing vibe'],

    // Country & Folk
    'Country': ['steel guitar','storytelling','southern twang','heartland sound','rural roots'],
    'Folk': ['acoustic guitar','troubadour','honest lyric','organic sound','traditional'],

    // Latin & World
    'Latin': ['percussion heavy','salsa rhythm','mambo beat','tropical heat','dance energy'],
    'Bossa Nova': ['samba rhythm','jazzy chord','brazilian sun','smooth guitar','romantic feel'],
    'Flamenco': ['spanish guitar','passionate vocal','hand claps','gypsy soul','dramatic flair'],

    // Other
    'Gospel': ['praise vocal','church choir','spiritual lift','organ swell','hallelujah'],
    'Funk': ['slap bass','tight groove','syncopated rhythm','brass punch','get down'],
    'Disco': ['four on floor','string section','mirror ball','groove bass','dance fever'],
    'Metal': ['distorted riff','double kick','aggressive vocal','heavy palm mute','face melting']
  };
  const list = map[label] || ['anthemic','modern','energetic','creative','distinctive'];
  return list[((Math.random() * list.length) | 0)];
}

function pickKeyword() {
  const pool = [
    // Urban/City
    'crowd','lights','stage','street','city','radio','basement','rooftop','skyline','subway',
    'boulevard','downtown','alley','corner','avenue','skyscraper','neon','concrete','metro','district',

    // Performance/Music
    'festival','concert','amplifier','microphone','speakers','setlist','encore','soundcheck','booth','decks',
    'turntable','vinyl','studio','mixing','mastering','recording','headphones','monitor','venue','club',

    // Time/Mood
    'midnight','sunrise','twilight','golden hour','late night','dawn','dusk','evening','afternoon','rush hour',

    // Nature/Outdoors
    'ocean','mountain','desert','forest','river','coastline','horizon','sunset','storm','rain',
    'thunder','lightning','wind','clouds','stars','moon','summer','winter','spring','autumn',

    // Emotions/Vibes
    'energy','passion','freedom','dreams','memories','nostalgia','euphoria','adrenaline','intensity','fire',
    'ice','heat','electric','magnetic','gravity','momentum','pressure','tension','release','climax',

    // Technology/Modern
    'engine','digital','cyber','satellite','frequency','wavelength','signal','transmission','voltage','circuit',
    'laser','chrome','algorithm','matrix','network','wireless','fiber','pixel','binary','quantum',

    // Movement/Action
    'chase','drift','cruise','ride','flight','jump','dive','run','sprint','accelerate',
    'velocity','motion','flow','bounce','swing','spin','rotate','orbit','spiral','trajectory'
  ];
  return pool[((Math.random() * pool.length) | 0)];
}

function pickForbidden() {
  const pool = [
    // Visual Effects (overused)
    'glow','glitch','pulse','shimmer','sparkle','flicker','strobe','flash','blur','fade',

    // Corporate/Brand
    'brand names','trademarked','corporate','commercial','logo','sponsored','advertising','marketing',

    // Cliché Terms
    'viral','trending','influencer','clout','flex','fire emoji','lit','savage','squad','goals',
    'vibe check','stan','tea','salty','shook','ghost','simp','cap','slaps','bussin',

    // Overused Phrases
    'let that sink in','normalize','toxic','problematic','iconic','literally','obsessed','aesthetic',
    'era','giving','serving','living rent free','main character','understood the assignment',

    // Generic/Vague
    'stuff','things','whatever','something','basically','honestly','actually','obviously','technically'
  ];
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
