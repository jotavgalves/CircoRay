const ANGRY_ASSET = "/assets/images/clown/clown-angry.svg";
const FURY_ASSET = "/assets/images/clown/clown-fury.png";
let normalSrc = "";
let hardcoreObserver = null;
let forcedFury = false;

function getClown() {
  return document.querySelector(".clown-img");
}

function isFury() {
  return forcedFury || document.body.classList.contains("cr-hardcore-fury") || Boolean(window.__circorayHardcoreFury);
}

function currentModeAsset() {
  return isFury() ? FURY_ASSET : ANGRY_ASSET;
}

function rememberNormalGeometry(clown) {
  if (!clown) return;
  if (!normalSrc) normalSrc = clown.getAttribute("src") || "";
  const currentHeight = clown.getBoundingClientRect().height;
  if (currentHeight > 0 && !clown.style.getPropertyValue("--cr-clown-normal-height")) {
    clown.style.setProperty("--cr-clown-normal-height", `${currentHeight}px`);
  }
}

function syncMainClown() {
  const clown = getClown();
  if (!clown) return;
  rememberNormalGeometry(clown);
  const target = currentModeAsset();
  if (clown.getAttribute("src") !== target) clown.setAttribute("src", target);
  clown.classList.add("cr-hardcore-angry", "cr-clown-hate-aura");
  clown.classList.toggle("cr-fury-clown", isFury());
}

function syncHardcoreImages(root = document.getElementById("cr-hardcore")) {
  if (!root) return;
  const target = currentModeAsset();
  root.querySelectorAll("img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    if (src === ANGRY_ASSET || src === FURY_ASSET || img.classList.contains("crhc-chaser")) {
      if (src !== target) img.setAttribute("src", target);
      img.classList.toggle("cr-fury-clown", isFury());
    }
  });
}

function syncAll() {
  syncMainClown();
  syncHardcoreImages();
}

function observeHardcoreOverlay() {
  const root = document.getElementById("cr-hardcore");
  if (!root || hardcoreObserver) return;
  hardcoreObserver = new MutationObserver((mutations) => {
    let needsSync = false;
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length) { needsSync = true; break; }
      if (mutation.type === "attributes" && mutation.attributeName === "src") { needsSync = true; break; }
    }
    if (needsSync) syncHardcoreImages(root);
  });
  hardcoreObserver.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["src"] });
  syncHardcoreImages(root);
}

function useHardcore(event) {
  if (event?.detail?.fury === true) forcedFury = true;
  syncAll();
  observeHardcoreOverlay();
}

function useFury() {
  forcedFury = true;
  syncAll();
  observeHardcoreOverlay();
  requestAnimationFrame(syncAll);
  setTimeout(syncAll, 60);
  setTimeout(syncAll, 180);
}

function restoreNormal() {
  forcedFury = false;
  const clown = getClown();
  if (clown) {
    if (normalSrc && clown.getAttribute("src") !== normalSrc) clown.setAttribute("src", normalSrc);
    clown.classList.remove("cr-hardcore-angry", "cr-clown-hate-aura", "cr-fury-clown");
    clown.style.removeProperty("--cr-clown-normal-height");
  }
  const root = document.getElementById("cr-hardcore");
  root?.querySelectorAll("img.cr-fury-clown").forEach((img) => img.classList.remove("cr-fury-clown"));
}

export function initHardcoreAngrySwap() {
  if (window.__circorayHardcoreAngrySwapLoaded) return;
  window.__circorayHardcoreAngrySwapLoaded = true;

  const style = document.createElement("style");
  style.textContent = `
    body.cr-hardcore-armed .clown-img.cr-hardcore-angry{
      width:100%!important;
      height:var(--cr-clown-normal-height, auto)!important;
      object-fit:contain!important;
      object-position:center bottom!important;
      transform:none!important;
      transform-origin:center bottom!important;
      filter:drop-shadow(0 0 10px rgba(255,0,0,.92)) drop-shadow(0 0 28px rgba(140,0,0,.7))!important;
    }
    .clown-img.cr-hardcore-angry.cr-fury-clown{
      width:100%!important;
      height:var(--cr-clown-normal-height, auto)!important;
      object-fit:contain!important;
      object-position:center bottom!important;
      transform:none!important;
      transform-origin:center bottom!important;
      filter:drop-shadow(0 0 18px #ff1d1d) drop-shadow(0 0 44px #b00000) drop-shadow(0 0 78px #5a0000)!important;
    }
    #cr-hardcore img.cr-fury-clown{
      object-fit:contain!important;
      object-position:center bottom!important;
      filter:drop-shadow(0 0 18px #ff1d1d) drop-shadow(0 0 42px #a00000) drop-shadow(0 0 70px #500000)!important;
    }
  `;
  document.head.appendChild(style);

  window.addEventListener("circoray:hardcore-armed", useHardcore);
  window.addEventListener("circoray:hardcore-fury", useFury);
  window.addEventListener("circoray:hardcore-start", useHardcore);
  window.addEventListener("circoray:hardcore-emotion-reset", restoreNormal);

  if (document.body.classList.contains("cr-hardcore-fury") || window.__circorayHardcoreFury) forcedFury = true;
  if (document.body.classList.contains("cr-hardcore-armed") || forcedFury) useHardcore({ detail: { fury: forcedFury } });
}
