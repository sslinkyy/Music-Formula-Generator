/**
 * Mode Management Utilities
 * Handles basic/advanced mode switching
 */

import { getMode as getStoredMode, setMode as setStoredMode } from '../state/persistence.js';

/**
 * Gets the current mode
 * @returns {string} 'basic' or 'advanced'
 */
export function getMode() {
  return getStoredMode();
}

/**
 * Applies the specified mode to the document
 * @param {string} mode - 'basic' or 'advanced'
 */
export function applyMode(mode) {
  document.documentElement.setAttribute('data-mode', mode);
  setStoredMode(mode);

  // Update button text
  const modeBtn = document.getElementById('mode-toggle');
  if (modeBtn) {
    modeBtn.textContent = mode === 'basic' ? 'Advanced Mode' : 'Basic Mode';
    modeBtn.title = mode === 'basic' ? 'Switch to advanced mode' : 'Switch to basic mode';
  }
}

/**
 * Toggles between basic and advanced mode
 * @returns {string} New mode
 */
export function toggleMode() {
  const current = getMode();
  const newMode = current === 'basic' ? 'advanced' : 'basic';
  applyMode(newMode);
  return newMode;
}

/**
 * Initializes mode on page load
 */
export function initMode() {
  const mode = getMode();
  applyMode(mode);
}
