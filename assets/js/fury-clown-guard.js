const FURY_ASSET = "/assets/images/clown/clown-fury.png?v=20260910-2";
const ANGRY_ASSET = "/assets/images/clown/clown-angry.svg";
let furyActive = false;
let mainObserver = null;

function getMainClown(){
  return document.getElementById("clownImg") || document.querySelector(".clown-img");
}

function shouldBeFury(){
  const test = new URLSearchParams(location.search).get("test") || "";
  return furyActive || document.body.classList.contains("cr-hardcore-fury") || window.__circorayHardcoreFury === true || test.startsWith("fury");
}

function applyFury(){
  const img = getMainClown();
  if (!img || !shouldBeFury()) return;
  furyActive = true;
  if (img.getAttribute("src") !== FURY_ASSET) img.setAttribute("src", FURY_ASSET);
  img.classList.add("cr-hardcore-angry","cr-clown-hate-aura","cr-fury-clown");
}

function bindMain(){
  const img = getMainClown();
  if (!img) return;
  applyFury();
  if (mainObserver) return;
  mainObserver = new MutationObserver(() => {
    if (!shouldBeFury()) return;
    const current = img.getAttribute("src") || "";
    if (current !== FURY_ASSET) img.setAttribute("src", FURY_ASSET);
  });
  mainObserver.observe(img,{attributes:true,attributeFilter:["src"]});
}

function activate(){
  furyActive = true;
  bindMain();
  applyFury();
  requestAnimationFrame(applyFury);
  setTimeout(applyFury,40);
  setTimeout(applyFury,120);
  setTimeout(applyFury,300);
}

function reset(){
  furyActive = false;
}

export function initFuryClownGuard(){
  if (window.__circorayFuryClownGuardLoaded) return;
  window.__circorayFuryClownGuardLoaded = true;
  window.CIRCO_FURY_CLOWN_GUARD = {activate, reset, asset:FURY_ASSET, angry:ANGRY_ASSET};

  window.addEventListener("circoray:hardcore-fury", activate);
  window.addEventListener("circoray:hardcore-armed", e => { if (e?.detail?.fury === true) activate(); });
  window.addEventListener("circoray:hardcore-start", e => { if (e?.detail?.profile === "fury" || e?.detail?.fury === true) activate(); });
  window.addEventListener("circoray:hardcore-emotion-reset", reset);

  bindMain();
  if (shouldBeFury()) activate();
}
