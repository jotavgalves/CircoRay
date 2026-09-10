import { pickSpeech, getSpeechMode } from "/assets/js/speech-profiles.js?v=20260910-1";

const state={taps:[],lastReactionAt:0,totalTaps:0,installed:false,angryTimer:null,angryToken:0};

function provoke(amount,reason){window.dispatchEvent(new CustomEvent("circoray:clown-provoked",{detail:{amount,reason,mode:getSpeechMode()}}))}
function say(text,duration=2200){if(!text)return;const bubble=document.querySelector(".speech-bubble");if(!bubble)return;const p=bubble.querySelector("p")||bubble;p.textContent=text;bubble.classList.add("show");clearTimeout(say.timer);say.timer=setTimeout(()=>bubble.classList.remove("show"),duration)}
function gameState(){const coupon=document.querySelector("#screen-coupon.active, #screen-win.active, .screen.active[id*='coupon']");if(coupon)return"win";const tickets=[...document.querySelectorAll(".ticket-pip")];if(tickets.length&&tickets.every(el=>el.classList.contains("filled")))return"win";const closed=document.querySelector("#screen-closed.active, #screen-lose.active, .screen.active[id*='closed'], .screen.active[id*='lose']");return closed?"lose":"playing"}
function clownTarget(){return document.getElementById("clownImg")||document.querySelector(".clown-img")||document.querySelector(".clown-wrap")}
function visualTarget(){return getSpeechMode()==="fury"?(document.getElementById("clownFuryImg")||clownTarget()):clownTarget()}
function showAngry(duration=1400){const target=visualTarget();if(!target)return;state.angryToken++;const token=state.angryToken;clearTimeout(state.angryTimer);target.classList.add("cr-clown-angry-visible");target.closest?.(".clown-wrap")?.classList.add("cr-clown-angry-wrap");state.angryTimer=setTimeout(()=>{if(token!==state.angryToken)return;target.classList.remove("cr-clown-angry-visible");target.closest?.(".clown-wrap")?.classList.remove("cr-clown-angry-wrap")},duration)}
function addEffect(kind){const clown=visualTarget();if(!clown)return;clown.classList.remove("cr-clown-shake","cr-clown-glitch");void clown.offsetWidth;clown.classList.add(kind==="rare"?"cr-clown-glitch":"cr-clown-shake");setTimeout(()=>clown.classList.remove("cr-clown-shake","cr-clown-glitch"),kind==="rare"?850:420);if(navigator.vibrate){try{navigator.vibrate(kind==="rare"?[45,40,80]:35)}catch{}}}

function onTap(){
  const now=Date.now();
  state.totalTaps++;
  state.taps.push(now);
  state.taps=state.taps.filter(time=>now-time<=1700);
  const result=gameState();
  const mode=getSpeechMode();

  if(result==="win"){
    provoke(mode==="fury"?5:2,"win-tap");
    say(pickSpeech("win"),mode==="fury"?1900:2300);
    addEffect("normal");
    return;
  }
  if(result==="lose"){
    provoke(mode==="fury"?10:6,"lose-tap");
    say(pickSpeech("lose"),mode==="fury"?1900:2300);
    addEffect("normal");
    showAngry(mode==="fury"?2300:1700);
    return;
  }
  if(state.totalTaps%7===0){
    provoke(mode==="fury"?22:15,"rare-tap");
    say(pickSpeech("rare"),mode==="fury"?2200:3000);
    addEffect("rare");
    showAngry(mode==="fury"?2800:2200);
    return;
  }
  if(state.taps.length>=3){
    provoke(mode==="fury"?18:12,"rapid-tap");
    say(pickSpeech("rapid"),mode==="fury"?2100:2500);
    addEffect(mode==="fury"?"rare":"normal");
    showAngry(mode==="fury"?2400:1700);
    state.taps=[];
    return;
  }
  provoke(mode==="fury"?7:4,"tap");
  const cooldown=mode==="fury"?750:mode==="hardcore"?1200:1500;
  if(now-state.lastReactionAt>=cooldown){
    state.lastReactionAt=now;
    say(pickSpeech("tap"),mode==="fury"?1800:2200);
    addEffect("normal");
  }
}

function installStyles(){
  if(document.getElementById("cr-clown-interaction-style"))return;
  const style=document.createElement("style");style.id="cr-clown-interaction-style";style.textContent=`
.clown-wrap{pointer-events:none!important}.clown-img,#clownFuryImg{cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-drag:none}.clown-img{pointer-events:auto!important}body.cr-hardcore-fury #clownFuryImg{pointer-events:auto!important}
.cr-clown-shake{animation:crClownShake .38s ease both}.cr-clown-glitch{animation:crClownGlitch .8s steps(2,end) both}.cr-clown-angry-visible{filter:drop-shadow(0 0 12px #ff0000) drop-shadow(0 0 28px rgba(170,0,0,.92)) contrast(1.12) saturate(1.22)!important}.cr-clown-angry-wrap::after{content:"";position:absolute;inset:10% 8% 0 0;border-radius:50%;background:radial-gradient(circle,rgba(255,0,0,.32),rgba(130,0,0,.12) 45%,transparent 72%);filter:blur(18px);z-index:-1;animation:crAngryAura .65s ease-in-out infinite alternate;pointer-events:none}@keyframes crAngryAura{to{transform:scale(1.08);opacity:.65}}@keyframes crClownShake{0%,100%{transform:translateX(0)}20%{transform:translateX(-5px) rotate(-1deg)}45%{transform:translateX(5px) rotate(1deg)}70%{transform:translateX(-3px)}}@keyframes crClownGlitch{0%,100%{transform:none}20%{transform:translate(-5px,2px) skewX(3deg)}40%{transform:translate(5px,-1px) skewX(-4deg)}60%{transform:scale(1.03)}80%{transform:translate(-2px,1px)}}`;
  document.head.appendChild(style);
}

function installTarget(){
  const target=clownTarget();if(!target||target.dataset.crSpeechBound==="1")return !!target;
  target.dataset.crSpeechBound="1";target.setAttribute("role","button");target.setAttribute("tabindex","0");target.setAttribute("aria-label","Tocar no palhaço");
  target.addEventListener("pointerup",e=>{e.preventDefault();onTap()});
  target.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onTap()}});
  window.CIRCO_CLOWN_TAP=onTap;
  return true;
}

export function initClownInteractions(){
  if(state.installed)return;state.installed=true;installStyles();
  if(!installTarget()){
    const stage=document.querySelector(".stage")||document.getElementById("app");
    if(stage){const observer=new MutationObserver(()=>{if(installTarget())observer.disconnect()});observer.observe(stage,{childList:true,subtree:true})}
  }
}
