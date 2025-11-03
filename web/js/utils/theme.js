/**
 * Theme Management Utilities
 * Handles dark/light theme switching
 */

import { getTheme as getStoredTheme, setTheme as setStoredTheme, getPreferences, setPreferences } from '../state/persistence.js';

/**
 * Gets the current theme
 * @returns {string} 'light' or 'dark'
 */
export function getTheme() {
  return getStoredTheme();
}

/**
 * Applies the specified theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  setStoredTheme(theme);
}

/**
 * Toggles between light and dark theme
 * @returns {string} New theme
 */
export function toggleTheme() {
  const current = getTheme();
  const newTheme = current === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
  return newTheme;
}

/**
 * Applies motion preference
 */
export function applyMotionPref() {
  try {
    const prefs = getPreferences();
    const val = prefs.reduceMotion ? 'true' : 'false';
    document.documentElement.setAttribute('data-reduce-motion', val);

    const motionBtn = document.getElementById('motion-toggle');
    if (motionBtn) {
      motionBtn.textContent = prefs.reduceMotion ? 'Motion: Off' : 'Motion';
    }
  } catch (err) {
    console.error('Failed to apply motion preference:', err);
  }
}

/**
 * Toggles motion preference
 * @returns {boolean} New motion preference
 */
export function toggleMotionPref() {
  const prefs = getPreferences();
  prefs.reduceMotion = !prefs.reduceMotion;
  setPreferences(prefs);
  applyMotionPref();
  return prefs.reduceMotion;
}

/**
 * Applies emoji preference
 */
export function applyEmojiPref() {
  try {
    const prefs = getPreferences();
    const use = !!prefs.useEmojis;

    // Expose to games
    window.__rgfUseEmojis = use;

    const btn = document.getElementById('emoji-toggle');
    if (btn) {
      btn.textContent = use ? 'Emoji: On' : 'Emoji';
    }
  } catch (err) {
    console.error('Failed to apply emoji preference:', err);
  }
}

/**
 * Toggles emoji preference
 * @returns {boolean} New emoji preference
 */
export function toggleEmojiPref() {
  const prefs = getPreferences();
  prefs.useEmojis = !prefs.useEmojis;
  setPreferences(prefs);
  applyEmojiPref();
  return prefs.useEmojis;
}

/**
 * Initializes theme on page load
 */
export function initTheme() {
  const theme = getTheme();
  applyTheme(theme);
  applyMotionPref();
  applyEmojiPref();
}
