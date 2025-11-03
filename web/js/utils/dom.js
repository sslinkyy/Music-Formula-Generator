/**
 * DOM Utility Functions
 * Common DOM manipulation and UI helper functions
 */

// Toast notification delay constant
const DEFAULT_TOAST_DELAY_MS = 1500;

// Button flash delay constant
const DEFAULT_BUTTON_FLASH_DELAY_MS = 800;

/**
 * Copies text to clipboard with fallback for older browsers
 * @param {string} text - Text to copy
 * @returns {Promise<void>}
 */
export async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older browsers
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.position = 'fixed';
  ta.style.top = '-1000px';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {number} ms - Duration in milliseconds
 */
export function showToast(message, ms = DEFAULT_TOAST_DELAY_MS) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, ms);
}

/**
 * Temporarily changes button text and disables it
 * @param {HTMLElement} btn - Button element
 * @param {string} label - Temporary label
 * @param {number} delay - Duration in milliseconds
 */
export function flashButton(btn, label, delay = DEFAULT_BUTTON_FLASH_DELAY_MS) {
  if (!btn) return;
  const original = btn.textContent;
  btn.textContent = label;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, delay);
}

/**
 * Formats a number with specified decimal places
 * @param {number} value - Number to format
 * @param {number} digits - Decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(value, digits = 2) {
  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(digits) : '0.00';
}

/**
 * Creates a slider input element with label
 * @param {Object} config - Configuration object
 * @param {string} config.id - Input ID
 * @param {string} config.label - Label text
 * @param {number} config.min - Minimum value
 * @param {number} config.max - Maximum value
 * @param {number} config.step - Step increment
 * @param {number} config.value - Current value
 * @param {Function} config.onChange - Change handler
 * @returns {HTMLElement} Container element
 */
export function createSlider({ id, label, min, max, step, value, onChange }) {
  const container = document.createElement('div');
  container.className = 'input-row';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.type = 'range';
  input.id = id;
  input.name = id;
  input.min = String(min);
  input.max = String(max);
  input.step = String(step);
  input.value = String(value);
  input.setAttribute('aria-label', label);

  const valueDisplay = document.createElement('span');
  valueDisplay.className = 'input-value';
  valueDisplay.textContent = formatNumber(value);

  input.addEventListener('input', (e) => {
    const val = Number(e.target.value);
    valueDisplay.textContent = formatNumber(val);
    if (onChange) onChange(val);
  });

  container.appendChild(labelEl);
  container.appendChild(input);
  container.appendChild(valueDisplay);

  return container;
}

/**
 * Creates a dropdown select element
 * @param {Object} config - Configuration object
 * @param {string} config.id - Select ID
 * @param {string} config.label - Label text
 * @param {Array<string|Object>} config.options - Option values
 * @param {string} config.value - Current value
 * @param {Function} config.onChange - Change handler
 * @returns {HTMLElement} Container element
 */
export function createSelect({ id, label, options, value, onChange }) {
  const container = document.createElement('div');
  container.className = 'input-row';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.textContent = label;

  const select = document.createElement('select');
  select.id = id;
  select.name = id;
  select.setAttribute('aria-label', label);

  options.forEach((opt) => {
    const option = document.createElement('option');
    if (typeof opt === 'string') {
      option.value = opt;
      option.textContent = opt;
    } else {
      option.value = opt.value;
      option.textContent = opt.label || opt.value;
    }
    if (option.value === value) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  if (onChange) {
    select.addEventListener('change', (e) => onChange(e.target.value));
  }

  container.appendChild(labelEl);
  container.appendChild(select);

  return container;
}

/**
 * Creates a text input element
 * @param {Object} config - Configuration object
 * @param {string} config.id - Input ID
 * @param {string} config.label - Label text
 * @param {string} config.value - Current value
 * @param {string} config.placeholder - Placeholder text
 * @param {Function} config.onChange - Change handler
 * @param {number} config.maxLength - Maximum length
 * @returns {HTMLElement} Container element
 */
export function createTextInput({ id, label, value, placeholder, onChange, maxLength }) {
  const container = document.createElement('div');
  container.className = 'input-row';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.textContent = label;

  const input = document.createElement('input');
  input.type = 'text';
  input.id = id;
  input.name = id;
  input.value = value || '';
  input.setAttribute('aria-label', label);

  if (placeholder) {
    input.placeholder = placeholder;
  }

  if (maxLength) {
    input.maxLength = maxLength;
  }

  if (onChange) {
    input.addEventListener('input', (e) => onChange(e.target.value));
  }

  container.appendChild(labelEl);
  container.appendChild(input);

  return container;
}

/**
 * Creates a textarea element
 * @param {Object} config - Configuration object
 * @param {string} config.id - Textarea ID
 * @param {string} config.label - Label text
 * @param {string} config.value - Current value
 * @param {string} config.placeholder - Placeholder text
 * @param {Function} config.onChange - Change handler
 * @param {number} config.rows - Number of rows
 * @param {number} config.maxLength - Maximum length
 * @returns {HTMLElement} Container element
 */
export function createTextarea({ id, label, value, placeholder, onChange, rows = 3, maxLength }) {
  const container = document.createElement('div');
  container.className = 'input-row';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', id);
  labelEl.textContent = label;

  const textarea = document.createElement('textarea');
  textarea.id = id;
  textarea.name = id;
  textarea.value = value || '';
  textarea.rows = rows;
  textarea.setAttribute('aria-label', label);

  if (placeholder) {
    textarea.placeholder = placeholder;
  }

  if (maxLength) {
    textarea.maxLength = maxLength;
  }

  if (onChange) {
    textarea.addEventListener('input', (e) => onChange(e.target.value));
  }

  container.appendChild(labelEl);
  container.appendChild(textarea);

  return container;
}

/**
 * Scrolls element into view smoothly
 * @param {HTMLElement|string} elementOrId - Element or element ID
 * @param {Object} options - Scroll options
 */
export function scrollToElement(elementOrId, options = { behavior: 'smooth', block: 'start' }) {
  const element = typeof elementOrId === 'string'
    ? document.getElementById(elementOrId)
    : elementOrId;

  if (element) {
    try {
      element.scrollIntoView(options);
    } catch (err) {
      // Fallback for browsers that don't support smooth scrolling
      element.scrollIntoView();
    }
  }
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Checks if user prefers reduced motion
 * @returns {boolean} True if reduced motion preferred
 */
export function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Safely sets innerHTML with text content (prevents XSS)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to set
 */
export function setTextContent(element, text) {
  if (element) {
    element.textContent = text;
  }
}

/**
 * Creates a button element
 * @param {Object} config - Configuration object
 * @param {string} config.text - Button text
 * @param {Function} config.onClick - Click handler
 * @param {string} config.className - CSS class
 * @param {string} config.type - Button type
 * @param {boolean} config.disabled - Disabled state
 * @returns {HTMLElement} Button element
 */
export function createButton({ text, onClick, className = '', type = 'button', disabled = false }) {
  const button = document.createElement('button');
  button.type = type;
  button.textContent = text;
  button.disabled = disabled;

  if (className) {
    button.className = className;
  }

  if (onClick) {
    button.addEventListener('click', onClick);
  }

  return button;
}
