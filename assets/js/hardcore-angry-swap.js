const ANGRY_ASSET = "/assets/images/clown/clown-angry.svg";
let normalSrc = "";

function getClown() {
  return document.querySelector(".clown-img");
}

function useAngry() {
  const clown = getClown();
  if (!clown) return;

  if (!normalSrc) normalSrc = clown.getAttribute("src") || "";

  const currentHeight = clown.getBoundingClientRect().height;
  if (currentHeight > 0 && clown.getAttribute("src") !== ANGRY_ASSET) {
    clown.style.setProperty("--cr-clown-normal-height", `${currentHeight}px`);
  }

  if (clown.getAttribute("src") !== ANGRY_ASSET) clown.setAttribute("src", ANGRY_ASSET);
  clown.classList.add("cr-hardcore-angry", "cr-clown-hate-aura");
}

function restoreNormal() {
  const clown = getClown();
  if (!clown) return;
  if (normalSrc && clown.getAttribute("src") !== normalSrc) clown.setAttribute("src", normalSrc);
  clown.classList.remove("cr-hardcore-angry", "cr-clown-hate-aura");
  clown.style.removeProperty("--cr-clown-normal-height");
}

export function initHardcoreAngrySwap() {
  if (window.__circorayHardcoreAngrySwapLoaded) return;
  window.__circorayHardcoreAngrySwapLoaded = true;

  const style = document.createElement("style");
  style.textContent = `
    body.cr-hardcore-armed .clown-img.cr-hardcore-angry{
      width:100%!important;
      height:var(--cr-clown-normal-height, auto)!important;
      object-fit:fill!important;
      object-position:center bottom!important;
      transform:none!important;
      transform-origin:center bottom!important;
      filter:drop-shadow(0 0 10px rgba(255,0,0,.92)) drop-shadow(0 0 28px rgba(140,0,0,.7))!important;
    }
    body.cr-hardcore-fury .clown-img.cr-hardcore-angry{
      filter:drop-shadow(0 0 14px #ff1d1d) drop-shadow(0 0 34px #970000) drop-shadow(0 0 58px #4a0000)!important;
    }
  `;
  document.head.appendChild(style);

  window.addEventListener("circoray:hardcore-armed", useAngry);
  window.addEventListener("circoray:hardcore-fury", useAngry);
  window.addEventListener("circoray:hardcore-start", useAngry);
  window.addEventListener("circoray:hardcore-emotion-reset", restoreNormal);

  if (document.body.classList.contains("cr-hardcore-armed")) useAngry();
}
