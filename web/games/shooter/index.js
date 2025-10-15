// Shooter (Arena) — playable MVP
// Exports: buildShooterGameDialog(onFinish, options)
import { GENRE_LIBRARY } from '../../data/genres.js';
import { ACCENT_LIBRARY } from '../../data/accents.js';

export function buildShooterGameDialog(onFinish, options = {}) {
  const wrap = document.createElement('div');
  const difficulty = options.difficulty || 'normal';
  const duration = options.durationSec || 60;
  const speedScale = difficulty === 'hard' ? 1.3 : difficulty === 'easy' ? 0.85 : 1.0;

  // Controls
  const controls = document.createElement('div'); controls.className = 'inline-buttons';
  const diffSel = document.createElement('select'); ['easy','normal','hard'].forEach(d=>{ const o=document.createElement('option'); o.value=d; o.textContent=d; if(d===difficulty) o.selected=true; diffSel.appendChild(o); }); controls.appendChild(diffSel);
  let lang = 'English', acc = 'Neutral / Standard';
  const langSel = document.createElement('select'); ['English','Spanish','French'].forEach(L=>{ const o=document.createElement('option'); o.value=L; o.textContent=L; langSel.appendChild(o); }); controls.appendChild(langSel);
  const accSel = document.createElement('select'); (ACCENT_LIBRARY||[]).slice(0,8).forEach(a=>{ const o=document.createElement('option'); o.value=a.name; o.textContent=a.name; accSel.appendChild(o); }); controls.appendChild(accSel);
  langSel.addEventListener('change', ()=> lang = langSel.value);
  accSel.addEventListener('change', ()=> acc = accSel.value);
  const startBtn = document.createElement('button'); startBtn.className='btn-primary'; startBtn.textContent='Start';
  const restartBtn = document.createElement('button'); restartBtn.textContent='Restart'; restartBtn.disabled=true;
  const quitBtn = document.createElement('button'); quitBtn.textContent='Quit';
  controls.appendChild(startBtn); controls.appendChild(restartBtn); controls.appendChild(quitBtn);
  wrap.appendChild(controls);

  // Canvas
  const canvas = document.createElement('canvas'); canvas.width = 800; canvas.height = 420; canvas.style.width='100%'; canvas.style.background='#0f1115'; canvas.style.borderRadius='12px'; wrap.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const hud = document.createElement('div'); hud.className='hint'; hud.textContent = 'Move: WASD/Arrows | Shoot: Space/Click | Avoid hazards'; hud.style.margin='6px 0'; wrap.appendChild(hud);

  // State
  let running=false, t0=0, now=0, raf=0;
  const rng = makeRng(Date.now());
  const player = { x: canvas.width/2, y: canvas.height/2, vx: 0, vy: 0, speed: 180*speedScale, r: 12, hp: 3 };
  const bullets = [], enemies = [], pickups = [], hazards = [];
  const keys = {}; let mouseDown=false; let shots=0, hits=0, kills=0, bestCombo=0, combo=0;
  const genreKills = {}; const styleTags = new Set(); const keywords = new Set(); const forbidden = new Set();
  const enemyKinds = pickEnemyKinds();

  function start(){ reset(); running=true; t0=0; now=0; raf=requestAnimationFrame(loop); restartBtn.disabled=false; }
  function reset(){ enemies.length=0; bullets.length=0; pickups.length=0; hazards.length=0; player.x=canvas.width/2; player.y=canvas.height/2; player.vx=player.vy=0; player.hp=3; shots=hits=kills=bestCombo=combo=0; Object.keys(genreKills).forEach(k=>delete genreKills[k]); styleTags.clear(); keywords.clear(); forbidden.clear(); }
  function endGame(){ running=false; try{ if(raf) cancelAnimationFrame(raf);}catch(_){} raf=0; const top=Object.entries(genreKills).sort((a,b)=>b[1]-a[1]).slice(0,3); const sum=top.reduce((a,b)=>a+b[1],0)||1; const genres=top.map(([name,count])=>({ name, influence:Math.round((count/sum)*100) })); const out={ genres: genres.length?genres:[{name:'Trap',influence:60},{name:'R&B',influence:40}], premise: samplePremise(), styleTags:Array.from(styleTags).slice(0,8), keywords:Array.from(keywords).slice(0,8), language: lang, accent: acc, forbidden:Array.from(forbidden).slice(0,8), meta:{ mode:'shooter', difficulty: diffSel.value, duration, score: Math.max(0, Math.round(kills*100 + bestCombo*20 - forbidden.size*50)), accuracy: calcAcc(), bestCombo } }; if(onFinish) onFinish(out); }
  function calcAcc(){ const total=shots||1; return Math.round((hits/total)*100); }
  function loop(ts){ if(!t0) t0=ts; now=ts; const elapsed=(now-t0)/1000; update(1/60); draw(elapsed); if (elapsed<duration && running && player.hp>0) raf=requestAnimationFrame(loop); else endGame(); }
  function update(dt){ const sp=player.speed*dt; player.vx = (keys['ArrowRight']||keys['d']?1:0) - (keys['ArrowLeft']||keys['a']?1:0); player.vy = (keys['ArrowDown']||keys['s']?1:0) - (keys['ArrowUp']||keys['w']?1:0); const len=Math.hypot(player.vx,player.vy)||1; player.x += (player.vx/len)*sp; player.y += (player.vy/len)*sp; clampPlayer(); if ((keys[' ']||mouseDown) && (now%200<16)) spawnBullet(); if (Math.random() < 0.03*speedScale) spawnEnemy(); if (Math.random() < 0.015) spawnPickup(); if (Math.random() < 0.01) spawnHazard(); for (let i=bullets.length-1;i>=0;i--){ const b=bullets[i]; b.x+=b.vx*dt; b.y+=b.vy*dt; if (b.x<0||b.y<0||b.x>canvas.width||b.y>canvas.height) bullets.splice(i,1);} enemies.forEach(e=>{ const dx=player.x-e.x, dy=player.y-e.y; const d=Math.hypot(dx,dy)||1; const v=(60*speedScale)/(0.5+Math.random()); e.x+=(dx/d)*v*dt; e.y+=(dy/d)*v*dt; }); for (let i=enemies.length-1;i>=0;i--){ const e=enemies[i]; let dead=false; for (let j=bullets.length-1;j>=0;j--){ const b=bullets[j]; if (Math.hypot(b.x-e.x,b.y-e.y)<=e.r){ bullets.splice(j,1); dead=true; hits++; break; } } if (dead){ enemies.splice(i,1); kills++; combo++; bestCombo=Math.max(bestCombo,combo); genreKills[e.kind]=(genreKills[e.kind]||0)+1; if (Math.random()<0.35) spawnPickupAt(e.x,e.y); } } for (let i=hazards.length-1;i>=0;i--){ const h=hazards[i]; h.x+=h.vx*dt; h.y+=h.vy*dt; if (Math.hypot(h.x-player.x,h.y-player.y)<=h.r+player.r){ hazards.splice(i,1); player.hp--; combo=0; forbidden.add('hazards'); } else if (h.x<0||h.y<0||h.x>canvas.width||h.y>canvas.height) hazards.splice(i,1);} for (let i=pickups.length-1;i>=0;i--){ const p=pickups[i]; if (Math.hypot(p.x-player.x,p.y-player.y)<=18){ pickups.splice(i,1); if (p.type==='tag') styleTags.add(p.label); else if (p.type==='kw') keywords.add(p.label); else if (p.type==='heal') player.hp=Math.min(3,player.hp+1); } } }
  function clampPlayer(){ player.x=Math.max(player.r,Math.min(canvas.width-player.r,player.x)); player.y=Math.max(player.r,Math.min(canvas.height-player.r,player.y)); }
  function spawnBullet(){ const ang=(Math.random()*Math.PI*2); const v=320*speedScale; bullets.push({ x: player.x, y: player.y, vx: Math.cos(ang)*v, vy: Math.sin(ang)*v }); shots++; }
  function spawnEnemy(){ const side=Math.floor(Math.random()*4); const r=10+Math.random()*10; let x=0,y=0; if(side===0){x=0;y=Math.random()*canvas.height;} else if(side===1){x=canvas.width;y=Math.random()*canvas.height;} else if(side===2){x=Math.random()*canvas.width;y=0;} else {x=Math.random()*canvas.width;y=canvas.height;} const kind = enemyKinds[Math.floor(Math.random()*enemyKinds.length)]; enemies.push({x,y,vx:0,vy:0,r,kind}); }
  function spawnHazard(){ const r=10+Math.random()*8; const x=Math.random()*canvas.width, y=Math.random()*canvas.height; const ang=Math.random()*Math.PI*2; const v=80*speedScale; hazards.push({ x,y,vx:Math.cos(ang)*v,vy:Math.sin(ang)*v,r }); }
  function spawnPickup(){ const type = Math.random()<0.6 ? 'tag' : 'kw'; const label = type==='tag' ? sampleTag() : sampleKeyword(); const x=Math.random()*canvas.width, y=Math.random()*canvas.height; pickups.push({ x,y,type,label }); }
  function spawnPickupAt(x,y){ const type = Math.random()<0.6 ? 'tag' : 'kw'; const label = type==='tag' ? sampleTag() : sampleKeyword(); pickups.push({ x,y,type,label }); }

  // Wiring
  startBtn.addEventListener('click', start);
  restartBtn.addEventListener('click', () => { reset(); start(); });
  quitBtn.addEventListener('click', () => { running=false; try{ if(raf) cancelAnimationFrame(raf);}catch(_){} });
  window.addEventListener('keydown', (e)=>{ keys[e.key]=true; }); window.addEventListener('keyup', (e)=>{ keys[e.key]=false; }); canvas.addEventListener('mousedown', ()=>{ mouseDown=true; }); canvas.addEventListener('mouseup', ()=>{ mouseDown=false; });

  function draw(elapsed){ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.fillStyle='#4D96FF'; ctx.beginPath(); ctx.arc(player.x,player.y,player.r,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#FFD93D'; bullets.forEach(b=>{ ctx.fillRect(b.x-2,b.y-2,4,4); }); enemies.forEach(e=>{ ctx.fillStyle=colorForKind(e.kind); ctx.beginPath(); ctx.arc(e.x,e.y,e.r,0,Math.PI*2); ctx.fill(); }); pickups.forEach(p=>{ ctx.fillStyle = p.type==='tag'?'#6BCB77':'#B084CC'; ctx.beginPath(); ctx.arc(p.x,p.y,8,0,Math.PI*2); ctx.fill(); }); ctx.fillStyle='#FF6B6B'; hazards.forEach(h=>{ ctx.beginPath(); ctx.arc(h.x,h.y,h.r,0,Math.PI*2); ctx.fill(); }); ctx.fillStyle='#9aa3b2'; ctx.font='12px system-ui'; ctx.fillText(`Time: ${Math.max(0,(duration-elapsed)|0)}  HP: ${player.hp}  Kills: ${kills}  Combo: ${combo}  Acc: ${calcAcc()}%`, 8, 16); }

  return wrap;
}

function colorForKind(kind){ const map={ 'Trap':'#FF6B6B','Afrobeats':'#6BCB77','Drill':'#4D96FF','R&B':'#FFD93D','House':'#22D3EE'}; return map[kind]||'#888'; }
function pickEnemyKinds(){ const lib=(GENRE_LIBRARY||[]).map(g=>g.name); const targets=['Trap','R&B','Drill','Afrobeats','House']; return targets.map(t=>closest(lib,t)); }
function closest(list, name){ const token=(name||'').toLowerCase(); const exact=list.find(n=>(n||'').toLowerCase()===token); if (exact) return exact; const loose=list.find(n=>(n||'').toLowerCase().includes(token)); return loose||name; }
function sampleTag(){ const pool=['dark bounce','street cinema','silky hook','808 slap','chant hook','retro grit','warm vinyl','head-nod']; return pool[(Math.random()*pool.length)|0]; }
function sampleKeyword(){ const pool=['alley','engine','city','radio','midnight','festival','basement','lights']; return pool[(Math.random()*pool.length)|0]; }
function samplePremise(){ const L=['freedom','rebellion','ambition','escape','triumph','nostalgia','identity','legacy'], R=['defiance','balance','growth','celebration','memory','yearning','perseverance','trust']; return `${L[(Math.random()*L.length)|0]} & ${R[(Math.random()*R.length)|0]}`; }
function makeRng(seed0){ let seed=(seed0>>>0)||0xA5A5A5A5; return function(){ seed|=0; seed=(seed+0x6D2B79F5)|0; let t=Math.imul(seed^(seed>>>15),1|seed); t=(t+Math.imul(t^(t>>>7),61|t))^t; return ((t^(t>>>14))>>>0)/4294967296; }; }

