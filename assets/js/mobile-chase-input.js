let installed=false;
function getArena(target){return target?.closest?.('.crhc-arena')||null}
function firePointer(arena,type,touch){
  if(!arena||!touch)return;
  try{
    arena.dispatchEvent(new PointerEvent(type,{bubbles:true,cancelable:true,pointerType:'touch',pointerId:99,isPrimary:true,clientX:touch.clientX,clientY:touch.clientY,buttons:type==='pointerup'?0:1,button:0}));
  }catch{
    const ev=new MouseEvent(type==='pointermove'?'mousemove':type==='pointerdown'?'mousedown':'mouseup',{bubbles:true,cancelable:true,clientX:touch.clientX,clientY:touch.clientY,buttons:type==='pointerup'?0:1,button:0});
    arena.dispatchEvent(ev);
  }
}
function onTouchStart(e){
  const arena=getArena(e.target);
  if(!arena)return;
  const t=e.touches?.[0]||e.changedTouches?.[0];
  if(!t)return;
  e.preventDefault();
  firePointer(arena,'pointerdown',t);
}
function onTouchMove(e){
  const arena=getArena(e.target);
  if(!arena)return;
  const t=e.touches?.[0]||e.changedTouches?.[0];
  if(!t)return;
  e.preventDefault();
  firePointer(arena,'pointermove',t);
}
function onTouchEnd(e){
  const arena=getArena(e.target);
  if(!arena)return;
  const t=e.changedTouches?.[0];
  if(!t)return;
  e.preventDefault();
  firePointer(arena,'pointerup',t);
}
function installStyles(){
  if(document.getElementById('cr-mobile-chase-input-style'))return;
  const s=document.createElement('style');
  s.id='cr-mobile-chase-input-style';
  s.textContent='.crhc-arena,.crhc-arena *{touch-action:none!important;-webkit-user-select:none!important;user-select:none!important}.crhc-player{pointer-events:none!important}';
  document.head.appendChild(s);
}
export function initMobileChaseInput(){
  if(installed)return;installed=true;installStyles();
  document.addEventListener('touchstart',onTouchStart,{capture:true,passive:false});
  document.addEventListener('touchmove',onTouchMove,{capture:true,passive:false});
  document.addEventListener('touchend',onTouchEnd,{capture:true,passive:false});
  document.addEventListener('touchcancel',onTouchEnd,{capture:true,passive:false});
}
