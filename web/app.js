import { CONSTANTS, CONTROLS, DEFAULT_WEIGHTS, WEIGHT_PRESETS, BASE_INPUTS, DERIVED_INPUTS, USER_SECTION_DEFS, PREMISE_OPTIONS, GENRE_SLOTS, GENRE_SLOT_WEIGHT_TOTAL, ACCENT_DEFAULT, DEFAULT_AI_SETTINGS, CREATIVE_FIELDS } from './js/config.js';
import { computeScores } from './js/scoring.js';
import { analyzeGenreMix, appendStyleAccent } from './js/genre.js';
import { getPhoneticMode, applyPhoneticSpelling } from './js/phonetics.js';
import { GENRE_LIBRARY } from './data/genres.js';
import { ACCENT_LIBRARY } from './data/accents.js';

const state = {
  controls: Object.fromEntries(CONTROLS.map(c => [c.id, c.value])),
  weights: { ...DEFAULT_WEIGHTS },
  baseInputs: Object.fromEntries(BASE_INPUTS.map(item => [item.id, item.value])),
  derivedInputs: Object.fromEntries(DERIVED_INPUTS.map(item => [item.id, item.value])),
  creativeInputs: Object.fromEntries(CREATIVE_FIELDS.map(field => [field.id, field.defaultValue])),
  genreMix: Array.from({ length: GENRE_SLOTS }, () => ({ genre: '', weight: 0 })),
  premise: '(auto)',
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
    } else if (['mustInclude', 'forbidden', 'audienceNotes'].includes(field.id)) {
      input = document.createElement('textarea');
      input.rows = field.id === 'audienceNotes' ? 3 : 2;
      input.value = state.creativeInputs[field.id] || '';
      input.addEventListener('input', () => {
        state.creativeInputs[field.id] = input.value;
      });
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = state.creativeInputs[field.id] || '';
      input.addEventListener('input', () => {
        state.creativeInputs[field.id] = input.value;
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
    select.innerHTML = `<option value="">(none)</option>` + GENRE_LIBRARY.map(g => `
      <option value="${g.name}">${g.name}</option>`).join('');
    select.value = slot.genre;
    select.addEventListener('change', () => {
      slot.genre = select.value;
    });

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
  select.innerHTML = PREMISE_OPTIONS.map(opt => `
    <option value="${opt}">${opt}</option>`).join('');
  select.value = state.premise;
  select.addEventListener('change', () => {
    state.premise = select.value;
  });
}

function renderAccent() {
  const select = document.getElementById('accent-select');
  select.innerHTML = ACCENT_LIBRARY.map(acc => `
    <option value="${acc.name}">${acc.name}</option>`).join('');
  select.value = state.accent;
  select.addEventListener('change', () => {
    state.accent = select.value;
  });
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
  container.innerHTML = renderStaticGrid(entries.map(item => ({
    label: item.label,
    value: typeof item.value === 'number' ? formatNumber(item.value, item.label.startsWith('Final') ? 1 : 3) : item.value
  })));
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
    state.outputs.prompt = buildPromptText();
    renderOutputs();
  });
  document.getElementById('call-ai').addEventListener('click', async (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    button.disabled = true;
    state.outputs.aiResponse = 'Calling AI...';
    renderOutputs();
    try {
      const result = await callAI();
      state.outputs.aiResponse = result;
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
        analysis.structureHint ? `Structure: ${analysis.structureHint}` : '',
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
}

function applyPreset(name) {
  const preset = WEIGHT_PRESETS[name];
  if (!preset) return;
  state.weights = { ...preset };
  renderWeights();
  recompute();
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
  const tbody = document.createElement('tbody');
  GENRE_LIBRARY.forEach(item => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>${item.tempo}</td>
      <td>${item.structure}</td>
      <td>${item.styleTags}</td>
      <td>${item.exclude}</td>
      <td>${item.sfx}</td>
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
    `Structure: ${analysis.structureHint || structure}`,
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
  const styleTagsCombined = [analysis.styleTagsCsv || '', state.creativeInputs.styleTags || ''].filter(Boolean).join(', ');

  const lines = [];
  lines.push("You are Suno v5 Lyrical Expert - iMob Worldwide. Generate a completely original song.");
  lines.push("Output exactly four code blocks, in this order: 1) title 2) style 3) exclude 4) lyrics.");
  lines.push("Formatting rules (MANDATORY):");
  lines.push("- All meta tags/directives must be in [square brackets] (e.g., [HOOK], [Verse 1], [Bridge], [Outro], [Chant]).");
  lines.push("- Alternate voices / ad-libs go in (parentheses): (yeah), (echo), (crowd: ay!).");
  lines.push("- Any noises/SFX go in bracketed asterisks: [* cheer *], [* breath *], [* bass drop *].");
  lines.push("- The Style block is a single bracketed list of tags separated by pipes (example: [anthemic rap | chant hook | evolving chorus | confident bounce]).");
  lines.push("- Exclude block is lowercase nouns, comma-separated.");
  lines.push("- Begin lyrics with: [Producer Tag] iMob Worldwide!");
  lines.push("- 3+ minutes; evolving choruses; stage cues in [brackets]; call-and-response via (parentheses).");
  lines.push("- Do NOT reference production gear, BPM, mixing jargon, or arrangement terms unless explicitly requested.");
  lines.push("");
  lines.push(`Final Score: ${formatNumber(computed.final.clamped, 1)}`);
  lines.push(`Tempo / Feel: ${analysis.tempoHint || tempo}`);
  lines.push(`Structure: ${analysis.structureHint || structure}`);
  lines.push(`Hook Plan: ${hookPlan}`);
  lines.push(`Flow Plan: ${flowPlan}`);
  lines.push(`Rhyme Plan: ${rhymePlan}`);
  lines.push(`Style / Vibe: ${vibe}`);
  lines.push(`Audience: ${audienceLine}`);
  lines.push(`Phonetics: ${phonetic.instruction}`);
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
  if (lockedSections.length) {
    lines.push("LOCKED SECTIONS (use verbatim; only write missing parts):");
    lockedSections.forEach(line => lines.push(line));
    lines.push("");
  }
  lines.push("If any rule is broken, fix and re-output without commentary.");
  return lines.join('\n');

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
  const explicit = (state.premise || '').trim().toLowerCase();
  if (explicit && explicit !== '(auto)') return explicit;
  const theme = (state.creativeInputs.theme || '').toLowerCase();
  const keywords = (state.creativeInputs.keywords || '').toLowerCase();
  const audience = (state.creativeInputs.audienceNotes || '').toLowerCase();
  const haystack = `${theme} ${keywords} ${audience}`;
  if (haystack.includes('love')) return 'love & loyalty';
  if (haystack.includes('heartbreak')) return 'heartbreak & healing';
  if (haystack.includes('hustle')) return 'hustle & ambition';
  if (haystack.includes('betray')) return 'betrayal & trust';
  if (haystack.includes('win') || haystack.includes('victory')) return 'triumph & celebration';
  if (haystack.includes('redemption') || haystack.includes('forgive')) return 'redemption & growth';
  if (haystack.includes('city') || haystack.includes('hometown')) return 'city pride & belonging';
  if (haystack.includes('grind') || haystack.includes('struggle')) return 'struggle & perseverance';
  const pool = ['love & loyalty', 'heartbreak & healing', 'hustle & ambition', 'betrayal & trust', 'triumph & celebration', 'redemption & growth', 'city pride & belonging', 'struggle & perseverance'];
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}

function init() {
  renderConstants();
  renderControls();
  renderWeights();
  renderBaseInputs();
  renderDerivedInputs();
  renderCreativeInputs();
  renderGenreMix();
  renderPremise();
  renderAccent();
  renderUserSections();
  recompute();
  renderAISettings();
  renderOutputs();
  setupButtons();
}

document.addEventListener('DOMContentLoaded', init);
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













