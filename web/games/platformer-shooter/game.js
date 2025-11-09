// Core game logic with Three.js
import * as THREE from 'https://unpkg.com/three@0.150.0/build/three.module.js';
import { GENRE_LIBRARY } from '../../data/genres.js';

// Enemy types based on genres
const ENEMY_TYPES = [
  { genre: 'Synthwave', color: 0xff6b9d, shape: 'pyramid', speed: 1.0 },
  { genre: 'Cyberpunk', color: 0x00ffff, shape: 'cube', speed: 1.2 },
  { genre: 'Industrial', color: 0xff6b6b, shape: 'spike', speed: 0.8 },
  { genre: 'Vaporwave', color: 0xb084cc, shape: 'pyramid', speed: 0.9 },
  { genre: 'Trap', color: 0xffd93d, shape: 'cube', speed: 1.3 }
];

// Powerup types
const POWERUP_TYPES = [
  { type: 'health', color: 0x6bcb77, label: 'health boost', styleTag: 'healing vibes' },
  { type: 'speed', color: 0x4d96ff, label: 'speed boost', styleTag: 'fast tempo' },
  { type: 'rapidfire', color: 0xffd93d, label: 'rapid fire', styleTag: 'rapid fire beats' },
  { type: 'shield', color: 0x22d3ee, label: 'shield', styleTag: 'protected energy' },
  { type: 'damage', color: 0xff6b6b, label: 'damage boost', styleTag: 'heavy impact' }
];

export function initGame(container, difficulty, hpByDiff, speedByDiff) {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a14);
  scene.fog = new THREE.Fog(0x0a0a14, 50, 200);

  // Camera — side-scrolling view (2.5D)
  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 12, 40);
  camera.lookAt(0, 8, 0);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // Lighting - retro neon aesthetic
  const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
  scene.add(ambientLight);

  // Neon rim lights
  const light1 = new THREE.DirectionalLight(0xff00ff, 1);
  light1.position.set(20, 30, 10);
  light1.castShadow = true;
  light1.shadow.camera.left = -50;
  light1.shadow.camera.right = 50;
  light1.shadow.camera.top = 50;
  light1.shadow.camera.bottom = -50;
  scene.add(light1);

  const light2 = new THREE.DirectionalLight(0x00ffff, 0.8);
  light2.position.set(-20, 20, -10);
  scene.add(light2);

  const light3 = new THREE.PointLight(0xffd93d, 1, 50);
  light3.position.set(0, 10, 0);
  scene.add(light3);

  // Floor strip (wide, thin)
  const floorGeometry = new THREE.BoxGeometry(500, 1, 2);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, emissive: 0x0a0a14, roughness: 0.7, metalness: 0.3 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.position.set(0, 0, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Platforms disabled for side-scroll MVP (ground only)
  const platforms = [];

  // Helper to create an emoji sprite texture
  function makeEmojiTexture(emoji = '👾', size = 64) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, size, size);
    // Optional subtle glow for contrast
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = size * 0.08;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Use common color emoji fonts across platforms
    const px = Math.floor(size * 0.8);
    ctx.font = `${px}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", system-ui, sans-serif`;
    ctx.fillText(emoji, size / 2, size / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  // Player — sprite
  const playerTex = makeEmojiTexture('🧑‍🎤', 96);
  const playerMat = new THREE.SpriteMaterial({ map: playerTex, transparent: true });
  const playerMesh = new THREE.Sprite(playerMat);
  playerMesh.scale.set(3, 3, 1);
  playerMesh.position.set(0, 1.5, 0);
  scene.add(playerMesh);
  const playerGlow = null;

  // Player state
  const player = {
    mesh: playerMesh,
    glow: playerGlow,
    position: playerMesh.position,
    velocity: new THREE.Vector3(0, 0, 0),
    rotation: 0,
    facing: 1,
    speed: speedByDiff[difficulty] || 10,
    jumpForce: 12,
    hp: hpByDiff[difficulty] || 3,
    maxHp: hpByDiff[difficulty] || 3,
    onGround: false,
    powerups: {
      speed: 1,
      rapidFire: 1,
      damage: 1,
      shield: false
    },
    powerupTimers: {}
  };

  // Input state
  const keys = {};
  const mouse = { x: 0, y: 0, buttons: 0 };
  let pointerLocked = false;

  // Simple mouse input (no pointer lock needed in side-scroll)
  window.addEventListener('mousemove', () => {});
  window.addEventListener('mousedown', e => { mouse.buttons = e.buttons; });
  window.addEventListener('mouseup', e => { mouse.buttons = e.buttons; });
  document.addEventListener('pointerlockchange', () => {});

  window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
  });

  window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
  });

  // Resize handler
  window.addEventListener('resize', () => {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });

  // Initialize global input state (only when game starts)
  if (!window.__gameKeys) {
    window.__gameKeys = {};
    window.__gameMouse = { x: 0, y: 0, buttons: 0 };

    window.addEventListener('keydown', e => {
      window.__gameKeys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', e => {
      window.__gameKeys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', e => {
      if (document.pointerLockElement) {
        window.__gameMouse.x += e.movementX * 0.002;
        window.__gameMouse.y += e.movementY * 0.002;
      }
    });

    window.addEventListener('mousedown', e => {
      window.__gameMouse.buttons = e.buttons;
    });

    window.addEventListener('mouseup', e => {
      window.__gameMouse.buttons = e.buttons;
    });
  }

  return {
    scene,
    camera,
    renderer,
    player,
    playerMesh,
    platforms,
    keys,
    mouse,
    floor
  };
}

export function updateGame(gameState, dt, playSfx) {
  const {
    player,
    enemies,
    projectiles,
    powerups,
    particles,
    platforms,
    genreKills,
    styleTags,
    keywords,
    forbidden,
    difficulty
  } = gameState;

  // Get input state from global
  const keys = window.__gameKeys || {};
  const mouse = window.__gameMouse || { x: 0, y: 0, buttons: 0 };

  // Update player movement (side-scroll)
  updatePlayer(player, keys, platforms, dt, playSfx);
  // Camera follow (side view)
  updateCamera(player, mouse);

  // Spawn enemies
  if (Math.random() < 0.02) {
    spawnEnemy(gameState);
  }

  // Spawn powerups
  if (Math.random() < 0.008) {
    spawnPowerup(gameState);
  }

  // Update enemies
  updateEnemies(gameState, dt, playSfx);

  // Shooting
  if (mouse.buttons & 1 && gameState.lastShot < Date.now() - 100 / player.powerups.rapidFire) {
    shootProjectile(gameState, playSfx);
    gameState.lastShot = Date.now();
  }

  // Update projectiles
  updateProjectiles(gameState, dt, playSfx);

  // Update powerups
  updatePowerups(gameState, dt, playSfx);

  // Update particles
  updateParticles(gameState, dt);

  // Update powerup timers
  updatePowerupTimers(player, dt);
}

function updatePlayer(player, keys, platforms, dt, playSfx) {
  const moveSpeed = player.speed * player.powerups.speed;
  // Horizontal movement (A/D or Left/Right)
  const left = keys['a'] || keys['arrowleft'];
  const right = keys['d'] || keys['arrowright'];
  if (left && !right) { player.velocity.x = -moveSpeed; player.facing = -1; }
  else if (right && !left) { player.velocity.x = moveSpeed; player.facing = 1; }
  else { player.velocity.x *= 0.85; }
  // No depth in side-scroll
  player.velocity.z = 0;

  // Gravity
  player.velocity.y -= 30 * dt;

  // Apply velocity (x/y only)
  player.position.x += player.velocity.x * dt;
  player.position.y += player.velocity.y * dt;
  player.position.z = 0;

  // Ground collision
  player.onGround = false;
  if (player.position.y <= 1) {
    player.position.y = 1;
    player.velocity.y = 0;
    player.onGround = true;
  }

  // Platforms disabled in MVP (keep ground-only jumping)

  // Jumping
  if (keys[' '] && player.onGround) {
    player.velocity.y = player.jumpForce;
    player.onGround = false;
    if (playSfx) playSfx('jump');
  }

  // Update glow position
  if (player.glow) {
    player.glow.position.copy(player.position);
  }

  // Bounds (horizontal)
  const limit = 240;
  player.position.x = Math.max(-limit, Math.min(limit, player.position.x));
  player.position.z = 0;
}

function updateCamera(player) {
  if (!player.mesh.parent) return;
  const camera = player.mesh.parent.children.find(child => child instanceof THREE.PerspectiveCamera);
  if (!camera) return;
  camera.position.x = player.position.x;
  camera.position.y = Math.max(8, player.position.y + 8);
  camera.position.z = 40;
  camera.lookAt(new THREE.Vector3(player.position.x, player.position.y + 4, 0));
}

function spawnEnemy(gameState) {
  const { scene, enemies } = gameState;
  if (!scene) return;

  const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
  const GENRE_EMOJI = {
    'Synthwave': '👾',
    'Cyberpunk': '🤖',
    'Industrial': '🦾',
    'Vaporwave': '🌴',
    'Trap': '🐍'
  };
  const eEmoji = GENRE_EMOJI[enemyType.genre] || '👾';
  const tex = makeEmojiTexture(eEmoji, 64);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Sprite(mat);
  mesh.scale.set(2.5, 2.5, 1);
  // Spawn to left or right
  const side = Math.random() < 0.5 ? -1 : 1;
  const startX = (player.position?.x || 0) + side * (30 + Math.random() * 20);
  mesh.position.set(startX, 2.5 + Math.random() * 3, 0);
  scene.add(mesh);

  const enemy = {
    mesh,
    type: enemyType,
    hp: 2,
    speed: enemyType.speed * (gameState.difficulty === 'hard' ? 1.3 : gameState.difficulty === 'easy' ? 0.8 : 1),
    rotation: 0
  };

  enemies.push(enemy);
}

function updateEnemies(gameState, dt, playSfx) {
  const { player, enemies, scene, combo } = gameState;

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];

    // Move toward player along X only
    const dirX = Math.sign((player.position.x) - (enemy.mesh.position.x));
    enemy.mesh.position.x += dirX * enemy.speed * 8 * dt;

    // Check collision with player
    const dx = Math.abs(enemy.mesh.position.x - player.position.x);
    const dy = Math.abs(enemy.mesh.position.y - player.position.y);
    if (dx < 2.5 && dy < 2.5) {
      // Damage player
      if (!player.powerups.shield) {
        player.hp -= 1;
        gameState.combo = 0;
        gameState.forbidden.add('enemy contact');
        if (playSfx) playSfx('damage');
      }

      // Remove enemy
      scene.remove(enemy.mesh);
      enemies.splice(i, 1);
      spawnParticles(gameState, enemy.mesh.position, enemy.type.color);
    }

    // Remove if too far or dead
    if (enemy.hp <= 0) {
      scene.remove(enemy.mesh);
      enemies.splice(i, 1);
      gameState.kills++;
      gameState.combo++;
      gameState.bestCombo = Math.max(gameState.bestCombo, gameState.combo);
      gameState.score += 100 * (1 + Math.floor(gameState.combo / 10));

      // Track genre
      const genre = enemy.type.genre;
      gameState.genreKills[genre] = (gameState.genreKills[genre] || 0) + 1;

      // Add keyword
      const kws = ['neon', 'retro', 'cyber', 'synth', 'digital', 'future', 'grid', 'electric'];
      gameState.keywords.add(kws[Math.floor(Math.random() * kws.length)]);

      spawnParticles(gameState, enemy.mesh.position, enemy.type.color);
      if (playSfx) playSfx('hit');

      if (gameState.combo % 5 === 0 && playSfx) playSfx('combo');
    }
  }
}

function shootProjectile(gameState, playSfx) {
  const { scene, player, projectiles } = gameState;
  if (!scene) return;

  const tex = makeEmojiTexture('🔸', 48);
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true });
  const mesh = new THREE.Sprite(mat);
  mesh.scale.set(1, 1, 1);

  mesh.position.copy(player.position);
  mesh.position.y += 1;

  scene.add(mesh);

  // Direction from player facing (horizontal)
  const direction = new THREE.Vector3(player.facing, 0, 0);

  const projectile = {
    mesh,
    velocity: direction.multiplyScalar(60),
    lifetime: 3,
    damage: player.powerups.damage
  };

  projectiles.push(projectile);
  gameState.shots++;

  if (playSfx) playSfx('shoot');
}

function updateProjectiles(gameState, dt, playSfx) {
  const { projectiles, enemies, scene } = gameState;

  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];

    // Move
    proj.mesh.position.x += proj.velocity.x * dt;
    proj.mesh.position.y += proj.velocity.y * dt;
    // No depth in side-scroll
    proj.mesh.position.z = 0;

    proj.lifetime -= dt;

    // Check collision with enemies
    let hit = false;
    for (const enemy of enemies) {
      const dx = Math.abs(proj.mesh.position.x - enemy.mesh.position.x);
      const dy = Math.abs(proj.mesh.position.y - enemy.mesh.position.y);
      if (dx < 2 && dy < 2) {
        enemy.hp -= proj.damage;
        hit = true;
        gameState.hits++;
        spawnParticles(gameState, proj.mesh.position, 0xffd93d);
        break;
      }
    }

    // Remove if hit or expired
    if (hit || proj.lifetime <= 0 || Math.abs(proj.mesh.position.y) > 50) {
      scene.remove(proj.mesh);
      projectiles.splice(i, 1);
    }
  }
}

function spawnPowerup(gameState) {
  const { scene, powerups } = gameState;
  if (!scene) return;

  const powerupType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];

  const geometry = new THREE.OctahedronGeometry(0.8);
  const material = new THREE.MeshStandardMaterial({
    color: powerupType.color,
    emissive: powerupType.color,
    emissiveIntensity: 0.8,
    roughness: 0.2,
    metalness: 0.8
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Random position
  mesh.position.set(
    (Math.random() - 0.5) * 60,
    5 + Math.random() * 10,
    (Math.random() - 0.5) * 60
  );

  scene.add(mesh);

  const powerup = {
    mesh,
    type: powerupType,
    rotation: 0,
    bobOffset: Math.random() * Math.PI * 2
  };

  powerups.push(powerup);
}

function updatePowerups(gameState, dt, playSfx) {
  const { player, powerups, scene, styleTags } = gameState;

  for (let i = powerups.length - 1; i >= 0; i--) {
    const powerup = powerups[i];

    // Rotate and bob
    powerup.rotation += dt * 2;
    powerup.mesh.rotation.y = powerup.rotation;
    powerup.bobOffset += dt * 3;
    powerup.mesh.position.y += Math.sin(powerup.bobOffset) * 0.05;

    // Check collision with player
    const dist = powerup.mesh.position.distanceTo(player.position);
    if (dist < 3) {
      // Apply powerup
      applyPowerup(player, powerup.type);
      styleTags.add(powerup.type.styleTag);
      gameState.score += 50;

      scene.remove(powerup.mesh);
      powerups.splice(i, 1);

      spawnParticles(gameState, powerup.mesh.position, powerup.type.color);
      if (playSfx) playSfx('powerup');
    }
  }
}

function applyPowerup(player, powerupType) {
  const duration = 10; // seconds

  if (powerupType.type === 'health') {
    player.hp = Math.min(player.maxHp, player.hp + 1);
  } else if (powerupType.type === 'speed') {
    player.powerups.speed = 1.5;
    player.powerupTimers.speed = duration;
  } else if (powerupType.type === 'rapidfire') {
    player.powerups.rapidFire = 3;
    player.powerupTimers.rapidFire = duration;
  } else if (powerupType.type === 'shield') {
    player.powerups.shield = true;
    player.powerupTimers.shield = duration;
    // Change player color
    if (player.mesh) {
      player.mesh.material.emissive.setHex(0x22d3ee);
    }
  } else if (powerupType.type === 'damage') {
    player.powerups.damage = 2;
    player.powerupTimers.damage = duration;
  }
}

function updatePowerupTimers(player, dt) {
  Object.keys(player.powerupTimers).forEach(key => {
    player.powerupTimers[key] -= dt;
    if (player.powerupTimers[key] <= 0) {
      delete player.powerupTimers[key];

      // Reset powerup
      if (key === 'speed') player.powerups.speed = 1;
      else if (key === 'rapidFire') player.powerups.rapidFire = 1;
      else if (key === 'shield') {
        player.powerups.shield = false;
        if (player.mesh) {
          player.mesh.material.emissive.setHex(0x4d96ff);
        }
      } else if (key === 'damage') player.powerups.damage = 1;
    }
  });
}

function spawnParticles(gameState, position, color) {
  const { scene, particles } = gameState;
  if (!scene) return;

  for (let i = 0; i < 10; i++) {
    const geometry = new THREE.SphereGeometry(0.1, 4, 4);
    const material = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);

    mesh.position.copy(position);
    scene.add(mesh);

    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10,
      (Math.random() - 0.5) * 10
    );

    particles.push({
      mesh,
      velocity,
      lifetime: 0.5 + Math.random() * 0.5
    });
  }
}

function updateParticles(gameState, dt) {
  const { particles, scene } = gameState;

  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];

    particle.mesh.position.x += particle.velocity.x * dt;
    particle.mesh.position.y += particle.velocity.y * dt;
    particle.mesh.position.z += particle.velocity.z * dt;

    particle.lifetime -= dt;

    if (particle.lifetime <= 0) {
      scene.remove(particle.mesh);
      particles.splice(i, 1);
    }
  }
}

export function renderGame(scene, camera, renderer) {
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
