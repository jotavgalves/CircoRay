const POLISH_ID = 'cr-hardcore-polish';

function ensureStyles(){
  if(document.getElementById(POLISH_ID)) return;
  const style=document.createElement('style');
  style.id=POLISH_ID;
  style.textContent=`
  .crhc-transition{background:radial-gradient(circle at 50% 44%,rgba(110,0,0,.28),rgba(5,3,3,.98) 54%)!important;overflow:hidden}
  .crhc-transition>div{width:min(680px,94vw);position:relative}
  .crhc-transition .duo{position:relative!important;height:min(245px,38vh)!important;display:block!important;margin:0 auto 12px!important;max-width:520px!important;overflow:visible!important}
  .crhc-transition .duo::before{content:'';position:absolute;left:50%;top:50%;width:24px;height:24px;border-radius:50%;transform:translate(-50%,-50%) scale(.2);background:#fff;box-shadow:0 0 28px #fff,0 0 70px #ff1d1d,0 0 130px #7a0000;animation:crMagicBurst 1.05s .22s ease-out both;z-index:4;pointer-events:none}
  .crhc-transition .duo::after{content:'';position:absolute;left:50%;top:50%;width:2px;height:78%;transform:translate(-50%,-50%) scaleY(0);background:linear-gradient(transparent,#fff,#ff1d1d,#fff,transparent);filter:drop-shadow(0 0 14px #ff1d1d);animation:crMagicCut .7s .45s ease-out both;z-index:5;pointer-events:none}
  .crhc-transition .duo img{position:absolute!important;left:50%!important;top:50%!important;width:min(175px,39vw)!important;margin:0!important;opacity:0!important;filter:drop-shadow(0 0 25px #7a0000)!important;animation:none!important;will-change:transform,opacity,filter}
  .crhc-transition .duo img:first-child{transform:translate(-50%,-50%)!important;animation:crOriginalSplit 1.18s .2s cubic-bezier(.2,.8,.2,1) both!important}
  .crhc-transition .duo img:last-child{transform:translate(-50%,-50%)!important;animation:crCloneSplit 1.18s .2s cubic-bezier(.2,.8,.2,1) both!important}
  .crhc-transition h2{font-size:clamp(25px,6vw,42px)!important;max-width:620px;margin:10px auto 8px!important;text-wrap:balance}
  .crhc-transition p{opacity:.82;margin:0 auto 18px!important;max-width:520px!important}
  .crhc-transition .crhc-btn{min-width:220px}
  @keyframes crMagicBurst{0%{opacity:0;transform:translate(-50%,-50%) scale(.15)}35%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(11)}}
  @keyframes crMagicCut{0%{opacity:0;transform:translate(-50%,-50%) scaleY(0)}45%{opacity:1;transform:translate(-50%,-50%) scaleY(1)}100%{opacity:0;transform:translate(-50%,-50%) scaleY(1.25)}}
  @keyframes crOriginalSplit{0%,18%{opacity:1;transform:translate(-50%,-50%) scale(1);filter:blur(0) drop-shadow(0 0 24px #7a0000)}42%{opacity:.88;filter:blur(2px) drop-shadow(0 0 60px #ff1d1d)}100%{opacity:1;transform:translate(calc(-50% - 104px),-50%) scale(.92);filter:blur(0) drop-shadow(0 0 22px #7a0000)}}
  @keyframes crCloneSplit{0%,20%{opacity:0;transform:translate(-50%,-50%) scale(.82);filter:blur(12px) drop-shadow(0 0 70px #ff1d1d)}44%{opacity:.9}100%{opacity:1;transform:translate(calc(-50% + 104px),-50%) scale(.92);filter:blur(0) drop-shadow(0 0 22px #b00000)}}
  .crhc-arena.crhc-double-polished .crhc-chaser:not(.clone){filter:drop-shadow(0 0 19px #770000)!important}
  .crhc-arena.crhc-double-polished .crhc-chaser.clone{filter:brightness(.78) contrast(1.08) drop-shadow(0 0 24px #ff1d1d)!important}
  .crhc-entry.cr-delayed-true{border-color:#5c3a20!important;box-shadow:none!important;animation:none!important}
  .crhc-entry.cr-delayed-true::after{opacity:0!important}
  `;
  document.head.appendChild(style);
}

function polishTransition(stage){
  const transition=stage.querySelector('.crhc-transition');
  if(!transition || transition.dataset.polished==='1') return;
  transition.dataset.polished='1';
  const title=transition.querySelector('h2');
  const text=transition.querySelector('p');
  const button=transition.querySelector('button');
  if(title) title.textContent='VOCÊ AINDA NÃO VAI SAIR.';
  if(text) text.textContent='A luz apaga. O riso ecoa duas vezes. Quando você olha de novo, há dois.';
  if(button) button.textContent='CORRER';
}

function polishDoubleArena(stage){
  const arena=stage.querySelector('.crhc-arena');
  if(!arena || arena.dataset.doublePolished==='1') return;
  const pair=[...arena.querySelectorAll('.crhc-chaser')];
  if(pair.length!==2) return;
  arena.dataset.doublePolished='1';
  arena.classList.add('crhc-double-polished');
  const separate=()=>{
    if(!arena.isConnected) return;
    const a=pair[0], b=pair[1];
    const ax=parseFloat(a.style.left)||0, ay=parseFloat(a.style.top)||0;
    const bx=parseFloat(b.style.left)||0, by=parseFloat(b.style.top)||0;
    const d=Math.hypot(ax-bx,ay-by);
    if(d<96){
      const push=Math.min(38,(96-d)*.48);
      a.style.marginLeft=`-${push}px`;
      b.style.marginLeft=`${push}px`;
      a.style.marginTop='-10px';
      b.style.marginTop='10px';
    }else{
      a.style.marginLeft='0px'; b.style.marginLeft='0px';
      a.style.marginTop='0px'; b.style.marginTop='0px';
    }
    requestAnimationFrame(separate);
  };
  requestAnimationFrame(separate);
}

function installDoorDelay(stage){
  const scene=stage.querySelector('.crhc-door-scene');
  if(!scene || scene.dataset.delayInstalled==='1') return;
  scene.dataset.delayInstalled='1';
  let suppress=false;
  const observer=new MutationObserver(records=>{
    if(suppress || !document.body.classList.contains('cr-hardcore-fury')) return;
    for(const record of records){
      const el=record.target;
      if(!(el instanceof HTMLElement) || !el.classList.contains('crhc-entry')) continue;
      if(el.classList.contains('warn') && !el.dataset.trueDelayed){
        el.dataset.trueDelayed='1';
        suppress=true;
        el.classList.remove('warn');
        el.classList.add('cr-delayed-true');
        suppress=false;
        setTimeout(()=>{
          if(!el.isConnected) return;
          suppress=true;
          el.classList.remove('cr-delayed-true');
          el.classList.add('warn');
          suppress=false;
        },150);
      }
      if(!el.classList.contains('warn') && !el.classList.contains('cr-delayed-true') && !el.classList.contains('near-true')) delete el.dataset.trueDelayed;
    }
  });
  observer.observe(scene,{subtree:true,attributes:true,attributeFilter:['class']});
}

export function initHardcorePolish(){
  ensureStyles();
  const stage=document.getElementById('crhc-stage');
  if(!stage || stage.dataset.polishObserver==='1') return;
  stage.dataset.polishObserver='1';
  const sync=()=>{polishTransition(stage);polishDoubleArena(stage);installDoorDelay(stage)};
  const observer=new MutationObserver(sync);
  observer.observe(stage,{childList:true,subtree:true});
  sync();
}
