// Grid Picker – MVP stub with TODOs
// Exports: buildGridGameDialog(onFinish, options)
export function buildGridGameDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Stub: 3-turn draft planned (Genre → Premise → Tags/Keywords → Language/Accent optional). Use Simulate to preview output.';
  wrap.appendChild(hint);

  // TODO: Implement turns, cards, and synergies
  // - Turn 1: Genre cards (single/dual) → influence deltas
  // - Turn 2: Premise pair card or reroll
  // - Turn 3: Style tag set; optional keyword pack
  // - Turn 4 (optional): Language/Accent card; hazard card tradeoff
  // - End: normalize → summary → Apply

  const actions = document.createElement('div');
  actions.className = 'inline-buttons';
  const simulate = document.createElement('button'); simulate.className = 'btn-primary'; simulate.textContent = 'Simulate';
  const close = document.createElement('button'); close.textContent = 'Close';
  actions.appendChild(simulate); actions.appendChild(close);
  wrap.appendChild(actions);

  simulate.addEventListener('click', () => {
    // Sample output (valid gameOutput)
    const output = {
      genres: [ { name: 'Lo-fi', influence: 55 }, { name: 'Boom Bap', influence: 45 } ],
      premise: 'nostalgia & memory',
      styleTags: ['dusty texture','head-nod','warm vinyl'],
      keywords: ['midnight','basement'],
      language: 'English',
      accent: 'Neutral / Standard',
      forbidden: [],
      meta: { mode: 'grid', difficulty: (options.difficulty||'normal'), duration: 45, score: 4200 }
    };
    if (onFinish) onFinish(output);
  });
  close.addEventListener('click', () => { try { document.getElementById('close-dialog').click(); } catch(_){} });
  return wrap;
}

