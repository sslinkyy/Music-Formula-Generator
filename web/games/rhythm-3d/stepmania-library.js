// StepMania Library Manager - Stores packs in IndexedDB
// Uses IndexedDB to persistently store StepMania ZIP files locally

const DB_NAME = 'StepManiaLibrary';
const DB_VERSION = 1;
const STORE_NAME = 'packs';

let dbInstance = null;

/**
 * Initialize IndexedDB for StepMania library
 */
async function initDB() {
  if (dbInstance) return dbInstance;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('StepMania library database opened successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object store for packs if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });

        // Create indexes for searching
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('artist', 'artist', { unique: false });
        objectStore.createIndex('dateAdded', 'dateAdded', { unique: false });

        console.log('Created StepMania packs object store');
      }
    };
  });
}

/**
 * Save a StepMania pack to the library
 * @param {Object} packData - Parsed StepMania data
 * @param {Blob} zipBlob - Original ZIP file as blob
 * @param {string} fileName - Original file name
 * @returns {Promise<number>} ID of saved pack
 */
export async function savePackToLibrary(packData, zipBlob, fileName) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const pack = {
      title: packData.metadata.title || fileName,
      artist: packData.metadata.artist || 'Unknown',
      fileName: fileName,
      dateAdded: new Date().toISOString(),
      charts: packData.charts.map(c => ({
        displayName: c.displayName,
        difficulty: c.difficulty,
        meter: c.meter
      })),
      bpm: packData.timing.bpms[0]?.bpm || null,
      hasAudio: !!packData.audioUrl,
      // Store the ZIP file as ArrayBuffer
      zipData: null // Will be set below
    };

    // Convert blob to ArrayBuffer for storage
    zipBlob.arrayBuffer().then(arrayBuffer => {
      pack.zipData = arrayBuffer;

      const request = store.add(pack);

      request.onsuccess = () => {
        const id = request.result;
        console.log('Saved pack to library:', pack.title, 'ID:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to save pack:', request.error);
        reject(request.error);
      };
    });
  });
}

/**
 * Get all packs from library
 * @returns {Promise<Array>} List of packs (without ZIP data)
 */
export async function listPacks() {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Return packs without the heavy zipData field for listing
      const packs = request.result.map(pack => ({
        id: pack.id,
        title: pack.title,
        artist: pack.artist,
        fileName: pack.fileName,
        dateAdded: pack.dateAdded,
        charts: pack.charts,
        bpm: pack.bpm,
        hasAudio: pack.hasAudio
      }));
      resolve(packs);
    };

    request.onerror = () => {
      console.error('Failed to list packs:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Load a pack from library by ID
 * @param {number} id - Pack ID
 * @returns {Promise<Blob>} ZIP file as Blob
 */
export async function loadPackFromLibrary(id) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      const pack = request.result;
      if (!pack) {
        reject(new Error('Pack not found'));
        return;
      }

      // Convert ArrayBuffer back to Blob
      const blob = new Blob([pack.zipData], { type: 'application/zip' });

      // Attach metadata to the blob for easy access
      blob.packMetadata = {
        id: pack.id,
        title: pack.title,
        artist: pack.artist,
        fileName: pack.fileName,
        charts: pack.charts,
        bpm: pack.bpm,
        hasAudio: pack.hasAudio
      };

      resolve(blob);
    };

    request.onerror = () => {
      console.error('Failed to load pack:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Delete a pack from library
 * @param {number} id - Pack ID
 * @returns {Promise<void>}
 */
export async function deletePackFromLibrary(id) {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      console.log('Deleted pack from library, ID:', id);
      resolve();
    };

    request.onerror = () => {
      console.error('Failed to delete pack:', request.error);
      reject(request.error);
    };
  });
}

/**
 * Get storage usage statistics
 * @returns {Promise<Object>} Usage info
 */
export async function getStorageInfo() {
  if (!navigator.storage || !navigator.storage.estimate) {
    return { supported: false };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const packs = await listPacks();

    return {
      supported: true,
      usage: estimate.usage,
      quota: estimate.quota,
      usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(1),
      packCount: packs.length
    };
  } catch (err) {
    console.error('Failed to get storage info:', err);
    return { supported: false, error: err.message };
  }
}
