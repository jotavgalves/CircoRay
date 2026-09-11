let installed=false;

function getArena(target){
  return target?.closest?.('.crhc-arena') || document.querySelector('#crhc-stage .crhc-arena');
}

function fireMove(arena,touch){
  if(!arena||!touch)return;
  try{
    arena.dispatchEvent(new PointerEvent('pointermove',{
      bubbles:true,
      cancelable:true,
      pointerType:'touch',
      pointerId:99,
      isPrimary:true,
      clientX:touch.clientX,
      clientY:touch.clientY,
      buttons:1,
      button:0
    }));
  }catch{
    arena.dispatchEvent(new MouseEvent('mousemove',{
      bubbles:true,
      cancelable:true,
      clientX:touch.clientX,
      clientY:touch.clientY,
      buttons:1,
      button:0
    }));
  }
}

function routeTouch(e){
  const arena=getArena(e.target);
  if(!arena)return;
  const t=e.touches?.[0] || e.changedTouches?.[0];
  if(!t)return;
  e.preventDefault();
  fireMove(arena,t);
}

function installStyles(){
  if(document.getElementById('cr-mobile-chase-input-style'))return;
  const s=document.createElement('style');
  s.id='cr-mobile-chase-input-style';
  s.textContent=`
    .crhc-arena,.crhc-arena *{
      touch-action:none!important;
      overscroll-behavior:contain!important;
      -webkit-user-select:none!important;
      user-select:none!important;
      -webkit-touch-callout:none!important;
    }
    .crhc-player,.crhc-obstacle,.crhc-chaser{pointer-events:none!important}
  `;
  document.head.appendChild(s);
}

export function initMobileChaseInput(){
  if(installed)return;
  installed=true;
  installStyles();
  document.addEventListener('touchstart',routeTouch,{capture:true,passive:false});
  document.addEventListener('touchmove',routeTouch,{capture:true,passive:false});
}
