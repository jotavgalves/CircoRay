let installed=false;
const moveHandlers=new WeakMap();
let originalAddEventListener=null;

function getArena(target){
  return target?.closest?.('.crhc-arena') || document.querySelector('#crhc-stage .crhc-arena');
}

function rememberArenaMoveHandler(){
  if(originalAddEventListener)return;
  originalAddEventListener=EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener=function(type,listener,options){
    try{
      if(type==='pointermove' && this instanceof Element && this.classList?.contains('crhc-arena') && typeof listener==='function'){
        moveHandlers.set(this,listener);
      }
    }catch{}
    return originalAddEventListener.call(this,type,listener,options);
  };
}

function directMove(arena,touch){
  if(!arena||!touch)return false;
  const handler=moveHandlers.get(arena);
  if(typeof handler!=='function')return false;
  try{
    handler.call(arena,{
      buttons:1,
      pointerType:'touch',
      clientX:touch.clientX,
      clientY:touch.clientY,
      preventDefault(){},
      stopPropagation(){}
    });
    return true;
  }catch(error){
    console.error('Falha no controle touch direto da perseguição:',error);
    return false;
  }
}

function routeTouch(e){
  const arena=getArena(e.target);
  if(!arena)return;
  const touch=e.touches?.[0] || e.changedTouches?.[0];
  if(!touch)return;
  e.preventDefault();
  directMove(arena,touch);
}

function installStyles(){
  if(document.getElementById('cr-mobile-chase-input-style-v2'))return;
  const style=document.createElement('style');
  style.id='cr-mobile-chase-input-style-v2';
  style.textContent=`
    .crhc-arena,.crhc-arena *{
      touch-action:none!important;
      overscroll-behavior:contain!important;
      -webkit-user-select:none!important;
      user-select:none!important;
      -webkit-touch-callout:none!important;
    }
    .crhc-player,.crhc-obstacle,.crhc-chaser,.crhc-hud{pointer-events:none!important}
    @media (max-width:600px){
      .crhc-arena .crhc-obstacle[style*="bottom:16%"]{
        right:5%!important;
        width:22%!important;
      }
    }
  `;
  document.head.appendChild(style);
}

export function initMobileChaseInput(){
  if(installed)return;
  installed=true;
  rememberArenaMoveHandler();
  installStyles();
  document.addEventListener('touchstart',routeTouch,{capture:true,passive:false});
  document.addEventListener('touchmove',routeTouch,{capture:true,passive:false});
}
