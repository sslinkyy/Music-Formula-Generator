// Shooter (Concept) – MVP stub with TODOs
// Exports: buildShooterGameDialog(onFinish, options)
export function buildShooterGameDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  const hint = document.createElement('p');
  hint.className = 'hint';
  hint.textContent = 'Stub: Arena shooter planned (hits → influences, pickups → tags/keywords, portals → language/accent). Use Simulate to preview output.';
  wrap.appendChild(hint);

  // TODO: Implement arena loop on Canvas
  // - Enemies tagged by genre families; hits → influence
  // - Pickups: style tags/keywords; hazards → forbidden
  // - Portals: language/accent (single active)
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
      genres: [ { name: 'UK Drill', influence: 50 }, { name: 'R&B', influence: 30 }, { name: 'Trap', influence: 20 } ],
      premise: 'rebellion & defiance',
      styleTags: ['dark bounce','silky hook','street cinema'],
      keywords: ['alley','engine','city'],
      language: 'English',
      accent: 'British English (London)',
      forbidden: ['glitch'],
      meta: { mode: 'shooter', difficulty: (options.difficulty||'normal'), duration: (options.durationSec||60), score: 9000, accuracy: 70 }
    };
    if (onFinish) onFinish(output);
  });
  close.addEventListener('click', () => { try { document.getElementById('close-dialog').click(); } catch(_){} });
  return wrap;
}

