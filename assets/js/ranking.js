const NAME_KEY = "circoray:ranking:name:v1";
const CLIENT_KEY = "circoray:ranking:client:v1";
const LOCAL_KEY = "circoray:ranking:local:v1";
const CACHE_KEY = "circoray:ranking:global-cache:v1";
const PENDING_KEY = "circoray:ranking:pending:v1";

const state = {
  sessionToken: "",
  startedAt: 0,
  running: false,
  completed: false,
  finalRun: null,
  modal: null,
  list: null,
  localList: null,
  nameInput: null,
  status: null,
  submitBtn: null
};

function safeGet(key, fallback = "") {
  try {
    const value = localStorage.getItem(key);
    return value == null ? fallback : value;
  } catch { return fallback; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

function readJson(key, fallback) {
  try { return JSON.parse(safeGet(key, "")) || fallback; } catch { return fallback; }
}

function formatTime(ms) {
  const total = Math.max(0, Number(ms) || 0);
  const minutes = Math.floor(total / 60000);
  const seconds = Math.floor((total % 60000) / 1000);
  const centis = Math.floor((total % 1000) / 10);
  return `${minutes}:${String(seconds).padStart(2, "0")}.${String(centis).padStart(2, "0")}`;
}

function clientId() {
  let id = safeGet(CLIENT_KEY);
  if (id) return id;
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  id = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  safeSet(CLIENT_KEY, id);
  return id;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function localRuns() {
  const runs = readJson(LOCAL_KEY, []);
  return Array.isArray(runs) ? runs.sort((a, b) => Number(a.timeMs) - Number(b.timeMs)).slice(0, 10) : [];
}

function saveLocalRun(run) {
  const runs = localRuns();
  const next = [...runs, run]
    .filter((item) => item && Number.isFinite(Number(item.timeMs)))
    .sort((a, b) => Number(a.timeMs) - Number(b.timeMs))
    .slice(0, 10);
  safeSet(LOCAL_KEY, JSON.stringify(next));
  renderLocal(next);
}

function renderRanking(ranking) {
  if (!state.list) return;
  const rows = Array.isArray(ranking) ? ranking.slice(0, 10) : [];
  if (!rows.length) {
    state.list.innerHTML = '<div class="cr-rank-empty">Ninguém entrou no ranking ainda.</div>';
    return;
  }
  state.list.innerHTML = rows.map((item, index) => `
    <div class="cr-rank-row ${item.clientId === clientId() ? "mine" : ""}">
      <strong class="cr-rank-pos">${index + 1}</strong>
      <span class="cr-rank-name">${escapeHtml(item.name || "Jogador")}</span>
      <b class="cr-rank-time">${formatTime(item.timeMs)}</b>
    </div>
  `).join("");
}

function renderLocal(runs = localRuns()) {
  if (!state.localList) return;
  if (!runs.length) {
    state.localList.innerHTML = '<div class="cr-rank-empty">Você ainda não concluiu uma corrida.</div>';
    return;
  }
  state.localList.innerHTML = runs.slice(0, 5).map((item, index) => `
    <div class="cr-local-row"><span>${index + 1}º</span><strong>${formatTime(item.timeMs)}</strong></div>
  `).join("");
}

function setStatus(message, kind = "") {
  if (!state.status) return;
  state.status.textContent = message || "";
  state.status.dataset.kind = kind;
}

async function loadGlobal() {
  const cached = readJson(CACHE_KEY, []);
  if (cached.length) renderRanking(cached);
  try {
    const response = await fetch("/api/ranking", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    const ranking = Array.isArray(payload.ranking) ? payload.ranking : [];
    safeSet(CACHE_KEY, JSON.stringify(ranking));
    renderRanking(ranking);
    return ranking;
  } catch (error) {
    if (!cached.length) setStatus(`Ranking global indisponível: ${error.message}`, "error");
    return cached;
  }
}

async function requestRankingSession() {
  if (state.running || state.completed) return;
  state.running = true;
  try {
    const response = await fetch("/api/ranking/session", { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.token) throw new Error(payload.error || "Não foi possível iniciar o ranking.");
    state.sessionToken = payload.token;
    state.startedAt = Number(payload.startedAt) || Date.now();
  } catch (error) {
    state.running = false;
    console.warn("Ranking não iniciou:", error);
  }
}

function isGameStarted() {
  return Boolean(document.querySelector("#screen-game1.active, .screen.active[id*='game1']"));
}

function allTicketsFilled() {
  const tickets = [...document.querySelectorAll(".ticket-pip")];
  return tickets.length > 0 && tickets.every((ticket) => ticket.classList.contains("filled"));
}

async function finishRun() {
  if (state.completed || !state.sessionToken || !state.startedAt) return;
  state.completed = true;
  const completedAt = Date.now();
  const run = {
    timeMs: Math.max(0, completedAt - state.startedAt),
    completedAt,
    sessionToken: state.sessionToken,
    clientId: clientId()
  };
  state.finalRun = run;
  saveLocalRun({ timeMs: run.timeMs, completedAt: run.completedAt });

  const name = safeGet(NAME_KEY).trim();
  if (name.length >= 2) {
    await submitRun(name, run, { openAfter: true });
  } else {
    openModal();
    setStatus(`Você terminou em ${formatTime(run.timeMs)}. Digite seu nome para entrar no ranking.`, "success");
    state.nameInput?.focus();
  }
}

async function submitRun(name, run = state.finalRun, { openAfter = false } = {}) {
  const cleanName = String(name || "").replace(/\s+/g, " ").trim().slice(0, 24);
  if (cleanName.length < 2) {
    setStatus("Digite pelo menos 2 caracteres.", "error");
    return false;
  }
  if (!run?.sessionToken) {
    setStatus("Esta tentativa não possui uma sessão válida de ranking.", "error");
    return false;
  }

  safeSet(NAME_KEY, cleanName);
  if (state.nameInput) state.nameInput.value = cleanName;
  if (state.submitBtn) state.submitBtn.disabled = true;
  setStatus("Sincronizando com o ranking global…");

  const body = {
    name: cleanName,
    clientId: run.clientId || clientId(),
    timeMs: run.timeMs,
    completedAt: run.completedAt,
    sessionToken: run.sessionToken
  };

  try {
    const response = await fetch("/api/ranking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    safeSet(PENDING_KEY, "");
    safeSet(CACHE_KEY, JSON.stringify(payload.ranking || []));
    renderRanking(payload.ranking || []);
    setStatus(payload.position ? `Tempo salvo. Você está em ${payload.position}º no ranking global.` : "Tempo salvo no ranking global.", "success");
    if (openAfter) openModal();
    return true;
  } catch (error) {
    safeSet(PENDING_KEY, JSON.stringify(body));
    setStatus(`Seu tempo ficou salvo neste aparelho. Sincronização pendente: ${error.message}`, "error");
    if (openAfter) openModal();
    return false;
  } finally {
    if (state.submitBtn) state.submitBtn.disabled = false;
  }
}

async function retryPending() {
  const pending = readJson(PENDING_KEY, null);
  if (!pending?.sessionToken) return;
  await submitRun(pending.name, pending);
}

function openModal() {
  state.modal?.classList.add("open");
  state.modal?.setAttribute("aria-hidden", "false");
  loadGlobal();
  renderLocal();
}

function closeModal() {
  state.modal?.classList.remove("open");
  state.modal?.setAttribute("aria-hidden", "true");
}

function installUi() {
  const style = document.createElement("style");
  style.textContent = `
    #cr-ranking-btn{position:fixed;right:12px;bottom:12px;z-index:9997;border:2px solid #2a1a0e;border-radius:10px;background:linear-gradient(180deg,#7a0000,#3a0000);color:#f3e9d6;padding:10px 14px;font:700 12px 'Rye',serif;letter-spacing:.06em;box-shadow:0 5px 0 #0e0908,0 8px 20px rgba(0,0,0,.45);cursor:pointer}
    #cr-ranking-modal{position:fixed;inset:0;z-index:9999;background:rgba(5,3,3,.9);display:none;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(5px)}
    #cr-ranking-modal.open{display:flex}
    .cr-rank-card{width:min(520px,100%);max-height:min(760px,92vh);overflow:auto;background:#150e0c;border:2px solid #5c3a20;border-radius:16px;color:#f3e9d6;box-shadow:0 24px 80px rgba(0,0,0,.65);padding:20px;font-family:'Special Elite',monospace}
    .cr-rank-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.cr-rank-head h2{font:400 25px 'Rye',serif;color:#d8a53a;margin:0}.cr-rank-close{border:0;background:transparent;color:#f3e9d6;font-size:28px;line-height:1;cursor:pointer}
    .cr-rank-sub{color:#b8ad9c;font-size:12px;line-height:1.45;margin:8px 0 16px}.cr-name-wrap{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0 8px}.cr-name-wrap input{min-width:0;border:1px solid #5c3a20;background:#0e0908;color:#f3e9d6;border-radius:8px;padding:11px 12px;font:14px 'Special Elite',monospace}.cr-name-wrap button{border:1px solid #7a0000;border-radius:8px;background:#7a0000;color:white;padding:0 14px;font:700 11px 'Rye',serif;cursor:pointer}.cr-name-wrap button:disabled{opacity:.55}
    .cr-rank-status{min-height:18px;font-size:11px;color:#b8ad9c;margin-bottom:12px}.cr-rank-status[data-kind='error']{color:#ff9292}.cr-rank-status[data-kind='success']{color:#a5d8ae}.cr-rank-card h3{font:400 15px 'Rye',serif;color:#d8a53a;margin:18px 0 8px}.cr-rank-row{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:8px;padding:9px 8px;border-bottom:1px solid rgba(92,58,32,.5);font-size:12px}.cr-rank-row.mine{background:rgba(216,165,58,.1)}.cr-rank-pos{color:#d8a53a}.cr-rank-time{font-family:ui-monospace,monospace}.cr-rank-empty{padding:12px;color:#8f8578;font-size:11px}.cr-local-row{display:flex;justify-content:space-between;padding:7px 8px;border-bottom:1px solid rgba(92,58,32,.35);font-size:11px}.cr-local-row strong{font-family:ui-monospace,monospace}
  `;
  document.head.appendChild(style);

  const button = document.createElement("button");
  button.id = "cr-ranking-btn";
  button.type = "button";
  button.textContent = "RANKING";
  button.addEventListener("click", openModal);
  document.body.appendChild(button);

  const modal = document.createElement("div");
  modal.id = "cr-ranking-modal";
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML = `
    <div class="cr-rank-card" role="dialog" aria-modal="true" aria-label="Ranking CircoRay">
      <div class="cr-rank-head"><div><h2>Ranking do Parque</h2><p class="cr-rank-sub">O menor tempo para conquistar todos os tickets fica no topo. Seu melhor resultado também fica salvo neste aparelho.</p></div><button class="cr-rank-close" type="button" aria-label="Fechar">×</button></div>
      <div class="cr-name-wrap"><input id="cr-rank-name" maxlength="24" placeholder="Seu nome no ranking"><button id="cr-rank-submit" type="button">SALVAR TEMPO</button></div>
      <div id="cr-rank-status" class="cr-rank-status"></div>
      <h3>Top global</h3><div id="cr-rank-list"></div>
      <h3>Seus melhores tempos</h3><div id="cr-local-list"></div>
    </div>`;
  document.body.appendChild(modal);

  state.modal = modal;
  state.list = modal.querySelector("#cr-rank-list");
  state.localList = modal.querySelector("#cr-local-list");
  state.nameInput = modal.querySelector("#cr-rank-name");
  state.status = modal.querySelector("#cr-rank-status");
  state.submitBtn = modal.querySelector("#cr-rank-submit");
  state.nameInput.value = safeGet(NAME_KEY);

  modal.querySelector(".cr-rank-close").addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });
  state.submitBtn.addEventListener("click", () => submitRun(state.nameInput.value));
  state.nameInput.addEventListener("keydown", (event) => { if (event.key === "Enter") submitRun(state.nameInput.value); });

  renderLocal();
  loadGlobal();
}

function observeGame() {
  const check = () => {
    if (!state.running && !state.completed && isGameStarted()) requestRankingSession();
    if (state.running && state.sessionToken && !state.completed && allTicketsFilled()) finishRun();
  };
  const observer = new MutationObserver(check);
  observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["class"] });
  check();
}

export function initRanking() {
  if (window.__circorayRankingLoaded) return;
  window.__circorayRankingLoaded = true;
  installUi();
  observeGame();
  retryPending().catch(() => {});
}
