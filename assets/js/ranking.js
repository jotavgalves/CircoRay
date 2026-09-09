const NAME_KEY = "circoray:ranking:name:v1";
const CLIENT_KEY = "circoray:ranking:client:v1";
const LOCAL_KEY = "circoray:ranking:local:v2";
const CACHE_KEY = "circoray:ranking:global-cache:v2";
const PENDING_KEY = "circoray:ranking:pending:v2";

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
  submitBtn: null,
  button: null,
  mode: "normal",
  global: { normal: [], hardcore: [] }
};

function safeGet(key, fallback = "") { try { const v = localStorage.getItem(key); return v == null ? fallback : v; } catch { return fallback; } }
function safeSet(key, value) { try { localStorage.setItem(key, value); } catch {} }
function readJson(key, fallback) { try { return JSON.parse(safeGet(key, "")) || fallback; } catch { return fallback; } }
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
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" })[c]);
}
function detectRunMode() {
  return window.__circorayHardcoreArmed || window.__circorayHardcoreActive || document.querySelector("#cr-hardcore.open") ? "hardcore" : "normal";
}
function isFinalScreenActive() {
  return Boolean(document.querySelector("#screen-final.active,#screen-coupon.active,#screen-win.active,#screen-lose.active,#screen-closed.active,.screen.active[id*='final'],.screen.active[id*='coupon'],.screen.active[id*='win'],.screen.active[id*='lose'],.screen.active[id*='closed']"));
}
function localRuns(mode = state.mode) {
  const runs = readJson(LOCAL_KEY, []);
  return Array.isArray(runs) ? runs.filter((r) => (r.mode || "normal") === mode).sort((a,b) => Number(a.timeMs)-Number(b.timeMs)).slice(0,10) : [];
}
function saveLocalRun(run) {
  const runs = readJson(LOCAL_KEY, []);
  const next = [...(Array.isArray(runs) ? runs : []), run]
    .filter((item) => item && Number.isFinite(Number(item.timeMs)))
    .sort((a,b) => Number(a.timeMs)-Number(b.timeMs))
    .slice(0,30);
  safeSet(LOCAL_KEY, JSON.stringify(next));
  renderLocal();
}
function renderRanking() {
  if (!state.list) return;
  const rows = state.global[state.mode] || [];
  if (!rows.length) { state.list.innerHTML = '<div class="cr-rank-empty">Ninguém entrou neste ranking ainda.</div>'; return; }
  state.list.innerHTML = rows.slice(0,10).map((item,index) => `
    <div class="cr-rank-row ${item.clientId===clientId()?"mine":""}">
      <strong class="cr-rank-pos">${index+1}</strong>
      <span class="cr-rank-name">${escapeHtml(item.name||"Jogador")}</span>
      <b class="cr-rank-time">${formatTime(item.timeMs)}</b>
    </div>`).join("");
}
function renderLocal() {
  if (!state.localList) return;
  const runs = localRuns();
  if (!runs.length) { state.localList.innerHTML = '<div class="cr-rank-empty">Você ainda não concluiu este modo.</div>'; return; }
  state.localList.innerHTML = runs.slice(0,5).map((item,index) => `<div class="cr-local-row"><span>${index+1}º</span><strong>${formatTime(item.timeMs)}</strong></div>`).join("");
}
function setStatus(message, kind="") { if (!state.status) return; state.status.textContent=message||""; state.status.dataset.kind=kind; }
function setMode(mode) {
  state.mode = mode === "hardcore" ? "hardcore" : "normal";
  state.modal?.querySelectorAll("[data-rank-mode]").forEach((b) => b.classList.toggle("active", b.dataset.rankMode===state.mode));
  state.modal?.querySelector("#cr-rank-mode-title")?.replaceChildren(document.createTextNode(state.mode === "hardcore" ? "Top Hardcore" : "Top Normal"));
  renderRanking(); renderLocal();
}
async function loadGlobal() {
  const cached = readJson(CACHE_KEY, null);
  if (cached?.normal || cached?.hardcore) {
    state.global.normal = Array.isArray(cached.normal) ? cached.normal : [];
    state.global.hardcore = Array.isArray(cached.hardcore) ? cached.hardcore : [];
    renderRanking();
  }
  try {
    const response = await fetch("/api/ranking", { cache:"no-store" });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    state.global.normal = Array.isArray(payload.normalRanking) ? payload.normalRanking : Array.isArray(payload.ranking) ? payload.ranking : [];
    state.global.hardcore = Array.isArray(payload.hardcoreRanking) ? payload.hardcoreRanking : [];
    safeSet(CACHE_KEY, JSON.stringify(state.global));
    renderRanking();
  } catch (error) { setStatus(`Ranking global indisponível: ${error.message}`, "error"); }
}
async function requestRankingSession() {
  if (state.running || state.completed) return;
  state.running = true;
  try {
    const response = await fetch("/api/ranking/session", { cache:"no-store" });
    const payload = await response.json();
    if (!response.ok || !payload.token) throw new Error(payload.error || "Não foi possível iniciar o ranking.");
    state.sessionToken = payload.token;
    state.startedAt = Number(payload.startedAt) || Date.now();
  } catch (error) { state.running=false; console.warn("Ranking não iniciou:", error); }
}
function isGameStarted() { return Boolean(document.querySelector("#screen-game1.active,.screen.active[id*='game1']")); }
function allTicketsFilled() {
  const tickets = [...document.querySelectorAll(".ticket-pip")];
  return tickets.length > 0 && tickets.every((t) => t.classList.contains("filled"));
}
async function finishRun() {
  if (state.completed || !state.sessionToken || !state.startedAt) return;
  state.completed = true;
  const completedAt = Date.now();
  const mode = detectRunMode();
  const run = { timeMs:Math.max(0,completedAt-state.startedAt), completedAt, sessionToken:state.sessionToken, clientId:clientId(), mode };
  state.finalRun = run;
  state.mode = mode;
  saveLocalRun({ timeMs:run.timeMs, completedAt, mode });
  const name = safeGet(NAME_KEY).trim();
  if (name.length >= 2) await submitRun(name, run, { openAfter:false });
  syncButtonVisibility();
}
async function submitRun(name, run=state.finalRun, {openAfter=false}={}) {
  const cleanName = String(name||"").replace(/\s+/g," ").trim().slice(0,24);
  if (cleanName.length < 2) { setStatus("Digite pelo menos 2 caracteres.","error"); return false; }
  if (!run?.sessionToken) { setStatus("Esta tentativa não possui uma sessão válida de ranking.","error"); return false; }
  safeSet(NAME_KEY,cleanName); if(state.nameInput) state.nameInput.value=cleanName; if(state.submitBtn) state.submitBtn.disabled=true;
  setStatus(`Salvando no ranking ${run.mode === "hardcore" ? "Hardcore" : "Normal"}…`);
  const body = { name:cleanName, clientId:run.clientId||clientId(), timeMs:run.timeMs, completedAt:run.completedAt, sessionToken:run.sessionToken, mode:run.mode||"normal" };
  try {
    const response = await fetch("/api/ranking", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    safeSet(PENDING_KEY,"");
    state.global[payload.mode||body.mode] = Array.isArray(payload.ranking) ? payload.ranking : [];
    safeSet(CACHE_KEY,JSON.stringify(state.global));
    state.mode = payload.mode || body.mode;
    renderRanking();
    setStatus(payload.position ? `Tempo salvo. ${payload.position}º no ranking ${state.mode === "hardcore" ? "Hardcore" : "Normal"}.` : "Tempo salvo.","success");
    if(openAfter && isFinalScreenActive()) openModal();
    return true;
  } catch(error) {
    safeSet(PENDING_KEY,JSON.stringify(body));
    setStatus(`Tempo salvo neste aparelho. Sincronização pendente: ${error.message}`,"error");
    if(openAfter && isFinalScreenActive()) openModal();
    return false;
  } finally { if(state.submitBtn) state.submitBtn.disabled=false; }
}
async function retryPending() { const p=readJson(PENDING_KEY,null); if(p?.sessionToken) await submitRun(p.name,p); }
function openModal() {
  if (!isFinalScreenActive()) return;
  state.modal?.classList.add("open"); state.modal?.setAttribute("aria-hidden","false");
  if (state.finalRun?.mode) setMode(state.finalRun.mode);
  loadGlobal(); renderLocal();
  if (state.finalRun && !safeGet(NAME_KEY).trim()) setStatus(`Você terminou em ${formatTime(state.finalRun.timeMs)}. Digite seu nome para entrar no ranking.`,"success");
}
function closeModal() { state.modal?.classList.remove("open"); state.modal?.setAttribute("aria-hidden","true"); }
function syncButtonVisibility() {
  if (!state.button) return;
  const visible = isFinalScreenActive();
  state.button.classList.toggle("visible", visible);
  state.button.setAttribute("aria-hidden", visible ? "false" : "true");
  if (!visible) closeModal();
}
function installUi() {
  const style=document.createElement("style");
  style.textContent=`
    #cr-ranking-btn{display:none;position:fixed;right:12px;bottom:12px;z-index:9997;border:1px solid #5c3a20;border-radius:9px;background:linear-gradient(180deg,#6d1010,#350000);color:#f3e9d6;padding:9px 12px;font:700 10px 'Rye',serif;letter-spacing:.05em;box-shadow:0 4px 0 #0e0908,0 7px 16px rgba(0,0,0,.42);cursor:pointer}#cr-ranking-btn.visible{display:block}
    #cr-ranking-modal{position:fixed;inset:0;z-index:9999;background:rgba(5,3,3,.9);display:none;align-items:center;justify-content:center;padding:18px;backdrop-filter:blur(5px)}#cr-ranking-modal.open{display:flex}
    .cr-rank-card{width:min(520px,100%);max-height:min(760px,92vh);overflow:auto;background:#150e0c;border:2px solid #5c3a20;border-radius:16px;color:#f3e9d6;box-shadow:0 24px 80px rgba(0,0,0,.65);padding:20px;font-family:'Special Elite',monospace}
    .cr-rank-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.cr-rank-head h2{font:400 25px 'Rye',serif;color:#d8a53a;margin:0}.cr-rank-close{border:0;background:transparent;color:#f3e9d6;font-size:28px;line-height:1;cursor:pointer}.cr-rank-sub{color:#b8ad9c;font-size:12px;line-height:1.45;margin:8px 0 14px}
    .cr-rank-tabs{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:8px 0 14px}.cr-rank-tabs button{border:1px solid #5c3a20;background:#0e0908;color:#b8ad9c;border-radius:8px;padding:9px;font:700 10px 'Rye',serif;cursor:pointer}.cr-rank-tabs button.active{background:#650000;color:#fff;border-color:#9d1a1a;box-shadow:0 0 12px rgba(150,0,0,.25)}
    .cr-name-wrap{display:grid;grid-template-columns:1fr auto;gap:8px;margin:12px 0 8px}.cr-name-wrap input{min-width:0;border:1px solid #5c3a20;background:#0e0908;color:#f3e9d6;border-radius:8px;padding:11px 12px;font:14px 'Special Elite',monospace}.cr-name-wrap button{border:1px solid #7a0000;border-radius:8px;background:#7a0000;color:white;padding:0 14px;font:700 11px 'Rye',serif;cursor:pointer}.cr-name-wrap button:disabled{opacity:.55}
    .cr-rank-status{min-height:18px;font-size:11px;color:#b8ad9c;margin-bottom:12px}.cr-rank-status[data-kind='error']{color:#ff9292}.cr-rank-status[data-kind='success']{color:#a5d8ae}.cr-rank-card h3{font:400 15px 'Rye',serif;color:#d8a53a;margin:18px 0 8px}.cr-rank-row{display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:8px;padding:9px 8px;border-bottom:1px solid rgba(92,58,32,.5);font-size:12px}.cr-rank-row.mine{background:rgba(216,165,58,.1)}.cr-rank-pos{color:#d8a53a}.cr-rank-time{font-family:ui-monospace,monospace}.cr-rank-empty{padding:12px;color:#8f8578;font-size:11px}.cr-local-row{display:flex;justify-content:space-between;padding:7px 8px;border-bottom:1px solid rgba(92,58,32,.35);font-size:11px}.cr-local-row strong{font-family:ui-monospace,monospace}
  `; document.head.appendChild(style);
  const button=document.createElement("button"); button.id="cr-ranking-btn"; button.type="button"; button.textContent="VER RANKING"; button.setAttribute("aria-hidden","true"); button.addEventListener("click",openModal); document.body.appendChild(button); state.button=button;
  const modal=document.createElement("div"); modal.id="cr-ranking-modal"; modal.setAttribute("aria-hidden","true"); modal.innerHTML=`<div class="cr-rank-card" role="dialog" aria-modal="true" aria-label="Ranking CircoRay"><div class="cr-rank-head"><div><h2>Ranking do Parque</h2><p class="cr-rank-sub">Normal e Hardcore são comparados separadamente.</p></div><button class="cr-rank-close" type="button" aria-label="Fechar">×</button></div><div class="cr-rank-tabs"><button type="button" data-rank-mode="normal" class="active">NORMAL</button><button type="button" data-rank-mode="hardcore">HARDCORE</button></div><div class="cr-name-wrap"><input id="cr-rank-name" maxlength="24" placeholder="Seu nome no ranking"><button id="cr-rank-submit" type="button">SALVAR TEMPO</button></div><div id="cr-rank-status" class="cr-rank-status"></div><h3 id="cr-rank-mode-title">Top Normal</h3><div id="cr-rank-list"></div><h3>Seus melhores tempos</h3><div id="cr-local-list"></div></div>`; document.body.appendChild(modal);
  state.modal=modal; state.list=modal.querySelector("#cr-rank-list"); state.localList=modal.querySelector("#cr-local-list"); state.nameInput=modal.querySelector("#cr-rank-name"); state.status=modal.querySelector("#cr-rank-status"); state.submitBtn=modal.querySelector("#cr-rank-submit"); state.nameInput.value=safeGet(NAME_KEY);
  modal.querySelector(".cr-rank-close").addEventListener("click",closeModal); modal.addEventListener("click",(e)=>{if(e.target===modal)closeModal()}); modal.querySelectorAll("[data-rank-mode]").forEach((b)=>b.addEventListener("click",()=>setMode(b.dataset.rankMode))); state.submitBtn.addEventListener("click",()=>submitRun(state.nameInput.value)); state.nameInput.addEventListener("keydown",(e)=>{if(e.key==="Enter")submitRun(state.nameInput.value)});
  renderLocal(); loadGlobal(); syncButtonVisibility();
}
function observeGame() {
  const check=()=>{ if(!state.running&&!state.completed&&isGameStarted())requestRankingSession(); if(state.running&&state.sessionToken&&!state.completed&&allTicketsFilled())finishRun(); syncButtonVisibility(); };
  const observer=new MutationObserver(check); observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]}); check();
}
export function initRanking() {
  if(window.__circorayRankingLoaded)return; window.__circorayRankingLoaded=true; installUi(); observeGame(); retryPending().catch(()=>{});
}
