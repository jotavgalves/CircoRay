export function initUiFixes(){
  if(window.__circorayUiFixesLoaded)return;
  window.__circorayUiFixesLoaded=true;
  const style=document.createElement('style');
  style.textContent='.wheel .slice-label{width:86px!important;margin:0!important;text-align:center!important;font-family:Rye,serif!important;font-size:10px!important;line-height:1.05!important;letter-spacing:-.02em!important;white-space:normal!important;transform:translate(-50%,-50%)!important;transform-origin:center!important;writing-mode:horizontal-tb!important;z-index:3!important}@media(max-width:600px){.wheel .slice-label{width:72px!important;font-size:9px!important;line-height:1!important}}';
  document.head.appendChild(style);
  function fix(){
    const labels=[...document.querySelectorAll('.wheel .slice-label')].slice(0,6);
    if(labels.length!==6)return;
    const names=['TICKET','VOLTE AO INÍCIO','TENTE DE NOVO','TICKET','VOLTE AO INÍCIO','TENTE DE NOVO'];
    const radius=32;
    labels.forEach((label,i)=>{
      const angle=(-60+i*60)*Math.PI/180;
      label.textContent=names[i];
      label.style.left=(50+Math.cos(angle)*radius)+'%';
      label.style.top=(50+Math.sin(angle)*radius)+'%';
      label.style.transform='translate(-50%,-50%)';
    });
  }
  fix();
  window.CIRCO_FIX_WHEEL_LABELS=fix;
}
