export function initUiFixes(){
  if(window.__circorayUiFixesLoaded)return;
  window.__circorayUiFixesLoaded=true;

  const style=document.createElement('style');
  style.textContent=`
    /* ROLETA: o ponteiro fica sobre o centro de uma fatia, não sobre uma divisória. */
    .wheel{
      background:conic-gradient(from -30deg,
        var(--ink) 0deg 60deg,
        var(--stripe-red) 60deg 120deg,
        var(--ink) 120deg 180deg,
        var(--stripe-red) 180deg 240deg,
        var(--ink) 240deg 300deg,
        var(--stripe-red) 300deg 360deg)!important;
    }
    .pointer{
      top:-18px!important;
      font-size:31px!important;
      line-height:1!important;
      filter:drop-shadow(0 3px 3px rgba(0,0,0,.75)) drop-shadow(0 0 4px rgba(216,165,58,.45))!important;
    }
    .wheel .slice-label{
      position:absolute!important;
      width:82px!important;
      margin:0!important;
      text-align:center!important;
      font-family:'Rye',serif!important;
      font-size:11px!important;
      line-height:1.08!important;
      letter-spacing:0!important;
      white-space:normal!important;
      transform:translate(-50%,-50%)!important;
      transform-origin:center!important;
      writing-mode:horizontal-tb!important;
      z-index:3!important;
      pointer-events:none!important;
      text-shadow:0 1px 2px #000,0 0 4px rgba(0,0,0,.8)!important;
    }
    .captive{width:27%!important;max-width:88px!important}

    /* A fala precisa parecer sair do personagem. */
    .speech-bubble{
      top:2%!important;
      left:68%!important;
      width:48%!important;
      max-width:205px!important;
      padding:8px 11px!important;
    }
    .speech-bubble::after{left:11px!important;bottom:-12px!important}
    .speech-bubble::before{left:13px!important;bottom:-7px!important}

    /* A ação do jogo é GIRAR; ranking é navegação secundária. */
    .spin-btn{
      min-width:122px!important;
      padding:13px 28px!important;
      font-size:18px!important;
      opacity:1;
      filter:none!important;
    }
    .spin-btn:not(:disabled){
      background:linear-gradient(180deg,#a91414,#5a0000)!important;
      border-color:#180000!important;
      box-shadow:0 6px 0 #120707,0 9px 18px rgba(0,0,0,.55),0 0 14px rgba(150,0,0,.22)!important;
      color:#fff!important;
    }
    .spin-btn:disabled{opacity:.42!important;filter:grayscale(.2)!important}
    #cr-ranking-btn{
      padding:8px 11px!important;
      font-size:10px!important;
      border-width:1px!important;
      opacity:.78!important;
      box-shadow:0 3px 0 #0e0908,0 5px 12px rgba(0,0,0,.35)!important;
    }
    #cr-ranking-btn:hover,#cr-ranking-btn:focus-visible{opacity:1!important}

    /* Medidor de raiva: usa o espaço vazio da topbar em vez da área de jogo. */
    #cr-hardcore-meter{
      top:18px!important;
      bottom:auto!important;
      left:50%!important;
      width:94px!important;
      min-height:22px!important;
      padding:4px 7px!important;
      border-radius:999px!important;
      transform:translate(-50%,-8px)!important;
      background:rgba(14,9,8,.86)!important;
      box-shadow:0 3px 10px rgba(0,0,0,.35)!important;
    }
    #cr-hardcore-meter.visible{transform:translate(-50%,0)!important}
    #cr-hardcore-meter .crhm-head{margin:0 0 3px!important;justify-content:center!important}
    #cr-hardcore-meter .crhm-head strong{display:none!important}
    #cr-hardcore-meter .crhm-head span{font-size:9px!important;color:#f3e9d6!important}
    #cr-hardcore-meter .crhm-track{height:3px!important}
    #cr-hardcore-meter .crhm-status{display:none!important}
    #cr-hardcore-meter.armed{width:104px!important;border-color:#c40000!important}

    /* Mobile: mais respiro vertical e roleta ligeiramente menor. */
    @media(max-width:600px){
      #screen-game3{gap:7px!important;padding-top:6px!important;padding-bottom:8px!important}
      .wheel-wrap{width:min(76vw,276px)!important}
      .wheel .slice-label{width:72px!important;font-size:9.5px!important;line-height:1.06!important}
      .captive{width:25%!important;max-width:70px!important}
      .speech-bubble{left:66%!important;top:1%!important;width:51%!important;max-width:176px!important;font-size:11px!important}
      .spin-btn{min-width:116px!important;padding:11px 23px!important;font-size:16px!important}
      #cr-ranking-btn{right:8px!important;bottom:8px!important;padding:7px 9px!important;font-size:9px!important}
      #cr-hardcore-meter{top:17px!important;width:88px!important;padding:3px 6px!important}
      #cr-hardcore-meter.armed{width:98px!important}
    }
    @media(max-width:380px){
      .wheel-wrap{width:min(74vw,254px)!important}
      .wheel .slice-label{width:66px!important;font-size:8.8px!important}
      .captive{width:24%!important}
    }
  `;
  document.head.appendChild(style);

  const names=['TICKET','TENTE DE NOVO','VOLTE AO INÍCIO','TICKET','TENTE DE NOVO','VOLTE AO INÍCIO'];
  const points=[[50,18.5],[77.5,34],[77.5,66],[50,81.5],[22.5,66],[22.5,34]];
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
  [80,250,700,1400].forEach(ms=>setTimeout(fix,ms));

  const wheel=document.querySelector('.wheel');
  if(wheel){
    const observer=new MutationObserver(fix);
    observer.observe(wheel,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  }

  window.addEventListener('circoray:config-ready',fix);
  window.addEventListener('circoray:hardcore-armed',fix);
  window.CIRCO_FIX_WHEEL_LABELS=fix;
}
