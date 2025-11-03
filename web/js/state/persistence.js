/**
 * State Persistence Module
 * Handles saving, loading, and managing application state
 */

// LocalStorage keys
export const STORAGE_KEYS = {
  STATE: 'rgf_state_v1',
  THEME: 'rgf_theme_v1',
  PROMPT_HISTORY: 'rgf_prompt_history_v1',
  ONBOARDING: 'rgf_onboarding_seen_v1',
  PREFERENCES: 'rgf_prefs_v1',
  COLLAPSED_SECTIONS: 'rgf_collapsed_sections_v1',
  GAMIFICATION: 'rgf_gamify_v1',
};

/**
 * Gets user preferences from localStorage
 * @returns {Object} Preferences object
 */
export function getPreferences() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFERENCES) || '{}');
  } catch (err) {
    console.error('Failed to parse preferences:', err);
    return {};
  }
}

/**
 * Sets user preferences in localStorage
 * @param {Object} prefs - Preferences object
 */
export function setPreferences(prefs) {
  try {
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save preferences:', err);
  }
}

/**
 * Gets the current mode (basic or advanced)
 * @returns {string} Mode ('basic' or 'advanced')
 */
export function getMode() {
  const prefs = getPreferences();
  return prefs.mode || 'basic'; // Default to basic for new users
}

/**
 * Sets the current mode
 * @param {string} mode - 'basic' or 'advanced'
 */
export function setMode(mode) {
  const prefs = getPreferences();
  prefs.mode = mode;
  setPreferences(prefs);
}

/**
 * Gets the current theme
 * @returns {string} Theme name ('light' or 'dark')
 */
export function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

/**
 * Sets the theme
 * @param {string} theme - Theme name ('light' or 'dark')
 */
export function setTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (err) {
    console.error('Failed to save theme:', err);
  }
}

/**
 * Checks if onboarding has been seen
 * @returns {boolean} True if seen
 */
export function hasSeenOnboarding() {
  return !!localStorage.getItem(STORAGE_KEYS.ONBOARDING);
}

/**
 * Marks onboarding as seen
 */
export function markOnboardingSeen() {
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
  } catch (err) {
    console.error('Failed to mark onboarding seen:', err);
  }
}

/**
 * Gets prompt history
 * @returns {Array<Object>} Prompt history array
 */
export function getPromptHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROMPT_HISTORY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Failed to load prompt history:', err);
    return [];
  }
}

/**
 * Sets prompt history
 * @param {Array<Object>} list - Prompt history array
 */
export function setPromptHistory(list) {
  try {
    localStorage.setItem(STORAGE_KEYS.PROMPT_HISTORY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save prompt history:', err);
  }
}

/**
 * Adds a prompt to history
 * @param {string} text - Prompt text
 */
export function addPromptHistory(text) {
  const list = getPromptHistory();
  const entry = {
    timestamp: Date.now(),
    text: String(text || '').substring(0, 5000), // Limit size
  };
  list.unshift(entry);
  // Keep only last 20 prompts
  const trimmed = list.slice(0, 20);
  setPromptHistory(trimmed);
}

/**
 * Clears prompt history
 */
export function clearPromptHistory() {
  setPromptHistory([]);
}

/**
 * Gets gamification data
 * @returns {Object} Gamification data
 */
export function getGamificationData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAMIFICATION);
    if (!raw) return { unlocked: {} };
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load gamification data:', err);
    return { unlocked: {} };
  }
}

/**
 * Sets gamification data
 * @param {Object} data - Gamification data
 */
export function setGamificationData(data) {
  try {
    localStorage.setItem(STORAGE_KEYS.GAMIFICATION, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save gamification data:', err);
  }
}

/**
 * Gets collapsed sections state
 * @returns {Array<string>} Array of collapsed section IDs
 */
export function getCollapsedSections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COLLAPSED_SECTIONS);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.error('Failed to load collapsed sections:', err);
    return [];
  }
}

/**
 * Sets collapsed sections state
 * @param {Array<string>} sections - Array of section IDs
 */
export function setCollapsedSections(sections) {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLAPSED_SECTIONS, JSON.stringify(sections));
  } catch (err) {
    console.error('Failed to save collapsed sections:', err);
  }
}

/**
 * Saves application state to localStorage
 * @param {Object} state - State object to save
 * @returns {boolean} True if successful
 */
export function saveState(state) {
  try {
    const serialized = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEYS.STATE, serialized);
    return true;
  } catch (err) {
    console.error('Failed to save state:', err);
    return false;
  }
}

/**
 * Loads application state from localStorage
 * @param {Object} defaultState - Default state to use if none exists
 * @returns {Object|null} Loaded state or null if failed
 */
export function loadState(defaultState = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STATE);
    if (!raw) return defaultState;

    const loaded = JSON.parse(raw);

    // Merge with default state to ensure all keys exist
    if (defaultState) {
      return deepMerge(defaultState, loaded);
    }

    return loaded;
  } catch (err) {
    console.error('Failed to load state:', err);
    return defaultState;
  }
}

/**
 * Clears all application state
 */
export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEYS.STATE);
  } catch (err) {
    console.error('Failed to clear state:', err);
  }
}

/**
 * Deep merges two objects, preferring values from source
 * @param {Object} target - Target object (provides defaults)
 * @param {Object} source - Source object (overrides)
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }

  return output;
}

/**
 * Checks if value is a plain object
 * @param {any} item - Value to check
 * @returns {boolean} True if plain object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Estimates localStorage usage
 * @returns {Object} Usage statistics
 */
export function getStorageStats() {
  try {
    let totalSize = 0;
    const sizes = {};

    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const item = localStorage.getItem(key);
      const size = item ? new Blob([item]).size : 0;
      sizes[name] = size;
      totalSize += size;
    });

    return {
      totalBytes: totalSize,
      totalKB: (totalSize / 1024).toFixed(2),
      byKey: sizes,
    };
  } catch (err) {
    console.error('Failed to get storage stats:', err);
    return {
      totalBytes: 0,
      totalKB: '0.00',
      byKey: {},
    };
  }
}

/**
 * Tests if localStorage is available
 * @returns {boolean} True if available
 */
export function isLocalStorageAvailable() {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (err) {
    return false;
  }
}
