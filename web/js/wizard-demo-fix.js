// Patch module to wire Wizard/Demo and decorate trophy icons without editing app.js

// Minimal Wizard controller (mirrors app.js structure)
const wizardCtl = {
  active: false,
  step: 0,
  steps: [
    { id: 'weights', match: /weights/i },
    { id: 'genre', match: /genre mix/i },
    { id: 'premise', match: /premise.*phonetics/i },
    { id: 'user', match: /user sections/i },
    { id: 'build', match: /scores|outputs/i },
  ],
};

function wizardSections() {
  const sections = Array.from(document.querySelectorAll('#scoring-panel .panel-group > section'));
  const h3s = sections.map((sec) => sec.querySelector('h3'));
  return { sections, h3s };
}

function gotoWizardStep(idx) {
  wizardCtl.step = Math.max(0, Math.min(wizardCtl.steps.length - 1, idx));
  const { sections, h3s } = wizardSections();
  let targetIndex = -1;
  for (let i = 0; i < h3s.length; i++) {
    const h3 = h3s[i];
    if (!h3) continue;
    if (wizardCtl.steps[wizardCtl.step].match.test(h3.textContent || '')) {
      targetIndex = i;
      break;
    }
  }
  sections.forEach((sec, i) => {
    if (i === targetIndex) {
      sec.classList.remove('wizard-hidden');
      sec.classList.add('wizard-highlight');
    } else {
      sec.classList.add('wizard-hidden');
      sec.classList.remove('wizard-highlight');
    }
  });
  renderWizardBar();
  // Scroll into view
  if (wizardCtl.steps[wizardCtl.step].id === 'build') {
    const btn = document.getElementById('build-prompt');
    if (btn) btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } else {
    const { sections: secs } = wizardSections();
    const current = secs[targetIndex];
    if (current) current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function setWizardActive(active) {
  wizardCtl.active = !!active;
  const bar = document.getElementById('wizard-bar');
  if (bar) bar.hidden = !wizardCtl.active;
  if (!wizardCtl.active) {
    document
      .querySelectorAll('#scoring-panel .panel-group > section')
      .forEach((sec) => sec.classList.remove('wizard-hidden', 'wizard-highlight'));
    renderWizardBar();
    return;
  }
  gotoWizardStep(0);
}

function renderWizardBar() {
  try {
    const toggle = document.getElementById('wizard-toggle');
    if (toggle) toggle.textContent = wizardCtl.active ? 'Wizard: On' : 'Wizard';
    const bar = document.getElementById('wizard-bar'); if (!bar) return;
    bar.hidden = !wizardCtl.active;
    const steps = Array.from(bar.querySelectorAll('.wizard-step'));
    steps.forEach((el) => {
      const stepNum = Number(el.getAttribute('data-step'));
      el.classList.toggle('active', stepNum === wizardCtl.step);
      el.classList.toggle('done', stepNum < wizardCtl.step);
    });
  } catch (_) {}
}

function wireWizardButtons() {
  const toggle = document.getElementById('wizard-toggle');
  const prev = document.getElementById('wizard-prev');
  const next = document.getElementById('wizard-next');
  if (toggle && !toggle.dataset.wzBound) {
    toggle.addEventListener('click', () => setWizardActive(!wizardCtl.active));
    toggle.dataset.wzBound = '1';
  }
  if (prev && !prev.dataset.wzBound) {
    prev.addEventListener('click', () => gotoWizardStep(wizardCtl.step - 1));
    prev.dataset.wzBound = '1';
  }
  if (next && !next.dataset.wzBound) {
    next.addEventListener('click', () => {
      if (wizardCtl.step >= wizardCtl.steps.length - 1) {
        // Build prompt by clicking the existing button so app.js handles it
        const build = document.getElementById('build-prompt');
        if (build) build.click();
      } else {
        gotoWizardStep(wizardCtl.step + 1);
      }
    });
    next.dataset.wzBound = '1';
  }
}

// Demo preset via UI interactions (no direct access to app.js state)
async function applyDemoViaUI() {
  try {
    // Use weight preset button
    const presetBtn = document.querySelector('[data-preset="streaming"]');
    if (presetBtn) presetBtn.click();
    // Basic genre mix
    const mixRoot = document.getElementById('genre-mix');
    if (mixRoot) {
      const selects = mixRoot.querySelectorAll('select');
      const numbers = mixRoot.querySelectorAll('input[type="number"]');
      if (selects[0]) { selects[0].value = 'Trap'; selects[0].dispatchEvent(new Event('change', { bubbles: true })); }
      if (numbers[0]) { numbers[0].value = '50'; numbers[0].dispatchEvent(new Event('input', { bubbles: true })); }
      if (selects[1]) { selects[1].value = 'Afrobeats'; selects[1].dispatchEvent(new Event('change', { bubbles: true })); }
      if (numbers[1]) { numbers[1].value = '30'; numbers[1].dispatchEvent(new Event('input', { bubbles: true })); }
      if (selects[2]) { selects[2].value = 'R&B'; selects[2].dispatchEvent(new Event('change', { bubbles: true })); }
      if (numbers[2]) { numbers[2].value = '20'; numbers[2].dispatchEvent(new Event('input', { bubbles: true })); }
    }
    // Premise & accent
    const premSel = document.getElementById('premise-select');
    if (premSel) {
      premSel.value = '(custom)'; premSel.dispatchEvent(new Event('change', { bubbles: true }));
      const premInput = document.getElementById('premise-custom-input');
      if (premInput) { premInput.value = 'underdog & comeback'; premInput.dispatchEvent(new Event('input', { bubbles: true })); }
    }
    const accSel = document.getElementById('accent-select');
    if (accSel) { accSel.selectedIndex = 0; accSel.dispatchEvent(new Event('change', { bubbles: true })); }
    // Small creative hints
    const tags = document.querySelector('textarea[name="styleTags"]');
    const kws = document.querySelector('textarea[name="keywords"]');
    if (tags) { tags.value = 'anthemic, modern, energetic'; tags.dispatchEvent(new Event('input', { bubbles: true })); }
    if (kws) { kws.value = 'crowd, radio, midnight'; kws.dispatchEvent(new Event('input', { bubbles: true })); }
  } catch (e) { console.error('Demo UI apply failed', e); }
}

function wireDemoButtons() {
  const demoTop = document.getElementById('demo-mode');
  const demoHero = document.getElementById('demo-mode-hero');
  if (demoTop && !demoTop.dataset.demoBound) { demoTop.addEventListener('click', applyDemoViaUI); demoTop.dataset.demoBound = '1'; }
  if (demoHero && !demoHero.dataset.demoBound) { demoHero.addEventListener('click', applyDemoViaUI); demoHero.dataset.demoBound = '1'; }
}

// Decorate trophy icons with emoji when dialog opens
function decorateTrophyIcons(root) {
  const map = {
    'First Prompt!': '✨',
    'Perfect Weights': '⚖️',
    'Fusion Chef': '🍳',
    '5 Prompts': '5️⃣',
    '10 Prompts': '🔟',
    '25 Prompts': '🏆',
    'Ready to Roll': '🚀',
    '3-Day Streak': '📆',
    '7-Day Streak': '📅',
    'Apprentice Wizard': '🧙',
    'Wizard Graduate': '🎓',
    'Demo Explorer': '🧪',
    'Muse': '🎨',
    'Blend DJ': '🎛️',
    'Curator': '🗂️',
    'Prompt Copier': '📋',
    'Brief Copier': '📝',
    'Suno Copier': '🔊',
    'API Caller': '🔌',
    'Voice Actor': '🎙️',
    'Accent Explorer': '🧭',
    'Polyglot I': '🌐',
    'Polyglot II': '🌍',
    'Polyglot Explorer': '🗺️',
    'Preset Driver': '🎚️',
    'Preset Maestro': '🏅',
    'Lyricist': '✍️',
    'Composer': '🎼',
    'Crate Digger': '📦',
    'Crate Curator': '🧰',
    'Rhythm First Round': '🥁',
    'Rhythm Ace': '💯',
    'Combo Master': '🔥',
    'Hazard Avoider': '🛡️',
  };
  try {
    root.querySelectorAll('.trophy-item').forEach((li) => {
      const label = li.querySelector('div:nth-child(2) > div:first-child');
      const icon = li.querySelector('.trophy-icon');
      const text = label ? (label.textContent || '').trim() : '';
      const glyph = map[text] || '🏆';
      if (icon) icon.textContent = glyph;
    });
  } catch (_) {}
}

function watchDialogForTrophies() {
  const dialog = document.getElementById('library-dialog');
  if (!dialog) return;
  const title = document.getElementById('dialog-title');
  const content = document.getElementById('dialog-content');
  const obs = new MutationObserver(() => {
    const head = (title && title.textContent) || '';
    if (/Trophies|How to Earn Trophies/i.test(head) && content) {
      decorateTrophyIcons(content);
    }
  });
  obs.observe(dialog, { attributes: true, childList: true, subtree: true });
}

document.addEventListener('DOMContentLoaded', () => {
  // Wire controls once DOM is ready
  wireWizardButtons();
  wireDemoButtons();
  watchDialogForTrophies();
  renderWizardBar();
});

