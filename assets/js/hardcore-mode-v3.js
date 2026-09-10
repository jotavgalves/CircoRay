const MEMORY_KEY = "circoray:clown-memory:v1";

const DEFAULTS = {
  enabled: true,
  angerThreshold: 45,
  furyThreshold: 75,
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
  armed: false,
  fury: false,
  currentGameHardened: false
};

function clamp(n, min, max) { return Math.min(max, Math.max(min, Number(n) || 0)); }

function readPersistentMemory() {
  try {
    const raw = JSON.parse(localStorage.getItem(MEMORY_KEY) || "null");
    return raw && typeof raw === "object" ? raw : {};
  } catch { return {}; }
}

function persistMemory() {
  if (!state.memory) return;
  const persistent = {
    visits: state.memory.visits,
    totalTaps: state.memory.totalTaps,
    highestAnger: state.memory.highestAnger,
    wins: state.memory.wins,
    losses: state.memory.losses,
    hardcoreRuns: state.memory.hardcoreRuns,
    hardcoreWins: state.memory.hardcoreWins,
    lastResult: state.memory.lastResult,
    lastVisit: Date.now(),
    anger: 0
  };
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(persistent)); } catch {}
}

function broadcastMemory() {
  window.dispatchEvent(new CustomEvent("circoray:clown-memory", { detail: { ...state.memory } }));
}
function saveMemory() { persistMemory(); broadcastMemory(); }

function initMemory() {
  const prev = readPersistentMemory();
  state.memory = {
    visits: Number(prev.visits || 0) + 1,
    totalTaps: Number(prev.totalTaps || 0),
    anger: 0,
    highestAnger: clamp(prev.highestAnger || 0, 0, 100),
    wins: Number(prev.wins || 0),
    losses: Number(prev.losses || 0),
    hardcoreRuns: Number(prev.hardcoreRuns || 0),
    hardcoreWins: Number(prev.hardcoreWins || 0),
    lastResult: prev.lastResult || "",
    lastVisit: Date.now()
  };
  saveMemory();
}

function say(text, ms = 2600) {
  const bubble = document.querySelector(".speech-bubble");
  if (!bubble || !text) return;
  const p = bubble.querySelector("p") || bubble;
  p.textContent = text;
  bubble.classList.add("show");
  clearTimeout(say.timer);
  say.timer = setTimeout(() => bubble.classList.remove("show"), ms);
}

function applyArmedAtmosphere() {
  document.body.classList.add("cr-hardcore-armed");
  document.body.classList.toggle("cr-hardcore-fury", state.fury);
  window.__circorayHardcoreArmed = true;
  window.__circorayHardcoreFury = state.fury;
  document.querySelector(".clown-img")?.classList.add("cr-clown-hate-aura");
}
function clearArmedAtmosphere() {
  document.body.classList.remove("cr-hardcore-armed", "cr-hardcore-fury");
  document.querySelector(".clown-img")?.classList.remove("cr-clown-hate-aura");
  window.__circorayHardcoreArmed = false;
  window.__circorayHardcoreFury = false;
}

function hardenCurrentLegacyGame() {
  if (state.currentGameHardened) return;
  const g1Active = document.querySelector("#screen-game1.active");
  const g2Active = document.querySelector("#screen-game2.active");
  if (g1Active && window.g1 && Number.isFinite(Number(window.g1.timeLeft))) {
    window.g1.timeLeft = Math.max(3, Math.ceil(Number(window.g1.timeLeft) * (state.fury ? 0.58 : 0.72)));
    window.updateG1Timer?.();
    state.currentGameHardened = true;
  } else if (g2Active && window.g2 && Number.isFinite(Number(window.g2.timeLeft))) {
    window.g2.timeLeft = Math.max(3, Math.ceil(Number(window.g2.timeLeft) * (state.fury ? 0.62 : 0.76)));
    window.updateG2Timer?.();
    state.currentGameHardened = true;
  }
}

function armRun() {
  if (state.armed) {
    const nowFury = state.memory.anger >= state.cfg.furyThreshold;
    if (nowFury !== state.fury) { state.fury = nowFury; applyArmedAtmosphere(); }
    return;
  }
  state.armed = true;
  state.fury = state.memory.anger >= state.cfg.furyThreshold;
  applyArmedAtmosphere();
  hardenCurrentLegacyGame();
  say(state.fury ? "VOCÊ PASSOU DO LIMITE." : "AGORA FICOU SÉRIO.", 2600);
  window.dispatchEvent(new CustomEvent("circoray:hardcore-armed", { detail: { fury: state.fury, anger: state.memory.anger } }));
}

function addAnger(amount, reason = "tap") {
  if (!state.memory) return;
  if (reason.includes("tap")) state.memory.totalTaps += 1;
  state.memory.anger = clamp(state.memory.anger + amount, 0, 100);
  state.memory.highestAnger = Math.max(state.memory.highestAnger, state.memory.anger);
  if (state.memory.anger >= state.cfg.angerThreshold) armRun();
  if (state.memory.anger >= state.cfg.furyThreshold && !state.fury) {
    state.fury = true;
    applyArmedAtmosphere();
    window.dispatchEvent(new CustomEvent("circoray:hardcore-fury", { detail: { anger: state.memory.anger } }));
  }
  saveMemory();
}

function profile() {
  if (state.memory.anger >= state.cfg.furyThreshold) return "fury";
  if (state.memory.anger >= state.cfg.angerThreshold) return "hardcore";
  return "normal";
}

function installStyles() {
  if (document.getElementById("cr-hardcore-v3-styles")) return;
  const style = document.createElement("style");
  style.id = "cr-hardcore-v3-styles";
  style.textContent = `
  body.cr-hardcore-armed::after{content:"";position:fixed;inset:0;z-index:9992;pointer-events:none;background:radial-gradient(circle at 50% 38%,transparent 28%,rgba(95,0,0,.18) 58%,rgba(55,0,0,.55) 100%);box-shadow:inset 0 0 80px rgba(120,0,0,.45);animation:crRunPulse 1.8s ease-in-out infinite alternate}
  body.cr-hardcore-fury::after{background:radial-gradient(circle at 50% 38%,transparent 18%,rgba(130,0,0,.28) 52%,rgba(40,0,0,.72) 100%);animation-duration:.75s}
  body.cr-hardcore-armed #app{filter:saturate(.86) contrast(1.06)}
  .cr-clown-hate-aura{filter:drop-shadow(0 0 8px rgba(255,0,0,.9)) drop-shadow(0 0 22px rgba(170,0,0,.8)) drop-shadow(0 0 42px rgba(90,0,0,.7))!important;animation:crClownHate 1.15s ease-in-out infinite alternate}
  @keyframes crRunPulse{to{box-shadow:inset 0 0 115px rgba(170,0,0,.65);opacity:.82}}
  @keyframes crClownHate{to{transform:scale(1.018);filter:drop-shadow(0 0 14px rgba(255,0,0,1)) drop-shadow(0 0 34px rgba(170,0,0,.9))}}
  #cr-hardcore{position:fixed;inset:0;z-index:9998;background:radial-gradient(circle at 50% 10%,#3a0000 0,#120707 36%,#050303 100%);color:#f3e9d6;display:none;overflow:hidden;font-family:'Special Elite',monospace}
  #cr-hardcore.open{display:block}.crhc-wrap{height:100%;display:flex;flex-direction:column;padding:max(16px,env(safe-area-inset-top)) 16px max(16px,env(safe-area-inset-bottom));gap:12px}.crhc-head{text-align:center}.crhc-kicker{font:700 11px 'Rye',serif;letter-spacing:.16em;color:#d8a53a}.crhc-title{font:400 clamp(24px,7vw,42px) 'Rye',serif;margin:4px 0;color:#fff;text-shadow:0 0 18px rgba(255,0,0,.45)}.crhc-sub{font-size:12px;color:#c8b9aa;margin:0}.crhc-stage{position:relative;flex:1;min-height:0;border:2px solid #5c3a20;border-radius:16px;overflow:hidden;background:#0a0605;box-shadow:inset 0 0 60px rgba(0,0,0,.8)}
  .crhc-intro,.crhc-transition,.crhc-result{position:absolute;inset:0;display:grid;place-items:center;padding:28px;text-align:center;background:rgba(5,3,3,.96);z-index:20}.crhc-intro img,.crhc-transition img{width:min(210px,52vw);filter:drop-shadow(0 0 24px #7a0000)}.crhc-intro h2,.crhc-transition h2,.crhc-result h2{font:400 clamp(25px,8vw,46px) 'Rye',serif;margin:12px 0}.crhc-transition .duo{display:flex;justify-content:center;gap:0;margin:auto}.crhc-transition .duo img{width:min(150px,38vw);animation:crSplit .65s ease-out both}.crhc-transition .duo img:first-child{transform-origin:right center}.crhc-transition .duo img:last-child{transform-origin:left center;animation-delay:.08s}.crhc-btn{border:2px solid #7a0000;background:#7a0000;color:#fff;border-radius:10px;padding:12px 18px;font:700 12px 'Rye',serif;cursor:pointer;box-shadow:0 5px 0 #260000}.crhc-btn:active{transform:translateY(3px);box-shadow:0 2px 0 #260000}
  @keyframes crSplit{0%{opacity:0;filter:blur(8px) drop-shadow(0 0 40px #ff0000)}100%{opacity:1;filter:blur(0) drop-shadow(0 0 20px #7a0000)}}
  .crhc-arena{position:absolute;inset:0;touch-action:none;background:radial-gradient(circle at 50% 50%,rgba(122,0,0,.18),transparent 55%),repeating-linear-gradient(0deg,transparent 0 28px,rgba(255,255,255,.025) 29px 30px),#0c0807}.crhc-player{position:absolute;width:34px;height:34px;border-radius:50%;background:#d8a53a;border:3px solid #fff;box-shadow:0 0 18px #d8a53a;transform:translate(-50%,-50%);z-index:3}.crhc-chaser{position:absolute;width:78px;height:78px;object-fit:contain;transform:translate(-50%,-50%);filter:drop-shadow(0 0 18px #b00000);z-index:2;pointer-events:none}.crhc-chaser.clone{filter:hue-rotate(-12deg) brightness(.82) drop-shadow(0 0 18px #ff0000)}.crhc-obstacle{position:absolute;background:#2a1a0e;border:2px solid #75452a;border-radius:8px;box-shadow:0 8px 18px rgba(0,0,0,.55);z-index:4}.crhc-hud{position:absolute;left:10px;right:10px;top:10px;display:flex;justify-content:space-between;z-index:8;font:700 11px ui-monospace,monospace}.crhc-hud b{color:#d8a53a}.crhc-danger{animation:crhcDanger .3s linear infinite alternate}.crhc-dash{box-shadow:inset 0 0 100px rgba(255,0,0,.48)!important}.crhc-wall-danger{animation:crhcWallDanger .42s ease-in-out infinite alternate!important}.crhc-wall-danger .crhc-player{box-shadow:0 0 12px #fff,0 0 26px #ff1d1d!important}@keyframes crhcDanger{to{box-shadow:inset 0 0 70px rgba(255,0,0,.35)}}@keyframes crhcWallDanger{from{box-shadow:inset 0 0 35px rgba(160,0,0,.42)}to{box-shadow:inset 0 0 105px rgba(255,0,0,.72)}}
  .crhc-door-scene{position:absolute;inset:0;padding:18px;display:grid;grid-template-rows:auto 1fr auto;gap:12px;background:linear-gradient(#0a0605,#170b08)}.crhc-entries{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:12px;min-height:0}.crhc-entry{position:relative;border:2px solid #5c3a20;background:#120b09;border-radius:14px;color:#e9ddca;font:700 13px 'Rye',serif;cursor:pointer;overflow:hidden}.crhc-entry::after{content:'';position:absolute;inset:0;background:radial-gradient(circle,rgba(216,165,58,.28),transparent 62%);opacity:0}.crhc-entry.warn{border-color:#d8a53a;box-shadow:0 0 24px rgba(216,165,58,.62);animation:crhcTrueShake .18s 2}.crhc-entry.warn::after{opacity:1}.crhc-entry.fake{animation:crhcFake .18s 2}.crhc-entry.near-true{border-color:rgba(216,165,58,.35);box-shadow:0 0 9px rgba(216,165,58,.16);animation:crhcTrueShake .18s 2}.crhc-entry.near-true::after{opacity:.18}.crhc-entry.hit{background:#3a0000;border-color:#ff4a4a}@keyframes crhcFake{50%{transform:translateX(4px)}}@keyframes crhcTrueShake{25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}.crhc-wave{text-align:center;font:700 12px ui-monospace,monospace}.crhc-progress{height:8px;background:#2a1a0e;border-radius:999px;overflow:hidden}.crhc-progress>i{display:block;height:100%;width:0;background:#d8a53a;transition:width .2s}.crhc-result p,.crhc-transition p{max-width:430px;line-height:1.5}.crhc-extra-pip{filter:none!important;opacity:1!important}.crhc-extra-pip:not(.filled){filter:grayscale(1) brightness(.35)!important;opacity:.45!important}
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
function fillExtra(i) { state.extraPips[i]?.classList.add("filled"); }
function firstThreeFilled() {
  const tickets = [...document.querySelectorAll(".ticket-pip:not(.crhc-extra-pip)")].slice(0, 3);
  return tickets.length >= 3 && tickets.every(t => t.classList.contains("filled"));
}

function showIntro() {
  const stage = document.getElementById("crhc-stage");
  stage.innerHTML = `<section class="crhc-intro"><div><img src="${state.cfg.angryAsset}" alt="Palhaço irritado"><h2>${state.cfg.introLine}</h2><p>${state.cfg.hardcoreLine}</p><button class="crhc-btn" type="button">CONTINUAR</button></div></section>`;
  stage.querySelector("button").addEventListener("click", () => startChase({ double: false }), { once: true });
  say(state.cfg.introLine, 2200);
}
function triggerHardcore() {
  if (state.active || state.complete || !state.cfg.enabled || !state.armed) return;
  state.active = true;
  window.__circorayHardcoreActive = true;
  window.__circorayHardcoreComplete = false;
  state.memory.hardcoreRuns += 1;
  saveMemory();
  ensureExtraPips();
  state.overlay.classList.add("open");
  document.getElementById("crhc-anger").textContent = Math.round(state.memory.anger);
  document.getElementById("crhc-profile").textContent = profile().toUpperCase();
  showIntro();
  window.dispatchEvent(new CustomEvent("circoray:hardcore-start", { detail: { profile: profile(), memory: { ...state.memory } } }));
}

function circleHitsRect(x, y, radius, el) {
  const left = el.offsetLeft, top = el.offsetTop, right = left + el.offsetWidth, bottom = top + el.offsetHeight;
  const nearestX = clamp(x, left, right), nearestY = clamp(y, top, bottom);
  return Math.hypot(x - nearestX, y - nearestY) < radius;
}

function showDuplicationCard(testOnly = false) {
  const stage = document.getElementById("crhc-stage");
  stage.innerHTML = `<section class="crhc-transition"><div><div class="duo"><img src="${state.cfg.angryAsset}" alt=""><img src="${state.cfg.angryAsset}" alt=""></div><h2>O PALHAÇO NÃO QUER DEIXAR VOCÊ SAIR.</h2><p>Você achou que tinha vencido. Então ele usa a magia do circo e se divide em dois.</p><button class="crhc-btn" type="button">ENFRENTAR OS DOIS</button></div></section>`;
  say("EU NÃO PRECISO SER UM SÓ.", 2400);
  stage.querySelector("button").addEventListener("click", () => startChase({ double: true, testOnly }), { once: true });
}

function startChase({ double = false, testOnly = false } = {}) {
  const stage = document.getElementById("crhc-stage");
  const fury = state.fury;
  const baseDuration = (fury ? state.cfg.chaseFuryDurationSeconds : state.cfg.chaseDurationSeconds) * 1000;
  const duration = double ? Math.max(9000, baseDuration * .78) : baseDuration;
  const desktop = matchMedia("(pointer:fine)").matches;
  const desktopMultiplier = desktop ? 1.18 : 1;
  const doubleMultiplier = double ? .88 : 1;
  const baseSpeed = (fury ? state.cfg.chaseFurySpeed : state.cfg.chaseClownSpeed) * 0.12 * desktopMultiplier * doubleMultiplier;
  stage.innerHTML = `<div class="crhc-arena"><div class="crhc-hud"><span>${double ? "FUJA DOS DOIS" : state.cfg.chaseTitle}</span><span>RESTAM <b id="crhc-time"></b></span></div><div class="crhc-obstacle" style="left:10%;top:22%;width:34%;height:8%"></div><div class="crhc-obstacle" style="right:8%;top:40%;width:33%;height:8%"></div><div class="crhc-obstacle" style="left:18%;top:58%;width:30%;height:8%"></div><div class="crhc-obstacle" style="right:18%;bottom:16%;width:28%;height:8%"></div><div class="crhc-obstacle" style="left:47%;top:30%;width:8%;height:24%"></div><div class="crhc-player"></div><img class="crhc-chaser" src="${state.cfg.angryAsset}" alt="">${double ? `<img class="crhc-chaser clone" src="${state.cfg.angryAsset}" alt="">` : ""}</div>`;
  const arena = stage.querySelector(".crhc-arena");
  const player = stage.querySelector(".crhc-player");
  const chasers = [...stage.querySelectorAll(".crhc-chaser")];
  const walls = [...stage.querySelectorAll(".crhc-obstacle")];
  const R = 18, STEP = 1.5;
  let px = arena.clientWidth * .5, py = arena.clientHeight * .82;
  let prevPx = px, prevPy = py;
  const enemies = chasers.map((el, i) => ({ el, x: arena.clientWidth * (i ? .78 : .5), y: arena.clientHeight * (i ? .18 : .12) }));
  let dead = false, start = performance.now(), last = start;
  let dashUntil = 0, nextDashAt = start + (fury ? 2800 : 3800);
  let wallTouchMs = 0, wallPenalty = false, wallBurstUntil = 0, nextWallTauntAt = 0;

  function blocked(x, y) { return walls.some(w => circleHitsRect(x, y, R, w)); }
  function touchingOuterWall() {
    const eps = 1.25;
    return px <= R + eps || py <= R + eps || px >= arena.clientWidth - R - eps || py >= arena.clientHeight - R - eps;
  }
  function position() {
    player.style.left = `${px}px`; player.style.top = `${py}px`;
    enemies.forEach(e => { e.el.style.left = `${e.x}px`; e.el.style.top = `${e.y}px`; });
  }
  function movePlayer(clientX, clientY) {
    const r = arena.getBoundingClientRect();
    let tx = clamp(clientX - r.left, R, r.width - R), ty = clamp(clientY - r.top, R, r.height - R);
    const response = fury && wallPenalty ? .75 : 1;
    tx = px + (tx - px) * response; ty = py + (ty - py) * response;
    const dx = tx - px, dy = ty - py, dist = Math.hypot(dx, dy);
    if (dist < .01) return;
    prevPx = px; prevPy = py;
    const steps = Math.max(1, Math.ceil(dist / STEP));
    const sx = dx / steps, sy = dy / steps;
    for (let i = 0; i < steps; i++) {
      const nx = clamp(px + sx, R, r.width - R), ny = clamp(py + sy, R, r.height - R);
      let moved = false;
      if (!blocked(nx, py)) { px = nx; moved = true; }
      if (!blocked(px, ny)) { py = ny; moved = true; }
      if (!moved) break;
    }
    position();
  }
  arena.addEventListener("pointerdown", e => { arena.setPointerCapture?.(e.pointerId); movePlayer(e.clientX, e.clientY); });
  arena.addEventListener("pointermove", e => { if (e.buttons || e.pointerType === "touch") movePlayer(e.clientX, e.clientY); });

  function wallMultiplier(now, dt) {
    if (!fury) return 1;
    if (touchingOuterWall()) {
      wallTouchMs += dt;
      if (wallTouchMs >= 350 && !wallPenalty) {
        wallPenalty = true; arena.classList.add("crhc-wall-danger");
        if (now >= nextWallTauntAt) { say(Math.random() < .5 ? "SAIA DA PAREDE." : "AS PAREDES NÃO VÃO TE SALVAR.", 1700); nextWallTauntAt = now + 3200; }
      }
      if (wallTouchMs >= 1500 && now >= wallBurstUntil) {
        wallBurstUntil = now + 900; wallTouchMs = 700;
        if (now >= nextWallTauntAt) { say("EU CONSIGO TE VER.", 1500); nextWallTauntAt = now + 3200; }
      }
    } else {
      wallTouchMs = Math.max(0, wallTouchMs - dt * 2);
      if (wallTouchMs === 0 && wallPenalty) { wallPenalty = false; arena.classList.remove("crhc-wall-danger"); }
    }
    return now < wallBurstUntil ? 1.35 : wallPenalty ? 1.20 : 1;
  }

  function loop(now) {
    if (dead) return;
    const dt = Math.min(32, Math.max(0, now - last)); last = now;
    const wallBoost = wallMultiplier(now, dt);
    if (now >= nextDashAt) {
      dashUntil = now + (fury ? 850 : 650); nextDashAt = now + (fury ? 3000 : 4300);
      arena.classList.add("crhc-dash"); setTimeout(() => arena.classList.remove("crhc-dash"), fury ? 850 : 650);
    }
    const elapsed = clamp((now - start) / duration, 0, 1);
    const acceleration = 1 + elapsed * (fury ? .7 : .45);
    const dash = now < dashUntil ? (fury ? 1.85 : 1.65) : 1;
    const speed = baseSpeed * acceleration * dash * wallBoost;
    const velX = px - prevPx, velY = py - prevPy;
    let nearest = Infinity;
    enemies.forEach((enemy, idx) => {
      let targetX = px, targetY = py;
      if (double && idx === 1) {
        targetX = clamp(px + velX * 11, R, arena.clientWidth - R);
        targetY = clamp(py + velY * 11, R, arena.clientHeight - R);
      }
      const dx = targetX - enemy.x, dy = targetY - enemy.y, dist = Math.max(1, Math.hypot(dx, dy));
      const roleSpeed = double && idx === 1 ? speed * .93 : speed;
      enemy.x += dx / dist * roleSpeed * dt; enemy.y += dy / dist * roleSpeed * dt;
      nearest = Math.min(nearest, Math.hypot(px - enemy.x, py - enemy.y));
    });
    prevPx += (px - prevPx) * .22; prevPy += (py - prevPy) * .22;
    const remaining = Math.max(0, duration - (now - start));
    stage.querySelector("#crhc-time").textContent = `${(remaining / 1000).toFixed(1)}s`;
    if (nearest < 48) {
      dead = true; arena.classList.remove("crhc-wall-danger");
      if (!testOnly) { state.memory.losses += 1; state.memory.lastResult = double ? "fury-double-chase-lose" : "hardcore-chase-lose"; addAnger(6, "loss"); saveMemory(); }
      showRetry("ELE TE PEGOU.", double ? "Agora existem dois caminhos para você perder." : "Você não atravessa paredes. Ele atravessa.", () => startChase({ double, testOnly })); return;
    }
    if (remaining <= 0) {
      dead = true; arena.classList.remove("crhc-wall-danger");
      if (testOnly) { showTestDone(double ? "TESTE DOS DOIS CONCLUÍDO" : "TESTE DE FUGA CONCLUÍDO"); return; }
      if (fury && !double) { showDuplicationCard(false); return; }
      fillExtra(0); startDefend({ enhanced: fury }); return;
    }
    if (nearest < 110) arena.classList.add("crhc-danger"); else arena.classList.remove("crhc-danger");
    position(); requestAnimationFrame(loop);
  }
  position(); requestAnimationFrame(loop);
}

function startDefend({ enhanced = state.fury, testOnly = false } = {}) {
  const stage = document.getElementById("crhc-stage");
  const fury = !!enhanced;
  const totalWaves = Math.round(fury ? state.cfg.defendFuryWaves : state.cfg.defendWaves);
  const reactionMs = Number(fury ? state.cfg.defendFuryReactionMs : state.cfg.defendReactionMs);
  const entries = ["PORTA", "JANELA", "ALÇAPÃO", "VENTILAÇÃO"];
  stage.innerHTML = `<div class="crhc-door-scene"><div><div class="crhc-wave">ONDA <b id="crhc-wave">1</b> / ${totalWaves}</div><div class="crhc-progress"><i id="crhc-progress"></i></div></div><div class="crhc-entries">${entries.map((e,i)=>`<button class="crhc-entry" data-i="${i}" type="button">${e}</button>`).join("")}</div><p style="text-align:center;margin:0;font-size:11px;color:#c8b9aa">${fury ? "No Fúria, uma ameaça falsa pode imitar quase perfeitamente a verdadeira." : "Toque na entrada realmente ameaçada. Os outros sinais podem ser mentira."}</p></div>`;
  const buttons = [...stage.querySelectorAll(".crhc-entry")];
  let wave = 0, active = -1, resolved = false, timer = null;

  function nextWave() {
    if (wave >= totalWaves) {
      if (testOnly) { showTestDone("TESTE DAS PORTAS CONCLUÍDO"); return; }
      fillExtra(1); completeHardcore(); return;
    }
    wave += 1; resolved = false; active = Math.floor(Math.random() * buttons.length);
    buttons.forEach(b => b.classList.remove("warn","fake","near-true","hit"));
    const others = buttons.map((_,i)=>i).filter(i=>i!==active).sort(()=>Math.random()-.5);
    const nearTrueCount = fury ? (wave >= totalWaves - 2 ? 2 : 1) : 0;
    const nearTrue = others.slice(0, nearTrueCount);
    const normalFakes = others.slice(nearTrueCount);
    const extraFake = normalFakes.length && Math.random() < (fury ? .65 : .55) ? normalFakes[0] : -1;
    setTimeout(() => {
      if (resolved) return;
      buttons[active].classList.add("warn");
      nearTrue.forEach(i => buttons[i].classList.add("near-true"));
      if (extraFake >= 0) buttons[extraFake].classList.add("fake");
    }, 120);
    stage.querySelector("#crhc-wave").textContent = wave;
    stage.querySelector("#crhc-progress").style.width = `${wave / totalWaves * 100}%`;
    clearTimeout(timer);
    timer = setTimeout(() => failWave("ELE ENTROU."), Math.max(fury ? 590 : 650, reactionMs - Math.max(0,wave-1) * (fury ? 34 : 28)));
  }
  function failWave(title) {
    if (resolved) return; resolved = true; clearTimeout(timer);
    if (active >= 0) buttons[active].classList.add("hit");
    if (!testOnly) { state.memory.losses += 1; state.memory.lastResult = "hardcore-defend-lose"; addAnger(5,"loss"); saveMemory(); }
    setTimeout(() => showRetry(title, fury ? "O falso verdadeiro fez exatamente o que precisava." : "Você hesitou. Ele não.", () => startDefend({ enhanced:fury, testOnly })), 300);
  }
  buttons.forEach((button,i)=>button.addEventListener("click",()=>{
    if (resolved) return;
    if (i !== active) { failWave("ENTRADA ERRADA."); return; }
    resolved = true; clearTimeout(timer); button.classList.remove("warn"); button.classList.add("hit");
    setTimeout(nextWave, fury ? 190 : 240);
  }));
  nextWave();
}

function showRetry(title, text, retry) {
  const stage = document.getElementById("crhc-stage");
  stage.innerHTML = `<div class="crhc-result"><div><h2>${title}</h2><p>${text}</p><button class="crhc-btn" type="button">TENTAR DE NOVO</button></div></div>`;
  stage.querySelector("button").addEventListener("click", retry, { once:true });
}
function showTestDone(title) {
  const stage = document.getElementById("crhc-stage");
  stage.innerHTML = `<div class="crhc-result"><div><h2>${title}</h2><p>Modo de teste do painel administrativo. Nenhum progresso real foi alterado.</p><button class="crhc-btn" type="button">FECHAR TESTE</button></div></div>`;
  stage.querySelector("button").addEventListener("click",()=>{ state.overlay.classList.remove("open"); },{once:true});
}

function endRunEmotion(result) {
  state.memory.lastResult = result; state.memory.anger = 0; state.armed = false; state.fury = false; state.currentGameHardened = false;
  clearArmedAtmosphere(); saveMemory(); window.dispatchEvent(new CustomEvent("circoray:hardcore-emotion-reset"));
}
function completeHardcore() {
  state.complete = true; window.__circorayHardcoreComplete = true; window.__circorayHardcoreActive = false;
  state.memory.hardcoreWins += 1; state.memory.wins += 1;
  const stage = document.getElementById("crhc-stage");
  stage.innerHTML = `<div class="crhc-result"><div><img src="${state.cfg.angryAsset}" alt="" style="width:min(180px,50vw)"><h2>VOCÊ SOBREVIVEU.</h2><p>A raiva acaba com esta run. A memória do que você fez, não.</p><button class="crhc-btn" type="button">VER RESULTADO</button></div></div>`;
  stage.querySelector("button").addEventListener("click",()=>{ state.overlay.classList.remove("open"); endRunEmotion("hardcore-win"); },{once:true});
  window.dispatchEvent(new CustomEvent("circoray:hardcore-complete",{detail:{memory:{...state.memory}}}));
}

function observeCompletion() {
  const check = () => {
    state.currentGameHardened = false;
    if (state.started || !state.cfg.enabled) return;
    if (firstThreeFilled() && state.armed) { state.started = true; triggerHardcore(); }
  };
  const tickets = document.querySelector(".tickets");
  if (tickets) {
    state.observer = new MutationObserver(check);
    state.observer.observe(tickets,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
  }
  check();
}

function prepareAdminTest(fury = true) {
  state.fury = fury; state.armed = true; state.active = true;
  applyArmedAtmosphere(); ensureExtraPips(); state.overlay.classList.add("open");
  document.getElementById("crhc-anger").textContent = fury ? "100" : "55";
  document.getElementById("crhc-profile").textContent = fury ? "FURY · TESTE" : "HARDCORE · TESTE";
}

export function initHardcoreMode(config = {}) {
  if (window.__circorayHardcoreLoaded) return;
  window.__circorayHardcoreLoaded = true;
  state.cfg = { ...DEFAULTS, ...(config?.hardcore||{}), angryAsset:config?.clown?.angryAsset || config?.hardcore?.angryAsset || DEFAULTS.angryAsset };
  if (Number(state.cfg.angerThreshold) === 70 && Number(state.cfg.furyThreshold) === 90) { state.cfg.angerThreshold = 45; state.cfg.furyThreshold = 75; }
  window.__circorayHardcoreActive = false; window.__circorayHardcoreComplete = false; window.__circorayHardcoreArmed = false; window.__circorayHardcoreFury = false;
  initMemory(); installStyles(); createOverlay(); observeCompletion();
  window.addEventListener("circoray:clown-provoked",e=>addAnger(Number(e.detail?.amount||0),e.detail?.reason||"tap"));
  window.CIRCO_CLOWN_MEMORY = {
    get:()=>({...state.memory}), addAnger,
    reset:()=>{ localStorage.removeItem(MEMORY_KEY); clearArmedAtmosphere(); state.armed=false; state.fury=false; state.active=false; state.complete=false; state.started=false; initMemory(); }
  };
  window.CIRCO_HARDCORE_TEST = {
    chase:()=>{ prepareAdminTest(true); startChase({double:false,testOnly:true}); },
    doubleChase:()=>{ prepareAdminTest(true); showDuplicationCard(true); },
    doors:()=>{ prepareAdminTest(true); startDefend({enhanced:true,testOnly:true}); },
    normalDoors:()=>{ prepareAdminTest(false); startDefend({enhanced:false,testOnly:true}); }
  };
}