// Lightweight asset manager for Three.js assets and credits registry
// Provides: assetManager (GLTF loader, optional DRACO/KTX2), addCredit, getCredits

import * as THREE from 'https://unpkg.com/three@0.150.0/build/three.module.js';

let _GLTFLoaderPromise = null;
let _DRACOLoaderPromise = null;
let _KTX2LoaderPromise = null;

const defaults = {
  // Local decoders (placed under web/libs)
  dracoPath: 'libs/draco/',
  ktx2Path: 'libs/basis/'
};

const _credits = [];
const _creditKey = (c) => `${(c.name||'').toLowerCase()}|${(c.url||'').toLowerCase()}`;
const _creditSet = new Set();

// Seed core credit for Three.js
addCredit({ name: 'Three.js', url: 'https://threejs.org', license: 'MIT' });

export function addCredit(entry) {
  const e = Object.assign({ name: '', url: '', license: '', author: '', notes: '' }, entry || {});
  const key = _creditKey(e);
  if (!_creditSet.has(key)) { _creditSet.add(key); _credits.push(e); }
}

export function getCredits() { return _credits.slice(); }

async function getGLTFLoader() {
  if (!_GLTFLoaderPromise) {
    _GLTFLoaderPromise = import('https://unpkg.com/three@0.150.0/examples/jsm/loaders/GLTFLoader.js').then(m => m.GLTFLoader);
  }
  return _GLTFLoaderPromise;
}
async function getDRACOLoader() {
  if (!_DRACOLoaderPromise) {
    _DRACOLoaderPromise = import('https://unpkg.com/three@0.150.0/examples/jsm/loaders/DRACOLoader.js').then(m => m.DRACOLoader);
  }
  return _DRACOLoaderPromise;
}
async function getKTX2Loader() {
  if (!_KTX2LoaderPromise) {
    _KTX2LoaderPromise = import('https://unpkg.com/three@0.150.0/examples/jsm/loaders/KTX2Loader.js').then(m => m.KTX2Loader);
  }
  return _KTX2LoaderPromise;
}

export const assetManager = {
  _dracoPath: defaults.dracoPath,
  _ktx2Path: defaults.ktx2Path,
  _gltfCache: new Map(),
  setDecoderPaths({ dracoPath, ktx2Path } = {}) {
    if (dracoPath) this._dracoPath = dracoPath;
    if (ktx2Path) this._ktx2Path = ktx2Path;
  },
  async loadGLTF(url, { useDraco = true } = {}) {
    if (this._gltfCache.has(url)) return this._gltfCache.get(url);
    const GLTFLoader = await getGLTFLoader();
    const loader = new GLTFLoader();
    if (useDraco) {
      try {
        const DRACOLoader = await getDRACOLoader();
        const draco = new DRACOLoader();
        draco.setDecoderPath(this._dracoPath);
        loader.setDRACOLoader(draco);
      } catch (_) {}
    }
    const p = new Promise((resolve, reject) => loader.load(url, (gltf) => resolve(gltf), undefined, reject));
    this._gltfCache.set(url, p);
    return p;
  },
  async prepareKTX2(renderer) {
    try {
      const KTX2Loader = await getKTX2Loader();
      const ktx2 = new KTX2Loader();
      ktx2.setTranscoderPath(this._ktx2Path).detectSupport(renderer);
      return ktx2;
    } catch (_) { return null; }
  }
};

export function cloneGLTF(gltf) {
  // Shallow clone of scene graph suitable for many static assets
  const cloned = gltf.scene.clone(true);
  return cloned;
}
