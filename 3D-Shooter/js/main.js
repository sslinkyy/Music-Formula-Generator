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

const loader = new GLTFLoader();

const assetMap = {
  player: "assets/models/characters/character.glb",
  platform: "assets/models/environment/platform.glb",
  platformMedium: "assets/models/environment/platform-medium.glb",
  platformLarge: "assets/models/environment/platform-large.glb",
  platformGrass: "assets/models/environment/platform-grass-large-round.glb",
  platformFalling: "assets/models/environment/platform-falling.glb",
  coin: "assets/models/environment/coin.glb",
  flag: "assets/models/environment/flag.glb",
  cloud: "assets/models/environment/cloud.glb",
  grass: "assets/models/environment/grass.glb",
  dust: "assets/models/environment/dust.glb",
  brick: "assets/models/environment/brick.glb",
  brickParticle: "assets/models/environment/brick-particle.glb",
  blockCoin: "assets/models/environment/block-coin.glb",
};

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
    -8,
    62
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
  const targetX = playerState.mesh.position.x + 6;
  const targetY = playerState.mesh.position.y + 4;

  camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, 0.06);
  camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.04);
  camera.position.z = THREE.MathUtils.lerp(camera.position.z, 17, 0.02);
  camera.lookAt(playerState.mesh.position.x, playerState.mesh.position.y + 0.8, 0);
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.05);

  handleMovement(delta);
  detectPlatformCollisions();
  checkCoins();
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

  addFloor();
  addPlatforms();
  addPlayer();
  addDecorations();
  addClouds();
  addCoins();
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
