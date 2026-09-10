const FURY_ASSET = "/assets/images/clown/clown-fury.png?v=20260910-6";
let furyActive = false;
let mainObserver = null;

function getMainClown(){
  return document.getElementById("clownImg") || document.querySelector(".clown-img");
}

function getWrap(){
  return getMainClown()?.closest(".clown-wrap") || document.querySelector(".clown-wrap");
}

function shouldBeFury(){
  const test = new URLSearchParams(location.search).get("test") || "";
  return furyActive || document.body.classList.contains("cr-hardcore-fury") || window.__circorayHardcoreFury === true || test.startsWith("fury");
}

function ensureStyles(){
  if (document.getElementById("cr-fury-real-img-style")) return;
  const style = document.createElement("style");
  style.id = "cr-fury-real-img-style";
  style.textContent = `
    .clown-wrap::before{content:none!important;background:none!important}
    #clownFuryImg{
      display:none;
      position:absolute;
      left:0;
      bottom:0;
      width:100%;
      height:auto;
      z-index:21;
      pointer-events:auto;
      cursor:pointer;
      touch-action:manipulation;
      user-select:none;
      -webkit-user-drag:none;
      object-fit:contain;
      object-position:center bottom;
      transform:none!important;
      transform-origin:center bottom;
      filter:drop-shadow(0 0 18px #ff1d1d) drop-shadow(0 0 42px #b00000) drop-shadow(0 0 76px #5a0000);
    }
    body.cr-hardcore-fury #clownImg{visibility:hidden!important;opacity:0!important;pointer-events:none!important}
    body.cr-hardcore-fury #clownFuryImg{display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important}
  `;
  document.head.appendChild(style);
}

function proxyInteraction(fury, main){
  if (!fury || !main || fury.dataset.interactionProxy === "1") return;
  fury.dataset.interactionProxy = "1";
  fury.setAttribute("role", "button");
  fury.setAttribute("tabindex", "0");
  fury.setAttribute("aria-label", "Tocar no palhaço");

  fury.addEventListener("pointerup", (event) => {
    if (!shouldBeFury()) return;
    event.preventDefault();
    event.stopPropagation();
    try {
      main.dispatchEvent(new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        pointerType: event.pointerType || "mouse",
        clientX: event.clientX,
        clientY: event.clientY
      }));
    } catch {
      main.dispatchEvent(new Event("pointerup", {bubbles:true,cancelable:true}));
    }
  });

  fury.addEventListener("keydown", (event) => {
    if (!shouldBeFury() || (event.key !== "Enter" && event.key !== " ")) return;
    event.preventDefault();
    try {
      main.dispatchEvent(new KeyboardEvent("keydown", {
        key: event.key,
        bubbles: true,
        cancelable: true
      }));
    } catch {
      main.dispatchEvent(new Event("keydown", {bubbles:true,cancelable:true}));
    }
  });
}

function ensureFuryImage(){
  const wrap = getWrap();
  const main = getMainClown();
  if (!wrap || !main) return null;

  let fury = document.getElementById("clownFuryImg");
  if (!fury) {
    fury = document.createElement("img");
    fury.id = "clownFuryImg";
    fury.alt = "Palhaço em modo Fúria";
    fury.draggable = false;
    wrap.appendChild(fury);
  }
  if (fury.getAttribute("src") !== FURY_ASSET) fury.setAttribute("src", FURY_ASSET);
  proxyInteraction(fury, main);
  return fury;
}

function applyFury(){
  if (!shouldBeFury()) return;
  furyActive = true;
  document.body.classList.add("cr-hardcore-fury");
  ensureStyles();
  const fury = ensureFuryImage();
  if (fury) {
    fury.style.display = "block";
    fury.style.visibility = "visible";
    fury.style.opacity = "1";
    fury.style.pointerEvents = "auto";
  }
}

function bindMain(){
  const main = getMainClown();
  if (!main || mainObserver) return;
  mainObserver = new MutationObserver(() => {
    if (shouldBeFury()) applyFury();
  });
  mainObserver.observe(main,{attributes:true,attributeFilter:["src","class","style"]});
}

function activate(){
  furyActive = true;
  ensureStyles();
  bindMain();
  applyFury();
  requestAnimationFrame(applyFury);
  setTimeout(applyFury,50);
  setTimeout(applyFury,180);
}

function reset(){
  furyActive = false;
  const fury = document.getElementById("clownFuryImg");
  if (fury) fury.style.display = "none";
}

export function initFuryClownGuard(){
  if (window.__circorayFuryClownGuardV3Loaded) return;
  window.__circorayFuryClownGuardV3Loaded = true;
  ensureStyles();
  bindMain();
  ensureFuryImage();

  window.CIRCO_FURY_CLOWN_GUARD = {activate, reset, asset:FURY_ASSET};
  window.addEventListener("circoray:hardcore-fury", activate);
  window.addEventListener("circoray:hardcore-armed", e => { if (e?.detail?.fury === true) activate(); });
  window.addEventListener("circoray:hardcore-start", e => { if (e?.detail?.profile === "fury" || e?.detail?.fury === true) activate(); });
  window.addEventListener("circoray:hardcore-emotion-reset", reset);

  if (shouldBeFury()) activate();
}
