/**
 * State Manager Module
 * Centralized state management with validation
 */

import { CONSTANTS, CONTROLS, DEFAULT_WEIGHTS, BASE_INPUTS, DERIVED_INPUTS, USER_SECTION_DEFS, GENRE_SLOTS, ACCENT_DEFAULT, DEFAULT_AI_SETTINGS, CREATIVE_FIELDS } from '../config.js?v=1';
import { saveState, loadState as loadPersistedState } from './persistence.js';
import { validateBaseInput, validateDerivedInput, validateGenreWeight } from '../utils/validation.js';

/**
 * Builds the default state object
 * @returns {Object} Default state
 */
export function buildDefaultState() {
  return {
    controls: Object.fromEntries(CONTROLS.map(c => [c.id, c.value])),
    weights: { ...DEFAULT_WEIGHTS },
    baseInputs: Object.fromEntries(BASE_INPUTS.map(item => [item.id, item.value])),
    derivedInputs: Object.fromEntries(DERIVED_INPUTS.map(item => [item.id, item.value])),
    creativeInputs: Object.fromEntries(CREATIVE_FIELDS.map(field => [field.id, field.defaultValue])),
    genreMix: Array.from({ length: GENRE_SLOTS }, () => ({ genre: '', weight: 0 })),
    premise: '(auto)',
    customPremise: '',
    accent: ACCENT_DEFAULT,
    language: 'English',
    customLanguage: '',
    userSections: Object.fromEntries(USER_SECTION_DEFS.map(item => [item.id, ''])),
    userSectionExtras: [],
    aiSettings: { ...DEFAULT_AI_SETTINGS },
    computed: null,
    genreAnalysis: null,
    outputs: {
      brief: '',
      suno: '',
      prompt: '',
      aiResponse: ''
    }
  };
}

// Global state object
export const state = buildDefaultState();

/**
 * Resets state to defaults
 */
export function resetState() {
  const defaults = buildDefaultState();
  Object.keys(defaults).forEach(key => {
    state[key] = defaults[key];
  });
}

/**
 * Loads state from localStorage
 * @returns {boolean} True if successful
 */
export function loadState() {
  try {
    const defaultState = buildDefaultState();
    const loaded = loadPersistedState(defaultState);

    if (loaded) {
      // Validate and merge loaded state
      Object.keys(loaded).forEach(key => {
        if (key in state) {
          state[key] = loaded[key];
        }
      });

      // Validate critical values
      validateStateValues();
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to load state:', err);
    return false;
  }
}

/**
 * Saves current state to localStorage
 * @returns {boolean} True if successful
 */
export function persistState() {
  return saveState(state);
}

/**
 * Validates state values and fixes invalid ones
 */
function validateStateValues() {
  // Validate base inputs
  if (state.baseInputs) {
    Object.keys(state.baseInputs).forEach(key => {
      state.baseInputs[key] = validateBaseInput(state.baseInputs[key]);
    });
  }

  // Validate derived inputs
  if (state.derivedInputs) {
    Object.keys(state.derivedInputs).forEach(key => {
      state.derivedInputs[key] = validateDerivedInput(state.derivedInputs[key]);
    });
  }

  // Validate genre weights
  if (state.genreMix && Array.isArray(state.genreMix)) {
    state.genreMix.forEach(mix => {
      if (mix && typeof mix === 'object') {
        mix.weight = validateGenreWeight(mix.weight);
      }
    });
  }

  // Ensure critical objects exist
  if (!state.weights) state.weights = { ...DEFAULT_WEIGHTS };
  if (!state.aiSettings) state.aiSettings = { ...DEFAULT_AI_SETTINGS };
  if (!state.outputs) state.outputs = { brief: '', suno: '', prompt: '', aiResponse: '' };
  if (!Array.isArray(state.userSectionExtras)) {
    state.userSectionExtras = [];
  } else {
    state.userSectionExtras = state.userSectionExtras.map((item, index) => ({
      id: item?.id || `extra-${index}`,
      label: (typeof item?.label === 'string' && item.label.trim()) ? item.label : `Context ${index + 1}`,
      value: typeof item?.value === 'string' ? item.value : ''
    }));
  }
}

/**
 * Updates a base input value with validation
 * @param {string} key - Input key
 * @param {number} value - New value
 */
export function updateBaseInput(key, value) {
  if (!state.baseInputs) state.baseInputs = {};
  state.baseInputs[key] = validateBaseInput(value);
}

/**
 * Updates a derived input value with validation
 * @param {string} key - Input key
 * @param {number} value - New value
 */
export function updateDerivedInput(key, value) {
  if (!state.derivedInputs) state.derivedInputs = {};
  state.derivedInputs[key] = validateDerivedInput(value);
}

/**
 * Updates a weight value
 * @param {string} key - Weight key
 * @param {number} value - New value
 */
export function updateWeight(key, value) {
  if (!state.weights) state.weights = {};
  state.weights[key] = Math.max(0, Number(value) || 0);
}

/**
 * Updates a genre mix entry with validation
 * @param {number} index - Genre slot index
 * @param {string} genre - Genre name
 * @param {number} weight - Genre weight
 */
export function updateGenreMix(index, genre, weight) {
  if (!state.genreMix) {
    state.genreMix = Array.from({ length: GENRE_SLOTS }, () => ({ genre: '', weight: 0 }));
  }

  if (index >= 0 && index < state.genreMix.length) {
    state.genreMix[index] = {
      genre: String(genre || ''),
      weight: validateGenreWeight(weight)
    };
  }
}

/**
 * Updates a creative input
 * @param {string} key - Input key
 * @param {any} value - New value
 */
export function updateCreativeInput(key, value) {
  if (!state.creativeInputs) state.creativeInputs = {};
  state.creativeInputs[key] = value;
}

/**
 * Updates a user section
 * @param {string} key - Section key
 * @param {string} value - Section content
 */
export function updateUserSection(key, value) {
  if (!state.userSections) {
    state.userSections = Object.fromEntries(USER_SECTION_DEFS.map(item => [item.id, '']));
  }
  state.userSections[key] = String(value || '');
}

/**
 * Updates an AI setting
 * @param {string} key - Setting key
 * @param {any} value - New value
 */
export function updateAISetting(key, value) {
  if (!state.aiSettings) state.aiSettings = { ...DEFAULT_AI_SETTINGS };
  state.aiSettings[key] = value;
}

/**
 * Gets a computed value
 * @returns {Object|null} Computed values
 */
export function getComputed() {
  return state.computed;
}

/**
 * Sets computed values
 * @param {Object} computed - Computed values
 */
export function setComputed(computed) {
  state.computed = computed;
}

/**
 * Gets genre analysis
 * @returns {Object|null} Genre analysis
 */
export function getGenreAnalysis() {
  return state.genreAnalysis;
}

/**
 * Sets genre analysis
 * @param {Object} analysis - Genre analysis
 */
export function setGenreAnalysis(analysis) {
  state.genreAnalysis = analysis;
}

/**
 * Updates an output
 * @param {string} key - Output key (brief, suno, prompt, aiResponse)
 * @param {string} value - Output content
 */
export function updateOutput(key, value) {
  if (!state.outputs) {
    state.outputs = { brief: '', suno: '', prompt: '', aiResponse: '' };
  }
  state.outputs[key] = String(value || '');
}

/**
 * Gets all outputs
 * @returns {Object} Outputs object
 */
export function getOutputs() {
  return state.outputs || { brief: '', suno: '', prompt: '', aiResponse: '' };
}

// Debounced auto-save
let saveTimer = null;
const AUTOSAVE_DEBOUNCE_MS = 500;

/**
 * Schedules an auto-save
 * @param {number} delay - Delay in milliseconds
 */
export function scheduleAutoSave(delay = AUTOSAVE_DEBOUNCE_MS) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    persistState();
    saveTimer = null;
  }, delay);
}

/**
 * Forces immediate save
 */
export function forceSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  persistState();
}
