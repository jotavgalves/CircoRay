export function initUiFixes(){
  if(window.__circorayUiFixesLoaded)return;
  window.__circorayUiFixesLoaded=true;

  const style=document.createElement('style');
  style.textContent=`
    .wheel .slice-label{
      position:absolute!important;
      width:72px!important;
      margin:0!important;
      text-align:center!important;
      font-family:'Rye',serif!important;
      font-size:10px!important;
      line-height:1.02!important;
      letter-spacing:-.02em!important;
      white-space:normal!important;
      transform:translate(-50%,-50%)!important;
      transform-origin:center!important;
      writing-mode:horizontal-tb!important;
      z-index:3!important;
      pointer-events:none!important;
    }
    @media(max-width:600px){
      .wheel .slice-label{width:64px!important;font-size:9px!important;line-height:1!important}
    }
  `;
  document.head.appendChild(style);

  const names=['TICKET','VOLTE AO INÍCIO','TENTE DE NOVO','TICKET','VOLTE AO INÍCIO','TENTE DE NOVO'];
  const points=[[66.5,21.5],[82.5,50],[66.5,78.5],[33.5,78.5],[17.5,50],[33.5,21.5]];
  let raf=0;

  function fix(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const wheel=document.querySelector('.wheel');
      if(!wheel)return;
      const labels=[...wheel.querySelectorAll('.slice-label')].slice(0,6);
      if(labels.length!==6)return;
      labels.forEach((label,i)=>{
        label.textContent=names[i];
        label.style.setProperty('left',points[i][0]+'%','important');
        label.style.setProperty('top',points[i][1]+'%','important');
        label.style.setProperty('right','auto','important');
        label.style.setProperty('bottom','auto','important');
        label.style.setProperty('transform','translate(-50%,-50%)','important');
        label.style.removeProperty('rotate');
      });
    });
  }

  fix();
  setTimeout(fix,100);
  setTimeout(fix,500);

  const wheel=document.querySelector('.wheel');
  if(wheel){
    const observer=new MutationObserver(fix);
    observer.observe(wheel,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  }

  window.addEventListener('circoray:config-ready',fix);
  window.CIRCO_FIX_WHEEL_LABELS=fix;
}
