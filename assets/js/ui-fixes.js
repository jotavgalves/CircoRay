export function initUiFixes(){
  if(window.__circorayUiFixesLoaded)return;
  window.__circorayUiFixesLoaded=true;

  const style=document.createElement('style');
  style.textContent=`
    .wheel{background:conic-gradient(from 0deg,var(--ink) 0deg 60deg,var(--stripe-red) 60deg 120deg,var(--ink) 120deg 180deg,var(--stripe-red) 180deg 240deg,var(--ink) 240deg 300deg,var(--stripe-red) 300deg 360deg)!important}
    .pointer{top:-18px!important;font-size:31px!important;line-height:1!important;filter:drop-shadow(0 3px 3px rgba(0,0,0,.75)) drop-shadow(0 0 4px rgba(216,165,58,.45))!important}
    .wheel .slice-label{position:absolute!important;width:86px!important;margin:0!important;text-align:center!important;font-family:'Rye',serif!important;font-size:12px!important;line-height:1.06!important;letter-spacing:0!important;white-space:normal!important;transform:translate(-50%,-50%)!important;rotate:0deg!important;transform-origin:center!important;writing-mode:horizontal-tb!important;z-index:3!important;pointer-events:none!important;text-shadow:0 1px 2px #000,0 0 4px rgba(0,0,0,.8)!important}
    .captive{width:42%!important;max-width:132px!important;max-height:132px!important;height:auto!important;object-fit:contain!important;z-index:4!important;filter:drop-shadow(0 2px 4px rgba(0,0,0,.55)) drop-shadow(0 0 6px rgba(0,0,0,.28))!important}

    .clown-wrap{transform:none!important}
    .clown-img.cr-clown-hate-aura,.clown-img.cr-clown-angry-visible{transform:none!important;transform-origin:center bottom!important}
    .clown-img.cr-clown-hate-aura{animation:crFixedHateAura 1.05s ease-in-out infinite alternate!important}
    body.cr-hardcore-fury .clown-img.cr-clown-hate-aura{animation-duration:.48s!important}
    @keyframes crFixedHateAura{from{filter:drop-shadow(0 0 8px rgba(255,0,0,.78)) drop-shadow(0 0 20px rgba(150,0,0,.64)) contrast(1.08) saturate(1.08)}to{filter:drop-shadow(0 0 14px rgba(255,20,20,1)) drop-shadow(0 0 34px rgba(170,0,0,.88)) drop-shadow(0 0 52px rgba(80,0,0,.55)) contrast(1.14) saturate(1.2)}}

    body.cr-hardcore-armed::after{background:radial-gradient(circle at 20% 31%,rgba(255,0,0,.16) 0,rgba(120,0,0,.10) 13%,transparent 30%),radial-gradient(ellipse at center,transparent 34%,rgba(55,0,0,.20) 66%,rgba(20,0,0,.62) 100%)!important;box-shadow:inset 0 0 95px rgba(85,0,0,.5)!important}
    body.cr-hardcore-armed #app{filter:brightness(.92) saturate(.86) contrast(1.08)!important}
    body.cr-hardcore-armed .stage{box-shadow:inset 0 0 38px rgba(70,0,0,.45)!important}
    body.cr-hardcore-armed .clown-wrap::before{content:"";position:absolute;left:4%;right:4%;top:7%;bottom:2%;z-index:-1;border-radius:48%;background:radial-gradient(circle,rgba(255,0,0,.28),rgba(135,0,0,.12) 45%,transparent 72%);filter:blur(15px);animation:crLocalHatePulse 1.05s ease-in-out infinite alternate;pointer-events:none}
    body.cr-hardcore-fury .clown-wrap::before{animation-duration:.48s;background:radial-gradient(circle,rgba(255,25,25,.38),rgba(155,0,0,.16) 44%,transparent 72%)}
    @keyframes crLocalHatePulse{to{opacity:.58;filter:blur(22px)}}

    .speech-bubble{top:1%!important;left:75%!important;width:auto!important;max-width:205px!important;min-width:128px!important;padding:10px 14px 11px!important;border:2px solid #1b0d08!important;border-radius:16px 13px 15px 10px!important;background:linear-gradient(180deg,#eee4cf 0%,#e4d5bb 100%)!important;box-shadow:0 3px 0 rgba(27,13,8,.55),0 8px 15px rgba(0,0,0,.32)!important;transform:rotate(-1deg)!important;transform-origin:left bottom!important;overflow:visible!important}
    .speech-bubble::after{content:""!important;position:absolute!important;left:-12px!important;bottom:12px!important;width:18px!important;height:14px!important;background:#e7d8bf!important;border-left:2px solid #1b0d08!important;border-bottom:2px solid #1b0d08!important;border-right:0!important;border-top:0!important;clip-path:polygon(100% 0,100% 100%,0 72%)!important;transform:rotate(8deg)!important;z-index:0!important;filter:drop-shadow(-1px 2px 0 rgba(27,13,8,.28))!important}
    .speech-bubble::before{content:""!important;position:absolute!important;inset:3px!important;border:1px solid rgba(103,72,43,.20)!important;border-radius:12px 10px 11px 8px!important;background:transparent!important;pointer-events:none!important;z-index:1!important}
    .speech-bubble p{position:relative!important;z-index:2!important;margin:0!important;line-height:1.28!important;letter-spacing:.01em!important;text-align:left!important}

    .spin-btn{min-width:122px!important;padding:13px 28px!important;font-size:18px!important;filter:none!important}
    .spin-btn:not(:disabled){opacity:1!important;background:linear-gradient(180deg,#b41717,#610000)!important;border-color:#180000!important;box-shadow:0 6px 0 #120707,0 9px 18px rgba(0,0,0,.55),0 0 16px rgba(180,0,0,.28)!important;color:#fff!important}
    .spin-btn:disabled{opacity:.42!important;filter:grayscale(.2)!important}

    #cr-ranking-btn{display:none!important;right:12px!important;bottom:12px!important;padding:9px 12px!important;font-size:10px!important;border-width:1px!important;opacity:.88!important;box-shadow:0 3px 0 #0e0908,0 5px 12px rgba(0,0,0,.35)!important}
    #cr-ranking-btn.visible,#cr-ranking-btn.cr-ranking-final-visible{display:block!important}
    #cr-ranking-btn:hover,#cr-ranking-btn:focus-visible{opacity:1!important}

    @media(max-width:600px){
      #screen-game3{gap:7px!important;padding-top:6px!important;padding-bottom:8px!important}
      .wheel-wrap{width:min(78vw,286px)!important}
      .wheel .slice-label{width:74px!important;font-size:10.5px!important;line-height:1.04!important}
      .captive{width:38%!important;max-width:108px!important;max-height:108px!important}
      .speech-bubble{left:72%!important;top:1%!important;max-width:176px!important;min-width:118px!important;font-size:11px!important;padding:9px 12px 10px!important}
      .speech-bubble::after{left:-11px!important;bottom:11px!important;width:17px!important;height:13px!important}
      .spin-btn{min-width:116px!important;padding:11px 23px!important;font-size:16px!important}
      #cr-ranking-btn{right:8px!important;bottom:8px!important;padding:8px 10px!important;font-size:9px!important}
    }
    @media(max-width:380px){.wheel-wrap{width:min(77vw,264px)!important}.wheel .slice-label{width:68px!important;font-size:9.6px!important}.captive{width:36%!important;max-width:96px!important;max-height:96px!important}.speech-bubble{left:70%!important;max-width:160px!important;min-width:112px!important}}
  `;
  document.head.appendChild(style);

  const names=['TICKET','TENTE DE NOVO','VOLTE AO INÍCIO','TICKET','TENTE DE NOVO','VOLTE AO INÍCIO'];
  const points=[[65.75,22.72],[81.5,50],[65.75,77.28],[34.25,77.28],[18.5,50],[34.25,22.72]];
  let raf=0;
  function fixWheel(){
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(()=>{
      const wheel=document.querySelector('.wheel');
      if(!wheel)return;
      const labels=[...wheel.querySelectorAll('.slice-label')].slice(0,6);
      if(labels.length===6){
        labels.forEach((label,i)=>{
          label.textContent=names[i];
          label.style.setProperty('left',points[i][0]+'%','important');
          label.style.setProperty('top',points[i][1]+'%','important');
          label.style.setProperty('right','auto','important');
          label.style.setProperty('bottom','auto','important');
          label.style.setProperty('transform','translate(-50%,-50%)','important');
          label.style.setProperty('rotate','0deg','important');
          label.style.setProperty('writing-mode','horizontal-tb','important');
        });
      }
      const captive=wheel.querySelector('.captive')||document.querySelector('#screen-game3 .captive');
      if(captive){
        const narrow=window.innerWidth<=380;
        const mobile=window.innerWidth<=600;
        captive.style.setProperty('width',narrow?'36%':mobile?'38%':'42%','important');
        captive.style.setProperty('max-width',narrow?'96px':mobile?'108px':'132px','important');
        captive.style.setProperty('max-height',narrow?'96px':mobile?'108px':'132px','important');
        captive.style.setProperty('height','auto','important');
        captive.style.setProperty('object-fit','contain','important');
        captive.style.setProperty('z-index','4','important');
      }
    });
  }
  function isFinalScreen(){return Boolean(document.querySelector('#screen-final.active,#screen-coupon.active,#screen-win.active,#screen-lose.active,#screen-closed.active,.screen.active[id*="final"],.screen.active[id*="coupon"],.screen.active[id*="win"],.screen.active[id*="lose"],.screen.active[id*="closed"]'))}
  function syncRanking(){const btn=document.getElementById('cr-ranking-btn');if(!btn)return;btn.classList.toggle('cr-ranking-final-visible',isFinalScreen())}

  fixWheel();
  syncRanking();
  [80,250,700,1400].forEach(ms=>setTimeout(()=>{fixWheel();syncRanking()},ms));

  const game3=document.querySelector('#screen-game3');
  if(game3){
    const wheelObserver=new MutationObserver(()=>fixWheel());
    wheelObserver.observe(game3,{childList:true,subtree:true});
  }

  const screenObserver=new MutationObserver(()=>syncRanking());
  document.querySelectorAll('.screen').forEach(screen=>screenObserver.observe(screen,{attributes:true,attributeFilter:['class']}));

  window.addEventListener('resize',fixWheel,{passive:true});
  window.addEventListener('circoray:config-ready',()=>{fixWheel();syncRanking()});
  window.addEventListener('circoray:hardcore-armed',fixWheel);
  window.CIRCO_FIX_WHEEL_LABELS=fixWheel;
}
