const ANGRY_ASSET = "/assets/images/clown/clown-angry.svg";
const FURY_ASSET = "/assets/images/clown/clown-fury.png";

let mode = "normal";
const normalSources = new WeakMap();
const imageObservers = new WeakMap();
let overlayObserver = null;

function rememberNormal(img) {
  if (!img || normalSources.has(img)) return;
  const src = img.getAttribute("src") || "";
  if (src && src !== ANGRY_ASSET && src !== FURY_ASSET) normalSources.set(img, src);
}

function targetAsset() {
  if (mode === "fury") return FURY_ASSET;
  if (mode === "hardcore") return ANGRY_ASSET;
  return null;
}

function applyToImage(img) {
  if (!img) return;
  rememberNormal(img);
  const target = targetAsset();
  if (!target) return;

  if (img.getAttribute("src") !== target) img.setAttribute("src", target);
  img.classList.add("cr-hardcore-angry", "cr-clown-hate-aura");
  img.classList.toggle("cr-fury-clown", mode === "fury");
}

function bindMainImage(img) {
  if (!img) return;
  rememberNormal(img);
  applyToImage(img);
  if (imageObservers.has(img)) return;

  const observer = new MutationObserver(() => {
    const target = targetAsset();
    if (!target) return;
    if (img.getAttribute("src") !== target) img.setAttribute("src", target);
  });
  observer.observe(img, { attributes: true, attributeFilter: ["src"] });
  imageObservers.set(img, observer);
}

function syncMainClowns() {
  document.querySelectorAll(".clown-img").forEach(bindMainImage);
}

function syncOverlayImages() {
  const root = document.getElementById("cr-hardcore");
  if (!root) return;
  const target = targetAsset();
  if (!target) return;

  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (img.classList.contains("crhc-chaser") || src === ANGRY_ASSET || src === FURY_ASSET) {
      if (src !== target) img.setAttribute("src", target);
      img.classList.toggle("cr-fury-clown", mode === "fury");
    }
  });
}

function ensureOverlayObserver() {
  const root = document.getElementById("cr-hardcore");
  if (!root || overlayObserver) return;
  overlayObserver = new MutationObserver((mutations) => {
    if (mutations.some((m) => m.type === "childList" && m.addedNodes.length)) syncOverlayImages();
  });
  overlayObserver.observe(root, { subtree: true, childList: true });
}

function syncAll() {
  syncMainClowns();
  syncOverlayImages();
  ensureOverlayObserver();
}

function activateHardcore(event) {
  if (mode === "fury") return;
  if (event?.detail?.fury === true) {
    activateFury();
    return;
  }
  mode = "hardcore";
  syncAll();
}

function activateFury() {
  mode = "fury";
  syncAll();
  requestAnimationFrame(syncAll);
  setTimeout(syncAll, 50);
  setTimeout(syncAll, 150);
  setTimeout(syncAll, 350);
}

function restoreNormal() {
  mode = "normal";
  document.querySelectorAll(".clown-img").forEach((img) => {
    const original = normalSources.get(img);
    if (original) img.setAttribute("src", original);
    img.classList.remove("cr-hardcore-angry", "cr-clown-hate-aura", "cr-fury-clown");
  });
  document.querySelectorAll("#cr-hardcore img.cr-fury-clown").forEach((img) => img.classList.remove("cr-fury-clown"));
}

function installStyles() {
  if (document.getElementById("cr-fury-clown-v3-styles")) return;
  const style = document.createElement("style");
  style.id = "cr-fury-clown-v3-styles";
  style.textContent = `
    .clown-img.cr-hardcore-angry{
      width:100%!important;
      height:auto!important;
      display:block!important;
      object-fit:contain!important;
      object-position:center bottom!important;
      transform:none!important;
      transform-origin:center bottom!important;
    }
    .clown-img.cr-hardcore-angry:not(.cr-fury-clown){
      filter:drop-shadow(0 0 10px rgba(255,0,0,.92)) drop-shadow(0 0 28px rgba(140,0,0,.7))!important;
    }
    .clown-img.cr-hardcore-angry.cr-fury-clown{
      filter:drop-shadow(0 0 18px #ff1d1d) drop-shadow(0 0 44px #b00000) drop-shadow(0 0 78px #5a0000)!important;
    }
    #cr-hardcore img.cr-fury-clown{
      object-fit:contain!important;
      object-position:center bottom!important;
      filter:drop-shadow(0 0 18px #ff1d1d) drop-shadow(0 0 42px #a00000) drop-shadow(0 0 70px #500000)!important;
    }
  `;
  document.head.appendChild(style);
}

export function initHardcoreAngrySwap() {
  if (window.__circorayHardcoreAngrySwapV3Loaded) return;
  window.__circorayHardcoreAngrySwapV3Loaded = true;
  installStyles();

  window.CIRCO_FURY_CLOWN = {
    activate: activateFury,
    hardcore: activateHardcore,
    reset: restoreNormal,
    asset: FURY_ASSET
  };

  window.addEventListener("circoray:hardcore-armed", activateHardcore);
  window.addEventListener("circoray:hardcore-fury", activateFury);
  window.addEventListener("circoray:hardcore-start", (event) => {
    if (event?.detail?.profile === "fury" || event?.detail?.fury === true) activateFury();
    else activateHardcore(event);
  });
  window.addEventListener("circoray:hardcore-emotion-reset", restoreNormal);

  const testMode = new URLSearchParams(location.search).get("test");
  if (testMode === "fury" || testMode === "fury-chase" || testMode === "fury-double" || testMode === "fury-doors") {
    activateFury();
  } else if (document.body.classList.contains("cr-hardcore-fury") || window.__circorayHardcoreFury === true) {
    activateFury();
  } else if (document.body.classList.contains("cr-hardcore-armed")) {
    activateHardcore();
  } else {
    syncMainClowns();
  }
}
