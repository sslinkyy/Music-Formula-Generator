/**
 * Input Validation Utilities
 * Provides sanitization and validation for user inputs
 */

// Validation constants
export const VALIDATION_LIMITS = {
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 100,
  MIN_BASE_INPUT: 0,
  MAX_BASE_INPUT: 10,
  MIN_DERIVED_INPUT: 0,
  MAX_DERIVED_INPUT: 1,
  MIN_API_KEY_LENGTH: 10,
  MAX_TEXT_LENGTH: 10000,
  MAX_TITLE_LENGTH: 200,
  MIN_TEMPO: 40,
  MAX_TEMPO: 300,
  MIN_TEMPERATURE: 0,
  MAX_TEMPERATURE: 2,
  MIN_TOP_P: 0,
  MAX_TOP_P: 1,
  MIN_PENALTY: -2,
  MAX_PENALTY: 2,
  MAX_TOKENS_MIN: 1,
  MAX_TOKENS_MAX: 32000,
  TIMEOUT_MIN_MS: 1000,
  TIMEOUT_MAX_MS: 300000,
};

/**
 * Validates and clamps a number to a range
 * @param {any} value - Value to validate
 * @param {number} min - Minimum allowed value
 * @param {number} max - Maximum allowed value
 * @param {number} defaultValue - Default if invalid
 * @returns {number} Validated number
 */
export function validateNumber(value, min, max, defaultValue = 0) {
  const num = Number(value);
  if (!Number.isFinite(num) || Number.isNaN(num)) {
    return defaultValue;
  }
  return Math.max(min, Math.min(max, num));
}

/**
 * Validates a genre weight (0-100)
 * @param {any} weight - Weight value
 * @returns {number} Validated weight
 */
export function validateGenreWeight(weight) {
  return validateNumber(
    weight,
    VALIDATION_LIMITS.MIN_WEIGHT,
    VALIDATION_LIMITS.MAX_WEIGHT,
    0
  );
}

/**
 * Validates a base input (0-10 scale)
 * @param {any} value - Input value
 * @returns {number} Validated input
 */
export function validateBaseInput(value) {
  return validateNumber(
    value,
    VALIDATION_LIMITS.MIN_BASE_INPUT,
    VALIDATION_LIMITS.MAX_BASE_INPUT,
    5
  );
}

/**
 * Validates a derived input (0-1 scale)
 * @param {any} value - Input value
 * @returns {number} Validated input
 */
export function validateDerivedInput(value) {
  return validateNumber(
    value,
    VALIDATION_LIMITS.MIN_DERIVED_INPUT,
    VALIDATION_LIMITS.MAX_DERIVED_INPUT,
    0.5
  );
}

/**
 * Validates tempo value
 * @param {any} tempo - Tempo in BPM
 * @returns {number} Validated tempo
 */
export function validateTempo(tempo) {
  return validateNumber(
    tempo,
    VALIDATION_LIMITS.MIN_TEMPO,
    VALIDATION_LIMITS.MAX_TEMPO,
    120
  );
}

/**
 * Validates temperature for AI models
 * @param {any} temp - Temperature value
 * @returns {number} Validated temperature
 */
export function validateTemperature(temp) {
  return validateNumber(
    temp,
    VALIDATION_LIMITS.MIN_TEMPERATURE,
    VALIDATION_LIMITS.MAX_TEMPERATURE,
    0.7
  );
}

/**
 * Validates top_p for AI models
 * @param {any} topP - Top P value
 * @returns {number} Validated top P
 */
export function validateTopP(topP) {
  return validateNumber(
    topP,
    VALIDATION_LIMITS.MIN_TOP_P,
    VALIDATION_LIMITS.MAX_TOP_P,
    1
  );
}

/**
 * Validates frequency/presence penalty for AI models
 * @param {any} penalty - Penalty value
 * @returns {number} Validated penalty
 */
export function validatePenalty(penalty) {
  return validateNumber(
    penalty,
    VALIDATION_LIMITS.MIN_PENALTY,
    VALIDATION_LIMITS.MAX_PENALTY,
    0
  );
}

/**
 * Validates max tokens for AI models
 * @param {any} tokens - Max tokens value
 * @returns {number} Validated max tokens
 */
export function validateMaxTokens(tokens) {
  return validateNumber(
    tokens,
    VALIDATION_LIMITS.MAX_TOKENS_MIN,
    VALIDATION_LIMITS.MAX_TOKENS_MAX,
    1200
  );
}

/**
 * Validates timeout in milliseconds
 * @param {any} timeout - Timeout value in ms
 * @returns {number} Validated timeout
 */
export function validateTimeout(timeout) {
  return validateNumber(
    timeout,
    VALIDATION_LIMITS.TIMEOUT_MIN_MS,
    VALIDATION_LIMITS.TIMEOUT_MAX_MS,
    60000
  );
}

/**
 * Sanitizes text input by trimming and limiting length
 * @param {any} text - Text to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized text
 */
export function sanitizeText(text, maxLength = VALIDATION_LIMITS.MAX_TEXT_LENGTH) {
  if (typeof text !== 'string') {
    return '';
  }
  const trimmed = text.trim();
  return trimmed.length > maxLength ? trimmed.substring(0, maxLength) : trimmed;
}

/**
 * Sanitizes title text
 * @param {any} title - Title to sanitize
 * @returns {string} Sanitized title
 */
export function sanitizeTitle(title) {
  return sanitizeText(title, VALIDATION_LIMITS.MAX_TITLE_LENGTH);
}

/**
 * Validates API key format
 * @param {any} apiKey - API key to validate
 * @returns {boolean} True if valid format
 */
export function validateApiKey(apiKey) {
  if (typeof apiKey !== 'string') return false;
  const trimmed = apiKey.trim();
  return trimmed.length >= VALIDATION_LIMITS.MIN_API_KEY_LENGTH;
}

/**
 * Validates URL format
 * @param {any} url - URL to validate
 * @returns {boolean} True if valid URL
 */
export function validateUrl(url) {
  if (typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validates and sanitizes genre name
 * @param {any} name - Genre name
 * @returns {string} Sanitized genre name
 */
export function sanitizeGenreName(name) {
  const sanitized = sanitizeText(name, 100);
  // Remove potentially problematic characters
  return sanitized.replace(/[<>\"']/g, '');
}

/**
 * Validates array of weights sums to expected total
 * @param {Array<number>} weights - Array of weight values
 * @param {number} expectedTotal - Expected sum (default 100)
 * @param {number} tolerance - Allowed tolerance (default 0.01)
 * @returns {boolean} True if sum is valid
 */
export function validateWeightSum(weights, expectedTotal = 100, tolerance = 0.01) {
  if (!Array.isArray(weights)) return false;
  const sum = weights.reduce((acc, w) => acc + Number(w || 0), 0);
  return Math.abs(sum - expectedTotal) <= tolerance;
}

/**
 * Normalizes weights to sum to target total
 * @param {Array<number>} weights - Array of weight values
 * @param {number} targetTotal - Target sum (default 100)
 * @returns {Array<number>} Normalized weights
 */
export function normalizeWeights(weights, targetTotal = 100) {
  if (!Array.isArray(weights) || weights.length === 0) {
    return [];
  }

  const validWeights = weights.map(w => Math.max(0, Number(w) || 0));
  const sum = validWeights.reduce((acc, w) => acc + w, 0);

  if (sum === 0) {
    // Distribute evenly if all zeros
    const evenWeight = targetTotal / weights.length;
    return weights.map(() => evenWeight);
  }

  const scale = targetTotal / sum;
  return validWeights.map(w => w * scale);
}

/**
 * Sanitizes HTML to prevent XSS
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML (text content only)
 */
export function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Validates object has required keys
 * @param {Object} obj - Object to validate
 * @param {Array<string>} requiredKeys - Required key names
 * @returns {boolean} True if all keys present
 */
export function validateRequiredKeys(obj, requiredKeys) {
  if (!obj || typeof obj !== 'object') return false;
  return requiredKeys.every(key => key in obj);
}

/**
 * Clamps a value between 0 and 1
 * @param {any} value - Value to clamp
 * @returns {number} Clamped value
 */
export function clamp01(value) {
  return validateNumber(value, 0, 1, 0);
}
