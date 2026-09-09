const state = {
  config: null,
  tension: 0,
  lastScreen: "",
  lastLineAt: 0,
  lastLowTimeStage: "",
  hardcoreCinematicShown: false,
  observer: null,
  timer: null
};

function clamp(n, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Number(n) || 0));
}

function pick(list) {
  const values = Array.isArray(list) ? list.filter(Boolean) : [];
  return values.length ? values[Math.floor(Math.random() * values.length)] : "";
}

function activeScreen() {
  return document.querySelector(".screen.active")?.id || "";
}

function sayConfigured(kind, cooldown = 6000) {
  const now = Date.now();
  if (now - state.lastLineAt < cooldown) return;
  const clown = state.config?.clown || {};
  let line = "";
  if (kind === "angry") line = pick(clown.angryTapTaunts || clown.taunts);
  else if (kind === "win") line = pick(clown.winLines);
  else if (kind === "pressure") line = pick(clown.clickTaunts || clown.taunts);
  else line = pick(clown.taunts);
  if (!line) return;
  state.lastLineAt = now;
  window.sayLine?.(line, Number(state.config?.game?.speechDurationMs || 2600));
}

function installStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #cr-tension-layer{position:fixed;inset:0;pointer-events:none;z-index:9991;opacity:0;transition:opacity .8s ease;background:radial-gradient(ellipse at center,transparent 38%,rgba(25,0,0,.16) 68%,rgba(8,0,0,.45) 100%)}
    body.cr-tension-mid #cr-tension-layer{opacity:.32}
    body.cr-tension-high #cr-tension-layer{opacity:.58;animation:crTensionBreath 2.2s ease-in-out infinite alternate}
    body.cr-tension-max #cr-tension-layer{opacity:.78;animation:crTensionBreath .9s ease-in-out infinite alternate}
    @keyframes crTensionBreath{to{filter:brightness(1.22) saturate(1.18)}}

    #cr-hardcore-cinematic{position:fixed;inset:0;z-index:10020;display:none;place-items:center;background:rgba(4,0,0,.94);color:#fff;text-align:center;padding:24px;pointer-events:none}
    #cr-hardcore-cinematic.show{display:grid;animation:crHcFlash 1.55s ease both}
    #cr-hardcore-cinematic .crhc-cin-inner{max-width:520px;animation:crHcText 1.2s cubic-bezier(.2,.8,.2,1) both}
    #cr-hardcore-cinematic .crhc-cin-kicker{font:700 11px 'Special Elite',monospace;letter-spacing:.22em;color:#d8a53a;margin-bottom:10px}
    #cr-hardcore-cinematic .crhc-cin-title{font:400 clamp(28px,9vw,54px) 'Rye',serif;line-height:1.02;text-shadow:0 0 10px #f00,0 0 32px #8b0000;margin:0}
    #cr-hardcore-cinematic .crhc-cin-line{font:700 12px 'Special Elite',monospace;color:#f0c7c7;margin-top:12px}
    @keyframes crHcFlash{0%{opacity:0}10%{opacity:1}72%{opacity:1}100%{opacity:0}}
    @keyframes crHcText{0%{transform:scale(.84);filter:blur(8px);opacity:0}28%{transform:scale(1.06);filter:blur(0);opacity:1}100%{transform:scale(1);opacity:1}}

    /* Hardcore muda mecanicamente os jogos normais. */
    body.cr-hardcore-armed #screen-game1 .balloon{width:50px!important;height:57px!important;animation-duration:.82s!important}
    body.cr-hardcore-fury #screen-game1 .balloon{width:44px!important;height:50px!important;animation-duration:.64s!important}
    body.cr-hardcore-armed #screen-game1 .balloon-field{filter:contrast(1.08) saturate(.9)}
    body.cr-hardcore-fury #screen-game1 .balloon-field{filter:contrast(1.15) saturate(.82)}

    body.cr-hardcore-armed #screen-game2 .tap-btn{width:116px!important;height:116px!important;font-size:17px!important}
    body.cr-hardcore-fury #screen-game2 .tap-btn{width:100px!important;height:100px!important;font-size:15px!important}
    body.cr-hardcore-armed #screen-game2 .track{filter:contrast(1.12) brightness(.9)}
    body.cr-hardcore-fury #screen-game2 .track{filter:contrast(1.22) brightness(.82)}

    body.cr-hardcore-armed #screen-game3 .wheel{box-shadow:0 0 0 4px var(--gold),0 10px 24px rgba(0,0,0,.72),0 0 24px rgba(150,0,0,.28)!important}
    body.cr-hardcore-fury #screen-game3 .wheel{box-shadow:0 0 0 4px var(--gold),0 10px 24px rgba(0,0,0,.8),0 0 34px rgba(220,0,0,.42)!important}

    body.cr-reactive-glitch #app{animation:crMicroGlitch .22s steps(2,end) 1}
    @keyframes crMicroGlitch{0%,100%{transform:none;filter:none}33%{transform:translateX(-2px);filter:hue-rotate(-8deg) contrast(1.12)}66%{transform:translateX(2px);filter:hue-rotate(8deg) contrast(1.08)}}

    @media(max-width:600px){
      #cr-hardcore-cinematic{padding:18px}
      #cr-hardcore-cinematic .crhc-cin-line{font-size:10px}
      body.cr-hardcore-armed #screen-game1 .balloon{width:47px!important;height:54px!important}
      body.cr-hardcore-fury #screen-game1 .balloon{width:41px!important;height:47px!important}
    }
  `;
  document.head.appendChild(style);

  const layer = document.createElement("div");
  layer.id = "cr-tension-layer";
  document.body.appendChild(layer);

  const cinematic = document.createElement("div");
  cinematic.id = "cr-hardcore-cinematic";
  cinematic.innerHTML = '<div class="crhc-cin-inner"><div class="crhc-cin-kicker">AS REGRAS MUDARAM</div><h2 class="crhc-cin-title">HARDCORE</h2><div class="crhc-cin-line"></div></div>';
  document.body.appendChild(cinematic);
}

function setTension(value, reason = "") {
  const next = clamp(value);
  if (Math.abs(next - state.tension) < 1 && !reason) return;
  state.tension = next;
  document.documentElement.style.setProperty("--cr-tension", String(next));
  document.body.classList.toggle("cr-tension-mid", next >= 30 && next < 60);
  document.body.classList.toggle("cr-tension-high", next >= 60 && next < 85);
  document.body.classList.toggle("cr-tension-max", next >= 85);
  window.dispatchEvent(new CustomEvent("circoray:tension", { detail: { value: next, reason } }));
}

function stageBaseTension(screen) {
  if (screen.includes("game3")) return 56;
  if (screen.includes("game2")) return 38;
  if (screen.includes("game1")) return 20;
  if (screen.includes("trans")) return 28;
  if (screen.includes("final") || screen.includes("coupon") || screen.includes("win")) return 18;
  return 8;
}

function updateFromState() {
  const screen = activeScreen();
  let target = stageBaseTension(screen);
  const memory = window.CIRCO_CLOWN_MEMORY?.get?.();
  const anger = clamp(memory?.anger || 0);
  target += anger * .32;
  if (window.__circorayHardcoreArmed) target = Math.max(target, 72);
  if (window.__circorayHardcoreFury) target = Math.max(target, 90);

  const g1 = Number(window.g1?.timeLeft);
  const g2 = Number(window.g2?.timeLeft);
  if (screen.includes("game1") && Number.isFinite(g1) && g1 <= 4) target += 13;
  if (screen.includes("game2") && Number.isFinite(g2) && g2 <= 4) target += 13;

  const eased = state.tension + (target - state.tension) * .24;
  setTension(eased);

  if (screen !== state.lastScreen) {
    const previous = state.lastScreen;
    state.lastScreen = screen;
    window.dispatchEvent(new CustomEvent("circoray:screen-change", { detail: { screen, previous } }));
  }

  const lowStage = screen.includes("game1") && Number.isFinite(g1) && g1 <= 3 ? "game1" : screen.includes("game2") && Number.isFinite(g2) && g2 <= 3 ? "game2" : "";
  if (lowStage && state.lastLowTimeStage !== lowStage) {
    state.lastLowTimeStage = lowStage;
    sayConfigured("pressure", 4500);
  }
  if (!lowStage) state.lastLowTimeStage = "";
}

function showHardcoreCinematic(detail = {}) {
  if (state.hardcoreCinematicShown) return;
  state.hardcoreCinematicShown = true;
  const node = document.querySelector("#cr-hardcore-cinematic");
  if (!node) return;
  const fury = Boolean(detail?.fury || window.__circorayHardcoreFury);
  node.querySelector(".crhc-cin-title").textContent = fury ? "FÚRIA" : "HARDCORE";
  node.querySelector(".crhc-cin-line").textContent = state.config?.hardcore?.hardcoreLine || "";
  node.classList.add("show");
  setTension(fury ? 100 : 88, "hardcore-armed");
  if (navigator.vibrate) { try { navigator.vibrate(fury ? [70,35,90,35,120] : [55,40,90]); } catch {} }
  setTimeout(() => node.classList.remove("show"), 1600);
}

function microGlitch() {
  if (document.body.classList.contains("cr-reactive-glitch")) return;
  document.body.classList.add("cr-reactive-glitch");
  setTimeout(() => document.body.classList.remove("cr-reactive-glitch"), 260);
}

function installReactiveClown() {
  document.addEventListener("pointerup", (event) => {
    const screen = activeScreen();
    if (!screen.includes("game1")) return;
    if (event.target.closest?.(".balloon")) return;
    if (event.target.closest?.(".balloon-field")) {
      setTension(state.tension + 4, "miss");
      if (Math.random() < .28) sayConfigured("angry", 7000);
    }
  }, true);

  window.addEventListener("circoray:game-win", () => {
    setTension(Math.max(12, state.tension - 10), "win");
    if (Math.random() < .35) sayConfigured("win", 4200);
  });

  window.addEventListener("circoray:wheel-outcome", (event) => {
    const outcome = event.detail?.outcome;
    if (outcome === "TICKET") setTension(Math.max(20, state.tension - 6), "wheel-ticket");
    else setTension(state.tension + 7, "wheel-pressure");
    if (outcome !== "TICKET" && Math.random() < .45) sayConfigured("pressure", 5000);
  });

  window.addEventListener("circoray:clown-provoked", () => {
    setTension(state.tension + 5, "provoked");
    if (state.tension > 72 && Math.random() < .25) microGlitch();
  });
}

export function initExperienceController(config = {}) {
  if (window.__circorayExperienceControllerLoaded) return;
  window.__circorayExperienceControllerLoaded = true;
  state.config = config;
  installStyles();
  installReactiveClown();

  window.addEventListener("circoray:hardcore-armed", (event) => showHardcoreCinematic(event.detail));
  window.addEventListener("circoray:hardcore-fury", () => {
    setTension(100, "fury");
    microGlitch();
  });

  state.observer = new MutationObserver(updateFromState);
  state.observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
  state.timer = setInterval(updateFromState, 650);
  updateFromState();
}
