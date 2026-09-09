const SESSION_KEY='circoray:analytics:session:v1';
function sid(){let v='';try{v=sessionStorage.getItem(SESSION_KEY)||''}catch{}if(v)return v;v=crypto.getRandomValues(new Uint32Array(3)).join('-');try{sessionStorage.setItem(SESSION_KEY,v)}catch{}return v}
function send(type,data={}){fetch('/api/analytics',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,sessionId:sid(),at:Date.now(),data}),keepalive:true}).catch(()=>{})}

function unlockGame(){document.documentElement.classList.remove('cr-intro-pending')}

function installIntro(){
  if(document.getElementById('cr-carmesim-intro'))return;
  const style=document.createElement('style');
  style.textContent=`
  #cr-carmesim-intro{position:fixed;inset:0;z-index:10020;background:radial-gradient(circle at 50% 22%,rgba(126,0,0,.30),transparent 33%),linear-gradient(180deg,#080202 0%,#150504 58%,#040202 100%);display:grid;place-items:center;padding:18px;color:#f3e9d6;overflow:hidden}
  #cr-carmesim-intro::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(0,0,0,.42),transparent 22%,transparent 78%,rgba(0,0,0,.42));box-shadow:inset 0 0 110px rgba(0,0,0,.72)}
  .crc-card{position:relative;z-index:1;width:min(820px,95vw);display:grid;grid-template-columns:minmax(250px,45%) 1fr;align-items:center;gap:24px;border:1px solid rgba(216,165,58,.30);border-radius:20px;padding:18px;background:rgba(9,3,3,.84);box-shadow:0 30px 90px #000,0 0 50px rgba(120,0,0,.18);overflow:hidden}
  .crc-stage{position:relative;display:flex;align-items:center;justify-content:center;overflow:hidden;border-radius:15px;background:linear-gradient(180deg,rgba(35,8,8,.52),rgba(9,3,3,.18));min-height:430px}
  .crc-scene{display:block;width:100%;height:100%;max-height:500px;object-fit:contain;object-position:center;filter:drop-shadow(0 14px 26px rgba(0,0,0,.58)) drop-shadow(0 0 24px rgba(150,0,0,.20))}
  .crc-copy{padding:6px 4px 6px 0}.crc-kicker{font:700 10px 'Rye',serif;letter-spacing:.2em;color:#d8a53a}.crc-card h1{font:400 clamp(31px,7vw,55px) 'Rye',serif;margin:7px 0 11px;color:#fff;text-shadow:0 0 22px rgba(180,0,0,.4)}.crc-card p{font:14px/1.55 'Special Elite',monospace;color:#d9cdbd;margin:0 0 10px}.crc-card button{margin-top:11px;border:2px solid #2a0909;border-radius:11px;padding:13px 22px;background:linear-gradient(#9e1010,#4a0000);color:#fff;font:700 13px 'Rye',serif;box-shadow:0 5px 0 #180505;cursor:pointer}.crc-card button:active{transform:translateY(3px);box-shadow:0 2px 0 #180505}
  @media(max-width:600px){#cr-carmesim-intro{padding:8px}.crc-card{width:min(96vw,440px);grid-template-columns:1fr;text-align:center;gap:10px;padding:10px}.crc-stage{min-height:0;max-height:54vh}.crc-scene{width:min(100%,330px);max-height:54vh}.crc-copy{padding:0 8px 6px}.crc-card p{font-size:12px}.crc-card h1{font-size:clamp(28px,8.8vw,40px);margin:4px 0 8px}.crc-card button{width:100%;margin-top:7px;padding:12px 16px}}
  @media(max-height:690px) and (max-width:600px){.crc-stage{max-height:45vh}.crc-scene{max-height:45vh}.crc-card p{font-size:11px;line-height:1.42}.crc-card h1{font-size:29px}}
  `;
  document.head.appendChild(style);

  const root=document.createElement('div');
  root.id='cr-carmesim-intro';
  root.innerHTML=`<div class="crc-card"><div class="crc-stage"><img class="crc-scene" src="/assets/images/clown/palhaco-carmesim-guiche.webp" alt="Palhaço Carmesim em seu guichê"></div><div class="crc-copy"><div class="crc-kicker">MESTRE DO PARQUE</div><h1>Palhaço Carmesim</h1><p>“Pode me chamar de <strong>Palhaço Carmesim</strong>. Este parque é meu. Os jogos também.”</p><p>“Ganhe seus tickets e talvez eu deixe você ir. Só existe uma recomendação: não teste a minha paciência.”</p><button type="button">ENTRAR NO PARQUE</button></div></div>`;
  document.body.appendChild(root);
  root.querySelector('button').addEventListener('click',()=>{
    const animation=root.animate([{opacity:1},{opacity:0}],{duration:320,easing:'ease',fill:'forwards'});
    Promise.resolve(animation.finished).catch(()=>{}).finally(()=>{root.remove();unlockGame();send('intro_complete')});
  },{once:true});
  send('intro_view');
}

function installAnalytics(){send('visit');let last='';const check=()=>{const active=document.querySelector('.screen.active')?.id||'';if(active&&active!==last){last=active;send('screen',{screen:active});if(active.includes('game1'))send('run_start');}};new MutationObserver(check).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});check();window.addEventListener('circoray:hardcore-armed',e=>send('hardcore_armed',{anger:e.detail?.anger||0,fury:!!e.detail?.fury}));window.addEventListener('circoray:hardcore-fury',e=>send('fury',{anger:e.detail?.anger||0}));window.addEventListener('circoray:hardcore-complete',()=>send('hardcore_complete'));window.addEventListener('circoray:roulette-result',e=>send('roulette',{outcome:e.detail?.outcome||''}));window.addEventListener('circoray:tension-change',e=>{if(Number(e.detail?.value||0)>=80)send('high_tension',{value:e.detail.value})},{once:true})}
export function initIntroAnalytics(){installAnalytics();installIntro()}
export function releaseIntroLock(){unlockGame()}
