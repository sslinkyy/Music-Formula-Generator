// 3D Platformer Shooter — Retro third-person action game
// Exports: buildPlatformerShooterDialog(onFinish, options)
import { GENRE_LIBRARY } from '../../data/genres.js';
import { ACCENT_LIBRARY } from '../../data/accents.js';
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.150.0/build/three.module.js';

export function buildPlatformerShooterDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  const difficulty = options.difficulty || 'normal';
  const duration = options.durationSec || 120; // 2 minutes default

  // Controls
  const controls = document.createElement('div');
  controls.className = 'inline-buttons';

  const diffSel = document.createElement('select');
  ['easy', 'normal', 'hard'].forEach(d => {
    const o = document.createElement('option');
    o.value = d;
    o.textContent = d;
    if (d === difficulty) o.selected = true;
    diffSel.appendChild(o);
  });
  controls.appendChild(diffSel);

  let lang = 'English', acc = 'Neutral / Standard';
  const langSel = document.createElement('select');
  ['English', 'Spanish', 'French'].forEach(L => {
    const o = document.createElement('option');
    o.value = L;
    o.textContent = L;
    langSel.appendChild(o);
  });
  controls.appendChild(langSel);

  const accSel = document.createElement('select');
  (ACCENT_LIBRARY || []).slice(0, 8).forEach(a => {
    const o = document.createElement('option');
    o.value = a.name;
    o.textContent = a.name;
    accSel.appendChild(o);
  });
  controls.appendChild(accSel);

  langSel.addEventListener('change', () => (lang = langSel.value));
  accSel.addEventListener('change', () => (acc = accSel.value));

  const startBtn = document.createElement('button');
  startBtn.className = 'btn-primary';
  startBtn.textContent = 'Start';
  const restartBtn = document.createElement('button');
  restartBtn.textContent = 'Restart';
  restartBtn.disabled = true;
  const quitBtn = document.createElement('button');
  quitBtn.textContent = 'Quit';
  const pauseBtn = document.createElement('button');
  pauseBtn.textContent = 'Pause';
  pauseBtn.title = 'Pause/Resume';
  const sfxBtn = document.createElement('button');
  sfxBtn.textContent = 'SFX: On';
  sfxBtn.title = 'Toggle sounds';
  const vol = document.createElement('input');
  vol.type = 'range';
  vol.min = '0';
  vol.max = '1';
  vol.step = '0.01';
  vol.value = '0.12';
  vol.title = 'Volume';
  vol.style.width = '100px';

  controls.appendChild(startBtn);
  controls.appendChild(restartBtn);
  controls.appendChild(quitBtn);
  controls.appendChild(pauseBtn);
  controls.appendChild(sfxBtn);
  controls.appendChild(vol);
  wrap.appendChild(controls);

  // Canvas container
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '600px';
  container.style.position = 'relative';
  container.style.background = '#0a0a14';
  container.style.borderRadius = '12px';
  container.style.overflow = 'hidden';
  wrap.appendChild(container);

  // HUD
  const hud = document.createElement('div');
  hud.className = 'hint';
  hud.textContent = 'Move: WASD | Jump: Space | Shoot: Click | Look: Mouse';
  hud.style.margin = '6px 0';
  wrap.appendChild(hud);

  // Game state
  let running = false;
  let paused = false;
  let t0 = 0;
  let now = 0;
  let pauseAccum = 0;
  let pauseStart = 0;
  let sfxOn = true;
  let sfxVol = 0.12;

  // Three.js components (will be initialized in start())
  let scene, camera, renderer;
  let player, playerMesh;
  let enemies = [];
  let projectiles = [];
  let platforms = [];
  let powerups = [];
  let particles = [];

  // Game stats
  let score = 0;
  let kills = 0;
  let combo = 0;
  let bestCombo = 0;
  let shots = 0;
  let hits = 0;
  const genreKills = {};
  const styleTags = new Set();
  const keywords = new Set();
  const forbidden = new Set();

  // Player stats by difficulty
  const hpByDiff = { easy: 5, normal: 3, hard: 2 };
  const speedByDiff = { easy: 8, normal: 10, hard: 12 };

  // Import game modules
  import('./game.js').then(gameModule => {
    const { initGame, updateGame, renderGame } = gameModule;

    function start() {
      reset();

      // Initialize Three.js scene
      const result = initGame(container, difficulty, hpByDiff, speedByDiff);
      scene = result.scene;
      camera = result.camera;
      renderer = result.renderer;
      player = result.player;
      playerMesh = result.playerMesh;
      platforms = result.platforms;

      running = true;
      t0 = 0;
      now = 0;
      pauseAccum = 0;
      paused = false;
      restartBtn.disabled = false;

      requestAnimationFrame(loop);
    }

    function reset() {
      enemies = [];
      projectiles = [];
      powerups = [];
      particles = [];
      score = 0;
      kills = 0;
      combo = 0;
      bestCombo = 0;
      shots = 0;
      hits = 0;
      Object.keys(genreKills).forEach(k => delete genreKills[k]);
      styleTags.clear();
      keywords.clear();
      forbidden.clear();
    }

    function loop(ts) {
      if (!t0) t0 = ts;
      now = ts;
      const elapsed = (now - t0) / 1000 - pauseAccum;

      if (paused) {
        renderGame(scene, camera, renderer);
        drawPausedOverlay();
        requestAnimationFrame(loop);
        return;
      }

      const gameState = {
        player,
        enemies,
        projectiles,
        powerups,
        particles,
        platforms,
        score,
        kills,
        combo,
        bestCombo,
        genreKills,
        styleTags,
        keywords,
        forbidden,
        shots,
        hits,
        elapsed,
        difficulty: diffSel.value,
        sfxOn,
        sfxVol
      };

      updateGame(gameState, 1/60, playSfx);
      renderGame(scene, camera, renderer);
      updateHUD(elapsed);

      if (elapsed < duration && running && player.hp > 0) {
        requestAnimationFrame(loop);
      } else {
        endGame();
      }
    }

    function endGame() {
      running = false;

      // Calculate top genres
      const top = Object.entries(genreKills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);
      const sum = top.reduce((a, b) => a + b[1], 0) || 1;
      const genres = top.map(([name, count]) => ({
        name,
        influence: Math.round((count / sum) * 100)
      }));

      const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;

      const out = {
        genres: genres.length
          ? genres
          : [
              { name: 'Synthwave', influence: 60 },
              { name: 'Cyberpunk', influence: 40 }
            ],
        premise: samplePremise(),
        styleTags: Array.from(styleTags).slice(0, 8),
        keywords: Array.from(keywords).slice(0, 8),
        language: lang,
        accent: acc,
        forbidden: Array.from(forbidden).slice(0, 8),
        meta: {
          mode: 'platformer-shooter',
          difficulty: diffSel.value,
          duration,
          score: Math.max(
            0,
            Math.round(kills * 100 + bestCombo * 20 - forbidden.size * 50)
          ),
          accuracy,
          bestCombo
        }
      };

      if (onFinish) onFinish(out);
    }

    function updateHUD(elapsed) {
      const mult = 1 + Math.floor(combo / 10);
      const timeLeft = Math.max(0, (duration - elapsed) | 0);
      const accuracy = shots > 0 ? Math.round((hits / shots) * 100) : 0;

      hud.textContent = `Time: ${timeLeft}s | HP: ${player.hp} | Kills: ${kills} | Combo: ${combo} (x${mult}) | Acc: ${accuracy}% | Score: ${Math.round(score)}`;
    }

    function drawPausedOverlay() {
      // This would be rendered as an HTML overlay or using canvas
      // For now, just show in HUD
      if (paused) {
        hud.textContent = 'PAUSED - Press P or click Pause to resume';
      }
    }

    function togglePause() {
      paused = !paused;
      pauseBtn.textContent = paused ? 'Resume' : 'Pause';
      if (paused) {
        pauseStart = now;
        showToast('Paused');
      } else {
        if (pauseStart) {
          pauseAccum += (now - pauseStart) / 1000;
          pauseStart = 0;
        }
        showToast('Resumed');
      }
    }

    function playSfx(type) {
      try {
        if (!sfxOn) return;
        const C =
          window.__rgfAudioCtx ||
          new (window.AudioContext || window.webkitAudioContext)();
        window.__rgfAudioCtx = C;
        const o = C.createOscillator();
        const g = C.createGain();
        o.connect(g).connect(C.destination);

        let freq = 440,
          dur = 0.05,
          vol = 0.06,
          typeW = 'sine';

        if (type === 'shoot') {
          freq = 660;
          dur = 0.04;
          vol = 0.05;
          typeW = 'square';
        } else if (type === 'hit') {
          freq = 220;
          dur = 0.06;
          vol = 0.06;
          typeW = 'sawtooth';
        } else if (type === 'jump') {
          freq = 440;
          dur = 0.1;
          vol = 0.04;
          typeW = 'sine';
        } else if (type === 'powerup') {
          freq = 880;
          dur = 0.07;
          vol = 0.05;
          typeW = 'triangle';
        } else if (type === 'damage') {
          freq = 140;
          dur = 0.12;
          vol = 0.07;
          typeW = 'sawtooth';
        } else if (type === 'combo') {
          freq = 1200;
          dur = 0.05;
          vol = 0.04;
          typeW = 'sine';
        }

        vol = vol * (sfxVol || 0);
        g.gain.value = 0;
        const nowT = C.currentTime;
        const attack = 0.005,
          decay = dur;
        g.gain.setValueAtTime(0, nowT);
        g.gain.linearRampToValueAtTime(vol, nowT + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, nowT + attack + decay);
        o.type = typeW;
        o.frequency.setValueAtTime(freq, nowT);
        o.start(nowT);
        o.stop(nowT + attack + decay + 0.02);
      } catch (_) {}
    }

    function showToast(text) {
      try {
        const root = document.getElementById('toast-root');
        if (!root) return;
        const el = document.createElement('div');
        el.className = 'toast';
        el.textContent = text;
        root.appendChild(el);
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 900);
      } catch (_) {}
    }

    // Event listeners
    startBtn.addEventListener('click', start);
    restartBtn.addEventListener('click', () => {
      reset();
      start();
    });
    quitBtn.addEventListener('click', () => {
      running = false;
      if (renderer) {
        renderer.dispose();
      }
    });
    pauseBtn.addEventListener('click', togglePause);
    sfxBtn.addEventListener('click', () => {
      sfxOn = !sfxOn;
      sfxBtn.textContent = `SFX: ${sfxOn ? 'On' : 'Off'}`;
    });
    vol.addEventListener('input', () => {
      sfxVol = Math.max(0, Math.min(1, Number(vol.value) || 0));
    });

    window.addEventListener('keydown', e => {
      if (e.key === 'p' || e.key === 'P') {
        togglePause();
        e.preventDefault();
      }
    });
  });

  return wrap;
}

// Helper functions
function samplePremise() {
  const L = [
    'freedom',
    'rebellion',
    'ambition',
    'escape',
    'triumph',
    'nostalgia',
    'identity',
    'legacy'
  ];
  const R = [
    'defiance',
    'balance',
    'growth',
    'celebration',
    'memory',
    'yearning',
    'perseverance',
    'trust'
  ];
  return `${L[(Math.random() * L.length) | 0]} & ${
    R[(Math.random() * R.length) | 0]
  }`;
}
