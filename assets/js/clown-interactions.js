const FALLBACK = {
  angryAsset: "/assets/images/clown/clown-angry.svg",
  tapTaunts: [
    "EI. TIRA A MÃO DE MIM.",
    "VOCÊ GOSTA DE PROVOCAR, NÉ?",
    "CONTINUA TOCANDO. VAI DAR SUPER CERTO.",
    "EU TÔ DE OLHO EM VOCÊ."
  ],
  angryTapTaunts: [
    "TRÊS VEZES? TÁ PEDINDO PROBLEMA.",
    "PARA DE ME CUTUCAR.",
    "MAIS UMA E EU MUDO AS REGRAS."
  ],
  rareTapLines: [
    "SETE TOQUES. VOCÊ REALMENTE NÃO TEM MEDO.",
    "ACHOU O SEGREDO. NÃO CONTA PRA NINGUÉM.",
    "VOCÊ NÃO DEVERIA TER FEITO ISSO."
  ],
  winTapLines: [
    "GANHOU E AINDA VEIO ME PERTURBAR?",
    "NÃO SE ACOSTUME."
  ],
  loseTapLines: [
    "PERDEU E VEIO PEDIR CARINHO?",
    "EU AVISEI."
  ]
};

const state = {
  cfg: FALLBACK,
  taps: [],
  lastNormalReactionAt: 0,
  totalTaps: 0,
  installed: false,
  angryTimer: null,
  angryToken: 0
};

function pick(list) {
  const values = Array.isArray(list) && list.length ? list : [];
  return values.length ? values[Math.floor(Math.random() * values.length)] : "";
}

function say(text, duration = 2200) {
  if (!text) return;
  const bubble = document.querySelector(".speech-bubble");
  if (!bubble) return;
  const p = bubble.querySelector("p") || bubble;
  p.textContent = text;
  bubble.classList.add("show");
  clearTimeout(say.timer);
  say.timer = setTimeout(() => bubble.classList.remove("show"), duration);
}

function gameState() {
  const coupon = document.querySelector("#screen-coupon.active, #screen-win.active, .screen.active[id*='coupon']");
  if (coupon) return "win";
  const tickets = [...document.querySelectorAll(".ticket-pip")];
  if (tickets.length && tickets.every((el) => el.classList.contains("filled"))) return "win";
  const closed = document.querySelector("#screen-closed.active, #screen-lose.active, .screen.active[id*='closed'], .screen.active[id*='lose']");
  if (closed) return "lose";
  return "playing";
}

function clownTarget() {
  return document.querySelector(".clown-img") || document.querySelector(".clown-wrap");
}

function showAngry(duration = 1400) {
  const target = clownTarget();
  const angryAsset = state.cfg.angryAsset || FALLBACK.angryAsset;
  if (!target || !angryAsset) return;

  state.angryToken += 1;
  const token = state.angryToken;
  clearTimeout(state.angryTimer);
  target.classList.add("cr-clown-angry-visible");

  if (target.tagName === "IMG") {
    if (!target.dataset.crNormalSrc) target.dataset.crNormalSrc = target.getAttribute("src") || "";
    target.setAttribute("src", angryAsset);
  } else {
    if (target.dataset.crNormalBackground === undefined) target.dataset.crNormalBackground = target.style.backgroundImage || "";
    target.style.backgroundImage = `url("${String(angryAsset).replace(/"/g, "%22")}")`;
    target.style.backgroundSize = "contain";
    target.style.backgroundPosition = "center";
    target.style.backgroundRepeat = "no-repeat";
  }

  state.angryTimer = setTimeout(() => {
    if (token !== state.angryToken) return;
    target.classList.remove("cr-clown-angry-visible");
    if (target.tagName === "IMG") {
      const normalSrc = target.dataset.crNormalSrc;
      if (normalSrc) target.setAttribute("src", normalSrc);
    } else {
      target.style.backgroundImage = target.dataset.crNormalBackground || "";
      target.style.backgroundSize = "";
      target.style.backgroundPosition = "";
      target.style.backgroundRepeat = "";
    }
  }, duration);
}

function addEffect(kind) {
  const clown = clownTarget();
  if (!clown) return;
  clown.classList.remove("cr-clown-shake", "cr-clown-glitch");
  void clown.offsetWidth;
  clown.classList.add(kind === "rare" ? "cr-clown-glitch" : "cr-clown-shake");
  setTimeout(() => clown.classList.remove("cr-clown-shake", "cr-clown-glitch"), kind === "rare" ? 850 : 420);
  if (navigator.vibrate) {
    try { navigator.vibrate(kind === "rare" ? [45, 40, 80] : 35); } catch {}
  }
}

function onTap() {
  const now = Date.now();
  state.totalTaps += 1;
  state.taps.push(now);
  state.taps = state.taps.filter((time) => now - time <= 1700);

  const mode = gameState();
  if (mode === "win") {
    say(pick(state.cfg.winTapLines || FALLBACK.winTapLines));
    addEffect("normal");
    return;
  }
  if (mode === "lose") {
    say(pick(state.cfg.loseTapLines || FALLBACK.loseTapLines));
    addEffect("normal");
    showAngry(1700);
    return;
  }

  if (state.totalTaps % 7 === 0) {
    say(pick(state.cfg.rareTapLines || FALLBACK.rareTapLines), 3000);
    addEffect("rare");
    showAngry(2200);
    return;
  }

  if (state.taps.length >= 3) {
    say(pick(state.cfg.angryTapTaunts || FALLBACK.angryTapTaunts), 2500);
    addEffect("normal");
    showAngry(1700);
    state.taps = [];
    return;
  }

  if (now - state.lastNormalReactionAt >= 1500) {
    state.lastNormalReactionAt = now;
    say(pick(state.cfg.tapTaunts || FALLBACK.tapTaunts));
    addEffect("normal");
  }
}

function installStyles() {
  const style = document.createElement("style");
  style.textContent = `
    .clown-wrap{pointer-events:none!important}
    .clown-img{pointer-events:auto!important;cursor:pointer;touch-action:manipulation;user-select:none;-webkit-user-drag:none}
    .cr-clown-shake{animation:crClownShake .38s ease both}
    .cr-clown-glitch{animation:crClownGlitch .8s steps(2,end) both;filter:drop-shadow(4px 0 #7a0000) drop-shadow(-4px 0 #d8a53a)!important}
    .cr-clown-angry-visible{filter:drop-shadow(0 0 18px rgba(160,0,0,.7)) contrast(1.08)!important}
    @keyframes crClownShake{0%,100%{transform:translateX(0) rotate(0)}20%{transform:translateX(-5px) rotate(-1deg)}45%{transform:translateX(5px) rotate(1deg)}70%{transform:translateX(-3px)}}
    @keyframes crClownGlitch{0%,100%{transform:none}20%{transform:translate(-5px,2px) skewX(3deg)}40%{transform:translate(5px,-1px) skewX(-4deg)}60%{transform:scale(1.03)}80%{transform:translate(-2px,1px)}}
  `;
  document.head.appendChild(style);
}

function installTarget() {
  const target = clownTarget();
  if (!target) return false;
  target.setAttribute("role", "button");
  target.setAttribute("tabindex", "0");
  target.setAttribute("aria-label", "Tocar no palhaço");
  target.addEventListener("pointerup", (event) => {
    event.preventDefault();
    onTap();
  });
  target.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onTap();
    }
  });
  return true;
}

export function initClownInteractions(config = {}) {
  if (state.installed) return;
  state.installed = true;
  state.cfg = { ...FALLBACK, ...(config?.clown || {}) };
  installStyles();
  if (!installTarget()) {
    const observer = new MutationObserver(() => {
      if (installTarget()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}
