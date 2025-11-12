import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/loaders/GLTFLoader.js";
import { SkeletonUtils } from "https://cdn.jsdelivr.net/npm/three@0.154.0/examples/jsm/utils/SkeletonUtils.js";

const canvas = document.getElementById("game-canvas");
const statusText = document.getElementById("status-text");
const scoreValue = document.getElementById("score-value");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030411);
scene.fog = new THREE.Fog(0x030411, 25, 110);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);
camera.position.set(-4, 3, 15);

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

const loader = new GLTFLoader();

const assetBase = "../web/games/platformer-shooter/assets/models";
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

const cameraConfig = {
  offsetX: 6,
  offsetY: 4.3,
  offsetZ: 17,
  minX: 5,
  maxX: 58,
};
const worldLimits = { minX: -6.5, maxX: 58 };
const enemies = [];
const enemyLayout = [
  { model: "brick", center: 18, range: 3.2, speed: 1.1 },
  { model: "blockCoin", center: 32, range: 2.5, speed: 1.6 },
  { model: "brick", center: 44, range: 4, speed: 1.2 },
];
const parallaxStars = [];

const loadedModels = {};
const platformBoxes = [];
const coins = [];

const playerState = {
  mesh: null,
  velocity: new THREE.Vector3(),
  onGround: false,
  height: 1.6,
  moveSpeed: 6,
};

const input = {
  left: false,
  right: false,
  jump: false,
};

let goalBox = null;
let goalReached = false;
let score = 0;
const playerBounds = new THREE.Box3();
const clock = new THREE.Clock();

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

function cloneModel(key) {
  const source = loadedModels[key];
  if (!source) return null;
  return SkeletonUtils.clone(source);
}

function addFloor() {
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

function addSkyDome() {
  const geometry = new THREE.SphereGeometry(110, 32, 16);
  const material = new THREE.MeshBasicMaterial({
    color: 0x040d21,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0.92,
  });
  const dome = new THREE.Mesh(geometry, material);
  dome.position.set(25, 18, -20);
  scene.add(dome);
}

function addStarField() {
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
  scene.add(stars);
  parallaxStars.push(stars);
}

function updateStarField(delta) {
  parallaxStars.forEach((points) => {
    points.position.x -= delta * 1.5;
    if (points.position.x < -34) {
      points.position.x = 60;
    }
  });
}

function addPlatforms() {
  platformLayout.forEach((layout) => {
    const mesh = cloneModel(layout.model);
    if (!mesh) return;
    mesh.position.set(...layout.position);
    const scale = layout.scale ?? 1;
    mesh.scale.setScalar(scale);
    mesh.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = true;
      }
    });
    scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh);
    platformBoxes.push({ box, mesh });
  });
}

function addPlayer() {
  const template = cloneModel("player");
  if (!template) return;
  template.scale.setScalar(0.12);
  template.position.set(-1.5, -2, 0);
  template.rotation.y = Math.PI;
  template.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  scene.add(template);
  playerState.mesh = template;
  playerState.velocity.set(0, 0, 0);
  playerState.onGround = false;
}

function addCoins() {
  coinPositions.forEach(([x, y]) => {
    const coin = cloneModel("coin");
    if (!coin) return;
    coin.scale.setScalar(0.35);
    coin.position.set(x, y, 0);
    scene.add(coin);
    coins.push({
      mesh: coin,
      box: new THREE.Box3().setFromObject(coin),
    });
  });
}

function addEnemies() {
  enemyLayout.forEach((layout) => {
    const enemy = cloneModel(layout.model);
    if (!enemy) return;
    enemy.scale.setScalar(0.4);
    enemy.position.set(layout.center, -2.1, 0);
    enemy.userData = { direction: 1, baseY: enemy.position.y };
    enemy.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(enemy);
    enemies.push({
      mesh: enemy,
      box: new THREE.Box3().setFromObject(enemy),
      config: layout,
      cooldown: 0,
    });
  });
}

function updateEnemies(delta) {
  enemies.forEach((enemy, index) => {
    const cfg = enemy.config;
    const moveDelta = cfg.speed * delta * enemy.mesh.userData.direction;
    enemy.mesh.position.x += moveDelta;
    if (enemy.mesh.position.x > cfg.center + cfg.range) {
      enemy.mesh.userData.direction = -1;
    } else if (enemy.mesh.position.x < cfg.center - cfg.range) {
      enemy.mesh.userData.direction = 1;
    }
    enemy.mesh.position.y =
      enemy.mesh.userData.baseY + Math.sin(clock.getElapsedTime() * 2 + index) * 0.13;
    enemy.box.setFromObject(enemy.mesh);
    enemy.cooldown = Math.max(0, enemy.cooldown - delta);
  });
}

function checkEnemyCollisions() {
  if (!playerState.mesh) return;
  enemies.forEach((enemy) => {
    if (enemy.cooldown > 0) return;
    if (playerBounds.intersectsBox(enemy.box)) {
      enemy.cooldown = 0.7;
      playerState.velocity.y = 8;
      playerState.onGround = false;
      score = Math.max(0, score - 120);
      scoreValue.textContent = score.toString().padStart(3, "0");
      statusText.textContent = "Ouch! Bounce off the threat!";
    }
  });
}

function addClouds() {
  cloudPositions.forEach(([x, y, z]) => {
    const cloud = cloneModel("cloud");
    if (!cloud) return;
    cloud.scale.setScalar(0.6 + Math.random() * 0.4);
    cloud.position.set(x, y, z);
    cloud.traverse((child) => {
      if (child.isMesh) child.material.transparent = true;
    });
    scene.add(cloud);
  });
}

function addDecorations() {
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

function placeFlag() {
  const flag = cloneModel("flag");
  if (!flag) return;
  flag.scale.setScalar(0.4);
  flag.position.set(56, -1.8, 0);
  scene.add(flag);
  goalBox = new THREE.Box3().setFromObject(flag);
}

function registerControls() {
  window.addEventListener("keydown", (event) => {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        input.left = true;
        event.preventDefault();
        break;
      case "ArrowRight":
      case "KeyD":
        input.right = true;
        event.preventDefault();
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        input.jump = true;
        event.preventDefault();
        break;
      default:
        break;
    }
  });

  window.addEventListener("keyup", (event) => {
    switch (event.code) {
      case "ArrowLeft":
      case "KeyA":
        input.left = false;
        break;
      case "ArrowRight":
      case "KeyD":
        input.right = false;
        break;
      case "ArrowUp":
      case "KeyW":
      case "Space":
        input.jump = false;
        break;
      default:
        break;
    }
  });
}

function handleMovement(delta) {
  if (!playerState.mesh) return;

  const moveInput = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  playerState.mesh.position.x += moveInput * playerState.moveSpeed * delta;
  playerState.mesh.position.x = THREE.MathUtils.clamp(
    playerState.mesh.position.x,
    worldLimits.minX,
    worldLimits.maxX
  );

  if (input.jump && playerState.onGround) {
    playerState.velocity.y = 12;
    playerState.onGround = false;
  }

  playerState.velocity.y += -28 * delta;
  playerState.mesh.position.y += playerState.velocity.y * delta;

  if (playerState.mesh.position.y < -10) {
    playerState.mesh.position.set(-1.5, -2, 0);
    playerState.velocity.set(0, 0, 0);
  }
}

function detectPlatformCollisions() {
  if (!playerState.mesh) return;
  playerState.onGround = false;
  playerBounds.setFromCenterAndSize(
    playerState.mesh.position,
    new THREE.Vector3(0.75, playerState.height, 0.8)
  );

  for (const platform of platformBoxes) {
    if (playerBounds.intersectsBox(platform.box)) {
      const playerBottom = playerState.mesh.position.y - playerState.height / 2;
      const platformTop = platform.box.max.y;
      if (playerBottom <= platformTop + 0.1 && playerState.velocity.y <= 0) {
        playerState.mesh.position.y = platformTop + playerState.height / 2;
        playerState.velocity.y = 0;
        playerState.onGround = true;
        break;
      }
    }
  }
}

function checkCoins() {
  if (!playerState.mesh) return;
  for (let i = coins.length - 1; i >= 0; i -= 1) {
    const coin = coins[i];
    coin.box.setFromObject(coin.mesh);
    if (playerBounds.intersectsBox(coin.box)) {
      score += 100;
      scoreValue.textContent = score.toString().padStart(3, "0");
      scene.remove(coin.mesh);
      coins.splice(i, 1);
    }
  }
}

function checkGoal() {
  if (!goalBox || goalReached || !playerState.mesh) return;
  if (playerBounds.intersectsBox(goalBox)) {
    goalReached = true;
    statusText.textContent = "Checkpoint reached! Nice job!";
  }
}

function updateCamera() {
  if (!playerState.mesh) return;
  const targetX = THREE.MathUtils.clamp(
    playerState.mesh.position.x + cameraConfig.offsetX,
    cameraConfig.minX,
    cameraConfig.maxX
  );
  const targetY = playerState.mesh.position.y + cameraConfig.offsetY;

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.1);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.08);
  camera.position.z = THREE.MathUtils.lerp(
    camera.position.z,
    cameraConfig.offsetZ,
    0.05
  );
  camera.lookAt(
    playerState.mesh.position.x,
    playerState.mesh.position.y + 1,
    0
  );
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  updateStarField(delta);
  handleMovement(delta);
  detectPlatformCollisions();
  checkCoins();
  updateEnemies(delta);
  checkEnemyCollisions();
  checkGoal();

  if (!goalReached) {
    if (playerState.onGround) {
      statusText.textContent = "Grounded · Keep pacing";
    } else {
      statusText.textContent = "Airborne · Find the next landing";
    }
  }

  updateCamera();
  renderer.render(scene, camera);
}

async function loadModels() {
  const entries = Object.entries(assetMap);
  for (const [key, path] of entries) {
    statusText.textContent = `Loading ${key}...`;
    const gltf = await loader.loadAsync(path);
    const sceneNode = gltf.scene;
    sceneNode.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    loadedModels[key] = sceneNode;
  }
  statusText.textContent = "Assets ready";
}

async function init() {
  try {
    await loadModels();
  } catch (error) {
    console.error(error);
    statusText.textContent = "Failed to load assets";
    return;
  }

  addSkyDome();
  addStarField();
  addFloor();
  addPlatforms();
  addPlayer();
  addDecorations();
  addClouds();
  addCoins();
  addEnemies();
  placeFlag();
  registerControls();

  statusText.textContent = "Ready";
  scoreValue.textContent = score.toString().padStart(3, "0");
  animate();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener("resize", onWindowResize);
init();
