import { CONSTANTS, CONTROLS, DEFAULT_WEIGHTS, WEIGHT_PRESETS, BASE_INPUTS, DERIVED_INPUTS, USER_SECTION_DEFS, PREMISE_OPTIONS, GENRE_SLOTS, GENRE_SLOT_WEIGHT_TOTAL, ACCENT_DEFAULT, DEFAULT_AI_SETTINGS, CREATIVE_FIELDS } from './js/config.js';
import { computeScores } from './js/scoring.js';
import { analyzeGenreMix, appendStyleAccent } from './js/genre.js';
import { getPhoneticMode, applyPhoneticSpelling } from './js/phonetics.js';
import { GENRE_LIBRARY } from './data/genres.js';
import { buildRhythmGameDialog } from './games/rhythm/index.js';
import { buildGridGameDialog } from './games/grid/index.js';
import { buildShooterGameDialog } from './games/shooter/index.js';
import { ACCENT_LIBRARY } from './data/accents.js';

// Local UX option lists (duplicated from config for easier patching)
const __LANGUAGE_OPTIONS = [
  'English','Spanish','French','German','Italian','Portuguese','Arabic','Hindi','Japanese','Korean','Mandarin Chinese','Cantonese','Swahili','Turkish','Greek','Russian','(custom)'
];
const __INSTRUMENT_OPTIONS = [
  '808 bass','acoustic guitar','electric guitar','piano','rhodes','synth pad','synth lead','strings','brass','woodwinds','pluck synth','arp','drum kit','trap hats','claps','snare','kick','choir','vocal chop','fx riser'
];

// Persistence keys and default-state builder
const __STATE_KEY = 'rgf_state_v1';
const __THEME_KEY = 'rgf_theme_v1';
const __HIST_KEY = 'rgf_prompt_history_v1';
const __ONBOARD_KEY = 'rgf_onboarding_seen_v1';
const __PREF_KEY = 'rgf_prefs_v1';

function getPrefs() { try { return JSON.parse(localStorage.getItem(__PREF_KEY) || '{}'); } catch(_) { return {}; } }
function setPrefs(p) { try { localStorage.setItem(__PREF_KEY, JSON.stringify(p)); } catch(_) {} }
function applyMotionPref() {
  try {
    const prefs = getPrefs();
    const val = prefs.reduceMotion ? 'true' : 'false';
    document.documentElement.setAttribute('data-reduce-motion', val);
    const motionBtn = document.getElementById('motion-toggle');
    if (motionBtn) motionBtn.textContent = prefs.reduceMotion ? 'Motion: Off' : 'Motion';
  } catch(_) {}
}
function buildDefaultState() {
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
    userSections: Object.fromEntries(USER_SECTION_DEFS.map(item => [item.id, ''])),
    aiSettings: { ...DEFAULT_AI_SETTINGS },
    computed: null,
    genreAnalysis: null,
    outputs: { brief: '', suno: '', prompt: '', aiResponse: '' }
  };
}

const state = {
  controls: Object.fromEntries(CONTROLS.map(c => [c.id, c.value])),
  weights: { ...DEFAULT_WEIGHTS },
  baseInputs: Object.fromEntries(BASE_INPUTS.map(item => [item.id, item.value])),
  derivedInputs: Object.fromEntries(DERIVED_INPUTS.map(item => [item.id, item.value])),
  creativeInputs: Object.fromEntries(CREATIVE_FIELDS.map(field => [field.id, field.defaultValue])),
  genreMix: Array.from({ length: GENRE_SLOTS }, () => ({ genre: '', weight: 0 })),
  premise: '(auto)',
  customPremise: '',
  accent: ACCENT_DEFAULT,
  userSections: Object.fromEntries(USER_SECTION_DEFS.map(item => [item.id, ''])),
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
// Reduce immediate repeats when auto-picking premise
let __lastPremise = '';
function formatNumber(value, digits = 2) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  return value.toFixed(digits);
}
function renderConstants() {
  const container = document.getElementById('constants');
  container.innerHTML = renderStaticGrid(CONSTANTS.map(item => ({
    label: item.label,
    value: formatNumber(item.value, 6)
  })));
}

function renderControls() {
  const container = document.getElementById('controls');
  container.innerHTML = '';
  CONTROLS.forEach(ctrl => {
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `<span>${ctrl.label}</span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.value = state.controls[ctrl.id];
    input.step = '0.01';
    if (typeof ctrl.min === 'number') input.min = ctrl.min;
    if (typeof ctrl.max === 'number') input.max = ctrl.max;
    input.addEventListener('input', () => {
      state.controls[ctrl.id] = parseFloat(input.value) || 0;
      recompute();
      try { scheduleSave(); } catch (_) {}
    });
    label.appendChild(input);
    container.appendChild(label);
  });
}

function renderWeights() {
  const container = document.getElementById('weights');
  container.innerHTML = '';
  const entries = [
    { id: 'core', label: 'w_c (Core)' },
    { id: 'tech', label: 'w_t (Tech)' },
    { id: 'anthem', label: 'w_a (Anthem)' },
    { id: 'style', label: 'w_s (Style)' },
    { id: 'group', label: 'w_g (Group)' },
    { id: 'perf', label: 'w_p (Perf)' }
  ];
  entries.forEach(entry => {
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `<span>${entry.label}</span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.min = '0';
    input.max = '1';
    input.value = state.weights[entry.id];
    input.addEventListener('input', () => {
      state.weights[entry.id] = parseFloat(input.value) || 0;
      renderWeightsSummary();
      recompute();
    });
    label.appendChild(input);
    container.appendChild(label);
  });
  renderWeightsSummary();
}

function renderWeightsSummary() {
  const total = Object.values(state.weights).reduce((sum, val) => sum + val, 0);
  let summary = document.getElementById('weights-summary');
  if (!summary) {
    summary = document.createElement('p');
    summary.id = 'weights-summary';
    summary.className = 'hint';
    document.getElementById('weights').appendChild(summary);
  }
  summary.textContent = `Sum: ${formatNumber(total, 2)}`;
}
function renderBaseInputs() {
  const container = document.getElementById('base-inputs');
  container.innerHTML = '';
  BASE_INPUTS.forEach(item => {
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `<span>${item.label}</span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '10';
    input.step = '0.1';
    input.value = state.baseInputs[item.id];
    input.addEventListener('input', () => {
      state.baseInputs[item.id] = parseFloat(input.value) || 0;
      recompute();
    });
    label.appendChild(input);
    container.appendChild(label);
  });
}

function renderDerivedInputs() {
  const container = document.getElementById('derived-inputs');
  container.innerHTML = '';
  DERIVED_INPUTS.forEach(item => {
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `<span>${item.label}</span>`;
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '1';
    input.step = '0.01';
    input.value = state.derivedInputs[item.id];
    input.addEventListener('input', () => {
      state.derivedInputs[item.id] = parseFloat(input.value) || 0;
      recompute();
    });
    label.appendChild(input);
    container.appendChild(label);
  });
}
function renderCreativeInputs() {
  const container = document.getElementById('creative-inputs');
  container.innerHTML = '';
  CREATIVE_FIELDS.forEach(field => {
    const wrapper = document.createElement('label');
    wrapper.className = 'field';
    wrapper.innerHTML = `<span>${field.label}</span>`;
    let input;
    if (field.id === 'lengthTarget') {
      input = document.createElement('input');
      input.type = 'number';
      input.min = '0';
      input.step = '0.1';
      input.value = state.creativeInputs[field.id];
      input.addEventListener('input', () => {
        state.creativeInputs[field.id] = parseFloat(input.value) || 0;
      });
    } else if (['mustInclude', 'forbidden', 'audienceNotes', 'externalDirectives'].includes(field.id)) {
      input = document.createElement('textarea');
      input.rows = field.id === 'audienceNotes' ? 3 : (field.id === 'externalDirectives' ? 4 : 2);
      input.value = state.creativeInputs[field.id] || '';
      input.addEventListener('input', () => {
        state.creativeInputs[field.id] = input.value;
        try { scheduleSave(); } catch (_) {}
      });
    } else if (field.id === 'keywords' || field.id === 'styleTags') {
      // Tokenized input with removable chips for keywords/style tags
      const wrapperDiv = document.createElement('div');
      const chips = document.createElement('div');
      chips.className = 'chips';
      const text = document.createElement('input');
      text.type = 'text';
      text.placeholder = field.id === 'keywords' ? 'Add keyword and press Enter' : 'Add style tag and press Enter';
      text.style.marginTop = '8px';
      text.style.minWidth = '220px';

      let tokens = (state.creativeInputs[field.id] || '')
        .split(',').map(s => s.trim()).filter(Boolean);

      const normalize = (s) => s.replace(/\s+/g, ' ').trim();
      const uniquePush = (list, item) => {
        const lower = item.toLowerCase();
        if (!list.some(x => x.toLowerCase() === lower)) list.push(item);
      };
      const commit = () => {
        state.creativeInputs[field.id] = tokens.join(', ');
        try { scheduleSave(); } catch (_) {}
      };
      const renderChips = () => {
        const safe = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
        chips.innerHTML = tokens.map(name => `
          <span class="chip">${safe(name)}
            <button type="button" class="chip-remove" data-name="${safe(name)}" title="Remove">&times;</button>
          </span>
        `).join('');
      };
      const addFromText = () => {
        let raw = text.value;
        if (!raw || !raw.trim()) return;
        const parts = raw.split(',').map(normalize).filter(Boolean);
        parts.forEach(p => uniquePush(tokens, p));
        text.value = '';
        renderChips();
        commit();
      };
      text.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          addFromText();
        }
      });
      text.addEventListener('blur', addFromText);
      chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip-remove');
        if (!btn) return;
        const name = btn.getAttribute('data-name') || '';
        tokens = tokens.filter(x => x.toLowerCase() !== name.toLowerCase());
        renderChips();
        commit();
      });
      renderChips();
      wrapperDiv.appendChild(chips);
      wrapperDiv.appendChild(text);
      input = wrapperDiv;
    } else if (field.id === 'specificInstruments') {
      // Checkbox list + chips + custom input for multi-select UX
      const wrapperDiv = document.createElement('div');
      wrapperDiv.className = 'instrument-picker';

      const current = (state.creativeInputs[field.id] || '')
        .split(',').map(s => s.trim()).filter(Boolean);

      const checklist = document.createElement('div');
      checklist.className = 'instrument-checklist';
      __INSTRUMENT_OPTIONS.forEach(name => {
        const id = `inst-${name.replace(/[^a-z0-9]+/gi,'-').toLowerCase()}`;
        const lbl = document.createElement('label');
        lbl.style.display = 'inline-flex';
        lbl.style.alignItems = 'center';
        lbl.style.marginRight = '12px';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.id = id;
        cb.value = name;
        cb.checked = current.includes(name);
        cb.addEventListener('change', () => { updateFromUI(); });
        const span = document.createElement('span');
        span.textContent = name;
        span.style.marginLeft = '4px';
        lbl.appendChild(cb);
        lbl.appendChild(span);
        checklist.appendChild(lbl);
      });

      const custom = document.createElement('input');
      custom.type = 'text';
      custom.placeholder = 'Other (comma-separated)';
      custom.style.display = 'block';
      custom.style.marginTop = '8px';
      const customs = current.filter(x => !__INSTRUMENT_OPTIONS.includes(x));
      custom.value = customs.join(', ');
      custom.addEventListener('input', () => { updateFromUI(); });

      const chips = document.createElement('div');
      chips.className = 'chips';
      chips.style.marginTop = '8px';

      function updateFromUI() {
        const selected = Array.from(checklist.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
        const extra = custom.value.split(',').map(s => s.trim()).filter(Boolean);
        const merged = [...selected, ...extra];
        state.creativeInputs[field.id] = merged.join(', ');
        renderChips(merged);
        try { scheduleSave(); } catch (_) {}
      }
      function renderChips(list) {
        const safe = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;');
        chips.innerHTML = list.filter(Boolean).map(name => `
          <span class="chip">${safe(name)}
            <button type="button" class="chip-remove" data-name="${safe(name)}" title="Remove">&times;</button>
          </span>
        `).join('');
      }
      chips.addEventListener('click', (e) => {
        const btn = e.target.closest('.chip-remove');
        if (!btn) return;
        const name = btn.getAttribute('data-name') || '';
        // Uncheck if it is a predefined option
        const cbs = Array.from(checklist.querySelectorAll('input[type="checkbox"]'));
        const found = cbs.find(el => el.value.toLowerCase() === name.toLowerCase());
        if (found) {
          found.checked = false;
        } else {
          // Remove from custom CSV
          const items = custom.value.split(',').map(s => s.trim()).filter(Boolean);
          custom.value = items.filter(x => x.toLowerCase() !== name.toLowerCase()).join(', ');
        }
        updateFromUI();
      });
      renderChips(current);

      wrapperDiv.appendChild(checklist);
      wrapperDiv.appendChild(custom);
      wrapperDiv.appendChild(chips);
      input = wrapperDiv;
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = state.creativeInputs[field.id] || '';
      input.addEventListener('input', () => {
        state.creativeInputs[field.id] = input.value;
        try { scheduleSave(); } catch (_) {}
      });
    }
    wrapper.appendChild(input);
    container.appendChild(wrapper);
  });
}
function renderGenreMix() {
  const container = document.getElementById('genre-mix');
  container.innerHTML = '';
  state.genreMix.forEach((slot, index) => {
    const card = document.createElement('div');
    card.className = 'genre-slot';
    card.innerHTML = `<p><strong>Slot ${index + 1}</strong></p>`;

    const select = document.createElement('select');
    select.innerHTML = `<option value="">(none)</option><option value="(custom)">(custom)</option>` + GENRE_LIBRARY.map(g => `
      <option value="${g.name}">${g.name}</option>`).join('');
    select.value = slot.genre;
    select.addEventListener('change', () => {
      slot.genre = select.value;
      try { toggleCustom(); } catch (_) {}
      try { scheduleSave(); } catch (_) {}
    });

    const custom = document.createElement('input');
    custom.type = 'text';
    custom.placeholder = 'Custom genre label';
    custom.value = slot.customGenre || '';
    custom.style.display = 'none';
    custom.style.marginLeft = '8px';
    custom.addEventListener('input', () => { slot.customGenre = custom.value; try { scheduleSave(); } catch (_) {} });

    const toggleCustom = () => {
      const show = (select.value || '').toLowerCase() === '(custom)';
      custom.style.display = show ? '' : 'none';
    };
    toggleCustom();

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = String(GENRE_SLOT_WEIGHT_TOTAL);
    slider.value = slot.weight;

    const number = document.createElement('input');
    number.type = 'number';
    number.min = '0';
    number.max = String(GENRE_SLOT_WEIGHT_TOTAL);
    number.value = slot.weight;

    const syncWeight = value => {
      const numeric = Math.max(0, Math.min(GENRE_SLOT_WEIGHT_TOTAL, Number(value) || 0));
      slot.weight = numeric;
      slider.value = String(numeric);
      number.value = String(numeric);
      renderGenreMixTotal();
    };

    slider.addEventListener('input', () => syncWeight(slider.value));
    number.addEventListener('input', () => syncWeight(number.value));

    card.appendChild(select);
    card.appendChild(custom);
    const weightRow = document.createElement('div');
    weightRow.className = 'weight-row';
    weightRow.appendChild(slider);
    weightRow.appendChild(number);
    card.appendChild(weightRow);

    container.appendChild(card);
  });
  renderGenreMixTotal();
}

function renderGenreMixTotal() {
  const total = state.genreMix.reduce((sum, slot) => sum + (slot.weight || 0), 0);
  let totalEl = document.getElementById('genre-mix-total');
  if (!totalEl) {
    totalEl = document.createElement('p');
    totalEl.id = 'genre-mix-total';
    totalEl.className = 'hint';
    document.getElementById('genre-mix').appendChild(totalEl);
  }
  totalEl.textContent = `Total: ${formatNumber(total, 0)} / ${GENRE_SLOT_WEIGHT_TOTAL}`;
}

function renderPremise() {
  const select = document.getElementById('premise-select');
  select.innerHTML = PREMISE_OPTIONS.map(opt => `<option value="${opt}">${opt}</option>`).join('');
  select.value = state.premise;

  // Create or reuse a sibling input for custom premise
  let custom = document.getElementById('premise-custom-input');
  if (!custom) {
    custom = document.createElement('input');
    custom.type = 'text';
    custom.id = 'premise-custom-input';
    custom.placeholder = 'Type custom premise…';
    custom.value = state.customPremise || '';
    custom.style.minWidth = '220px';
    custom.style.marginLeft = '8px';
    // Insert next to the select
    select.parentElement.appendChild(custom);
  } else {
    custom.value = state.customPremise || '';
  }

  const updateCustomVisibility = () => {
    const isCustom = (select.value || '').toLowerCase() === '(custom)';
    custom.style.display = isCustom ? '' : 'none';
    if (isCustom) setTimeout(() => custom.focus(), 0);
  };
  updateCustomVisibility();

  select.addEventListener('change', () => {
    state.premise = select.value;
    updateCustomVisibility();
    try { scheduleSave(); } catch (_) {}
  });
  custom.addEventListener('input', () => {
    state.customPremise = custom.value;
    try { scheduleSave(); } catch (_) {}
  });
}

function renderAccent() {
  const select = document.getElementById('accent-select');
  select.innerHTML = ACCENT_LIBRARY.map(acc => `
    <option value="${acc.name}">${acc.name}</option>`).join('');
  select.value = state.accent;
  select.addEventListener('change', () => {
    state.accent = select.value;
    updateHiddenDirective();
    try {
      const g = getGamify();
      if (!/neutral/i.test(state.accent)) unlockAchievement('voiceActor','Voice Actor');
      g.accentsUsed = Array.isArray(g.accentsUsed) ? g.accentsUsed : [];
      const key = (state.accent||'').toLowerCase();
      if (key && !g.accentsUsed.includes(key)) g.accentsUsed.push(key);
      setGamify(g);
      if (g.accentsUsed.length >= 3) unlockAchievement('accentExplorer','Accent Explorer');
    } catch(_){}
    try { scheduleSave(); } catch (_) {}
  });
}

function renderLanguage() {
  const select = document.getElementById('language-select');
  if (!select) return;
  const opts = __LANGUAGE_OPTIONS;
  select.innerHTML = opts.map(opt => `<option value="${opt}">${opt}</option>`).join('');
  if (!state.language) state.language = 'English';
  select.value = state.language;
  let custom = document.getElementById('language-custom-input');
  if (!custom) {
    custom = document.createElement('input');
    custom.type = 'text';
    custom.id = 'language-custom-input';
    custom.placeholder = 'Type custom language';
    custom.style.minWidth = '220px';
    custom.style.marginLeft = '8px';
    const label = select.parentElement;
    if (label) label.appendChild(custom);
  }
  custom.value = state.customLanguage || '';
  const updateCustomVisibility = () => {
    const isCustom = (select.value || '').toLowerCase() === '(custom)';
    custom.style.display = isCustom ? '' : 'none';
    if (isCustom) setTimeout(() => custom.focus(), 0);
  };
  updateCustomVisibility();
  select.addEventListener('change', () => {
    state.language = select.value; updateCustomVisibility();
    try {
      const g = getGamify();
      if ((state.language||'').toLowerCase() !== 'english') unlockAchievement('polyglot1','Polyglot I');
      g.languagesUsed = Array.isArray(g.languagesUsed) ? g.languagesUsed : [];
      const langKey = (state.language||'').toLowerCase();
      if (langKey && !g.languagesUsed.includes(langKey)) g.languagesUsed.push(langKey);
      setGamify(g);
      if (g.languagesUsed.length >= 3) unlockAchievement('polyglotExplorer','Polyglot Explorer');
    } catch(_){}
    try { scheduleSave(); } catch (_) {}
  });
  custom.addEventListener('input', () => { state.customLanguage = custom.value; try { if ((custom.value||'').trim()) unlockAchievement('polyglot2','Polyglot II'); } catch(_){} try { scheduleSave(); } catch (_) {} });
}

// Utility: clean VBA artifact tokens from structure strings for display
function cleanStructureDisplay(text) {
  return String(text || '')
    .replace(/\s*a-[\'’]\s*/g, ' | ')
    .replace(/\s+\|\s+/g, ' | ')
    .trim();
}
function renderUserSections() {
  const container = document.getElementById('user-sections');
  container.innerHTML = '';
  USER_SECTION_DEFS.forEach(section => {
    const label = document.createElement('label');
    label.className = 'field';
    label.innerHTML = `<span>${section.label}</span>`;
    const textarea = document.createElement('textarea');
    textarea.value = state.userSections[section.id] || '';
    textarea.addEventListener('input', () => {
      state.userSections[section.id] = textarea.value;
    });
    label.appendChild(textarea);
    container.appendChild(label);
  });
}

function renderComputed() {
  const container = document.getElementById('computed-scores');
  const computed = state.computed;
  let entries;
  if (computed && computed.blocks) {
    entries = [
      { label: 'Core', value: computed.blocks.core },
      { label: 'Sync', value: computed.blocks.sync },
      { label: 'Core*', value: computed.blocks.coreStar },
      { label: 'Tech', value: computed.blocks.tech },
      { label: 'Anthem', value: computed.blocks.anthem },
      { label: 'StyleSig', value: computed.blocks.styleSig },
      { label: 'Group', value: computed.blocks.group },
      { label: 'Perf', value: computed.blocks.perf },
      { label: 'Regularizer', value: computed.blocks.regularizer },
      { label: 'Weight Sum', value: computed.weightSum },
      { label: 'Final Raw', value: computed.final.raw },
      { label: 'Final (0-100)', value: computed.final.clamped }
    ];
  } else {
    entries = [
      { label: 'Core', value: '—' },
      { label: 'Tech', value: '—' },
      { label: 'Anthem', value: '—' },
      { label: 'StyleSig', value: '—' },
      { label: 'Group', value: '—' },
      { label: 'Perf', value: '—' },
      { label: 'Regularizer', value: '—' },
      { label: 'Final Score', value: '—' }
    ];
  }
  // Build grid with meters for numeric values
  const html = ['<div class="table-grid">'];
  entries.forEach(item => {
    const isNumber = typeof item.value === 'number' && !Number.isNaN(item.value);
    const isFinal = item.label.startsWith('Final (0-100)');
    const max = isFinal ? 100 : 1;
    const val = isNumber ? Math.max(0, Math.min(max, item.value)) : null;
    const pct = isNumber ? Math.round((val / max) * 100) : null;
    html.push('<div class="cell">');
    html.push(`<span>${item.label}</span>`);
    html.push(`<strong>${isNumber ? formatNumber(val, isFinal ? 1 : 3) : (item.value || '-') }</strong>`);
    if (isNumber) {
      html.push(`<div class=\"meter\"><div class=\"meter-track\"><div class=\"meter-bar\" style=\"width:${pct}%\"></div></div><div class=\"meter-label\"><span>${pct}%</span><span>max ${max}</span></div></div>`);
    }
    html.push('</div>');
  });
  html.push('</div>');
  container.innerHTML = html.join('');
}

function renderAISettings() {
  const form = document.getElementById('ai-settings');
  form.elements.endpoint.value = state.aiSettings.endpoint;
  form.elements.model.value = state.aiSettings.model;
  form.elements.apiKey.value = state.aiSettings.apiKey;
  form.elements.organization.value = state.aiSettings.organization;
  form.elements.temperature.value = state.aiSettings.temperature;
  form.elements.topP.value = state.aiSettings.topP;
  form.elements.frequencyPenalty.value = state.aiSettings.frequencyPenalty;
  form.elements.presencePenalty.value = state.aiSettings.presencePenalty;
  form.elements.maxTokens.value = state.aiSettings.maxTokens;
  form.elements.timeoutMs.value = state.aiSettings.timeoutMs;
  form.elements.systemPrompt.value = state.aiSettings.systemPrompt;
  form.elements.stopSequences.value = state.aiSettings.stopSequences;
  form.elements.userLabel.value = state.aiSettings.userLabel;
  form.elements.responseFormat.value = state.aiSettings.responseFormat;

  form.addEventListener('input', () => {
    const data = new FormData(form);
    for (const [key, value] of data.entries()) {
      if (!(key in state.aiSettings)) continue;
      if (['temperature', 'topP', 'frequencyPenalty', 'presencePenalty'].includes(key)) {
        state.aiSettings[key] = parseFloat(value) || 0;
      } else if (['maxTokens', 'timeoutMs'].includes(key)) {
        state.aiSettings[key] = parseInt(value, 10) || 0;
      } else {
        state.aiSettings[key] = value;
      }
    }
  });
}

function renderOutputs() {
  document.getElementById('creative-brief').textContent = state.outputs.brief || '';
  document.getElementById('suno-output').textContent = state.outputs.suno || '';
  document.getElementById('ai-prompt').textContent = state.outputs.prompt || '';
  document.getElementById('ai-response').textContent = state.outputs.aiResponse || '';
}

function renderStaticGrid(entries) {
  return `<div class="table-grid">${entries.map(entry => `
    <div class="cell">
      <span>${entry.label}</span>
      <strong>${entry.value}</strong>
    </div>
  `).join('')}</div>`;
}

function recompute() {
  try {
    state.computed = computeScores({
      controls: state.controls,
      weights: state.weights,
      baseInputs: state.baseInputs,
      derivedInputs: state.derivedInputs
    });
  } catch (error) {
    console.error('Scoring error', error);
    state.computed = null;
  }
  renderComputed();
}
function setupButtons() {
  document.querySelectorAll('[data-preset]').forEach(button => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset));
  });
  document.getElementById('generate-brief').addEventListener('click', () => {
    state.outputs.brief = buildCreativeBrief();
    renderOutputs();
  });
  document.getElementById('generate-suno').addEventListener('click', () => {
    const result = buildSunoBlocks();
    state.outputs.suno = result.blocksText;
    renderOutputs();
  });
  document.getElementById('build-prompt').addEventListener('click', () => {
      try {
        state.outputs.prompt = buildPromptText();
      } catch (err) {
        console.error('Build Prompt failed:', err);
        state.outputs.prompt = `Build Prompt error: ${err?.message || err}`;
      }
      updateHiddenDirective();
      renderOutputs();
      // Auto-navigate to Outputs so mobile users can see results
      try { selectTab('outputs'); } catch (_) { /* ignore */ }
      try { addPromptHistory(state.outputs.prompt); } catch (_) {}
      try { postBuildAchievements(); } catch (_) {}
    });
  const copyBtn = document.getElementById('copy-ai-prompt');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = (state.outputs.prompt || '').trim();
      if (!text) {
        flashButton(copyBtn, 'Nothing to copy', 900);
        return;
      }
      try {
        await copyToClipboard(text);
        flashButton(copyBtn, 'Copied!', 900);
        try { unlockAchievement('promptCopier','Prompt Copier'); } catch(_){}
      } catch (err) {
        console.error('Copy failed', err);
        flashButton(copyBtn, 'Copy failed', 1200);
      }
    });
  }

  const copyBriefBtn = document.getElementById('copy-brief');
  if (copyBriefBtn) {
    copyBriefBtn.addEventListener('click', async () => {
      const text = (state.outputs.brief || '').trim();
      if (!text) {
        flashButton(copyBriefBtn, 'Nothing to copy', 900);
        return;
      }
      try {
        await copyToClipboard(text);
        flashButton(copyBriefBtn, 'Copied!', 900);
        try { unlockAchievement('briefCopier','Brief Copier'); } catch(_){}
      } catch (err) {
        console.error('Copy failed', err);
        flashButton(copyBriefBtn, 'Copy failed', 1200);
      }
    });
  }

  const copySunoBtn = document.getElementById('copy-suno');
  if (copySunoBtn) {
    copySunoBtn.addEventListener('click', async () => {
      const text = (state.outputs.suno || '').trim();
      if (!text) {
        flashButton(copySunoBtn, 'Nothing to copy', 900);
        return;
      }
      try {
        await copyToClipboard(text);
        flashButton(copySunoBtn, 'Copied!', 900);
        try { unlockAchievement('sunoCopier','Suno Copier'); } catch(_){}
      } catch (err) {
        console.error('Copy failed', err);
        flashButton(copySunoBtn, 'Copy failed', 1200);
      }
    });
  }
  document.getElementById('call-ai').addEventListener('click', async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    button.disabled = true;
    state.outputs.aiResponse = 'Calling AI...';
    renderOutputs();
    try {
      const result = await callAI();
      state.outputs.aiResponse = result;
      try { unlockAchievement('apiCaller','API Caller'); } catch(_){}
    } catch (error) {
      state.outputs.aiResponse = `API error: ${error.message}`;
    } finally {
      button.disabled = false;
      renderOutputs();
    }
  });
  document.getElementById('apply-genre-mix').addEventListener('click', () => {
    const analysis = analyzeGenreMix(state.genreMix);
    state.genreAnalysis = analysis.mix.length ? analysis : null;
    if (analysis.mix.length) {
      if (analysis.styleTagsCsv) {
        state.creativeInputs.styleTags = analysis.styleTagsCsv;
        renderCreativeInputs();
      }
      const summary = [
        `Mix: ${analysis.mixSummary}`,
        `Feel: ${analysis.tempoHint}`,
        analysis.structureHint ? `Structure: ${cleanStructureDisplay(analysis.structureHint)}` : '',
        analysis.excludeCsv ? `Exclude: ${analysis.excludeCsv}` : '',
        analysis.sfxCsv ? `SFX: ${analysis.sfxCsv}` : ''
      ].filter(Boolean).join('\n');
      if (!state.outputs.brief || state.outputs.brief.includes('Creative brief will appear')) {
        state.outputs.brief = summary;
        renderOutputs();
      }
    } else {
      state.outputs.brief = 'Add at least one genre (and optional weights) before applying the mix.';
      renderOutputs();
    }
  });
  document.getElementById('open-genre-library').addEventListener('click', () => {
    openLibraryDialog('Genre Library', buildGenreLibraryTable());
  });
  document.getElementById('open-accent-library').addEventListener('click', () => {
    openLibraryDialog('Accent Library', buildAccentLibraryTable());
  });
  document.getElementById('close-dialog').addEventListener('click', () => closeDialog());

  // Header/toolbar app actions
  const saveBtn = document.getElementById('save-state');
  const loadBtn = document.getElementById('load-state');
  const resetBtn = document.getElementById('reset-state');
  const themeBtn = document.getElementById('theme-toggle');
  if (saveBtn) saveBtn.addEventListener('click', () => { saveState(); showToast('Saved settings'); });
  if (loadBtn) loadBtn.addEventListener('click', () => { const ok = loadState(); showToast(ok ? 'Loaded settings' : 'No saved settings'); rerenderAll(); });
  if (resetBtn) resetBtn.addEventListener('click', () => { resetState(); showToast('Reset to defaults'); rerenderAll(); });
  if (themeBtn) themeBtn.addEventListener('click', () => { toggleTheme(); showToast(`Theme: ${getTheme().toUpperCase()}`); });
  const motionBtn = document.getElementById('motion-toggle');
  if (motionBtn) motionBtn.addEventListener('click', () => { const prefs = getPrefs(); prefs.reduceMotion = !prefs.reduceMotion; setPrefs(prefs); applyMotionPref(); showToast(`Motion: ${prefs.reduceMotion ? 'OFF' : 'ON'}`); });
  // Hero quick actions
  const heroBrowse = document.getElementById('open-genre-library-hero');
  const heroBuild = document.getElementById('build-prompt-hero');
  const demoTop = document.getElementById('demo-mode');
  const demoHero = document.getElementById('demo-mode-hero');
  if (heroBrowse) heroBrowse.addEventListener('click', () => openLibraryDialog('Genre Library', buildGenreLibraryTable()));
  if (heroBuild) heroBuild.addEventListener('click', () => {
    try {
      state.outputs.prompt = buildPromptText();
    } catch (err) {
      console.error('Build Prompt failed:', err);
      state.outputs.prompt = `Build Prompt error: ${err?.message || err}`;
    }
    updateHiddenDirective();
    renderOutputs();
    try { selectTab('outputs'); } catch (_) {}
    showToast('Prompt built');
    try { addPromptHistory(state.outputs.prompt); } catch (_) {}
    try { postBuildAchievements(); } catch (_) {}
  });
  const loadDemo = () => { try { applyDemoPreset(); showToast('Demo loaded'); rerenderAll(); } catch (e) { console.error(e); } };
  if (demoTop) demoTop.addEventListener('click', () => { loadDemo(); try { unlockAchievement('demoExplorer','Demo Explorer'); } catch(_){} });
  if (demoHero) demoHero.addEventListener('click', () => { loadDemo(); try { unlockAchievement('demoExplorer','Demo Explorer'); } catch(_){} });

  // Trophies
  const trophiesBtn = document.getElementById('open-trophies');
  if (trophiesBtn) trophiesBtn.addEventListener('click', () => openLibraryDialog('Trophies', buildTrophiesContent()));
  const gamesBtn = document.getElementById('open-games');
  if (gamesBtn) gamesBtn.addEventListener('click', () => openLibraryDialog('Game Hub (Wireframe)', buildGameHubDialog()));
  const guideBtn = document.getElementById('open-guide');
  if (guideBtn) guideBtn.addEventListener('click', () => openLibraryDialog('How to Earn Trophies', buildTrophyGuideContent()));

  // Wizard controls
  try {
    const wzToggle = document.getElementById('wizard-toggle');
    const wzPrev = document.getElementById('wizard-prev');
    const wzNext = document.getElementById('wizard-next');
    if (wzToggle) wzToggle.addEventListener('click', () => { setWizardActive(!wizard.active); renderWizardBar(); });
    if (wzPrev) wzPrev.addEventListener('click', () => { gotoWizardStep(wizard.step - 1); });
    if (wzNext) wzNext.addEventListener('click', () => {
      if (wizard.step >= wizard.steps.length - 1) {
        // Finish: Build prompt and go to Outputs
        try {
          state.outputs.prompt = buildPromptText();
        } catch (err) {
          console.error('Build Prompt failed:', err);
          state.outputs.prompt = `Build Prompt error: ${err?.message || err}`;
        }
        updateHiddenDirective();
        renderOutputs();
        try { selectTab('outputs'); } catch (_) {}
        showToast('Prompt built');
        try { addPromptHistory(state.outputs.prompt); } catch (_) {}
        try { postBuildAchievements(); } catch (_) {}
      } else {
        gotoWizardStep(wizard.step + 1);
      }
    });
  } catch (_) {}

  // Suggest buttons
  const premBtn = document.getElementById('premise-suggest');
  if (premBtn) premBtn.addEventListener('click', () => { const s = suggestPremise(); state.premise = '(custom)'; state.customPremise = s; renderPremise(); showToast('Premise suggested'); try { unlockAchievement('muse','Muse'); } catch(_){} try { scheduleSave(); } catch(_){} });
  const genreBtn = document.getElementById('genre-suggest');
  if (genreBtn) genreBtn.addEventListener('click', () => { suggestGenreBlend(); renderGenreMix(); recompute(); showToast('Blend suggested'); try { unlockAchievement('djBlend','Blend DJ'); } catch(_){} try { scheduleSave(); } catch(_){} });
  const genrePresetsBtn = document.getElementById('genre-presets');
  if (genrePresetsBtn) genrePresetsBtn.addEventListener('click', () => openLibraryDialog('Blend Presets', buildGenrePresetDialog()));

  // Wizard Fix It action
  const wzFix = document.getElementById('wizard-fix');
  if (wzFix) wzFix.addEventListener('click', () => wizardFixCurrentStep());
}

function applyPreset(name) {
  const preset = WEIGHT_PRESETS[name];
  if (!preset) return;
  state.weights = { ...preset };
  renderWeights();
  recompute();
  try {
    const g = getGamify();
    g.presetUses = (g.presetUses || 0) + 1; setGamify(g);
    if (g.presetUses === 1) unlockAchievement('presetDriver','Preset Driver');
    if (g.presetUses === 5) unlockAchievement('presetMaestro','Preset Maestro');
  } catch(_){}
}

function openLibraryDialog(title, content) {
  const dialog = document.getElementById('library-dialog');
  document.getElementById('dialog-title').textContent = title;
  const contentEl = document.getElementById('dialog-content');
  contentEl.innerHTML = '';
  contentEl.appendChild(content);
  if (typeof dialog.showModal === 'function') {
    dialog.showModal();
  } else {
    dialog.setAttribute('open', 'true');
  }
}

function closeDialog() {
  const dialog = document.getElementById('library-dialog');
  if (dialog.hasAttribute('open')) {
    dialog.close();
  }
}

function buildGenreLibraryTable() {
  const table = document.createElement('table');
  table.className = 'library-table';
  table.innerHTML = `<thead>
    <tr>
      <th>Genre</th>
      <th>Tempo</th>
      <th>Structure</th>
      <th>Style Tags</th>
      <th>Exclude</th>
      <th>SFX</th>
    </tr>
  </thead>`;

  // Helpers to format cells
  const toChips = (list) => {
    const safe = (s) => String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<div class="chips">${list.filter(Boolean).map(x => `<span class="chip">${safe(x.trim())}</span>`).join('')}</div>`;
  };
  const splitStructure = (text) => {
    const raw = String(text || '').trim();
    if (!raw) return [];
    // Split on the VBA artifact token a-' or a-’ and clean pieces
    return raw.split(/\s*a-[\'’]\s*/i).map(s => s.trim()).filter(Boolean);
  };
  const splitCsv = (text) => String(text || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const tbody = document.createElement('tbody');
  GENRE_LIBRARY.forEach(item => {
    const row = document.createElement('tr');
    const name = String(item.name || '').trim();
    const tempo = String(item.tempo || '').trim();
    const structureParts = splitStructure(item.structure);
    const styleParts = splitCsv(item.styleTags);
    const excludeParts = splitCsv(item.exclude);
    const sfxParts = splitCsv(item.sfx);

    row.innerHTML = `
      <td>${name}</td>
      <td>${tempo}</td>
      <td>${toChips(structureParts)}</td>
      <td>${toChips(styleParts)}</td>
      <td>${toChips(excludeParts)}</td>
      <td>${toChips(sfxParts)}</td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
}

function buildAccentLibraryTable() {
  const table = document.createElement('table');
  table.className = 'library-table';
  table.innerHTML = `<thead>
    <tr>
      <th>Accent</th>
      <th>Instruction</th>
      <th>Style Tag</th>
    </tr>
  </thead>`;
  const tbody = document.createElement('tbody');
  ACCENT_LIBRARY.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.instruction}</td>
      <td>${item.styleTag}</td>
    `;
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  return table;
}
function buildCreativeBrief() {
  if (!state.computed || !state.computed.blocks) {
    recompute();
  }
  const computed = state.computed;
  if (!computed || !computed.blocks) {
    return 'Provide input values to compute scores before generating a brief.';
  }

  const analysis = state.genreAnalysis || analyzeGenreMix(state.genreMix);
  const phonetic = getPhoneticMode(state.accent);

  const Sn = (state.baseInputs.structure || 0) / 10;
  const Vn = (state.baseInputs.versatility || 0) / 10;
  const Reg = computed.blocks.regularizer || 0;

  let tempo;
  const core = computed.blocks.core || 0;
  const tech = computed.blocks.tech || 0;
  const anthem = computed.blocks.anthem || 0;
  if (anthem >= 0.8 && core >= 0.8) tempo = 'energetic, anthemic pocket';
  else if (tech >= 0.7 && core >= 0.75) tempo = 'tight pocket, agile bounce';
  else tempo = 'modern groove, confident bounce';

  let structure;
  if (Sn >= 0.75 && Vn >= 0.6) {
    structure = "Intro 4 a-' Hook 8 a-' Verse1 16 a-' Hook 8 a-' Verse2 16 a-' Bridge 4-8 a-' Hook 8 a-' Outro 4";
  } else if (Sn >= 0.6) {
    structure = "Intro 4 a-' Hook 8 a-' Verse 16 a-' Hook 8 a-' Verse 16 a-' Hook 8";
  } else {
    structure = "Intro 2 a-' Hook 8 a-' Verse 12 a-' Hook 8 a-' Verse 12 a-' Hook 8";
  }

  let hookPlan;
  if (anthem >= 0.8) {
    hookPlan = 'Chantable 4-6 words; 2-bar call/response; gang vox last 2 bars';
  } else if (anthem >= 0.65) {
    hookPlan = 'Memorable phrase + micro-melody; doubles on bars 5-8';
  } else {
    hookPlan = 'Understated hook; verse motif leads; optional post-hook ad-lib';
  }
  if ((computed.blocks.sync || 0) < 0.7) hookPlan += ' - Re-cut for pocket (phi_f high).';

  let flowPlan;
  let rhymePlan;
  if (tech >= 0.75 && Reg >= 0.95) {
    flowPlan = 'Two switch-ups per 16; brief double-time burst.';
    rhymePlan = '2-4 internal multis/line; end-rhyme chain every 2 bars.';
  } else if (tech >= 0.6) {
    flowPlan = 'One switch-up per 16; pocket-first.';
    rhymePlan = '1-2 internal multis/line; consistent end-rhyme.';
  } else {
    flowPlan = 'Single flow per verse; diction-forward.';
    rhymePlan = 'End-rhyme only; occasional internal.';
  }
  if (Reg < 0.9) rhymePlan += ' - R low: simplify one scheme/verse.';

  let adlibs;
  if ((computed.blocks.perf || 0) >= 0.7) {
    adlibs = 'Hook: main + double + L/R backs; Verses: backs on bars 13-16; hype ad-libs on punchlines (+/-30% pan).';
  } else {
    adlibs = 'Hook: single double; Verses: sparse ad-libs on key punchlines.';
  }

  let audience;
  const groupF = computed.blocks.group || 0;
  if (groupF >= 0.75) {
    audience = 'Add 2 local slang + 1 place/object + 1 shared pain/goal.';
  } else if (groupF >= 0.6) {
    audience = 'Broad references; one subtle nod.';
  } else {
    audience = 'Keep universal messaging.';
  }

  let vibe;
  const styleSig = computed.blocks.styleSig || 0;
  if (styleSig >= 0.75) vibe = 'Distinct timbre; signature phrase repeats tastefully';
  else if (styleSig < 0.6) vibe = 'Minimal FX; diction forward';
  else vibe = 'Cohesive tone; one tasteful delay throw';

  const mixSummary = state.genreAnalysis ? state.genreAnalysis.mixSummary : (analysis.mixSummary || 'Custom blend');

  const lines = [
    'Creative Brief (Auto-generated)',
    '',
    `Final Score: ${formatNumber(computed.final.clamped, 1)}`,
    `Feel: ${analysis.tempoHint || tempo}`,
    `Structure: ${cleanStructureDisplay(analysis.structureHint || structure)}`,
    `Hook Plan: ${hookPlan}`,
    `Flow Plan: ${flowPlan}`,
    `Rhyme Plan: ${rhymePlan}`,
    `Ad-libs: ${adlibs}`,
    `Audience: ${audience}`,
    `Style/Vibe: ${vibe}`,
    `Phonetic Mode: ${phonetic.instruction}`,
    `Genre Mix: ${mixSummary}`
  ];
  return lines.join('\n');
}
function buildSunoBlocks() {
  if (!state.computed || !state.computed.blocks) {
    recompute();
  }
  const computed = state.computed;
  if (!computed || !computed.blocks) {
    return { blocksText: 'Compute scores before generating Suno blocks.' };
  }

  const analysis = state.genreAnalysis || analyzeGenreMix(state.genreMix);
  const phonetic = getPhoneticMode(state.accent);
  const styleLine = appendStyleAccent(analysis.styleBlock || '[custom genre blend]', phonetic.styleTag);
  const exclude = (analysis.excludeCsv || 'pop, edm, hyperpop, house').toLowerCase();

  const hookUser = state.userSections.hook ? state.userSections.hook.split(/\r?\n/) : [];
  const verse1User = state.userSections.verse1 ? state.userSections.verse1.split(/\r?\n/) : [];
  const verse2User = state.userSections.verse2 ? state.userSections.verse2.split(/\r?\n/) : [];
  const introUser = state.userSections.intro ? state.userSections.intro.split(/\r?\n/) : [];
  const bridgeUser = state.userSections.bridge ? state.userSections.bridge.split(/\r?\n/) : [];
  const outroUser = state.userSections.outro ? state.userSections.outro.split(/\r?\n/) : [];

  const anthem = computed.blocks.anthem || 0;
  const groupF = computed.blocks.group || 0;
  const tech = computed.blocks.tech || 0;
  const styleSig = computed.blocks.styleSig || 0;

  const generatedIntro = buildIntro();
  const generatedHook = buildHook(analysis, anthem, groupF);
  const generatedHookEvolve = buildHookEvolve();
  const generatedVerse1 = buildVerse(tech, styleSig, 1);
  const generatedVerse2 = buildVerse(tech, styleSig, 2);
  const generatedBridge = buildBridge(styleSig, groupF);
  const generatedOutro = buildOutro();

  let lyrics = [];
  if (phonetic.label.toLowerCase() !== ACCENT_DEFAULT.toLowerCase()) {
    lyrics.push(`[Pronunciation] ${phonetic.instruction}`);
  }
  lyrics.push('[Producer Tag] iMob Worldwide!');
  lyrics.push('');
  lyrics.push(...chooseBlock('Intro', introUser, generatedIntro));
  lyrics.push(...chooseBlock('Hook', hookUser, generatedHook));
  lyrics.push(...chooseBlock('Verse 1', verse1User, generatedVerse1));
  lyrics.push(...chooseBlock('HOOK - reprise', hookUser, generatedHookEvolve));
  lyrics.push(...chooseBlock('Verse 2', verse2User, generatedVerse2));
  lyrics.push(...chooseBlock('Bridge', bridgeUser, generatedBridge));
  lyrics.push(...chooseBlock('Outro', outroUser, generatedOutro));

  lyrics = applyPhoneticSpelling(lyrics, phonetic.label);

  const title = state.userSections.titleIdea?.trim() || suggestTitle(computed.final.clamped);
  const blocksText = [
    '```',
    title,
    '```',
    '```',
    styleLine,
    '```',
    '```',
    exclude,
    '```',
    '```',
    lyrics.join('\n'),
    '```'
  ].join('\n');

  return { blocksText };
}

function buildPromptText() {
  if (!state.computed || !state.computed.blocks) {
    recompute();
  }
  const computed = state.computed;
  if (!computed || !computed.blocks) {
    return 'Provide input values to compute scores before building the prompt.';
  }

  const analysis = state.genreAnalysis || analyzeGenreMix(state.genreMix);
  const phonetic = getPhoneticMode(state.accent);
  const Sn = (state.baseInputs.structure || 0) / 10;
  const Vn = (state.baseInputs.versatility || 0) / 10;
  const Reg = computed.blocks.regularizer || 0;
  const core = computed.blocks.core || 0;
  const tech = computed.blocks.tech || 0;
  const anthem = computed.blocks.anthem || 0;
  const styleSig = computed.blocks.styleSig || 0;
  const groupF = computed.blocks.group || 0;

  let tempo;
  if (anthem >= 0.8 && (computed.blocks.sync || 0) >= 0.8) tempo = 'energetic, anthemic pocket';
  else if (tech >= 0.7 && core >= 0.75) tempo = 'tight pocket, agile bounce';
  else tempo = 'modern groove, confident bounce';

  let structure;
  if (Sn >= 0.75 && Vn >= 0.6) structure = "Intro 4 a-' Hook 8 a-' Verse1 16 a-' Hook 8 a-' Verse2 16 a-' Bridge 4-8 a-' Hook 8 a-' Outro 4";
  else if (Sn >= 0.6) structure = "Intro 4 a-' Hook 8 a-' Verse 16 a-' Hook 8 a-' Verse 16 a-' Hook 8";
  else structure = "Hook 8 a-' Verse 12 a-' Hook 8 a-' Verse 12 a-' Hook 8";

  let hookPlan;
  if (anthem >= 0.8) hookPlan = 'Chantable 4-6 words; 2-bar call/response; gang vox last 2 bars';
  else if (anthem >= 0.65) hookPlan = 'Memorable phrase + micro-melody; doubles on bars 5-8';
  else hookPlan = 'Understated hook; verse motif drives; optional post-hook ad-lib';
  if ((computed.blocks.sync || 0) < 0.7) hookPlan += ' - Re-cut for pocket (phi_f high).';

  let flowPlan;
  let rhymePlan;
  if (tech >= 0.75 && Reg >= 0.95) {
    flowPlan = 'Two switch-ups per 16; brief double-time burst';
    rhymePlan = '2-4 internal multis/line; end-rhyme chain every 2 bars';
  } else if (tech >= 0.6) {
    flowPlan = 'One switch-up per 16; pocket-first';
    rhymePlan = '1-2 internal multis/line; consistent end-rhyme';
  } else {
    flowPlan = 'Single flow per verse; diction-forward';
    rhymePlan = 'End-rhyme only; occasional internal';
  }
  if (Reg < 0.9) rhymePlan += ' - R low: simplify one scheme/verse.';

  let vibe;
  if (styleSig >= 0.75) vibe = 'Distinct timbre; signature phrase repeats tastefully';
  else if (styleSig < 0.6) vibe = 'Minimal FX; diction forward';
  else vibe = 'Cohesive tone; one tasteful delay throw';

  let audienceLine;
  if (groupF >= 0.75) audienceLine = 'Add 2 local slang + 1 place/object + 1 shared pain/goal.';
  else if (groupF >= 0.6) audienceLine = 'Broad references; one subtle nod.';
  else audienceLine = 'Keep universal messaging.';

  const lockedSections = buildLockedSections();
  const styleTagsCombined = [
    analysis.styleTagsCsv || '',
    state.creativeInputs.styleTags || '',
    phonetic.styleTag || ''
  ].filter(Boolean).join(', ');

  const lines = [];
  // Resolve final output language early for use below
  const __langSel = (state.language || 'English');
  const __langFinal = (__langSel.toLowerCase && __langSel.toLowerCase() === '(custom)') ? (state.customLanguage || 'English') : __langSel;
  lines.push("You are Suno v5 Lyrical Expert - iMob Worldwide. Generate a completely original song.");
  lines.push("Output exactly four code blocks, in this order: 1) title 2) style 3) exclude 4) lyrics.");
  lines.push("Formatting rules (MANDATORY):");
  // Universality and language handling
  lines.push(`- Write all lyrics in ${__langFinal}.`);
  lines.push("- Keep all meta tags in English regardless of lyric language (e.g., [HOOK], [Verse 1]).");
  lines.push("- Use globally understandable phrasing; avoid region-specific slang unless provided in user sections.");
  lines.push("- Only adapt conventions common across languages (e.g., bar counts, chorus structure), not culture-specific wordplay.");
  lines.push("- All meta tags/directives must be in [square brackets] (e.g., [HOOK], [Verse 1], [Bridge], [Outro], [Chant]).");
  lines.push("- Alternate voices / ad-libs go in (parentheses): (yeah), (echo), (crowd: ay!).");
  lines.push("- Any noises/SFX go in bracketed asterisks: [* cheer *], [* breath *], [* bass drop *].");
  lines.push("- The Style block is a single bracketed list of tags separated by pipes (example: [anthemic rap | chant hook | evolving chorus | confident bounce]).");
  lines.push("- Exclude block is lowercase nouns, comma-separated.");
  lines.push("- Begin lyrics with: [Producer Tag] iMob Worldwide!");
  lines.push("- 3+ minutes; evolving choruses; stage cues in [brackets]; call-and-response via (parentheses).");
  lines.push("- Do NOT reference production gear, BPM, mixing jargon, or arrangement terms unless explicitly requested.");
  lines.push("- Do NOT reference any instruments in the lyrics.");
  lines.push("");
  lines.push(`Final Score: ${formatNumber(computed.final.clamped, 1)}`);
  lines.push(`Tempo / Feel: ${analysis.tempoHint || tempo}`);
  lines.push(`Structure: ${cleanStructureDisplay(analysis.structureHint || structure)}`);
  lines.push(`Hook Plan: ${hookPlan}`);
  lines.push(`Flow Plan: ${flowPlan}`);
  lines.push(`Rhyme Plan: ${rhymePlan}`);
  lines.push(`Style / Vibe: ${vibe}`);
  lines.push(`Phonetic Accent: ${phonetic.label}`);
  lines.push(`Language: ${__langFinal}`);
  lines.push(`Audience: ${audienceLine}`);
  // Adapt phonetic instruction to selected language where appropriate (e.g., Neutral instruction)
  let __instr = String(phonetic.instruction || '');
  // Replace standalone 'English' with selected language (avoids modifying names/tags since we only touch instruction)
  __instr = __instr.replace(/\bEnglish\b/gi, __langFinal);
  lines.push(`Phonetics: ${__instr}`);
  const cheat = buildPhoneticCheatsheet(phonetic.label);
  if (cheat.length) {
    lines.push('Phonetic details for this accent:');
    cheat.forEach(line => lines.push(`- ${line}`));
  }
  lines.push(`Genre Mix: ${analysis.mixSummary || "custom blend"}`);
  if (analysis.sfxCsv) lines.push(`Suggested SFX: ${analysis.sfxCsv}`);
  lines.push("");
  if (state.creativeInputs.theme) lines.push(`Theme: ${state.creativeInputs.theme}`);
  if (state.creativeInputs.keywords) lines.push(`Keywords: ${state.creativeInputs.keywords}`);
  if (state.creativeInputs.mustInclude) lines.push(`Must include: ${state.creativeInputs.mustInclude}`);
  if (state.creativeInputs.forbidden) lines.push(`Forbidden: ${state.creativeInputs.forbidden}`);
  if (styleTagsCombined) lines.push(`Style tags: ${styleTagsCombined}`);
  if (state.creativeInputs.specificInstruments) lines.push(`Specific instruments: ${state.creativeInputs.specificInstruments}`);
  if (state.creativeInputs.lengthTarget) lines.push(`Length target (minutes): ${state.creativeInputs.lengthTarget}`);
  if (state.creativeInputs.audienceNotes) lines.push(`Audience notes: ${state.creativeInputs.audienceNotes}`);
  lines.push(`Premise focus: ${resolvePremise()}`);
  lines.push("");
  // External directives (user-specified), one-per-line
  const extraDirectives = String(state.creativeInputs.externalDirectives || '')
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(Boolean);
  if (extraDirectives.length) {
    lines.push('Additional directives:');
    extraDirectives.forEach(d => lines.push(`- ${d}`));
    lines.push('');
  }
  if (lockedSections.length) {
    lines.push("LOCKED SECTIONS (use verbatim; only write missing parts):");
    lockedSections.forEach(line => lines.push(line));
    lines.push("");
  }
  lines.push("If any rule is broken, fix and re-output without commentary.");
  // Uppercase directive appended at the very end for extra emphasis
  lines.push(`REWRITE the lyrics phonetically in the selected accent, in ${__langFinal}.`);
  return lines.join('\n');

}

// Compact phonetic guidance per accent to steer pronunciation beyond simple spellings
function buildPhoneticCheatsheet(label) {
  const L = (label || '').toLowerCase();
  const map = {
    'american english (general)': [
      'Rhotic: keep /r/ at syllable ends (car ? car).',
      'Vowels: relatively flat; avoid extreme shifts.',
      'Rhythm: stress-timed, neutral intonation.'
    ],
    'american english (southern)': [
      'Monophthongize /ai/ (time ? tahm).',
      'Lengthen open vowels (ride ? raahd).',
      'Pin/pen merger in many words (pen ? pin).',
      'Often weaken post-vocalic /r/.'
    ],
    'american english (new york)': [
      'Non-/semi-rhotic: drop /r/ after vowels (car ? caw).',
      'Diphthong raising (coffee ? caw-fee).',
      "'Short-a' split (man ? may-an)."
    ],
    'american english (midwest)': [
      'Rhotic; moderate /a/ tensing (block ? blaaack in Inland North).',
      'cot/caught often merged.',
      'Clear, even vowels.'
    ],
    'american english (west coast)': [
      'Fronted /u/ (dude ? deewd).',
      'Relaxed consonants, casual delivery.',
      'Uptalk appears in some lines.'
    ],
    'british english (rp)': [
      'Non-rhotic: drop /r/ after vowels (car ? cah).',
      'Long broad /a/ (dance ? dahns).',
      'Crisp consonants; careful enunciation.'
    ],
    'british english (london)': [
      'Glottal stops (bottle ? bo’ul).',
      'TH-fronting (think ? fink).',
      'L-vocalisation (milk ? miwk).'
    ],
    'british english (liverpool)': [
      'Scouse: sing-song, nasal quality.',
      'look ? lewk; soft /k/ toward fricatives.',
      'Distinct rising-falling melody.'
    ],
    'scottish english': [
      'Rhotic with trilled or tapped /r/.',
      'down ? doon; vowel length rules apply.',
      'Clipped rhythm; clear consonants.'
    ],
    'irish english': [
      'Musical lilt; rising end contours.',
      'time ? toime; right ? roight.',
      'Soft /t/ may edge toward /ch/ (but stay intelligible).'
    ],
    'australian english': [
      'Non-rhotic; broad diphthongs (mate ? maayt).',
      'Flattened vowels (today ? tuh-die).',
      'Rising terminals in phrases.'
    ],
    'new zealand english': [
      'Fronted short vowels (fish ? fush, pen ? pin).',
      'Smooth cadence with gentle rise.',
      'Non-rhotic.'
    ],
    'south african english': [
      'Rounded diphthongs (now ? naow).',
      'Clipped delivery; often non-rhotic.',
      'yes ? yis in casual speech.'
    ],
    'nigerian english': [
      'Stress-timed; clear, steady vowels.',
      'Retroflex consonants may appear.',
      'Distinct lengthening on stressed syllables.'
    ],
    'jamaican english': [
      'Patois influence (this ? dis, them ? dem).',
      'Non-rhotic; strong rhythmic swing.',
      'Syllable timing closer to beat.'
    ],
    'caribbean english (trinidad)': [
      'thing ? ting; sing-song intonation.',
      'Syllable-timed rhythm; clipped consonants.'
    ],
    'spanish-influenced english': [
      'Syllable-timed; open pure vowels (no diphthongs).',
      'th ? t/d; v ? b in some positions.',
      'Tapped/rolled r; steady pace.'
    ],
    'hindi-influenced english': [
      'Rhotic; retroflex /t/ /d/.',
      'th ? t/d; v/w distinctions may shift.',
      'Syllable-timed rhythm; precise diction.'
    ],
    'somali english accent': [
      'Percussive consonants; clipped vowels.',
      'Raised long vowels (now ? naaw).',
      'Lifted phrase endings.'
    ],
    'filipino english': [
      'Syllable-timed; bright vowels.',
      'f ? p and v ? b substitutions appear.',
      'Flat intonation compared to American.'
    ],
    'mandarin-accented english': [
      'Tone-influenced rhythm; even pacing.',
      'Non-rhotic; soften consonant clusters.',
      'Clear, simple vowels.'
    ],
    'cantonese-accented english': [
      'R/L may interchange (rice ? lice).',
      'Tonal cadence; clipped vowels.',
      'Non-rhotic tendencies.'
    ],
    'french-accented english': [
      'Front vowels; uvular /r/.',
      'Drop some final consonants softly.',
      'Even, legato rhythm.'
    ],
    'german-accented english': [
      'Crisp stops; strong /r/.',
      'Long tense vowels; precise diction.'
    ],
    'italian-accented english': [
      'Open pure vowels; expressive cadence.',
      'Trilled/tapped /r/; syllable-timed.'
    ],
    'arabic-accented english': [
      'Emphatic consonants; deep vowels.',
      'th ? t/d; rhythm with strong stress.'
    ],
    'turkish-accented english': [
      'Rounded vowels; firm stops.',
      'Syllable-timed with clear stress.'
    ],
    'greek-accented english': [
      'Open vowels; softened consonants.',
      'Lyrical cadence; steady rhythm.'
    ],
    'russian-accented english': [
      'Hard consonants; strong /r/.',
      'Reduced articles; deliberate pacing.'
    ]
  };
  return map[L] || [];
}

function chooseBlock(label, userLines, generatedLines) {
  if (Array.isArray(userLines) && userLines.filter(Boolean).length) {
    return [`[${label}]`, ...userLines.filter(Boolean)];
  }
  if (Array.isArray(generatedLines) && generatedLines.length) {
    return generatedLines;
  }
  return [];
}

function suggestTitle(score) {
  if (score >= 90) return 'Prime Cosine (RGF Run-Up)';
  if (score >= 80) return 'Phi In The Pocket (RGF Anthem)';
  return 'Function on Fire (RGF Build)';
}
function buildIntro() {
  const prem = resolvePremise();
  const lines = ['[Intro]'];
  switch (prem) {
    case 'love & loyalty':
      lines.push("Kept it close when the world felt cold (you know).");
      lines.push("(we still here) -- what we hold, we won't fold.");
      break;
    case 'heartbreak & healing':
      lines.push("Took a hit to the heart, learned to breathe through the ache.");
      lines.push("(slow deep breaths) -- healing don't rush, but it stays.");
      break;
    case 'hustle & ambition':
      lines.push("Early light on my face, same promise I made.");
      lines.push("(no days off) -- what I said, I became.");
      break;
    case 'betrayal & trust':
      lines.push("Saw the cracks in the circle, learned the names in the dust.");
      lines.push("(lesson learned) -- now the line is a must.");
      break;
    case 'triumph & celebration':
      lines.push("Hands high for the wins we bled for.");
      lines.push("(say it loud) -- we ain't going back poor.");
      break;
    case 'redemption & growth':
      lines.push("Wrote wrongs into rights with a calm in my chest.");
      lines.push("(step by step) -- I'm answering my own test.");
      break;
    case 'city pride & belonging':
      lines.push("Block by block, wrote my name in the cracks.");
      lines.push("(we from here) -- and we ain't turning our backs.");
      break;
    default:
      lines.push("Storm after storm, I learned how to stand.");
      lines.push("(hold tight) -- turn the weight into plans.");
  }
  return lines;
}

function buildHook(analysis, anthem, groupF) {
  const prem = resolvePremise();
  const lines = ['[HOOK]'];
  switch (prem) {
    case 'love & loyalty':
      lines.push("If I'm down, you lift -- that's us, no myth (yeah).");
      lines.push("When the dark talk big, our bond don't shift (nope).");
      lines.push("(right now) say it -- we don't quit.");
      lines.push("Run it back, two hearts, one script.");
      break;
    case 'heartbreak & healing':
      lines.push("I broke, then I learned how to carry my name (carry my name).");
      lines.push("Scars talk low but they point to the change (point to the change).");
      lines.push("If pain call back, I don't answer the same (nope).");
      lines.push("I love me more -- that's the lane.");
      break;
    case 'hustle & ambition':
      lines.push("Clock say go, I\'m already gone (already gone).");
      lines.push("Talk stay cheap, my work is the song (work is the song).");
      lines.push("Dreams got legs -- watch how they run (watch how they run).");
      lines.push("Pay me in proof, let the echo stay sung.");
      break;
    default:
      lines.push("We carry the fire like it\'s part of the skin.");
      lines.push("Call out the pain then we turn it to wins.");
      lines.push("(hands high) keep the wave locked in.");
      lines.push("Say it twice so the echo stays in.");
  }
  return lines;
}

function buildHookEvolve() {
  const prem = resolvePremise();
  const lines = ['[HOOK - reprise]'];
  switch (prem) {
    case 'love & loyalty':
      lines.push("If the night turns cold, our light still speaks.");
      lines.push("Two hearts synced, no fall, no leaks.");
      break;
    case 'heartbreak & healing':
      lines.push("If tears come back, they just rinse the frame.");
      lines.push("I see me clear -- I keep that same.");
      break;
    case 'hustle & ambition':
      lines.push("From plan to proof -- that\'s page by page.");
      lines.push("My name on the door -- not staged.");
      break;
    default:
      lines.push("The heavy became the handle I hold.");
      lines.push("I carry the weight like it\'s gold.");
  }
  return lines;
}
function buildVerse(tech, styleSig, verseNumber) {
  const prem = resolvePremise();
  const lines = [`[Verse ${verseNumber}]`];
  const bars = tech >= 0.75 ? 12 : tech >= 0.6 ? 10 : 8;
  for (let i = 1; i <= bars; i++) {
    switch (prem) {
      case 'love & loyalty':
        lines.push(i % 2 === 1 ? 'You held me down when the rumor got loud -- I remember that.' : "Every vow wasn't typed, but we live it -- that's the better pact.");
        break;
      case 'heartbreak & healing':
        lines.push(i % 2 === 1 ? 'I kept a mirror I avoided -- now I face it calm.' : 'I let the darkness write a verse -- then I took the psalm.');
        break;
      case 'hustle & ambition':
        lines.push(i % 2 === 1 ? 'Made a list, crossed it out -- now the list got long.' : "I don't chase what ain't mine -- I build my own.");
        break;
      case 'betrayal & trust':
        lines.push(i % 2 === 1 ? 'Close range cuts hurt deeper -- I learned the cost.' : 'Trust is a gate with a code -- some people lost.');
        break;
      case 'triumph & celebration':
        lines.push(i % 2 === 1 ? 'We made a toast to the nights that could\'ve broke us quick.' : "Now every step is a gift -- we don't trip on rich.");
        break;
      case 'redemption & growth':
        lines.push(i % 2 === 1 ? 'I wore my flaws like armor -- then I learned to shed.' : "Growth ain't loud -- it's the quiet I kept instead.");
        break;
      case 'city pride & belonging':
        lines.push(i % 2 === 1 ? 'Corner store stories and names on the mail.' : 'Dreams fit better when they come with the trail.');
        break;
      default:
        lines.push(i % 2 === 1 ? 'Pressure made diamonds -- it also made peace I earn.' : 'Every closed door was a hinge for a turn.');
    }
    if (styleSig >= 0.7 && i % 3 === 0) {
      lines.push("(say it back) -- we live what we learn.");
    }
  }
  return lines;
}

function buildBridge(styleSig, groupF) {
  if (styleSig < 0.55) return [];
  const prem = resolvePremise();
  const lines = ['[Bridge]'];
  switch (prem) {
    case 'love & loyalty':
      lines.push("If the crowd goes quiet -- you can hear our proof.");
      lines.push("(it's us) -- no need for the boost.");
      break;
    case 'heartbreak & healing':
      lines.push("I stitched what tore -- not to hide the seam.");
      lines.push("(look close) -- those lines still gleam.");
      break;
    case 'hustle & ambition':
      lines.push("Tomorrow don\'t start if I\'m stuck on last.");
      lines.push("(move now) -- make the future fast.");
      break;
    case 'betrayal & trust':
      lines.push("Kept my circle honest, let the edges fade.");
      lines.push("(stand close) -- trust is made.");
      break;
    default:
      lines.push("If pain is a teacher, I\'m ahead in class.");
      lines.push("(eyes up) -- I will pass.");
  }
  if (groupF >= 0.7) lines.push('(call back) -- let the crowd react.');
  return lines;
}

function buildOutro() {
  const prem = resolvePremise();
  const lines = ['[Outro]'];
  switch (prem) {
    case 'love & loyalty':
      lines.push("When the lights cut low, we still glow -- that\'s trust.");
      lines.push("(til the end) -- it\'s us.");
      break;
    case 'heartbreak & healing':
      lines.push("What was heavy ain't gone -- it just don't own me.");
      lines.push("(I\'m whole) -- let it be.");
      break;
    case 'hustle & ambition':
      lines.push("Day done, but the proof stays loud in the book.");
      lines.push("(sign it) -- take a look.");
      break;
    default:
      lines.push("If tomorrow's a hill -- I'm already mid-climb.");
      lines.push("(no fear) -- I got time.");
  }
  return lines;
}
function resolvePremise() {
  const mode = (state.premise || '').trim().toLowerCase();
  if (mode === '(custom)') {
    const c = (state.customPremise || '').trim();
    if (c) return c.toLowerCase();
    // fall through to auto detection if empty
  } else if (mode && mode !== '(auto)') {
    return mode;
  }
  const theme = (state.creativeInputs.theme || '').toLowerCase();
  const keywords = (state.creativeInputs.keywords || '').toLowerCase();
  const audience = (state.creativeInputs.audienceNotes || '').toLowerCase();
  const haystack = `${theme} ${keywords} ${audience}`;
  if (haystack.includes('love') || haystack.includes('loyal')) return 'love & loyalty';
  if (haystack.includes('heartbreak') || haystack.includes('breakup') || haystack.includes('broken')) return 'heartbreak & healing';
  if (haystack.includes('hustle') || haystack.includes('grind') || haystack.includes('ambition')) return 'hustle & ambition';
  if (haystack.includes('betray') || haystack.includes('lies') || haystack.includes('snake')) return 'betrayal & trust';
  if (haystack.includes('win') || haystack.includes('victory') || haystack.includes('champion')) return 'triumph & celebration';
  if (haystack.includes('redemption') || haystack.includes('forgive') || haystack.includes('aton')) return 'redemption & growth';
  if (haystack.includes('city') || haystack.includes('hometown') || haystack.includes('neighborhood')) return 'city pride & belonging';
  if (haystack.includes('struggle') || haystack.includes('persevere') || haystack.includes('survive')) return 'struggle & perseverance';
  if (haystack.includes('freedom') || haystack.includes('escape')) return 'freedom & escape';
  if (haystack.includes('nostalgia') || haystack.includes('memory') || haystack.includes('childhood')) return 'nostalgia & memory';
  if (haystack.includes('rebel') || haystack.includes('defiance') || haystack.includes('resist') || haystack.includes('protest')) return 'rebellion & defiance';
  if (haystack.includes('identity') || haystack.includes('self') || haystack.includes('becoming')) return 'self-discovery & identity';
  if (haystack.includes('faith') || haystack.includes('prayer') || haystack.includes('doubt')) return 'faith & doubt';
  if (haystack.includes('sacrifice') || haystack.includes('cost')) return 'ambition & sacrifice';
  if (haystack.includes('legacy') || haystack.includes('family') || haystack.includes('ancestors')) return 'legacy & family';
  if (haystack.includes('loss') || haystack.includes('grief') || haystack.includes('gone')) return 'loss & remembrance';
  if (haystack.includes('hope') || haystack.includes('renewal') || haystack.includes('reborn')) return 'hope & renewal';
  if (haystack.includes('summer') || haystack.includes('party') || haystack.includes('club')) return 'party & vibe';
  if (haystack.includes('distance') || haystack.includes('far') || haystack.includes('apart') || haystack.includes('miles')) return 'long-distance & yearning';
  if (haystack.includes('anxiety') || haystack.includes('therapy') || haystack.includes('mind')) return 'mental health & healing';
  if (haystack.includes('money') || haystack.includes('power') || haystack.includes('status')) return 'money & power';
  if (haystack.includes('fame') || haystack.includes('pressure') || haystack.includes('spotlight')) return 'fame & pressure';
  if (haystack.includes('street') || haystack.includes('survival') || haystack.includes('hunger')) return 'survival & street wisdom';
  if (haystack.includes('addiction') || haystack.includes('recovery') || haystack.includes('sober')) return 'addiction & recovery';
  if (haystack.includes('revenge') || haystack.includes('payback')) return 'betrayal & revenge';
  if (haystack.includes('underdog') || haystack.includes('come-up') || haystack.includes('come up')) return 'underdog & come-up';
  if (haystack.includes('gratitude') || haystack.includes('humble')) return 'gratitude & humility';
  if (haystack.includes('nature') || haystack.includes('calm') || haystack.includes('ocean')) return 'nature & calm';
  if (haystack.includes('technology') || haystack.includes('isolation') || haystack.includes('alone')) return 'technology & isolation';
  if (haystack.includes('community') || haystack.includes('together') || haystack.includes('solidarity')) return 'community & solidarity';
  if (haystack.includes('wanderlust') || haystack.includes('travel') || haystack.includes('homecoming')) return 'wanderlust & homecoming';
  const pool = [
    'love & loyalty', 'heartbreak & healing', 'hustle & ambition', 'betrayal & trust',
    'triumph & celebration', 'redemption & growth', 'city pride & belonging', 'struggle & perseverance',
    'freedom & escape', 'nostalgia & memory', 'rebellion & defiance', 'self-discovery & identity',
    'faith & doubt', 'ambition & sacrifice', 'legacy & family', 'loss & remembrance',
    'hope & renewal', 'party & vibe', 'long-distance & yearning', 'mental health & healing',
    'money & power', 'fame & pressure', 'survival & street wisdom', 'addiction & recovery',
    'betrayal & revenge', 'underdog & come-up', 'gratitude & humility', 'nature & calm',
    'technology & isolation', 'community & solidarity', 'wanderlust & homecoming'
  ];
  if (Math.random() < 0.7) {
    for (let tries = 0; tries < 8; tries++) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (pick !== __lastPremise) { __lastPremise = pick; return pick; }
    }
    const fallback = pool[Math.floor(Math.random() * pool.length)];
    __lastPremise = fallback; return fallback;
  }
  const left = ['love','heartbreak','hustle','betrayal','triumph','redemption','city pride','struggle','freedom','nostalgia','rebellion','identity','faith','ambition','legacy','loss','hope','party','distance','healing','money','fame','survival','recovery','underdog','gratitude','nature','technology','community','wanderlust'];
  const right = ['loyalty','healing','ambition','trust','celebration','growth','belonging','perseverance','escape','memory','defiance','self-discovery','doubt','sacrifice','family','remembrance','renewal','vibe','yearning','balance','power','pressure','street wisdom','comeback','come-up','humility','calm','isolation','solidarity','homecoming'];
  for (let tries = 0; tries < 12; tries++) {
    const a = left[Math.floor(Math.random() * left.length)];
    const b = right[Math.floor(Math.random() * right.length)];
    const result = `${a} & ${b}`;
    if (a !== b && result !== __lastPremise) { __lastPremise = result; return result; }
  }
  return 'struggle & perseverance';
}

function updateHiddenDirective() {
  try {
    const el = document.getElementById('hidden-phonetic-directive');
    if (!el) return;
    const langSel = (state.language || 'English');
    const langFinal = (langSel.toLowerCase ? langSel.toLowerCase() : '') === '(custom)'
      ? (state.customLanguage || 'English')
      : langSel;
    // Invisible on the page; clear and set directive
    el.textContent = `REWRITE the lyrics phonetically in the selected accent, in ${langFinal}.`;
  } catch (_) {
    // no-op
  }
}

async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
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

function flashButton(btn, label, delay = 800) {
  const original = btn.textContent;
  btn.textContent = label;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = original;
    btn.disabled = false;
  }, delay);
}

function init() {
  // Apply theme from previous session and compact density
  applyTheme(getTheme());
  try { loadState(); } catch (_) {}
  try { document.body.classList.add('density-compact'); } catch (_) {}
  // Ensure close button glyph renders correctly regardless of HTML encoding
  try { const btn = document.getElementById('close-dialog'); if (btn) btn.textContent = '×'; } catch (_) {}
  renderConstants();
  renderControls();
  renderWeights();
  renderBaseInputs();
  renderDerivedInputs();
  renderCreativeInputs();
  renderGenreMix();
  renderPremise();
  renderAccent();
  renderLanguage();
  renderUserSections();
  recompute();
  renderAISettings();
  renderOutputs();
  updateHiddenDirective();
  renderPromptHistory();
  try { renderReadiness(); } catch (_) {}
  try { renderWizardBar(); } catch (_) {}
  applyMotionPref();
  setupButtons();
  setupTabs();
  const backBtn = document.getElementById('back-to-inputs');
  if (backBtn) backBtn.addEventListener('click', () => { try { selectTab('inputs'); window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (_) {} });
  // Onboarding on first run
  try {
    const seen = localStorage.getItem(__ONBOARD_KEY);
    if (!seen) showOnboarding();
  } catch (_) {}
}

document.addEventListener('DOMContentLoaded', init);

// Enhance UX with collapsible sections and toolbar controls
document.addEventListener('DOMContentLoaded', setupCollapsibleSections);

function setupCollapsibleSections() {
  const sections = Array.from(document.querySelectorAll('.panel-group > section'));
  const storeKey = 'rgf_collapsed_sections_v1';
  let collapsed = [];
  try { collapsed = JSON.parse(localStorage.getItem(storeKey) || '[]'); } catch (_) { collapsed = []; }

  const slug = (text) => (text || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  sections.forEach(section => {
    const h3 = section.querySelector('h3');
    if (!h3) return;
    const id = section.dataset.id || slug(h3.textContent);
    section.dataset.id = id;
    h3.setAttribute('role', 'button');
    h3.setAttribute('tabindex', '0');
    const isCollapsed = collapsed.includes(id);
    section.classList.toggle('collapsed', isCollapsed);
    h3.setAttribute('aria-expanded', String(!isCollapsed));

    const toggle = (force) => {
      const willCollapse = typeof force === 'boolean' ? !force : !section.classList.contains('collapsed');
      section.classList.toggle('collapsed', willCollapse);
      h3.setAttribute('aria-expanded', String(!willCollapse));
      const set = new Set(collapsed);
      if (willCollapse) set.add(id); else set.delete(id);
      collapsed = Array.from(set);
      try { localStorage.setItem(storeKey, JSON.stringify(collapsed)); } catch (_) {}
    };

    h3.addEventListener('click', () => toggle());
    h3.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      if (e.key === 'ArrowRight') toggle(true);
      if (e.key === 'ArrowLeft') toggle(false);
    });
  });

  const collapseAll = document.getElementById('collapse-all');
  const expandAll = document.getElementById('expand-all');
  if (collapseAll) collapseAll.addEventListener('click', () => {
    sections.forEach(s => s.classList.add('collapsed'));
    sections.forEach(s => { const h3 = s.querySelector('h3'); if (h3) h3.setAttribute('aria-expanded', 'false'); });
    const ids = sections.map(s => s.dataset.id).filter(Boolean);
    try { localStorage.setItem(storeKey, JSON.stringify(ids)); } catch (_) {}
  });
  if (expandAll) expandAll.addEventListener('click', () => {
    sections.forEach(s => s.classList.remove('collapsed'));
    sections.forEach(s => { const h3 = s.querySelector('h3'); if (h3) h3.setAttribute('aria-expanded', 'true'); });
    try { localStorage.setItem(storeKey, JSON.stringify([])); } catch (_) {}
  });
}

// Global tab selector so other handlers (e.g., Build Prompt) can navigate
function selectTab(tab) {
  const inputsBtn = document.getElementById('tab-inputs');
  const outputsBtn = document.getElementById('tab-outputs');
  const aiBtn = document.getElementById('tab-ai');
  const panels = {
    inputs: document.getElementById('scoring-panel'),
    outputs: document.getElementById('outputs-panel')
  };
  const aiPrompt = document.getElementById('ai-prompt-section');
  const aiCall = document.getElementById('ai-call-section');
  const suno = document.getElementById('suno-section');
  const brief = document.getElementById('creative-brief-section');

  if (inputsBtn && outputsBtn && aiBtn) {
    inputsBtn.setAttribute('aria-selected', String(tab === 'inputs'));
    outputsBtn.setAttribute('aria-selected', String(tab === 'outputs'));
    aiBtn.setAttribute('aria-selected', String(tab === 'ai'));
  }
  if (panels.inputs && panels.outputs) {
    panels.inputs.style.display = (tab === 'inputs') ? '' : 'none';
    panels.outputs.style.display = (tab === 'inputs') ? 'none' : '';
  }
  if (tab === 'ai') {
    if (aiPrompt) aiPrompt.style.display = '';
    if (aiCall) aiCall.style.display = '';
    if (suno) suno.style.display = 'none';
    if (brief) brief.style.display = 'none';
  } else if (tab === 'outputs') {
    if (aiPrompt) aiPrompt.style.display = '';
    if (aiCall) aiCall.style.display = '';
    if (suno) suno.style.display = '';
    if (brief) brief.style.display = '';
    // Ensure outputs panel is scrolled into view on mobile
    const outPanel = document.getElementById('outputs-panel');
    try { if (outPanel) outPanel.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) {}
  }
}

function setupTabs() {
  const inputsBtn = document.getElementById('tab-inputs');
  const outputsBtn = document.getElementById('tab-outputs');
  const aiBtn = document.getElementById('tab-ai');
  if (!inputsBtn || !outputsBtn || !aiBtn) return;

  inputsBtn.addEventListener('click', () => selectTab('inputs'));
  outputsBtn.addEventListener('click', () => selectTab('outputs'));
  aiBtn.addEventListener('click', () => selectTab('ai'));

  // default to Inputs
  selectTab('inputs');
}
function buildLockedSections() {
  const sections = [
    { id: 'titleIdea', label: 'TITLE' },
    { id: 'intro', label: 'INTRO' },
    { id: 'hook', label: 'HOOK' },
    { id: 'verse1', label: 'VERSE 1' },
    { id: 'verse2', label: 'VERSE 2' },
    { id: 'bridge', label: 'BRIDGE' },
    { id: 'outro', label: 'OUTRO' }
  ];
  const locked = [];
  sections.forEach(section => {
    const raw = (state.userSections[section.id] || '').trim();
    if (!raw) return;
    locked.push(`[${section.label}]`);
    raw.split(/\r?\n/).forEach(line => {
      if (line.trim().length) locked.push(line.trim());
    });
  });
  return locked;
}

async function callAI() {
  const endpoint = (state.aiSettings.endpoint || '').trim();
  const apiKey = (state.aiSettings.apiKey || '').trim();
  if (endpoint.length === 0) throw new Error('Endpoint URL is required.');
  if (apiKey.length < 10) throw new Error('API key appears to be missing.');

  const prompt = buildPromptText();
  state.outputs.prompt = prompt;

  const systemPrompt = state.aiSettings.systemPrompt || 'You are a lyrical assistant. Output only valid Suno blocks as instructed.';
  const userMessage = { role: 'user', content: prompt };
  if (state.aiSettings.userLabel) {
    userMessage.name = state.aiSettings.userLabel;
  }

  let responseFormat;
  try {
    responseFormat = JSON.parse(state.aiSettings.responseFormat || '{"type":"text"}');
  } catch (err) {
    responseFormat = { type: 'text' };
  }

  const payload = {
    model: state.aiSettings.model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      userMessage
    ],
    temperature: Number(state.aiSettings.temperature) || 0,
    top_p: Number(state.aiSettings.topP) || 1,
    frequency_penalty: Number(state.aiSettings.frequencyPenalty) || 0,
    presence_penalty: Number(state.aiSettings.presencePenalty) || 0,
    max_tokens: Number(state.aiSettings.maxTokens) || 1200,
    response_format: responseFormat
  };

  const stopSequences = (state.aiSettings.stopSequences || '').split(',').map(s => s.trim()).filter(Boolean);
  if (stopSequences.length) payload.stop = stopSequences;

  const controller = new AbortController();
  const timeoutMs = Number(state.aiSettings.timeoutMs) || 60000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };
  if (state.aiSettings.organization) {
    headers['OpenAI-Organization'] = state.aiSettings.organization;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
    signal: controller.signal
  });
  clearTimeout(timeoutId);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  const data = await response.json();
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content.trim();
  }
  return JSON.stringify(data, null, 2);
}

// ---------- UX helpers: Toasts, Theme, Persistence ----------
function showToast(message, ms = 1500) {
  try {
    const root = document.getElementById('toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; }, Math.max(500, ms - 250));
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, ms);
  } catch (_) { /* no-op */ }
}

function getTheme() {
  try { return localStorage.getItem(__THEME_KEY) || 'light'; } catch (_) { return 'light'; }
}
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem(__THEME_KEY, theme); } catch (_) {}
}
function toggleTheme() {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function saveState() {
  const payload = JSON.stringify(state);
  try { localStorage.setItem(__STATE_KEY, payload); return true; } catch (_) { return false; }
}
function loadState() {
  try {
    const raw = localStorage.getItem(__STATE_KEY);
    if (!raw) return false;
    const saved = JSON.parse(raw);
    Object.assign(state.controls, saved.controls || {});
    Object.assign(state.weights, saved.weights || {});
    Object.assign(state.baseInputs, saved.baseInputs || {});
    Object.assign(state.derivedInputs, saved.derivedInputs || {});
    Object.assign(state.creativeInputs, saved.creativeInputs || {});
    state.genreMix = Array.isArray(saved.genreMix) ? saved.genreMix : state.genreMix;
    state.premise = saved.premise || state.premise;
    state.customPremise = typeof saved.customPremise === 'string' ? saved.customPremise : state.customPremise;
    state.accent = saved.accent || state.accent;
    Object.assign(state.userSections, saved.userSections || {});
    Object.assign(state.aiSettings, saved.aiSettings || {});
    return true;
  } catch (_) {
    return false;
  }
}
function resetState() {
  const fresh = buildDefaultState();
  Object.assign(state.controls, fresh.controls);
  Object.assign(state.weights, fresh.weights);
  Object.assign(state.baseInputs, fresh.baseInputs);
  Object.assign(state.derivedInputs, fresh.derivedInputs);
  Object.assign(state.creativeInputs, fresh.creativeInputs);
  state.genreMix = fresh.genreMix;
  state.premise = fresh.premise;
  state.customPremise = fresh.customPremise;
  state.accent = fresh.accent;
  Object.assign(state.userSections, fresh.userSections);
  Object.assign(state.aiSettings, fresh.aiSettings);
  state.outputs = fresh.outputs;
  state.computed = null;
  state.genreAnalysis = null;
}
function rerenderAll() {
  renderConstants();
  renderControls();
  renderWeights();
  renderBaseInputs();
  renderDerivedInputs();
  renderCreativeInputs();
  renderGenreMix();
  renderPremise();
  renderAccent();
  renderLanguage();
  renderUserSections();
  recompute();
  renderAISettings();
  renderOutputs();
  updateHiddenDirective();
  renderPromptHistory();
}

// Debounced autosave: persist state across restarts without manual Save
let __saveTimer = null;
function scheduleSave(delay = 400) {
  if (__saveTimer) clearTimeout(__saveTimer);
  __saveTimer = setTimeout(() => { try { saveState(); } catch (_) {} }, delay);
}

// Generic listeners to catch most changes without touching every handler
document.addEventListener('input', () => { try { scheduleSave(600); } catch (_) {} });
document.addEventListener('change', () => { try { scheduleSave(600); } catch (_) {} });

// Keep derived UI (readiness/wizard bar) in sync with edits
  document.addEventListener('input', () => { try { renderReadiness(); renderWizardBar(); } catch (_) {} });
  document.addEventListener('change', () => { try { renderReadiness(); renderWizardBar(); } catch (_) {} });
  document.addEventListener('input', () => { try { checkUserSectionAchievements(); checkGenreAchievements(); } catch(_){} });
  document.addEventListener('change', () => { try { checkUserSectionAchievements(); checkGenreAchievements(); } catch(_){} });

// ---------- Readiness meter ----------
function computeReadiness() {
  let score = 0;
  let total = 0;
  // Weights sum close to 1
  total += 1; const wsum = Object.values(state.weights).reduce((a,b)=>a+Number(b||0),0); if (Math.abs(wsum-1) < 0.02) score += 1; else if (Math.abs(wsum-1) < 0.08) score += 0.6; else score += 0.2;
  // At least one genre with weight
  total += 1; const anyGenre = state.genreMix.some(s => (s.genre||s.customGenre) && (s.weight||0)>0); score += anyGenre ? 1 : 0.1;
  // Premise picked
  total += 1; const premOk = (state.premise && state.premise.length); score += premOk ? 1 : 0.2;
  // Accent picked
  total += 1; const accOk = (state.accent && state.accent.length); score += accOk ? 1 : 0.2;
  // Some creative input
  total += 1; const creativeOk = (state.creativeInputs.styleTags || state.creativeInputs.keywords); score += creativeOk ? 1 : 0.3;
  // User sections optional but bonus if title/hook provided
  total += 1; const hookOk = (state.userSections.hook && state.userSections.hook.trim().length>0) || (state.userSections.titleIdea && state.userSections.titleIdea.trim().length>0); score += hookOk ? 1 : 0.5;
  const pct = Math.max(0, Math.min(100, Math.round((score/total)*100)));
  return pct;
}
function renderReadiness() {
  const pct = computeReadiness();
  const val = document.getElementById('readiness-value');
  const bar = document.getElementById('readiness-bar');
  if (val) val.textContent = `${pct}%`;
  if (bar) bar.style.width = `${pct}%`;
}

function checkUserSectionAchievements() {
  try {
    const sections = state.userSections || {};
    const nonEmpty = Object.entries(sections).filter(([k,v]) => typeof v === 'string' && v.trim().length > 0).map(([k])=>k);
    if (nonEmpty.length >= 1) unlockAchievement('lyricist','Lyricist');
    if (nonEmpty.length >= 3) unlockAchievement('composer','Composer');
  } catch(_){}
}
function checkGenreAchievements() {
  try {
    const g = getGamify();
    g.genresUsed = Array.isArray(g.genresUsed) ? g.genresUsed : [];
    (state.genreMix||[]).forEach(s => { const key=(s.genre||s.customGenre||'').toLowerCase().trim(); if(key && !g.genresUsed.includes(key)) g.genresUsed.push(key); });
    setGamify(g);
    if (g.genresUsed.length >= 5) unlockAchievement('crateDigger','Crate Digger');
    if (g.genresUsed.length >= 10) unlockAchievement('crateCurator','Crate Curator');
  } catch(_){}
}

// ---------- Wizard Mode ----------
const wizard = {
  active: false,
  step: 0,
  steps: [
    { id: 'weights', matcher: (h3) => /weights/i.test(h3.textContent || '') },
    { id: 'genre', matcher: (h3) => /genre mix/i.test(h3.textContent || '') },
    { id: 'premise', matcher: (h3) => /premise.*phonetics/i.test(h3.textContent || '') },
    { id: 'user', matcher: (h3) => /user sections/i.test(h3.textContent || '') },
    { id: 'build', matcher: (h3) => /scores|outputs/i.test(h3.textContent || '') }
  ]
};
function setWizardActive(active) {
  wizard.active = !!active;
  const bar = document.getElementById('wizard-bar');
  if (bar) bar.hidden = !wizard.active;
  if (!wizard.active) {
    document.querySelectorAll('.panel-group > section').forEach(sec => sec.classList.remove('wizard-hidden','wizard-highlight'));
    return;
  }
  try { unlockAchievement('apprenticeWizard','Apprentice Wizard'); } catch(_){}
  gotoWizardStep(0);
}
function gotoWizardStep(idx) {
  wizard.step = Math.max(0, Math.min(wizard.steps.length - 1, idx));
  renderWizardBar();
  const sections = Array.from(document.querySelectorAll('#scoring-panel .panel-group > section'));
  const h3s = sections.map(sec => sec.querySelector('h3'));
  let targetIndex = -1;
  for (let i=0;i<h3s.length;i++) {
    const h3 = h3s[i]; if (!h3) continue;
    if (wizard.steps[wizard.step].matcher(h3)) { targetIndex = i; break; }
  }
  sections.forEach((sec, i) => {
    if (i === targetIndex) { sec.classList.remove('wizard-hidden'); sec.classList.add('wizard-highlight'); }
    else { sec.classList.add('wizard-hidden'); sec.classList.remove('wizard-highlight'); }
  });
  if (wizard.steps[wizard.step].id === 'build') {
    try { selectTab('outputs'); } catch (_) {}
    const btn = document.getElementById('build-prompt');
    if (btn) { btn.scrollIntoView({ behavior: 'smooth', block: 'center' }); btn.classList.add('wizard-highlight'); setTimeout(() => btn.classList.remove('wizard-highlight'), 1500); }
    try { unlockAchievement('wizardGraduate','Wizard Graduate'); } catch(_){}
  } else {
    try { selectTab('inputs'); } catch (_) {}
    const target = sections[targetIndex]; if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
function renderWizardBar() {
  const bar = document.getElementById('wizard-bar');
  const toggle = document.getElementById('wizard-toggle');
  if (toggle) toggle.textContent = wizard.active ? 'Wizard: On' : 'Wizard';
  if (!bar) return;
  bar.hidden = !wizard.active;
  const steps = Array.from(bar.querySelectorAll('.wizard-step'));
  steps.forEach(el => {
    const stepNum = Number(el.getAttribute('data-step'));
    el.classList.toggle('active', stepNum === wizard.step);
    el.classList.toggle('done', stepNum < wizard.step);
  });
  const wzPrev = document.getElementById('wizard-prev');
  const wzNext = document.getElementById('wizard-next');
  const wzFix = document.getElementById('wizard-fix');
  if (wzPrev) wzPrev.disabled = wizard.step <= 0;
  if (wzNext) wzNext.textContent = wizard.step >= wizard.steps.length - 1 ? 'Finish' : 'Next';
  // Gate Next on minimal requirements
  const info = wizardRequirements();
  const hintEl = document.getElementById('wizard-hint');
  if (hintEl) hintEl.textContent = info.hint || '';
  if (wzNext) wzNext.disabled = !info.ok && wizard.step < wizard.steps.length - 1;
  if (wzFix) {
    wzFix.hidden = !info.canFix;
    wzFix.textContent = info.fixLabel || 'Fix It';
  }
}

// Demo preset: populate a sensible default state
function applyDemoPreset() {
  try {
    // Weights: Streaming preset if available
    const preset = WEIGHT_PRESETS?.streaming || null;
    if (preset) {
      state.weights = { ...preset };
    } else {
      // fallback to balanced
      const keys = Object.keys(state.weights||{});
      const equal = 1 / Math.max(1, keys.length);
      keys.forEach(k => state.weights[k] = +(equal.toFixed(2)));
    }
    // Genre mix
    const mix = state.genreMix || [];
    if (mix[0]) { mix[0].genre = 'trap'; mix[0].customGenre = ''; mix[0].weight = 50; }
    if (mix[1]) { mix[1].genre = 'afrobeats'; mix[1].customGenre = ''; mix[1].weight = 30; }
    if (mix[2]) { mix[2].genre = 'r&b'; mix[2].customGenre = ''; mix[2].weight = 20; }
    for (let i=3;i<mix.length;i++) { mix[i].genre=''; mix[i].customGenre=''; mix[i].weight=0; }
    // Premise & accent
    state.premise = '(custom)';
    state.customPremise = 'underdog & comeback';
    try { state.accent = ACCENT_LIBRARY?.[0]?.name || state.accent; } catch(_){}
    // Creative hints
    if (state.creativeInputs) {
      state.creativeInputs.styleTags = 'anthemic, modern, energetic';
      state.creativeInputs.keywords = 'crowd, radio, midnight';
    }
  } catch (e) { console.error('applyDemoPreset failed', e); }
}

function wizardRequirements() {
  const current = wizard.steps[wizard.step]?.id;
  let ok = true;
  let hint = '';
  let canFix = false;
  let fixLabel = '';
  if (current === 'weights') {
    const sum = Object.values(state.weights).reduce((a,b)=>a+Number(b||0),0);
    ok = Math.abs(sum - 1) < 0.05;
    if (!ok) { hint = 'Adjust weights to total ~1.00'; canFix = true; fixLabel = 'Normalize Weights'; }
  } else if (current === 'genre') {
    const any = state.genreMix.some(s => (s.genre||s.customGenre) && (s.weight||0) > 0);
    ok = any; if (!ok) { hint = 'Add at least one genre with weight > 0'; canFix = true; fixLabel = 'Suggest Blend'; }
  } else if (current === 'premise') {
    const premOk = (state.premise && state.premise.length);
    const accOk = (state.accent && state.accent.length);
    ok = premOk && accOk; if (!ok) { hint = 'Choose a premise and an accent'; canFix = true; fixLabel = 'Auto-Choose'; }
  } else if (current === 'user') {
    ok = true; hint = 'Optional: add a title or hook';
  } else if (current === 'build') {
    ok = true; hint = '';
  }
  return { ok, hint, canFix, fixLabel };
}

function wizardFixCurrentStep() {
  const current = wizard.steps[wizard.step]?.id;
  if (current === 'weights') {
    normalizeWeights();
    renderWeights();
    recompute();
    showToast('Weights normalized');
  } else if (current === 'genre') {
    suggestGenreBlend();
    renderGenreMix();
    recompute();
    showToast('Suggested a starter blend');
  } else if (current === 'premise') {
    // Ensure premise and accent are set
    if (!state.premise || state.premise === '(auto)') {
      const s = suggestPremise();
      state.premise = '(custom)';
      state.customPremise = s;
      renderPremise();
    }
    if (!state.accent) {
      try { state.accent = ACCENT_LIBRARY[0]?.name || state.accent; } catch(_){}
      renderAccent();
    }
    updateHiddenDirective();
    showToast('Filled in premise and accent');
  }
  // Refresh gating
  renderWizardBar();
  try { scheduleSave(); } catch(_){}
}

function normalizeWeights() {
  const keys = Object.keys(state.weights || {});
  const vals = keys.map(k => Number(state.weights[k] || 0));
  const sum = vals.reduce((a,b)=>a+b,0);
  if (sum <= 0) {
    const equal = 1 / (keys.length || 1);
    keys.forEach(k => { state.weights[k] = +(equal.toFixed(4)); });
    return;
  }
  keys.forEach((k,i) => { state.weights[k] = +( (vals[i] / sum).toFixed(4) ); });
}

// ---------- Prompt history (localStorage) ----------
function getPromptHistory() {
  try {
    const raw = localStorage.getItem(__HIST_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}
function setPromptHistory(list) {
  try { localStorage.setItem(__HIST_KEY, JSON.stringify(list)); } catch (_) {}
}
function addPromptHistory(text) {
  const t = String(text || '').trim();
  if (!t) return;
  const analysis = state.genreAnalysis || analyzeGenreMix(state.genreMix);
  const computed = state.computed;
  const score = computed?.final?.clamped != null ? formatNumber(computed.final.clamped, 1) : '';
  const langSel = (state.language || 'English');
  const langFinal = (langSel.toLowerCase ? langSel.toLowerCase() : '') === '(custom)' ? (state.customLanguage || 'English') : langSel;
  const entry = {
    ts: Date.now(),
    score,
    accent: state.accent || '',
    language: langFinal || 'English',
    mix: analysis?.mixSummary || '',
    text: t
  };
  const list = getPromptHistory();
  list.unshift(entry);
  while (list.length > 50) list.pop();
  setPromptHistory(list);
  renderPromptHistory();
}
function clearPromptHistory() {
  setPromptHistory([]);
  renderPromptHistory();
}
function renderPromptHistory() {
  const root = document.getElementById('prompt-history-list');
  const clearBtn = document.getElementById('clear-prompt-history');
  if (clearBtn) clearBtn.onclick = () => { clearPromptHistory(); };
  if (!root) return;
  const list = getPromptHistory();
  if (!list.length) {
    root.innerHTML = '<p class="hint">No prompt history yet. Click "Build Prompt" to generate one.</p>';
    return;
  }
  const safe = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const fmt = (ts) => { try { return new Date(ts).toLocaleString(); } catch (_) { return String(ts); } };
  root.innerHTML = list.map((item, idx) => `
    <div class="history-item" data-idx="${idx}" style="border:1px solid var(--panel-border); border-radius:10px; padding:0.6rem; margin:0.5rem 0; background: var(--panel);">
      <div class="history-head" style="display:flex; gap:.5rem; align-items:center; justify-content:space-between;">
        <div style="font-size:.9rem; color: var(--muted);">
          <strong>${safe(item.language)}</strong> • ${safe(item.accent)}${item.score?` • Score ${safe(item.score)}`:''}${item.mix?` • ${safe(item.mix)}`:''}
          <div style="font-size:.8rem;">${safe(fmt(item.ts))}</div>
        </div>
        <div style="display:flex; gap:.4rem;">
          <button type="button" class="ph-copy" data-idx="${idx}">Copy</button>
          <button type="button" class="ph-toggle" data-idx="${idx}">Show</button>
        </div>
      </div>
      <pre class="output-block ph-body" style="display:none; margin-top:.5rem;">${safe(item.text)}</pre>
    </div>
  `).join('');
  root.querySelectorAll('.ph-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.closest('.history-item').querySelector('.ph-body');
      const visible = panel.style.display !== 'none';
      panel.style.display = visible ? 'none' : '';
      btn.textContent = visible ? 'Show' : 'Hide';
    });
  });
  root.querySelectorAll('.ph-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const idx = Number(btn.getAttribute('data-idx'));
      const entry = getPromptHistory()[idx];
      if (!entry) return;
      try { await copyToClipboard(entry.text); flashButton(btn, 'Copied!', 900);} catch(_) { flashButton(btn, 'Copy failed', 1200);} 
    });
  });
}

// ---------- Achievements + Confetti ----------
const __GAMIFY_KEY = 'rgf_gamify_v1';
// Known achievements registry for consistent labeling + icons
const ACHIEVEMENTS = {
  firstPrompt: { label: 'First Prompt!', icon: '✨', desc: 'Build your first prompt.' },
  perfectWeights: { label: 'Perfect Weights', icon: '⚖️', desc: 'Make weights sum to exactly 1.00.' },
  fusionChef: { label: 'Fusion Chef', icon: '🍳', desc: 'Use 3 or more genres in a mix.' },
  build5: { label: '5 Prompts', icon: '5️⃣', desc: 'Build 5 prompts total.' },
  build10: { label: '10 Prompts', icon: '🔟', desc: 'Build 10 prompts total.' },
  build25: { label: '25 Prompts', icon: '🏆', desc: 'Build 25 prompts total.' },
  readyToRoll: { label: 'Ready to Roll', icon: '🚀', desc: 'Reach 100% readiness and build.' },
  streak3: { label: '3-Day Streak', icon: '📆', desc: 'Build prompts 3 days in a row.' },
  streak7: { label: '7-Day Streak', icon: '📅', desc: 'Build prompts 7 days in a row.' },
  apprenticeWizard: { label: 'Apprentice Wizard', icon: '🧙', desc: 'Turn on Wizard Mode.' },
  wizardGraduate: { label: 'Wizard Graduate', icon: '🎓', desc: 'Reach the Build step in Wizard Mode.' },
  demoExplorer: { label: 'Demo Explorer', icon: '🧪', desc: 'Load the demo setup.' },
  muse: { label: 'Muse', icon: '🎨', desc: 'Use Suggest for Premise.' },
  djBlend: { label: 'Blend DJ', icon: '🎛️', desc: 'Use Suggest Blend for Genre Mix.' },
  curator: { label: 'Curator', icon: '🗂️', desc: 'Apply a curated Blend Preset.' },
  promptCopier: { label: 'Prompt Copier', icon: '📋', desc: 'Copy the AI prompt to clipboard.' },
  briefCopier: { label: 'Brief Copier', icon: '📝', desc: 'Copy the Creative Brief.' },
  sunoCopier: { label: 'Suno Copier', icon: '🔊', desc: 'Copy the Suno blocks.' },
  apiCaller: { label: 'API Caller', icon: '🔌', desc: 'Call the AI endpoint successfully.' },
  voiceActor: { label: 'Voice Actor', icon: '🎙️', desc: 'Select a non-neutral accent.' },
  accentExplorer: { label: 'Accent Explorer', icon: '🧭', desc: 'Use 3 or more different accents.' },
  polyglot1: { label: 'Polyglot I', icon: '🌐', desc: 'Select a non-English language.' },
  polyglot2: { label: 'Polyglot II', icon: '🌍', desc: 'Enter a custom language.' },
  polyglotExplorer: { label: 'Polyglot Explorer', icon: '🗺️', desc: 'Use 3 or more different languages.' },
  presetDriver: { label: 'Preset Driver', icon: '🎚️', desc: 'Apply a weight preset.' },
  presetMaestro: { label: 'Preset Maestro', icon: '🏅', desc: 'Apply weight presets 5 times.' },
  lyricist: { label: 'Lyricist', icon: '✍️', desc: 'Enter any user section (title/intro/hook/etc.).' },
  composer: { label: 'Composer', icon: '🎼', desc: 'Enter 3 or more user sections.' },
  crateDigger: { label: 'Crate Digger', icon: '📦', desc: 'Use 5 unique genres across mixes.' },
  crateCurator: { label: 'Crate Curator', icon: '🧰', desc: 'Use 10 unique genres across mixes.' },
  rhythmFirst: { label: 'Rhythm First Round', icon: '🥁', desc: 'Finish a Rhythm Tapper round.' },
  rhythmAce: { label: 'Rhythm Ace', icon: '💯', desc: 'Finish Rhythm with =90% accuracy.' },
  comboMaster: { label: 'Combo Master', icon: '🔥', desc: 'Reach a 30+ combo in Rhythm.' },
  hazardAvoider: { label: 'Hazard Avoider', icon: '🛡️', desc: 'Finish Rhythm with 0 hazards collected.' }
};
function getGamify() {
  try { return JSON.parse(localStorage.getItem(__GAMIFY_KEY) || '{}'); } catch(_) { return {}; }
}
function setGamify(obj) {
  try { localStorage.setItem(__GAMIFY_KEY, JSON.stringify(obj)); } catch(_) {}
}
function unlockAchievement(key, label) {
  const g = getGamify();
  if (g[key]) return false;
  const meta = ACHIEVEMENTS[key] || {};
  g[key] = { unlockedAt: Date.now(), label: label || meta.label || key };
  setGamify(g);
  showToast(`Unlocked: ${g[key].label}`);
  try { fireConfetti(); } catch(_) {}
  return true;
}
function postBuildAchievements() {
  const g = getGamify();
  // First Prompt
  if (!g.firstPrompt) unlockAchievement('firstPrompt', 'First Prompt!');
  // Builds counter milestones
  g.totalBuilds = (g.totalBuilds || 0) + 1;
  setGamify(g);
  if (g.totalBuilds === 5) unlockAchievement('build5','5 Prompts');
  if (g.totalBuilds === 10) unlockAchievement('build10','10 Prompts');
  if (g.totalBuilds === 25) unlockAchievement('build25','25 Prompts');
  // Perfect Weights
  const wsum = Object.values(state.weights).reduce((a,b)=>a+Number(b||0),0);
  if (Math.abs(wsum - 1) < 0.0001) unlockAchievement('perfectWeights', 'Perfect Weights');
  // Fusion Chef (3+ genres weighted)
  const genresUsed = state.genreMix.filter(s => (s.genre||s.customGenre) && (s.weight||0) > 0).length;
  if (genresUsed >= 3) unlockAchievement('fusionChef', 'Fusion Chef');
  // Readiness 100%
  try { const ready = computeReadiness(); if (ready >= 100) unlockAchievement('readyToRoll','Ready to Roll'); } catch(_){}
  // Streaks (calendar days)
  const today = new Date(); const dayKey = today.toISOString().slice(0,10);
  const last = g.lastBuildDay; let streak = g.streak || 0;
  if (last) {
    const prev = new Date(last); const delta = Math.round((today - prev)/86400000);
    if (delta === 1) streak += 1; else if (delta > 1) streak = 1; // same day keeps streak
  } else streak = 1;
  g.streak = streak; g.lastBuildDay = dayKey; setGamify(g);
  if (streak === 3) unlockAchievement('streak3', '3-Day Streak');
  if (streak === 7) unlockAchievement('streak7', '7-Day Streak');
}
function fireConfetti(count = 36) {
  const prefs = getPrefs(); if (prefs.reduceMotion) return;
  const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#B084CC'];
  for (let i=0;i<count;i++) {
    const el = document.createElement('div');
    el.className = 'confetti-piece';
    el.style.left = Math.floor(Math.random()*100) + 'vw';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.animationDelay = (Math.random()*0.2) + 's';
    el.style.transform = `translateY(-20px) rotate(${Math.random()*360}deg)`;
    document.body.appendChild(el);
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 1500);
  }
}
function buildTrophiesContent() {
  const g = getGamify();
  const wrap = document.createElement('div');
  // Progress header
  const knownKeys = Object.keys(ACHIEVEMENTS);
  const unlockedKeys = knownKeys.filter(k => g[k]);
  const pct = Math.round((unlockedKeys.length / knownKeys.length) * 100);
  const header = document.createElement('div');
  header.className = 'trophies-header';
  const ring = document.createElement('div');
  ring.className = 'progress-ring';
  ring.style.background = `conic-gradient(var(--accent) ${pct}%, #e6e6ec 0)`;
  ring.innerHTML = `<span>${pct}%</span>`;
  const summary = document.createElement('div');
  summary.innerHTML = `<div><strong>Trophies</strong></div><div class="trophy-meta">${unlockedKeys.length} / ${knownKeys.length} unlocked</div>`;
  header.appendChild(ring); header.appendChild(summary);
  wrap.appendChild(header);

  // Full list with lock state
  const ul = document.createElement('ul'); ul.className = 'trophy-list';
  knownKeys.forEach(k => {
    const meta = ACHIEVEMENTS[k] || { label: k, icon: '??' };
    const unlocked = !!g[k];
    const li = document.createElement('li'); li.className = 'trophy-item' + (unlocked ? '' : ' locked');
    const when = unlocked ? new Date(g[k].unlockedAt||Date.now()).toLocaleString() : '';
    const safe = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    li.innerHTML = `
      <div class="trophy-icon" title="${safe(meta.desc||'')}">${meta.icon || '??'}</div>
      <div>
        <div title="${safe(meta.desc||'')}">${meta.label || k}</div>
        <div class="trophy-meta">${unlocked ? safe(when) : 'Locked'}</div>
      </div>
    `;
    ul.appendChild(li);
  });
  wrap.appendChild(ul);
  return wrap;
}

function buildTrophyGuideContent() {
  const wrap = document.createElement('div');
  const makeSection = (title, keys) => {
    const sec = document.createElement('section');
    const h = document.createElement('h3'); h.textContent = title; h.style.margin = '8px 0'; sec.appendChild(h);
    const ul = document.createElement('ul'); ul.className = 'trophy-list';
    keys.forEach(k => {
      const meta = ACHIEVEMENTS[k] || { label: k };
      const li = document.createElement('li'); li.className = 'trophy-item';
      li.innerHTML = `<div class="trophy-icon">${meta.icon || '??'}</div><div><div>${meta.label || k}</div><div class="trophy-meta">${meta.desc || ''}</div></div>`;
      ul.appendChild(li);
    });
    sec.appendChild(ul);
    return sec;
  };
  wrap.appendChild(makeSection('Getting Started', ['firstPrompt','demoExplorer','apprenticeWizard']));
  wrap.appendChild(makeSection('Weights & Mix', ['perfectWeights','fusionChef','crateDigger','crateCurator','presetDriver','presetMaestro']));
  wrap.appendChild(makeSection('Languages & Accents', ['polyglot1','polyglot2','polyglotExplorer','voiceActor','accentExplorer']));
  wrap.appendChild(makeSection('Creative & Actions', ['muse','djBlend','curator','lyricist','composer','promptCopier','briefCopier','sunoCopier','apiCaller']));
  wrap.appendChild(makeSection('Consistency', ['build5','build10','build25','streak3','streak7','readyToRoll','wizardGraduate']));
  return wrap;
}

// ---------- Game Hub (Wireframe) ----------
function buildGameHubDialog() {
  const wrap = document.createElement('div');
  const p = document.createElement('p');
  p.className = 'hint';
  p.textContent = 'Select a mode to experiment. These are wireframes: press Sample to preview how results map into the app.';
  wrap.appendChild(p);
  const grid = document.createElement('div');
  grid.style.display = 'grid'; grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))'; grid.style.gap = '12px';
  const mkCard = (title, desc, sampleFn, key, opts = {}) => {
    const card = document.createElement('div');
    card.className = 'panel';
    card.innerHTML = `<h3 style="margin-top:0">${title}</h3><p class="hint" style="margin:0 0 8px">${desc}</p>`;
    const row = document.createElement('div'); row.className = 'inline-buttons';
    const sample = document.createElement('button'); sample.textContent = 'Sample';
    sample.addEventListener('click', () => {
      const out = sampleFn();
      openLibraryDialog(`${title} • Summary`, buildGameSummary(out, key));
    });
    row.appendChild(sample);
    if (opts.start) {
      const start = document.createElement('button'); start.className = 'btn-primary'; start.textContent = 'Start';
      start.addEventListener('click', () => opts.start());
      row.appendChild(start);
    }
    card.appendChild(row);
    return card;
  };
  grid.appendChild(mkCard('Rhythm Tapper', 'Tap notes across lanes to shape genres, tags, and premise.', sampleRhythmOutput, 'rhythm', {
    start: () => {
      resetInputsForGame();
      rerenderAll();
      showToast('Inputs reset for game');
      const content = buildRhythmGameDialog((output) => {
        openLibraryDialog('Rhythm • Summary', buildGameSummary(output, 'rhythm'));
      }, { preset: 'streaming', difficulty: 'normal' });
      openLibraryDialog('Rhythm Tapper', content);
    }
  }));
  grid.appendChild(mkCard('Grid Picker', 'Draft cards over 3–4 turns to compose your blend.', sampleGridOutput, 'grid', {
    start: () => {
      resetInputsForGame();
      rerenderAll();
      showToast('Inputs reset for game');
      const content = buildGridGameDialog((output) => {
        openLibraryDialog('Grid • Summary', buildGameSummary(output, 'grid'));
      }, { difficulty: 'normal' });
      openLibraryDialog('Grid Picker', content);
    }
  }));
  grid.appendChild(mkCard('Shooter (concept)', 'Arena shooter mapping hits to influences.', sampleShooterOutput, 'shooter', {
    start: () => {
      resetInputsForGame();
      rerenderAll();
      showToast('Inputs reset for game');
      const content = buildShooterGameDialog((output) => {
        openLibraryDialog('Shooter • Summary', buildGameSummary(output, 'shooter'));
      }, { durationSec: 60 });
      openLibraryDialog('Shooter (Concept)', content);
    }
  }));
  wrap.appendChild(grid);
  return wrap;
}

// Resets relevant input fields so that game results are applied cleanly
function resetInputsForGame() {
  try {
    // Clear genre mix
    state.genreMix.forEach(slot => { slot.genre=''; slot.customGenre=''; slot.weight=0; });
    // Reset premise and language/accent
    state.premise = '(custom)';
    state.customPremise = '';
    state.language = 'English';
    state.customLanguage = '';
    state.accent = ACCENT_DEFAULT;
    // Clear creative inputs likely influenced by games
    if (state.creativeInputs) {
      state.creativeInputs.styleTags = '';
      state.creativeInputs.keywords = '';
      state.creativeInputs.forbidden = '';
    }
    // Clear user sections (verbatim lyrics)
    if (state.userSections) {
      const keys = ['titleIdea','intro','hook','verse1','verse2','bridge','outro','notes'];
      keys.forEach(k => { if (k in state.userSections) state.userSections[k] = ''; });
    }
    // Clear any prior genre analysis
    state.genreAnalysis = null;
    // Clear Outputs panes (Brief / Suno / Prompt / AI Response)
    if (state.outputs) {
      state.outputs.brief = '';
      state.outputs.suno = '';
      state.outputs.prompt = '';
      state.outputs.aiResponse = '';
    }
    // Drop computed scores so UI doesn't show stale meters
    state.computed = null;
    // Persist
    try { scheduleSave(); } catch (_) {}
  } catch (_) {}
}
function buildGameSummary(output, modeKey) {
  const wrap = document.createElement('div');
  const pre = document.createElement('pre'); pre.className = 'output-block';
  pre.textContent = JSON.stringify(output, null, 2);
  wrap.appendChild(pre);
  const row = document.createElement('div'); row.className = 'inline-buttons';
  const applyBtn = document.createElement('button'); applyBtn.className = 'btn-primary'; applyBtn.textContent = 'Apply to App';
  const buildBtn = document.createElement('button'); buildBtn.textContent = 'Apply + Build';
  row.appendChild(applyBtn); row.appendChild(buildBtn);
  wrap.appendChild(row);
  const apply = () => {
    try {
      applyGameOutput(output);
      unlockAchievement('game_'+modeKey, (modeKey+' mode').replace(/^./,c=>c.toUpperCase()));
      if (modeKey === 'rhythm') {
        // Rhythm-specific achievements
        unlockAchievement('rhythmFirst','Rhythm First Round');
        const acc = Number(output?.meta?.accuracy || 0);
        const combo = Number(output?.meta?.bestCombo || 0);
        const hazards = Array.isArray(output?.forbidden) ? output.forbidden.length : 0;
        if (acc >= 90) unlockAchievement('rhythmAce','Rhythm Ace');
        if (combo >= 30) unlockAchievement('comboMaster','Combo Master');
        if (hazards === 0) unlockAchievement('hazardAvoider','Hazard Avoider');
        // Also leverage existing language/accent achievements
        if ((output.language||'').toLowerCase() !== 'english') unlockAchievement('polyglot1','Polyglot I');
        if ((output.accent||'').toLowerCase().includes('english') === false) unlockAchievement('voiceActor','Voice Actor');
      }
    } catch(_){}
  };
  applyBtn.addEventListener('click', () => { apply(); rerenderAll(); showToast('Applied from game'); });
  buildBtn.addEventListener('click', () => { apply(); rerenderAll(); try { document.getElementById('build-prompt').click(); } catch(_){} });
  return wrap;
}
function applyGameOutput(out) {
  if (!out || typeof out !== 'object') return;
  // Genres ? top N slots
  const slots = (out.genres || []).slice(0, GENRE_SLOTS);
  const total = slots.reduce((a,b)=>a + Number(b.influence||0), 0) || 1;
  state.genreMix.forEach((slot, i) => {
    const src = slots[i];
    if (!src) { slot.genre=''; slot.customGenre=''; slot.weight=0; return; }
    // Try to match to library by name; otherwise (custom)
    const name = findGenreNameClosest(src.name);
    if (name) { slot.genre = name; slot.customGenre = ''; }
    else { slot.genre = '(custom)'; slot.customGenre = String(src.name||''); }
    slot.weight = Math.round((Number(src.influence||0) / total) * GENRE_SLOT_WEIGHT_TOTAL);
  });
  // Premise
  if (out.premise) { state.premise = '(custom)'; state.customPremise = out.premise; }
  // Language/Accent
  if (out.language) state.language = out.language;
  if (out.accent) state.accent = out.accent;
  // Style tags / Keywords / Forbidden
  const uniq = (arr) => Array.from(new Set((arr||[]).map(s => String(s||'').trim()).filter(Boolean)));
  const tags = uniq(out.styleTags);
  // Analyze current genre mix to augment style tags from the library
  try {
    const analysis = analyzeGenreMix(state.genreMix);
    state.genreAnalysis = analysis.mix.length ? analysis : null;
    const libTags = String(analysis.styleTagsCsv || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);
    const mergedTags = uniq(tags.concat(libTags));
    if (mergedTags.length) state.creativeInputs.styleTags = mergedTags.join(', ');
  } catch (_) {
    if (tags.length) state.creativeInputs.styleTags = tags.join(', ');
  }
  const keys = uniq(out.keywords);
  if (keys.length) state.creativeInputs.keywords = keys.join(', ');
  const forb = uniq(out.forbidden);
  if (forb.length) {
    const existing = String(state.creativeInputs.forbidden||'').trim();
    state.creativeInputs.forbidden = uniq((existing?existing.split(','):[]).concat(forb)).join(', ');
  }
  // Theme from premise (if available)
  if (out.premise) {
    state.creativeInputs.theme = out.premise;
  }
  // Length target from meta.duration (seconds ? minutes, 1 decimal)
  try {
    const durSec = Number(out.meta?.duration || 0);
    if (durSec > 0) {
      const minutes = Math.max(0.5, Math.round((durSec/60) * 10) / 10);
      state.creativeInputs.lengthTarget = minutes;
    }
  } catch (_) {}
  // Audience notes from gameplay stats (accuracy/combo/hazards/duration)
  try {
    const acc = Number(out.meta?.accuracy || 0);
    const combo = Number(out.meta?.bestCombo || 0);
    const hazards = forb.length;
    const dur = Number(out.meta?.duration || 0);
    const parts = [];
    if (acc >= 90) parts.push('High timing accuracy');
    else if (acc >= 75) parts.push('Good timing accuracy');
    else if (acc > 0) parts.push('Practice timing');
    if (combo >= 30) parts.push('Sustained long combo');
    else if (combo >= 15) parts.push('Solid combo streaks');
    if (hazards === 0) parts.push('No hazards collected');
    if (dur > 0) parts.push(`Round length ~${Math.round(dur)}s`);
    if (parts.length) {
      const prefix = 'Rhythm stats: ';
      const line = prefix + parts.join('; ') + '.';
      const existing = String(state.creativeInputs.audienceNotes || '').trim();
      state.creativeInputs.audienceNotes = existing ? (existing + (existing.endsWith('.') ? ' ' : '. ') + line) : line;
    }
  } catch (_) {}
}
function findGenreNameClosest(label) {
  try {
    const token = String(label||'').toLowerCase();
    const lib = GENRE_LIBRARY || [];
    const exact = lib.find(g => (g.name||'').toLowerCase() === token);
    if (exact) return exact.name;
    const loose = lib.find(g => (g.name||'').toLowerCase().includes(token));
    return loose ? loose.name : '';
  } catch(_) { return ''; }
}
// Sample outputs (wireframe-only; no gameplay yet)
function sampleRhythmOutput() {
  return {
    genres: [ { name: 'Drill', influence: 62 }, { name: 'Afrobeats', influence: 38 } ],
    premise: 'triumph & celebration',
    styleTags: ['anthemic rap','chant hook','confident bounce'],
    keywords: ['crowd','lights'],
    language: 'English',
    accent: 'Neutral / Standard',
    forbidden: [],
    meta: { mode: 'rhythm', difficulty: 'normal', duration: 72, score: 8200, accuracy: 92 }
  };
}
function sampleGridOutput() {
  return {
    genres: [ { name: 'Phonk', influence: 55 }, { name: 'Trap', influence: 45 } ],
    premise: 'hustle & ambition',
    styleTags: ['retro grit','808 slap','smoky texture'],
    keywords: ['midnight','engine','city'],
    language: 'English',
    accent: 'American English (General)',
    forbidden: ['brand names'],
    meta: { mode: 'grid', difficulty: 'easy', duration: 60, score: 5400 }
  };
}
function sampleShooterOutput() {
  return {
    genres: [ { name: 'UK Drill', influence: 50 }, { name: 'R&B', influence: 30 }, { name: 'Trap', influence: 20 } ],
    premise: 'freedom & escape',
    styleTags: ['dark bounce','silky hook','street cinema'],
    keywords: ['alley','city lights','engine'],
    language: 'English',
    accent: 'British English (London)',
    forbidden: ['glitch'],
    meta: { mode: 'shooter', difficulty: 'normal', duration: 75, score: 9100, accuracy: 68 }
  };
}

// ---------- Suggestions ----------
// Auto-apply from Grid game when it dispatches a completion event
try {
  document.addEventListener('rgf:grid-finished', (e) => {
    const out = e && e.detail; if (!out) return;
    try { applyGameOutput(out); rerenderAll(); showToast('Applied from Grid'); } catch(_){}
  });
} catch(_) {}

function suggestPremise() {
  // Reuse the randomizer pairs used elsewhere
  const left = ['love','heartbreak','hustle','betrayal','triumph','redemption','city pride','struggle','freedom','nostalgia','rebellion','identity','faith','ambition','legacy','loss','hope','party','distance','healing','money','fame','survival','recovery','underdog','gratitude','nature','technology','community','wanderlust'];
  const right = ['loyalty','healing','ambition','trust','celebration','growth','belonging','perseverance','escape','memory','defiance','self-discovery','doubt','sacrifice','family','remembrance','renewal','vibe','yearning','balance','power','pressure','street wisdom','comeback','come-up','humility','calm','isolation','solidarity','homecoming'];
  for (let tries=0; tries<12; tries++) {
    const a = left[Math.floor(Math.random()*left.length)];
    const b = right[Math.floor(Math.random()*right.length)];
    if (a !== b) return `${a} & ${b}`;
  }
  return 'struggle & perseverance';
}
function suggestGenreBlend() {
  const lib = GENRE_LIBRARY || [];
  if (!lib.length) return;
  const pickN = Math.random() < 0.5 ? 2 : 3;
  const picks = [];
  const used = new Set();
  for (let i=0; i<lib.length && picks.length < pickN; i++) {
    const idx = Math.floor(Math.random()*lib.length);
    const name = lib[idx]?.name; if (!name || used.has(name.toLowerCase())) continue;
    used.add(name.toLowerCase()); picks.push(name);
  }
  const weights = pickN === 2 ? [70,30] : [60,30,10];
  state.genreMix.forEach((slot, i) => {
    slot.genre = picks[i] || '';
    slot.customGenre = '';
    slot.weight = picks[i] ? weights[i] : 0;
  });
}

// ---------- Curated Genre Blend Presets ----------
const GENRE_BLEND_PRESETS = [
  { id: 'drill-afrobeats', label: 'UK Drill + Afrobeats', items: [ ['drill', 60], ['afro', 40] ], desc: 'Dark bounce + sunny percussion' },
  { id: 'phonk-trap', label: 'Phonk + Trap', items: [ ['phonk', 60], ['trap', 40] ], desc: 'Retro memphis grit + modern slap' },
  { id: 'lofi-boombap', label: 'Lo-fi + Boom Bap', items: [ ['lo-fi', 55], ['boom', 45] ], desc: 'Warm, dusty, head-nod' },
  { id: 'edm-pop-rap', label: 'EDM Pop + Rap', items: [ ['edm', 50], ['pop', 25], ['rap', 25] ], desc: 'Festival-friendly energy' },
  { id: 'rnb-trap-soul', label: 'R&B + Trap Soul', items: [ ['r&b', 60], ['trap', 40] ], desc: 'Smooth melodies + modern drums' },
  { id: 'hyperpop-trap', label: 'Hyperpop + Trap', items: [ ['hyperpop', 50], ['trap', 50] ], desc: 'Glitched hooks + hard drums' },
  { id: 'afrotrap', label: 'Afrotrap + Rap', items: [ ['afrotrap', 60], ['rap', 40] ], desc: 'Afrobeats bounce, trap drums' },
  { id: 'jersey-rap', label: 'Jersey Club + Rap', items: [ ['jersey', 60], ['rap', 40] ], desc: 'Bouncy kicks + rap energy' },
  { id: 'drill-rnb', label: 'UK Drill + R&B', items: [ ['drill', 60], ['r&b', 40] ], desc: 'Contrast: gritty verses, silky hooks' },
  { id: 'dancehall-rap', label: 'Dancehall + Rap', items: [ ['dancehall', 60], ['rap', 40] ], desc: 'Island groove + bars' },
  { id: 'reggaeton-rap', label: 'Reggaeton + Rap', items: [ ['reggaeton', 50], ['rap', 50] ], desc: 'Dem bow + rap verses' },
  { id: 'synthwave-rap', label: 'Synthwave + Rap', items: [ ['synthwave', 60], ['rap', 40] ], desc: 'Retro pads + modern cadences' },
  { id: 'altrock-rap', label: 'Alt Rock + Rap', items: [ ['alt rock', 50], ['rap', 50] ], desc: 'Guitars + hip-hop drums' },
  { id: 'lofi-trap', label: 'Lo-fi + Trap', items: [ ['lo-fi', 50], ['trap', 50] ], desc: 'Chill texture + punchy rhythm' },
  { id: 'phonk-dnb', label: 'Phonk + DnB', items: [ ['phonk', 50], ['dnb', 50] ], desc: 'Memphis flavor at 170+' },
  { id: 'house-rap', label: 'House + Rap', items: [ ['house', 50], ['rap', 50] ], desc: 'Four-on-the-floor + verses' }
];
function buildGenrePresetDialog() {
  const wrap = document.createElement('div');
  const table = document.createElement('table');
  table.className = 'library-table';
  table.innerHTML = `<thead>
    <tr><th>Preset</th><th>Blend</th><th>Description</th><th></th></tr>
  </thead>`;
  const tbody = document.createElement('tbody');
  GENRE_BLEND_PRESETS.forEach(p => {
    const row = document.createElement('tr');
    const blend = p.items.map(([name, w]) => `${name} ${w}%`).join(' + ');
    row.innerHTML = `<td>${p.label}</td><td>${blend}</td><td>${p.desc || ''}</td><td><button type="button" data-id="${p.id}">Apply</button></td>`;
    const btn = row.querySelector('button');
    btn.addEventListener('click', () => { applyGenrePreset(p); });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);
  wrap.appendChild(table);
  return wrap;
}
function applyGenrePreset(preset) {
  // Helper to find a library match by token(s)
  const findByToken = (label) => {
    const token = String(label || '').toLowerCase();
    const lib = GENRE_LIBRARY || [];
    let best = lib.find(g => (g.name||'').toLowerCase() === token);
    if (best) return best.name;
    best = lib.find(g => (g.name||'').toLowerCase().includes(token));
    if (best) return best.name;
    // common variants
    if (token === 'boom') {
      const b = lib.find(g => /boom\s*bap/i.test(g.name||''));
      if (b) return b.name;
    }
    if (token === 'lo-fi' || token === 'lofi') {
      const b = lib.find(g => /(lo\s*-?fi)/i.test(g.name||''));
      if (b) return b.name;
    }
    if (token === 'r&b' || token === 'rnb') {
      const b = lib.find(g => /(r\s*&\s*b|rnb)/i.test(g.name||''));
      if (b) return b.name;
    }
    if (token === 'dnb' || token === 'drum and bass') {
      const b = lib.find(g => /(drum\s*&?\s*bass|dnb)/i.test(g.name||''));
      if (b) return b.name;
    }
    if (token === 'alt rock' || token === 'alternative rock') {
      const b = lib.find(g => /(alt|alternative)\s*rock/i.test(g.name||''));
      if (b) return b.name;
    }
    return null;
  };
  const items = preset.items.slice(0, state.genreMix.length);
  state.genreMix.forEach((slot, i) => {
    const it = items[i];
    if (!it) { slot.genre = ''; slot.customGenre=''; slot.weight=0; return; }
    const [label, w] = it;
    const match = findByToken(label);
    if (match) { slot.genre = match; slot.customGenre=''; }
    else { slot.genre = '(custom)'; slot.customGenre = label; }
    slot.weight = w;
  });
  renderGenreMix();
  recompute();
  try { unlockAchievement('curator','Curator'); } catch(_){}
  // Also mirror the Apply Genre Mix behavior
  try {
    const analysis = analyzeGenreMix(state.genreMix);
    state.genreAnalysis = analysis.mix.length ? analysis : null;
    if (analysis.mix.length) {
      if (analysis.styleTagsCsv) {
        state.creativeInputs.styleTags = analysis.styleTagsCsv;
        renderCreativeInputs();
      }
      const summary = [
        `Mix: ${analysis.mixSummary}`,
        `Feel: ${analysis.tempoHint}`,
        analysis.structureHint ? `Structure: ${cleanStructureDisplay(analysis.structureHint)}` : '',
        analysis.excludeCsv ? `Exclude: ${analysis.excludeCsv}` : '',
        analysis.sfxCsv ? `SFX: ${analysis.sfxCsv}` : ''
      ].filter(Boolean).join('\n');
      state.outputs.brief = summary;
      renderOutputs();
    }
  } catch(_) {}
  showToast(`Applied: ${preset.label}`);
  try { scheduleSave(); } catch(_){}
}







