import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/GLTFLoader.js";
import { SkeletonUtils } from "https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/utils/SkeletonUtils.js";

const assetBase = "./assets/models";
const assetMap = {
  player: `${assetBase}/characters/character.glb`,
  platform: `${assetBase}/environment/platform.glb`,
  platformMedium: `${assetBase}/environment/platform-medium.glb`,
  platformLarge: `${assetBase}/environment/platform-large.glb`,
  platformGrass: `${assetBase}/environment/platform-grass-large-round.glb`,
  platformFalling: `${assetBase}/environment/platform-falling.glb`,
  coin: `${assetBase}/environment/coin.glb`,
  flag: `${assetBase}/environment/flag.glb`,
  cloud: `${assetBase}/environment/cloud.glb`,
  grass: `${assetBase}/environment/grass.glb`,
  dust: `${assetBase}/environment/dust.glb`,
  brick: `${assetBase}/environment/brick.glb`,
  brickParticle: `${assetBase}/environment/brick-particle.glb`,
  blockCoin: `${assetBase}/environment/block-coin.glb`,
};

const platformLayout = [
  { model: "platform", position: [0, -3.8, 0], scale: 2.6 },
  { model: "platformGrass", position: [6, -2.5, 0], scale: 1.3 },
  { model: "platformMedium", position: [13, -1.3, 0], scale: 1 },
  { model: "platformLarge", position: [20, -2.8, 0], scale: 1.4 },
  { model: "platformFalling", position: [27, -1.5, 0], scale: 1.1 },
  { model: "platform", position: [34, -3.7, 0], scale: 2.2 },
  { model: "platformGrass", position: [42, -2.4, 0], scale: 1.2 },
  { model: "platformMedium", position: [49, -1.9, 0], scale: 1 },
];

const coinPositions = [
  [2.5, -1.2],
  [8.1, -0.3],
  [15.5, 0.4],
  [22, -1.1],
  [29, -0.5],
  [36.7, -1.8],
  [44.5, -2.1],
  [52, -1.2],
];

const cloudPositions = [
  [2, 6, -8],
  [12, 5.2, -10],
  [24, 6.5, -12],
  [36, 4.8, -9],
  [48, 6.1, -11],
];

const enemyLayout = [
  { model: "brick", center: 18, range: 3.2, speed: 1.1 },
  { model: "blockCoin", center: 32, range: 2.5, speed: 1.6 },
  { model: "brick", center: 44, range: 4, speed: 1.2 },
];

const cameraConfig = {
  offsetX: 6,
  offsetY: 4.3,
  offsetZ: 17,
  minX: 5,
  maxX: 58,
};

const worldLimits = { minX: -6.5, maxX: 58 };

const loader = new GLTFLoader();
let modelsLoading = null;
const loadedModels = {};

async function ensureModels() {
  if (modelsLoading) {
    await modelsLoading;
    return;
  }

  modelsLoading = (async () => {
    const entries = Object.entries(assetMap);
    for (const [key, path] of entries) {
      const gltf = await loader.loadAsync(path);
      const sceneNode = gltf.scene;
      sceneNode.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      loadedModels[key] = sceneNode;
    }
  })();

  await modelsLoading;
}

function cloneModel(key) {
  const source = loadedModels[key];
  if (!source) return null;
  return SkeletonUtils.clone(source);
}

function registerControls(state) {
  const down = event => {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        state.input.left = true;
        event.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        state.input.right = true;
        event.preventDefault();
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        state.input.jump = true;
        event.preventDefault();
        break;
      default:
        break;
    }
  };

  const up = event => {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        state.input.left = false;
        break;
      case "ArrowRight":
      case "KeyD":
        state.input.right = false;
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        state.input.jump = false;
        break;
      default:
        break;
    }
  };

  state.keyDownHandler = down;
  state.keyUpHandler = up;
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
}

function addSkyDome(state) {
  const geometry = new THREE.SphereGeometry(110, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0x040d21,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.92,
  });
  const dome = new THREE.Mesh(geometry, material);
  dome.position.set(25, 18, -20);
  state.scene.add(dome);
}

function addStarField(state) {
  const starGeometry = new THREE.BufferGeometry();
  const starCount = 420;
  const positions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i += 1) {
    positions[i * 3] = Math.random() * 80 - 10;
    positions[i * 3 + 1] = Math.random() * 10 + 3;
    positions[i * 3 + 2] = -15 - Math.random() * 20;
  }
  starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const starMaterial = new THREE.PointsMaterial({
    size: 0.12,
    color: 0xffffff,
    transparent: true,
    opacity: 0.75,
  });
  const stars = new THREE.Points(starGeometry, starMaterial);
  state.scene.add(stars);
  state.parallaxStars.push(stars);
}

function addFloor(scene) {
  const geometry = new THREE.PlaneGeometry(220, 220);
  const material = new THREE.MeshStandardMaterial({
    color: 0x040510,
    roughness: 0.8,
    metalness: 0.1,
  });
  const floor = new THREE.Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -4.5;
  floor.receiveShadow = true;
  scene.add(floor);
}

function addPlatforms(scene, state) {
  platformLayout.forEach(layout => {
    const mesh = cloneModel(layout.model);
    if (!mesh) return;
    mesh.position.set(...layout.position);
    const scale = layout.scale ?? 1;
    mesh.scale.setScalar(scale);
    mesh.traverse(child => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
    scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    state.platformBoxes.push({ box, mesh });
  });
}

function addPlayer(scene, state, hpByDiff, speedByDiff, difficulty) {
  const template = cloneModel("player");
  if (!template) return null;
  template.scale.setScalar(0.12);
  template.position.set(-1.5, -2, 0);
  template.rotation.y = Math.PI;
  template.traverse(child => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(template);
  return {
    mesh: template,
    velocity: new THREE.Vector3(),
    onGround: false,
    height: 1.6,
    moveSpeed: speedByDiff[difficulty] || 10,
    jumpForce: 12,
    hp: hpByDiff[difficulty] || 3,
    maxHp: hpByDiff[difficulty] || 3,
  };
}

function addDecorations(scene, state) {
  const grass = cloneModel("grass");
  if (grass) {
    grass.scale.setScalar(0.6);
    grass.position.set(-3.5, -3.6, 1);
    scene.add(grass);
  }
  const dust = cloneModel("dust");
  if (dust) {
    dust.scale.setScalar(0.4);
    dust.position.set(18, -3.4, -0.5);
    scene.add(dust);
  }
  const brickCluster = cloneModel("brick");
  if (brickCluster) {
    brickCluster.scale.setScalar(0.4);
    brickCluster.position.set(8, -2.1, -2);
    scene.add(brickCluster);
  }
  const brickParticle = cloneModel("brickParticle");
  if (brickParticle) {
    brickParticle.scale.setScalar(0.35);
    brickParticle.position.set(26, -1.7, -1);
    brickParticle.rotation.y = Math.PI / 2;
    scene.add(brickParticle);
  }
}

function addClouds(scene, state) {
  cloudPositions.forEach(([x, y, z]) => {
    const cloud = cloneModel("cloud");
    if (!cloud) return;
    cloud.scale.setScalar(0.6 + Math.random() * 0.4);
    cloud.position.set(x, y, z);
    cloud.traverse(child => {
      if (child.isMesh) {
        child.material.transparent = true;
      }
    });
    scene.add(cloud);
  });
}

function addCoins(scene, state) {
  coinPositions.forEach(([x, y]) => {
    const coin = cloneModel("coin");
    if (!coin) return;
    coin.scale.setScalar(0.35);
    coin.position.set(x, y, 0);
    scene.add(coin);
    state.coins.push({
      mesh: coin,
      box: new THREE.Box3().setFromObject(coin),
    });
  });
}

function addEnemies(scene, state) {
  enemyLayout.forEach(layout => {
    const enemy = cloneModel(layout.model);
    if (!enemy) return;
    enemy.scale.setScalar(0.4);
    enemy.position.set(layout.center, -2.1, 0);
    enemy.userData = { direction: 1, baseY: enemy.position.y };
    enemy.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(enemy);
    state.enemies.push({
      mesh: enemy,
      box: new THREE.Box3().setFromObject(enemy),
      config: layout,
      cooldown: 0,
    });
  });
}

function placeFlag(scene, state) {
  const flag = cloneModel("flag");
  if (!flag) return;
  flag.scale.setScalar(0.4);
  flag.position.set(56, -1.8, 0);
  scene.add(flag);
  state.goalBox = new THREE.Box3().setFromObject(flag);
}

function handleMovement(state, delta) {
  const player = state.playerState;
  if (!player) return;
  const moveInput = (state.input.right ? 1 : 0) - (state.input.left ? 1 : 0);
  player.mesh.position.x += moveInput * player.moveSpeed * delta;
  player.mesh.position.x = THREE.MathUtils.clamp(player.mesh.position.x, worldLimits.minX, worldLimits.maxX);
  if (state.input.jump && player.onGround) {
    player.velocity.y = player.jumpForce;
    player.onGround = false;
  }
  player.velocity.y += -28 * delta;
  player.mesh.position.y += player.velocity.y * delta;
  if (player.mesh.position.y < -10) {
    player.mesh.position.set(-1.5, -2, 0);
    player.velocity.set(0, 0, 0);
  }
}

function detectPlatformCollisions(state) {
  if (!state.playerState) return;
  state.playerState.onGround = false;
  state.playerBounds.setFromCenterAndSize(
    state.playerState.mesh.position,
    new THREE.Vector3(0.75, state.playerState.height, 0.8)
  );

  for (const platform of state.platformBoxes) {
    if (state.playerBounds.intersectsBox(platform.box)) {
      const playerBottom = state.playerState.mesh.position.y - state.playerState.height / 2;
      const platformTop = platform.box.max.y;
      if (playerBottom <= platformTop + 0.1 && state.playerState.velocity.y <= 0) {
        state.playerState.mesh.position.y = platformTop + state.playerState.height / 2;
        state.playerState.velocity.y = 0;
        state.playerState.onGround = true;
        break;
      }
    }
  }
}

function checkCoins(state, playSfx) {
  if (!state.playerState) return;
  for (let i = state.coins.length - 1; i >= 0; i -= 1) {
    const coin = state.coins[i];
    coin.box.setFromObject(coin.mesh);
    if (state.playerBounds.intersectsBox(coin.box)) {
      state.score += 100;
      if (playSfx) playSfx("powerup");
      state.scene.remove(coin.mesh);
      state.coins.splice(i, 1);
    }
  }
}

function updateEnemies(state, delta) {
  state.enemies.forEach((enemy, index) => {
    const cfg = enemy.config;
    const moveDelta = cfg.speed * delta * enemy.mesh.userData.direction;
    enemy.mesh.position.x += moveDelta;
    if (enemy.mesh.position.x > cfg.center + cfg.range) {
      enemy.mesh.userData.direction = -1;
    } else if (enemy.mesh.position.x < cfg.center - cfg.range) {
      enemy.mesh.userData.direction = 1;
    }
    enemy.mesh.position.y =
      enemy.mesh.userData.baseY + Math.sin(state.time * 2 + index) * 0.13;
    enemy.box.setFromObject(enemy.mesh);
    enemy.cooldown = Math.max(0, enemy.cooldown - delta);
  });
}

function checkEnemyCollisions(state, playSfx) {
  if (!state.playerState) return;
  state.enemies.forEach(enemy => {
    if (enemy.cooldown > 0) return;
    if (state.playerBounds.intersectsBox(enemy.box)) {
      enemy.cooldown = 0.7;
      state.playerState.velocity.y = 8;
      state.playerState.onGround = false;
      state.playerState.hp = Math.max(0, state.playerState.hp - 1);
      state.enemyHits += 1;
      state.score = Math.max(0, state.score - 120);
      if (playSfx) playSfx("damage");
      state.statusMessage = "Ouch! Bounce off the threat!";
    }
  });
}

function checkGoal(state) {
  if (!state.goalBox || state.goalReached || !state.playerState) return;
  if (state.playerBounds.intersectsBox(state.goalBox)) {
    state.goalReached = true;
    state.statusMessage = "Checkpoint reached! Nice job!";
  }
}

function updateCamera(state) {
  if (!state.camera || !state.playerState) return;
  const targetX = THREE.MathUtils.clamp(
    state.playerState.mesh.position.x + cameraConfig.offsetX,
    cameraConfig.minX,
    cameraConfig.maxX
  );
  const targetY = state.playerState.mesh.position.y + cameraConfig.offsetY;
  state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.1);
  state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.08);
  state.camera.position.z = THREE.MathUtils.lerp(
    state.camera.position.z,
    cameraConfig.offsetZ,
    0.05
  );
  state.camera.lookAt(state.playerState.mesh.position.x, state.playerState.mesh.position.y + 1, 0);
}

function updateStarField(state, delta) {
  state.parallaxStars.forEach(points => {
    points.position.x -= delta * 1.5;
    if (points.position.x < -34) points.position.x = 60;
  });
}

export async function initGame(container, difficulty, hpByDiff, speedByDiff) {
  await ensureModels();
  container.innerHTML = "";
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030411);
  scene.fog = new THREE.Fog(0x030411, 25, 110);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  const directionalLight = new THREE.DirectionalLight(0xfff0d2, 0.9);
  directionalLight.position.set(4, 12, 6);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 60;
  scene.add(ambientLight, directionalLight);

  const rimLight = new THREE.PointLight(0x88ccff, 0.5, 40);
  rimLight.position.set(-6, 6, 7);
  const fillLight = new THREE.PointLight(0xff7ccf, 0.45, 40);
  fillLight.position.set(22, 4, 10);
  scene.add(rimLight, fillLight);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    200
  );
  camera.position.set(-4, 3, 15);

  const state = {
    scene,
    camera,
    renderer,
    playerState: null,
    platformBoxes: [],
    coins: [],
    enemies: [],
    parallaxStars: [],
    goalBox: null,
    goalReached: false,
    statusMessage: "Loading assets...",
    score: 0,
    time: 0,
    input: { left: false, right: false, jump: false },
    playerBounds: new THREE.Box3(),
    enemyHits: 0,
  };

  addSkyDome(state);
  addStarField(state);
  addFloor(scene);
  addPlatforms(scene, state);
  state.playerState = addPlayer(scene, state, hpByDiff, speedByDiff, difficulty);
  addDecorations(scene, state);
  addClouds(scene, state);
  addCoins(scene, state);
  addEnemies(scene, state);
  placeFlag(scene, state);
  registerControls(state);
  state.statusMessage = "Ready";

  state.resizeHandler = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  window.addEventListener("resize", state.resizeHandler);
  state.destroy = () => {
    window.removeEventListener("resize", state.resizeHandler);
    window.removeEventListener("keydown", state.keyDownHandler);
    window.removeEventListener("keyup", state.keyUpHandler);
  };

  return {
    scene,
    camera,
    renderer,
    player: state.playerState,
    playerMesh: state.playerState?.mesh ?? null,
    platforms: state.platformBoxes,
    platformerState: state,
  };
}

export function updateGame(gameState, dt, playSfx) {
  const state = gameState.platformerState;
  if (!state) return;
  state.time += dt;
  updateStarField(state, dt);
  handleMovement(state, dt);
  detectPlatformCollisions(state);
  checkCoins(state, playSfx);
  updateEnemies(state, dt);
  checkEnemyCollisions(state, playSfx);
  checkGoal(state);
  updateCamera(state);

  if (!state.goalReached) {
    state.statusMessage = state.playerState?.onGround
      ? "Grounded · Keep pacing"
      : "Airborne · Find the next landing";
  }

  gameState.score = Math.round(state.score);
  gameState.player = state.playerState;
  gameState.player.hp = state.playerState?.hp ?? 0;
  gameState.kills = state.enemyHits;
  gameState.combo = 0;
  gameState.bestCombo = 0;
  gameState.shots = gameState.shots || 0;
  gameState.hits = gameState.hits || 0;
  gameState.styleTags = gameState.styleTags || new Set();
  gameState.keywords = gameState.keywords || new Set();
  gameState.forbidden = gameState.forbidden || new Set();
  gameState.statusMessage = state.statusMessage;
}

export function renderGame(scene, camera, renderer) {
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}
