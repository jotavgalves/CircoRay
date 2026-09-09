const ANGRY_ASSET = "/assets/images/clown/clown-angry.svg";

function getClown() {
  return document.querySelector(".clown-img");
}

function syncClown() {
  const clown = getClown();
  if (!clown) return;

  const hardcore = document.body.classList.contains("cr-hardcore-armed");

  if (hardcore) {
    if (!clown.dataset.crNormalSrc) clown.dataset.crNormalSrc = clown.getAttribute("src") || "";
    if (clown.getAttribute("src") !== ANGRY_ASSET) clown.setAttribute("src", ANGRY_ASSET);
    clown.classList.add("cr-hardcore-angry");
    clown.setAttribute("data-hardcore-angry", "true");
  } else if (clown.dataset.crNormalSrc) {
    if (clown.getAttribute("src") !== clown.dataset.crNormalSrc) clown.setAttribute("src", clown.dataset.crNormalSrc);
    clown.classList.remove("cr-hardcore-angry");
    clown.removeAttribute("data-hardcore-angry");
  }
}

export function initHardcoreAngrySwap() {
  if (window.__circorayHardcoreAngrySwapLoaded) return;
  window.__circorayHardcoreAngrySwapLoaded = true;

  const style = document.createElement("style");
  style.textContent = `
    body.cr-hardcore-armed .clown-img.cr-hardcore-angry{
      object-fit:contain!important;
      transform:none!important;
      filter:drop-shadow(0 0 10px rgba(255,0,0,.92)) drop-shadow(0 0 28px rgba(140,0,0,.7))!important;
    }
    body.cr-hardcore-fury .clown-img.cr-hardcore-angry{
      filter:drop-shadow(0 0 14px #ff1d1d) drop-shadow(0 0 34px #970000) drop-shadow(0 0 58px #4a0000)!important;
    }
  `;
  document.head.appendChild(style);

  syncClown();
  window.addEventListener("circoray:hardcore-armed", syncClown);
  window.addEventListener("circoray:hardcore-fury", syncClown);
  window.addEventListener("circoray:config-ready", syncClown);

  const observer = new MutationObserver(syncClown);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"], childList: true, subtree: true });

  setTimeout(syncClown, 100);
  setTimeout(syncClown, 500);
}
