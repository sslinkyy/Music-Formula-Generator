// Grid Picker — playable MVP (3 turns)
// Exports: buildGridGameDialog(onFinish, options)
import { GENRE_LIBRARY } from '../../data/genres.js';
import { ACCENT_LIBRARY } from '../../data/accents.js';

export function buildGridGameDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  // Inject minimal styles for selected state
  const style = document.createElement('style');
  style.textContent = `
    .grid-card { transition: transform .06s ease, box-shadow .06s ease; }
    .grid-card:hover { transform: translateY(-1px); box-shadow: 0 2px 6px rgba(0,0,0,.25); }
    .grid-card.selected { border-color: var(--accent); background: #1b2130; color: #eaf2ff; }
    .grid-card[data-kind="kw"].selected { border-color: #B084CC; background: #251b2f; }
  `;
  wrap.appendChild(style);
  const state = { step: 0, picks: { genres: [], premise: '', tags: [], kws: [], lang: 'English', acc: 'Neutral / Standard' } };
  const steps = ['Genres','Premise','Tags'];
  const header = document.createElement('div'); header.className='inline-buttons';
  const title = document.createElement('h3'); title.style.margin='0'; title.textContent = 'Grid Picker';
  const progress = document.createElement('span'); progress.className='hint'; progress.style.marginLeft='8px';
  header.appendChild(title); header.appendChild(progress); wrap.appendChild(header);

  const board = document.createElement('div');
  board.style.display='grid'; board.style.gridTemplateColumns='repeat(auto-fit,minmax(180px,1fr))'; board.style.gap='10px';
  wrap.appendChild(board);

  const footer = document.createElement('div'); footer.className='inline-buttons'; footer.style.marginTop='10px';
  const back = document.createElement('button'); back.textContent='Back'; back.disabled=true;
  const next = document.createElement('button'); next.className='btn-primary'; next.textContent='Next';
  const close = document.createElement('button'); close.textContent='Close';
  footer.appendChild(back); footer.appendChild(next); footer.appendChild(close);
  wrap.appendChild(footer);

  const rng = makeRng(Date.now());

  function setStep(s) {
    state.step = Math.max(0, Math.min(steps.length-1, s));
    progress.textContent = `Step ${state.step+1} of ${steps.length}: ${steps[state.step]}`;
    back.disabled = state.step === 0;
    next.textContent = state.step === steps.length-1 ? 'Finish' : 'Next';
    renderBoard();
  }

  function renderBoard() {
    board.innerHTML='';
    if (state.step === 0) renderGenreDraft();
    else if (state.step === 1) renderPremiseDraft();
    else renderTagsDraft();
  }

  function renderGenreDraft() {
    const lib = (GENRE_LIBRARY||[]).slice();
    const cards = pickUnique(lib.map(g=>g.name).filter(Boolean), 8);
    const info = document.createElement('p'); info.className='hint'; info.textContent='Pick up to 2 genres (weights auto-normalized).'; board.appendChild(info);
    cards.forEach(name => board.appendChild(mkCard(name, () => toggleGenre(name))));
    syncGenreSelection();
  }
  function toggleGenre(name) {
    const i = state.picks.genres.findIndex(g=>g.name===name);
    if (i>=0) state.picks.genres.splice(i,1);
    else if (state.picks.genres.length<2) state.picks.genres.push({ name, influence: 50 });
    syncGenreSelection();
  }
  function syncGenreSelection() {
    const chosen = state.picks.genres.map(g=>g.name);
    board.querySelectorAll('.grid-card').forEach(el=>{
      const name = el.getAttribute('data-name');
      el.classList.toggle('selected', chosen.includes(name));
    });
  }

  function renderPremiseDraft() {
    const left = ['love','heartbreak','hustle','betrayal','triumph','redemption','city pride','struggle','freedom','nostalgia','rebellion','identity','faith','ambition','legacy','loss','hope','party','distance','healing','money','fame','survival','recovery','underdog','gratitude','nature','technology','community','wanderlust'];
    const right = ['loyalty','healing','ambition','trust','celebration','growth','belonging','perseverance','escape','memory','defiance','self-discovery','doubt','sacrifice','family','remembrance','renewal','vibe','yearning','balance','power','pressure','street wisdom','comeback','come-up','humility','calm','isolation','solidarity','homecoming'];
    const pairs = pickPairs(left, right, 8);
    const info = document.createElement('p'); info.className='hint'; info.textContent='Pick a premise pair (and optionally set language/accent).'; board.appendChild(info);
    pairs.forEach(p => board.appendChild(mkCard(`${p[0]} & ${p[1]}`, () => { state.picks.premise = `${p[0]} & ${p[1]}`; syncPremise(); })));
    // Quick language/accent selectors
    const langs = ['English','Spanish','French'];
    const accs = (ACCENT_LIBRARY||[]).slice(0,6).map(a=>a.name);
    const row = document.createElement('div'); row.className='inline-buttons'; row.style.gridColumn='1/-1';
    const langSel = document.createElement('select'); langs.forEach(L=>{ const o=document.createElement('option'); o.value=L; o.textContent=L; if(L===state.picks.lang) o.selected=true; langSel.appendChild(o); });
    const accSel = document.createElement('select'); accs.forEach(A=>{ const o=document.createElement('option'); o.value=A; o.textContent=A; if(A===state.picks.acc) o.selected=true; accSel.appendChild(o); });
    langSel.addEventListener('change', ()=> state.picks.lang = langSel.value);
    accSel.addEventListener('change', ()=> state.picks.acc = accSel.value);
    row.appendChild(langSel); row.appendChild(accSel); board.appendChild(row);
    syncPremise();
  }
  function syncPremise() {
    board.querySelectorAll('.grid-card').forEach(el=>{
      const v = el.getAttribute('data-name');
      el.classList.toggle('selected', v===state.picks.premise);
    });
  }

  function renderTagsDraft() {
    // Build tag pool from selected genres + general
    const base = ['anthemic','modern','energetic','dark','warm','gritty','melodic','minimal','lush','retro','cinematic'];
    const genreTags = []; try {
      const set = new Set();
      (GENRE_LIBRARY||[]).forEach(g=>{
        if (state.picks.genres.some(x => x.name.toLowerCase() === String(g.name||'').toLowerCase())) {
          String(g.styleTags||'').split(',').forEach(t=>{ const s=t.trim(); if (s) set.add(s); });
        }
      });
      genreTags.push(...Array.from(set));
    } catch(_){}
    const tags = pickUnique(base.concat(genreTags), 12);
    const kws = pickUnique(['crowd','radio','midnight','engine','basement','city','festival','glow','pulse','lights'], 8);
    const info = document.createElement('p'); info.className='hint'; info.textContent='Pick up to 5 style tags and up to 5 keywords.'; board.appendChild(info);
    const tagGrid = document.createElement('div'); tagGrid.style.display='grid'; tagGrid.style.gridTemplateColumns='repeat(auto-fit,minmax(160px,1fr))'; tagGrid.style.gap='8px'; tagGrid.style.gridColumn='1/-1';
    tags.forEach(t => tagGrid.appendChild(mkCard(t, ()=>toggleTag(t))));
    const kwGrid = document.createElement('div'); kwGrid.style.display='grid'; kwGrid.style.gridTemplateColumns='repeat(auto-fit,minmax(160px,1fr))'; kwGrid.style.gap='8px'; kwGrid.style.gridColumn='1/-1';
    kws.forEach(k => kwGrid.appendChild(mkCard('⭑ '+k, ()=>toggleKw(k), 'kw')));
    board.appendChild(tagGrid); board.appendChild(kwGrid);
    syncTagKw();
  }
  function toggleTag(t) {
    const i = state.picks.tags.indexOf(t);
    if (i>=0) state.picks.tags.splice(i,1); else if (state.picks.tags.length<5) state.picks.tags.push(t);
    syncTagKw();
  }
  function toggleKw(k) {
    const i = state.picks.kws.indexOf(k);
    if (i>=0) state.picks.kws.splice(i,1); else if (state.picks.kws.length<5) state.picks.kws.push(k);
    syncTagKw();
  }
  function syncTagKw() {
    board.querySelectorAll('.grid-card').forEach(el=>{
      const name = el.getAttribute('data-name');
      const isKw = el.getAttribute('data-kind')==='kw';
      if (isKw) el.classList.toggle('selected', state.picks.kws.includes(name.replace(/^\u2b51\s*/,'')));
      else el.classList.toggle('selected', state.picks.tags.includes(name));
    });
  }

  function mkCard(label, onClick, kind='tag') {
    const card = document.createElement('button');
    card.type='button'; card.className='grid-card'; card.setAttribute('data-kind', kind);
    card.setAttribute('data-name', label);
    card.style.display='block'; card.style.padding='10px'; card.style.textAlign='left';
    card.style.border='1px solid var(--panel-border)'; card.style.borderRadius='10px'; card.style.background='var(--panel)';
    card.innerHTML = `<div style="font-weight:600; margin-bottom:4px;">${label}</div>`;
    card.addEventListener('click', onClick);
    return card;
  }

  function makeRng(seed0) { let seed=(seed0>>>0)||0x9E3779B9; return function(){ seed|=0; seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }
  function pickUnique(arr, n) { const a=arr.slice().filter(Boolean); const out=[]; while (a.length && out.length<n){ const i=Math.floor(rng()*a.length); out.push(a.splice(i,1)[0]); } return out; }
  function pickPairs(a,b,n){ const out=[]; for(let i=0;i<n;i++){ out.push([a[Math.floor(rng()*a.length)], b[Math.floor(rng()*b.length)]]); } return out; }

  back.addEventListener('click', ()=> setStep(state.step-1));
  next.addEventListener('click', ()=>{
    if (state.step < steps.length-1) { setStep(state.step+1); return; }
    // Finish: normalize and emit
    let genres = state.picks.genres.length ? state.picks.genres.slice(0,2) : [{name:'Trap',influence:55},{name:'R&B',influence:45}];
    const sum = genres.reduce((a,b)=>a+Number(b.influence||0),0) || 1; genres = genres.map(g=>({ name: g.name, influence: Math.round((Number(g.influence||0)/sum)*100) }));
    const output = {
      genres,
      premise: state.picks.premise || 'hustle & ambition',
      styleTags: state.picks.tags.slice(0,8),
      keywords: state.picks.kws.slice(0,8),
      language: state.picks.lang || 'English',
      accent: state.picks.acc || 'Neutral / Standard',
      forbidden: [],
      meta: { mode: 'grid', difficulty: (options.difficulty||'normal'), duration: 45, score: 5000 }
    };
    try { document.dispatchEvent(new CustomEvent('rgf:grid-finished', { detail: output })); } catch(_){}
    if (onFinish) onFinish(output);
  });
  close.addEventListener('click', () => { try { document.getElementById('close-dialog').click(); } catch(_){} });

  setStep(0);
  return wrap;
}
