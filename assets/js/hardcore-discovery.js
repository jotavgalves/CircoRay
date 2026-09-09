const state = {
  meter: null,
  fill: null,
  status: null,
  hint: null,
  lastTaps: 0,
  discovered: false,
  threshold: 45,
  furyThreshold: 75
};

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, Number(n) || 0));
}

function installStyles() {
  const style = document.createElement("style");
  style.textContent = `
    #cr-hardcore-meter{position:fixed;left:12px;bottom:12px;z-index:9996;width:min(270px,calc(100vw - 92px));padding:10px 11px;border:1px solid rgba(216,165,58,.45);border-radius:11px;background:rgba(14,9,8,.94);box-shadow:0 8px 24px rgba(0,0,0,.45);color:#f3e9d6;font-family:'Special Elite',monospace;opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .25s ease,transform .25s ease}
    #cr-hardcore-meter.visible{opacity:1;transform:none}
    #cr-hardcore-meter.armed{border-color:#b80000;box-shadow:0 0 0 1px rgba(184,0,0,.25),0 8px 28px rgba(122,0,0,.5);animation:crHardcoreArmed 1s ease-in-out infinite alternate}
    .crhm-head{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:7px}.crhm-head strong{font:400 10px 'Rye',serif;letter-spacing:.06em;color:#d8a53a}.crhm-head span{font:700 10px ui-monospace,monospace;color:#b8ad9c}
    .crhm-track{height:7px;border-radius:999px;background:#2a1a0e;overflow:hidden}.crhm-fill{height:100%;width:0;background:linear-gradient(90deg,#d8a53a,#7a0000);transition:width .22s ease}
    .crhm-status{margin-top:7px;font-size:10px;line-height:1.3;color:#c8b9aa}.armed .crhm-status{color:#ff9d9d;font-weight:700}
    #cr-clown-touch-hint{position:fixed;left:50%;bottom:92px;z-index:9995;transform:translate(-50%,8px);max-width:min(300px,82vw);padding:8px 11px;border-radius:999px;border:1px solid rgba(216,165,58,.4);background:rgba(14,9,8,.92);color:#d8a53a;font:400 10px 'Rye',serif;text-align:center;letter-spacing:.03em;opacity:0;pointer-events:none;transition:opacity .25s ease,transform .25s ease}
    #cr-clown-touch-hint.visible{opacity:1;transform:translate(-50%,0)}
    @keyframes crHardcoreArmed{to{box-shadow:0 0 0 1px rgba(255,0,0,.35),0 0 22px rgba(170,0,0,.55),0 8px 28px rgba(0,0,0,.5)}}
    @media(max-width:480px){#cr-hardcore-meter{bottom:10px;left:10px;width:min(240px,calc(100vw - 86px));padding:9px 10px}.crhm-status{font-size:9px}}
  `;
  document.head.appendChild(style);
}

function createUi() {
  const meter = document.createElement("div");
  meter.id = "cr-hardcore-meter";
  meter.setAttribute("aria-live", "polite");
  meter.innerHTML = `
    <div class="crhm-head"><strong>PACIÊNCIA DO PALHAÇO</strong><span id="crhm-value">0%</span></div>
    <div class="crhm-track"><div class="crhm-fill"></div></div>
    <div class="crhm-status">Ele ainda está se divertindo.</div>`;
  document.body.appendChild(meter);
  state.meter = meter;
  state.fill = meter.querySelector(".crhm-fill");
  state.status = meter.querySelector(".crhm-status");

  const hint = document.createElement("div");
  hint.id = "cr-clown-touch-hint";
  hint.textContent = "O PALHAÇO PARECE ESTAR TE OBSERVANDO. TENTE TOCAR NELE.";
  document.body.appendChild(hint);
  state.hint = hint;
}

function statusText(anger) {
  const pct = anger / Math.max(1, state.threshold);
  if (anger >= state.furyThreshold) return "FÚRIA. Você passou do limite.";
  if (anger >= state.threshold) return "HARDCORE ARMADO. Termine os 3 jogos.";
  if (pct >= .78) return "Ele está quase perdendo a paciência.";
  if (pct >= .45) return "Você está irritando ele. Continue se quiser descobrir o que acontece.";
  if (pct > 0) return "Ele percebeu. Cada provocação piora as coisas.";
  return "Ele ainda está se divertindo.";
}

function update(memory, forceShow = false) {
  if (!memory) return;
  const taps = Number(memory.totalTaps || 0);
  const anger = clamp(memory.anger, 0, 100);
  const percent = clamp((anger / Math.max(1, state.threshold)) * 100, 0, 100);
  const newTap = taps > state.lastTaps;

  if (newTap || forceShow) state.discovered = true;
  state.lastTaps = taps;

  state.fill.style.width = `${percent}%`;
  state.meter.querySelector("#crhm-value").textContent = anger >= state.threshold ? "ARMADO" : `${Math.round(percent)}%`;
  state.status.textContent = statusText(anger);
  state.meter.classList.toggle("armed", anger >= state.threshold);
  state.meter.classList.toggle("visible", state.discovered || anger > 0);

  if (newTap) {
    state.hint.classList.remove("visible");
    if (navigator.vibrate && anger >= state.threshold) {
      try { navigator.vibrate([35, 45, 65]); } catch {}
    }
  }
}

function showDiscoveryHint() {
  if (state.discovered || state.lastTaps > 0 || window.__circorayHardcoreActive) return;
  state.hint.classList.add("visible");
  setTimeout(() => state.hint.classList.remove("visible"), 6500);
}

export function initHardcoreDiscovery(config = {}) {
  if (window.__circorayHardcoreDiscoveryLoaded) return;
  window.__circorayHardcoreDiscoveryLoaded = true;

  const hc = config?.hardcore || {};
  state.threshold = Number(hc.angerThreshold) || 45;
  state.furyThreshold = Number(hc.furyThreshold) || 75;
  if (state.threshold === 70 && state.furyThreshold === 90) {
    state.threshold = 45;
    state.furyThreshold = 75;
  }

  installStyles();
  createUi();

  const memory = window.CIRCO_CLOWN_MEMORY?.get?.();
  if (memory) {
    state.lastTaps = Number(memory.totalTaps || 0);
    update(memory, Number(memory.anger || 0) > 0);
  }

  window.addEventListener("circoray:clown-memory", (event) => update(event.detail));
  window.addEventListener("circoray:hardcore-start", () => {
    state.meter?.classList.remove("visible");
    state.hint?.classList.remove("visible");
  });

  setTimeout(showDiscoveryHint, 7000);
}
