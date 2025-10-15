// Snake (Prototype) — MVP stub
// TODOs:
// - Implement grid, snake movement, food spawns, hazards
// - Map collected food to keywords/tags; combo to genre influence
// - Add pause/resume and mobile controls

export function buildSnakeGameDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  const hint = document.createElement('p'); hint.className='hint';
  hint.textContent = 'Snake clone (prototype): collect food, avoid walls/your tail. Use Simulate to preview output.';
  wrap.appendChild(hint);

  const actions = document.createElement('div'); actions.className='inline-buttons';
  const simulate = document.createElement('button'); simulate.className='btn-primary'; simulate.textContent='Simulate';
  const close = document.createElement('button'); close.textContent='Close';
  actions.appendChild(simulate); actions.appendChild(close); wrap.appendChild(actions);

  simulate.addEventListener('click', () => {
    const output = {
      genres: [ { name: 'Trap', influence: 60 }, { name: 'Afrobeats', influence: 40 } ],
      premise: 'ambition & growth',
      styleTags: ['modern','energetic'],
      keywords: ['city','midnight'],
      language: 'English',
      accent: 'Neutral / Standard',
      forbidden: [],
      meta: { mode: 'snake', difficulty: (options.difficulty||'normal'), duration: 45, score: 3000 }
    };
    if (onFinish) onFinish(output);
  });
  close.addEventListener('click', () => { try { document.getElementById('close-dialog').click(); } catch(_){} });
  return wrap;
}

