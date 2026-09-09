const MEMORY_KEY = "circoray:clown-memory:v1";

const DEFAULTS = {
  enabled: true,
  angerThreshold: 70,
  furyThreshold: 90,
  initialAngerFromGrudgeMultiplier: 0.2,
  grudgeDecayPerDay: 2,
  angerDecayPerVisit: 12,
  chaseDurationSeconds: 14,
  chaseFuryDurationSeconds: 17,
  chaseClownSpeed: 1.0,
  chaseFurySpeed: 1.3,
  defendWaves: 8,
  defendFuryWaves: 11,
  defendReactionMs: 1450,
  defendFuryReactionMs: 1050,
  introLine: "VOCÊ ACHOU QUE TINHA ACABADO?",
  hardcoreLine: "VOCÊ QUERIA MINHA ATENÇÃO. AGORA VOCÊ TEM.",
  chaseTitle: "CORRA DO PALHAÇO",
  defendTitle: "NÃO DEIXE ELE ENTRAR",
  angryAsset: "/assets/images/clown/clown-angry.svg"
};

const state = {
  cfg: DEFAULTS,
  memory: null,
  active: false,
  complete: false,
  overlay: null,
  extraPips: [],
  observer: null,
  started: false,
  cleanupGame: null
};

function clamp(n, min, max) { return Math.min(max, Math.max(min, Number(n) || 0)); }
function readMemory() {
  try {
    const raw = JSON.parse(localStorage.getItem(MEMORY_KEY) || "null");
    return raw && typeof raw === "object" ? raw : {};
  } catch { return {}; }
}
function saveMemory() {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(state.memory)); } catch {}
  window.dispatchEvent(new CustomEvent("circoray:clown-memory", { detail: { ...state.memory } }));
}
function initMemory() {
  const now = Date.now();
  const prev = readMemory();
  const last = Number(prev.lastVisit || 0);
  const days = last ? Math.floor((now - last) / 86400000) : 0;
  const grudge = clamp((prev.grudge || 0) - days * state.cfg.grudgeDecayPerDay, 0, 100);
  const inheritedAnger = clamp(grudge * state.cfg.initialAngerFromGrudgeMultiplier, 0, 35);
  state.memory = {
    visits: Number(prev.visits || 0) + 1,
    totalTaps: Number(prev.totalTaps || 0),
    anger: clamp(Math.max(inheritedAnger, Number(prev.anger || 0) - state.cfg.angerDecayPerVisit), 0, 100),
    highestAnger: clamp(prev.highestAnger || 0, 0, 100),
    grudge,
    wins: Number(prev.wins || 0),
    losses: Number(prev.losses || 0),
    hardcoreRuns: Number(prev.hardcoreRuns || 0),
    hardcoreWins: Number(prev.hardcoreWins || 0),
    lastResult: prev.lastResult || "",
    lastVisit: now
  };
  saveMemory();
}
function addAnger(amount, reason = "tap") {
  if (!state.memory) return;
  state.memory.totalTaps += reason.includes("tap") ? 1 : 0;
  state.memory.anger = clamp(state.memory.anger + amount, 0, 100);
  state.memory.highestAnger = Math.max(state.memory.highestAnger, state.memory.anger);
  if (state.memory.anger >= state.cfg.furyThreshold) state.memory.grudge = clamp(state.memory.grudge + 2, 0, 100);
  saveMemory();
}
function profile() {
  if (state.memory.anger >= state.cfg.furyThreshold) return "fury";
  if (state.memory.anger >= state.cfg.angerThreshold) return "hardcore";
  return "normal";
}
function say(text, ms = 2600) {
  const bubble = document.querySelector(".speech-bubble");
  if (!bubble) return;
  const p = bubble.querySelector("p") || bubble;
  p.textContent = text;
  bubble.classList.add("show");
  clearTimeout(say.timer);
  say.timer = setTimeout(() => bubble.classList.remove("show"), ms);
}
function installStyles() {
  const style = document.createElement("style");
  style.textContent = `
  #cr-hardcore{position:fixed;inset:0;z-index:9998;background:radial-gradient(circle at 50% 10%,#3a0000 0,#120707 36%,#050303 100%);color:#f3e9d6;display:none;overflow:hidden;font-family:'Special Elite',monospace}
  #cr-hardcore.open{display:block}.crhc-wrap{height:100%;display:flex;flex-direction:column;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));gap:12px}.crhc-head{text-align:center}.crhc-kicker{font:700 11px 'Rye',serif;letter-spacing:.16em;color:#d8a53a}.crhc-title{font:400 clamp(24px,7vw,42px) 'Rye',serif;margin:4px 0;color:#fff;text-shadow:0 0 18px rgba(255,0,0,.45)}.crhc-sub{font-size:12px;color:#c8b9aa;margin:0}.crhc-stage{position:relative;flex:1;min-height:0;border:2px solid #5c3a20;border-radius:16px;overflow:hidden;background:#0a0605;box-shadow:inset 0 0 60px rgba(0,0,0,.8)}
  .crhc-intro{position:absolute;inset:0;display:grid;place-items:center;padding:28px;text-align:center;background:#050303;z-index:10}.crhc-intro img{width:min(220px,55vw);filter:drop-shadow(0 0 24px #7a0000)}.crhc-intro h2{font:400 clamp(25px,8vw,48px) 'Rye',serif;margin:12px 0}.crhc-intro p{max-width:420px;line-height:1.5}.crhc-btn{border:2px solid #7a0000;background:#7a0000;color:#fff;border-radius:10px;padding:12px 18px;font:700 12px 'Rye',serif;cursor:pointer;box-shadow:0 5px 0 #260000}.crhc-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #260000}
  .crhc-arena{position:absolute;inset:0;touch-action:none;background:radial-gradient(circle at 50% 50%,rgba(122,0,0,.18),transparent 55%),repeating-linear-gradient(0deg,transparent 0 28px,rgba(255,255,255,.025) 29px 30px),#0c0807}.crhc-player{position:absolute;width:34px;height:34px;border-radius:50%;background:#d8a53a;border:3px solid #fff;box-shadow:0 0 18px #d8a53a;transform:translate(-50%,-50%);z-index:3}.crhc-chaser{position:absolute;width:74px;height:74px;object-fit:contain;transform:translate(-50%,-50%);filter:drop-shadow(0 0 16px #7a0000);z-index:2;pointer-events:none}.crhc-obstacle{position:absolute;background:#2a1a0e;border:2px solid #5c3a20;border-radius:8px;box-shadow:0 8px 18px rgba(0,0,0,.45)}.crhc-hud{position:absolute;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;z-index:5;font:700 11px ui-monospace,monospace}.crhc-hud b{color:#d8a53a}.crhc-danger{animation:crhcDanger .3s linear infinite alternate}@keyframes crhcDanger{to{box-shadow:inset 0 0 70px rgba(255,0,0,.35)}}
  .crhc-door-scene{position:absolute;inset:0;padding:18px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;background:linear-gradient(#0a0605,#170b08)}.crhc-entries{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;min-height:0}.crhc-entry{position:relative;border:2px solid #5c3a20;background:#120b09;border-radius:14px;color:#e9ddca;font:700 13px 'Rye',serif;cursor:pointer;overflow:hidden}.crhc-entry::after{content:'';position:absolute;inset:0;background:radial-gradient(circle,rgba(216,165,58,.25),transparent 60%);opacity:0;transition:.1s}.crhc-entry.warn{border-color:#d8a53a;box-shadow:0 0 22px rgba(216,165,58,.45)}.crhc-entry.warn::after{opacity:1}.crhc-entry.fake{animation:crhcFake .18s 2}@keyframes crhcFake{50%{transform:translateX(4px)}}.crhc-entry.hit{background:#3a0000;border-color:#ff4a4a}.crhc-wave{text-align:center;font:700 12px ui-monospace,monospace}.crhc-progress{height:8px;background:#2a1a0e;border-radius:999px;overflow:hidden}.crhc-progress>i{display:block;height:100%;width:0;background:#d8a53a;transition:width .2s}.crhc-result{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:24px;background:rgba(5,3,3,.94);z-index:20}.crhc-result h2{font:400 clamp(25px,8vw,46px) 'Rye',serif;margin:0 0 10px}.crhc-result p{max-width:420px;line-height:1.5}
  .crhc-extra-pip{filter:none!important;opacity:1!important}.crhc-extra-pip:not(.filled){filter:grayscale(1) brightness(.35)!important;opacity:.45!important}
  `;
  document.head.appendChild(style);
}
function createOverlay() {
  const root = document.createElement("div");
  root.id = "cr-hardcore";
  root.innerHTML = `<div class="crhc-wrap"><header class="crhc-head"><div class="crhc-kicker">ROTA HARDCORE</div><h1 class="crhc-title">O PALHAÇO MUDOU AS REGRAS</h1><p class="crhc-sub">Raiva <b id="crhc-anger">0</b>/100 · <span id="crhc-profile">HARDCORE</span></p></header><main class="crhc-stage" id="crhc-stage"></main></div>`;
  document.body.appendChild(root);
  state.overlay = root;
}
function ensureExtraPips() {
  const tickets = document.querySelector(".tickets");
  if (!tickets || state.extraPips.length) return;
  for (let i = 0; i < 2; i++) {
    const pip = document.createElement("span");
    pip.className = "ticket-pip crhc-extra-pip";
    pip.textContent = "🎟";
    pip.setAttribute("aria-label", `Ticket hardcore ${i + 1}`);
    tickets.appendChild(pip);
    state.extraPips.push(pip);
  }
}
function fillExtra(index) { state.extraPips[index]?.classList.add("filled"); }
function firstThreeFilled() {
  const tickets = [...document.querySelectorAll(".ticket-pip:not(.crhc-extra-pip)")].slice(0, 3);
  return tickets.length >= 3 && tickets.every((t) => t.classList.contains("filled"));
}
function showIntro() {
  const stage = document.getElementById("crhc-stage");
  stage.innerHTML = `<section class="crhc-intro"><div><img src="${state.cfg.angryAsset}" alt="Palhaço irritado"><h2>${state.cfg.introLine}</h2><p>${state.cfg.hardcoreLine}</p><button class="crhc-btn" type="button">CONTINUAR</button></div></section>`;
  stage.querySelector("button").addEventListener("click", startChase, { once: true });
  say(state.cfg.introLine, 2200);
}
function triggerHardcore() {
  if (state.active || state.complete || !state.cfg.enabled) return;
  state.active = true;
  window.__circorayHardcoreActive = true;
  window.__circorayHardcoreComplete = false;
  state.memory.hardcoreRuns += 1;
  state.memory.grudge = clamp(state.memory.grudge + 5, 0, 100);
  saveMemory();
  ensureExtraPips();
  state.overlay.classList.add("open");
  document.getElementById("crhc-anger").textContent = Math.round(state.memory.anger);
  document.getElementById("crhc-profile").textContent = profile().toUpperCase();
  showIntro();
  window.dispatchEvent(new CustomEvent("circoray:hardcore-start", { detail: { profile: profile(), memory: { ...state.memory } } }));
}
function startChase() {
  const stage = document.getElementById("crhc-stage");
  const fury = profile() === "fury";
  const duration = (fury ? state.cfg.chaseFuryDurationSeconds : state.cfg.chaseDurationSeconds) * 1000;
  const speed = (fury ? state.cfg.chaseFurySpeed : state.cfg.chaseClownSpeed) * 0.12;
  stage.innerHTML = `<div class="crhc-arena"><div class="crhc-hud"><span>${state.cfg.chaseTitle}</span><span>RESTAM <b id="crhc-time"></b></span></div><div class="crhc-obstacle" style="left:18%;top:28%;width:22%;height:11%"></div><div class="crhc-obstacle" style="right:14%;top:53%;width:25%;height:10%"></div><div class="crhc-obstacle" style="left:35%;bottom:14%;width:18%;height:10%"></div><div class="crhc-player"></div><img class="crhc-chaser" src="${state.cfg.angryAsset}" alt=""></div>`;
  const arena = stage.querySelector(".crhc-arena");
  const player = stage.querySelector(".crhc-player");
  const chaser = stage.querySelector(".crhc-chaser");
  let px = arena.clientWidth * .5, py = arena.clientHeight * .72;
  let cx = arena.clientWidth * .5, cy = arena.clientHeight * .15;
  let dead = false, start = performance.now(), last = start;
  function position() { player.style.left = `${px}px`; player.style.top = `${py}px`; chaser.style.left = `${cx}px`; chaser.style.top = `${cy}px`; }
  function movePlayer(clientX, clientY) {
    const r = arena.getBoundingClientRect();
    px = clamp(clientX - r.left, 18, r.width - 18); py = clamp(clientY - r.top, 18, r.height - 18); position();
  }
  arena.addEventListener("pointerdown", e => { arena.setPointerCapture?.(e.pointerId); movePlayer(e.clientX, e.clientY); });
  arena.addEventListener("pointermove", e => { if (e.buttons || e.pointerType === "touch") movePlayer(e.clientX, e.clientY); });
  function loop(now) {
    if (dead) return;
    const dt = Math.min(32, now - last); last = now;
    const dx = px - cx, dy = py - cy, dist = Math.max(1, Math.hypot(dx, dy));
    cx += dx / dist * speed * dt; cy += dy / dist * speed * dt;
    const remaining = Math.max(0, duration - (now - start));
    stage.querySelector("#crhc-time").textContent = `${(remaining/1000).toFixed(1)}s`;
    if (dist < 48) {
      dead = true; state.memory.losses += 1; state.memory.lastResult = "hardcore-chase-lose"; addAnger(6, "loss"); saveMemory();
      showRetry("ELE TE PEGOU.", "Você provocou. Agora corre direito.", startChase); return;
    }
    if (remaining <= 0) { dead = true; fillExtra(0); startDefend(); return; }
    if (dist < 105) arena.classList.add("crhc-danger"); else arena.classList.remove("crhc-danger");
    position(); requestAnimationFrame(loop);
  }
  position(); requestAnimationFrame(loop);
  state.cleanupGame = () => { dead = true; };
}
function startDefend() {
  state.cleanupGame?.();
  const stage = document.getElementById("crhc-stage");
  const fury = profile() === "fury";
  const waves = fury ? state.cfg.defendFuryWaves : state.cfg.defendWaves;
  const reaction = fury ? state.cfg.defendFuryReactionMs : state.cfg.defendReactionMs;
  const labels = ["PORTA", "JANELA", "ALÇAPÃO", "VENTILAÇÃO"];
  stage.innerHTML = `<section class="crhc-door-scene"><div><div class="crhc-wave">${state.cfg.defendTitle} · ONDA <b id="crhc-wave">1</b>/${waves}</div><div class="crhc-progress"><i id="crhc-progress"></i></div></div><div class="crhc-entries">${labels.map((x,i)=>`<button class="crhc-entry" data-i="${i}" type="button">${x}</button>`).join("")}</div><div class="crhc-wave">Toque na entrada que der o sinal antes que ele invada.</div></section>`;
  const entries = [...stage.querySelectorAll(".crhc-entry")];
  let wave = 0, target = -1, timer = null, locked = false;
  function next() {
    if (wave >= waves) { fillExtra(1); completeHardcore(); return; }
    wave += 1; locked = false; entries.forEach(e => e.classList.remove("warn","fake","hit"));
    stage.querySelector("#crhc-wave").textContent = wave;
    stage.querySelector("#crhc-progress").style.width = `${(wave-1)/waves*100}%`;
    target = Math.floor(Math.random()*entries.length);
    const fakeChance = fury ? .45 : .25;
    if (Math.random() < fakeChance) {
      let fake = (target + 1 + Math.floor(Math.random()*3)) % entries.length;
      entries[fake].classList.add("fake"); setTimeout(()=>entries[fake].classList.remove("fake"),220);
    }
    setTimeout(() => {
      entries[target].classList.add("warn");
      timer = setTimeout(() => failWave(), reaction);
    }, 320 + Math.random()*520);
  }
  function failWave() {
    if (locked) return; locked = true; clearTimeout(timer); entries[target]?.classList.add("hit");
    state.memory.losses += 1; state.memory.lastResult = "hardcore-defend-lose"; addAnger(5, "loss"); saveMemory();
    setTimeout(()=>showRetry("ELE ENTROU.", "Escute os sinais. Feche a entrada certa.", startDefend),450);
  }
  entries.forEach((entry, index) => entry.addEventListener("click", () => {
    if (locked) return;
    if (index !== target || !entry.classList.contains("warn")) { entry.classList.add("fake"); setTimeout(()=>entry.classList.remove("fake"),260); return; }
    locked = true; clearTimeout(timer); entry.classList.remove("warn");
    stage.querySelector("#crhc-progress").style.width = `${wave/waves*100}%`;
    setTimeout(next, 330);
  }));
  next();
  state.cleanupGame = () => clearTimeout(timer);
}
function showRetry(title, text, retry) {
  const stage = document.getElementById("crhc-stage");
  const box = document.createElement("div");
  box.className = "crhc-result";
  box.innerHTML = `<div><h2>${title}</h2><p>${text}</p><button class="crhc-btn" type="button">TENTAR DE NOVO</button></div>`;
  stage.appendChild(box); box.querySelector("button").addEventListener("click", retry, { once: true });
}
function completeHardcore() {
  state.cleanupGame?.();
  state.complete = true; state.active = false;
  window.__circorayHardcoreComplete = true;
  state.memory.hardcoreWins += 1; state.memory.wins += 1; state.memory.lastResult = "hardcore-win";
  state.memory.anger = clamp(state.memory.anger - 18, 0, 100); saveMemory();
  const stage = document.getElementById("crhc-stage");
  stage.innerHTML = `<div class="crhc-result"><div><img src="${state.cfg.angryAsset}" alt="" style="width:min(180px,50vw)"><h2>VOCÊ SOBREVIVEU.</h2><p>O palhaço não esqueceu. Mas desta vez você terminou os cinco jogos.</p><button class="crhc-btn" type="button">VER RESULTADO</button></div></div>`;
  stage.querySelector("button").addEventListener("click", () => state.overlay.classList.remove("open"), { once: true });
  window.dispatchEvent(new CustomEvent("circoray:hardcore-complete", { detail: { memory: { ...state.memory } } }));
}
function observeCompletion() {
  const check = () => {
    if (state.started || !state.cfg.enabled) return;
    if (firstThreeFilled() && state.memory.anger >= state.cfg.angerThreshold) {
      state.started = true;
      triggerHardcore();
    }
  };
  state.observer = new MutationObserver(check);
  state.observer.observe(document.body, { subtree:true, attributes:true, attributeFilter:["class"] });
  check();
}
export function initHardcoreMode(config = {}) {
  if (window.__circorayHardcoreLoaded) return;
  window.__circorayHardcoreLoaded = true;
  state.cfg = { ...DEFAULTS, ...(config?.hardcore || {}), angryAsset: config?.clown?.angryAsset || config?.hardcore?.angryAsset || DEFAULTS.angryAsset };
  window.__circorayHardcoreActive = false;
  window.__circorayHardcoreComplete = false;
  initMemory(); installStyles(); createOverlay(); observeCompletion();
  window.addEventListener("circoray:clown-provoked", (event) => addAnger(Number(event.detail?.amount || 0), event.detail?.reason || "tap"));
  window.CIRCO_CLOWN_MEMORY = { get: () => ({ ...state.memory }), addAnger, reset: () => { localStorage.removeItem(MEMORY_KEY); initMemory(); } };
}
