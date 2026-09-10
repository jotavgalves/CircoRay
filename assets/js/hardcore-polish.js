const POLISH_ID = 'cr-hardcore-polish';

const COPY_REPLACEMENTS = new Map([
  ['Agora existem dois caminhos para você perder.', 'Um já era ruim. Agora são dois atrás de você.'],
  ['O falso verdadeiro fez exatamente o que precisava.', 'Você caiu no sinal falso.'],
  ['No Fúria, uma ameaça falsa pode imitar quase perfeitamente a verdadeira.', 'Cuidado: uma porta falsa também pode tremer e brilhar.'],
  ['A raiva acaba com esta run. A memória do que você fez, não.', 'Você sobreviveu ao modo Fúria.'],
]);

const SPEECH_REPLACEMENTS = new Map([
  ['EU NÃO PRECISO SER UM SÓ.', 'HAHAHAHAHA!'],
  ['SAIA DA PAREDE.', 'SAI DA PAREDE.'],
  ['AS PAREDES NÃO VÃO TE SALVAR.', 'ACHOU QUE A PAREDE IA TE SALVAR?'],
  ['EU CONSIGO TE VER.', 'EU TÔ TE VENDO.'],
]);

function ensureStyles(){
  if(document.getElementById(POLISH_ID)) return;
  const style=document.createElement('style');
  style.id=POLISH_ID;
  style.textContent=`
  .crhc-transition{background:rgba(5,3,3,.98)!important;overflow:hidden}
  .crhc-transition>div{width:min(620px,92vw);position:relative}
  .crhc-transition .duo{position:relative!important;height:min(220px,34vh)!important;display:grid!important;place-items:center!important;margin:0 auto 12px!important;max-width:420px!important;overflow:visible!important}
  .crhc-transition .duo::before,.crhc-transition .duo::after{display:none!important;content:none!important}
  .crhc-transition .duo img{position:static!important;width:min(185px,46vw)!important;margin:0!important;opacity:1!important;filter:drop-shadow(0 0 18px rgba(122,0,0,.55))!important;animation:none!important;transform:none!important}
  .crhc-transition .duo img:last-child{display:none!important}
  .crhc-transition h2{font-size:clamp(25px,6vw,40px)!important;max-width:580px;margin:10px auto 8px!important;text-wrap:balance}
  .crhc-transition p{opacity:.84;margin:0 auto 18px!important;max-width:500px!important;line-height:1.45!important}
  .crhc-transition .crhc-btn{min-width:220px}
  .crhc-arena.crhc-double-polished .crhc-chaser:not(.clone){filter:drop-shadow(0 0 19px #770000)!important}
  .crhc-arena.crhc-double-polished .crhc-chaser.clone{filter:brightness(.78) contrast(1.08) drop-shadow(0 0 24px #ff1d1d)!important}
  .crhc-entry.cr-delayed-true{border-color:#5c3a20!important;box-shadow:none!important;animation:none!important}
  .crhc-entry.cr-delayed-true::after{opacity:0!important}
  `;
  document.head.appendChild(style);
}

function replaceExactText(root, replacements){
  if(!root) return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())){
    const clean=(node.nodeValue||'').trim();
    const replacement=replacements.get(clean);
    if(replacement) node.nodeValue=node.nodeValue.replace(clean,replacement);
  }
}

function polishTransition(stage){
  const transition=stage.querySelector('.crhc-transition');
  if(!transition || transition.dataset.polished==='1') return;
  transition.dataset.polished='1';
  const title=transition.querySelector('h2');
  const text=transition.querySelector('p');
  const button=transition.querySelector('button');
  if(title) title.textContent='ACHOU QUE TINHA ESCAPADO?';
  if(text) text.textContent='O palhaço não vai deixar você sair. Agora você precisa fugir dos dois.';
  if(button) button.textContent='CORRER DOS DOIS';
}

function polishCopy(stage){
  replaceExactText(stage,COPY_REPLACEMENTS);
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

function installSpeechCopy(){
  const bubble=document.querySelector('.speech-bubble');
  if(!bubble || bubble.dataset.copyPolish==='1') return;
  bubble.dataset.copyPolish='1';
  const sync=()=>replaceExactText(bubble,SPEECH_REPLACEMENTS);
  const observer=new MutationObserver(sync);
  observer.observe(bubble,{subtree:true,childList:true,characterData:true});
  sync();
}

export function initHardcorePolish(){
  ensureStyles();
  const stage=document.getElementById('crhc-stage');
  if(!stage || stage.dataset.polishObserver==='1') return;
  stage.dataset.polishObserver='1';
  const sync=()=>{polishTransition(stage);polishCopy(stage);polishDoubleArena(stage);installDoorDelay(stage);installSpeechCopy()};
  const observer=new MutationObserver(sync);
  observer.observe(stage,{childList:true,subtree:true});
  sync();
}
