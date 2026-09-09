import { adminApi } from "./api.js?v=20260908-1";
import { bindDirtyEvents, fillSimpleFields, readSimpleFields, renderRouletteEditors, readRouletteEditors } from "./form.js?v=20260909-1";

const DRAFT_KEY = "circoray:admin:draft:v1";
const loginView = document.getElementById("loginView");
const appView = document.getElementById("appView");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const publishBtn = document.getElementById("publishBtn");
const draftBtn = document.getElementById("draftBtn");
const storageBadge = document.getElementById("storageBadge");
const statusBar = document.getElementById("statusBar");
const jsonEditor = document.getElementById("jsonEditor");

let currentConfig = null;
let publishedRevision = 0;
let storageReady = false;
let dirty = false;
let hydrating = false;

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function injectHardcoreAdmin() {
  const nav = document.getElementById("sectionNav");
  if (!nav || nav.querySelector('[data-section="hardcore"]')) return;
  const button = document.createElement("button");
  button.className = "nav-item";
  button.dataset.section = "hardcore";
  button.textContent = "Hardcore e memória";
  const audioButton = nav.querySelector('[data-section="audio"]');
  nav.insertBefore(button, audioButton || null);

  const content = document.querySelector(".content");
  const audioPanel = content?.querySelector('[data-panel="audio"]');
  const section = document.createElement("section");
  section.className = "panel-section";
  section.dataset.panel = "hardcore";
  section.innerHTML = `
    <div class="section-heading"><div><h3>Hardcore e memória do palhaço</h3><p>Quando a raiva ultrapassa o limite, depois dos 3 jogos normais entram dois jogos extras exclusivos.</p></div></div>
    <div class="card grid three">
      <label class="toggle-field"><input id="hardcoreEnabled" type="checkbox"><span class="toggle"></span><span>Ativar rota hardcore</span></label>
      <label class="field"><span>Raiva para ativar hardcore</span><input data-number-bind="hardcore.angerThreshold" type="number" min="1" max="100" step="1"></label>
      <label class="field"><span>Raiva para modo fúria</span><input data-number-bind="hardcore.furyThreshold" type="number" min="1" max="100" step="1"></label>
      <label class="field"><span>Raiva perdida ao voltar</span><input data-number-bind="hardcore.angerDecayPerVisit" type="number" min="0" max="100" step="1"></label>
      <label class="field"><span>Rancor perdido por dia</span><input data-number-bind="hardcore.grudgeDecayPerDay" type="number" min="0" max="100" step="1"></label>
      <label class="field"><span>Quanto do rancor vira raiva ao voltar (0–1)</span><input data-number-bind="hardcore.initialAngerFromGrudgeMultiplier" type="number" min="0" max="1" step="0.05"></label>
    </div>
    <div class="section-heading"><div><h3>Jogo 4 — Corra do Palhaço</h3><p>O jogador arrasta o ponto pelo picadeiro enquanto o palhaço persegue.</p></div></div>
    <div class="card grid three">
      <label class="field"><span>Título</span><input data-bind="hardcore.chaseTitle" type="text"></label>
      <label class="field"><span>Duração hardcore (s)</span><input data-number-bind="hardcore.chaseDurationSeconds" type="number" min="3" step="1"></label>
      <label class="field"><span>Duração fúria (s)</span><input data-number-bind="hardcore.chaseFuryDurationSeconds" type="number" min="3" step="1"></label>
      <label class="field"><span>Velocidade palhaço</span><input data-number-bind="hardcore.chaseClownSpeed" type="number" min="0.2" max="5" step="0.1"></label>
      <label class="field"><span>Velocidade palhaço na fúria</span><input data-number-bind="hardcore.chaseFurySpeed" type="number" min="0.2" max="5" step="0.1"></label>
    </div>
    <div class="section-heading"><div><h3>Jogo 5 — Não Deixe Ele Entrar</h3><p>Porta, janela, alçapão e ventilação dão sinais. O jogador precisa bloquear a entrada correta.</p></div></div>
    <div class="card grid three">
      <label class="field"><span>Título</span><input data-bind="hardcore.defendTitle" type="text"></label>
      <label class="field"><span>Ondas hardcore</span><input data-number-bind="hardcore.defendWaves" type="number" min="1" max="50" step="1"></label>
      <label class="field"><span>Ondas fúria</span><input data-number-bind="hardcore.defendFuryWaves" type="number" min="1" max="50" step="1"></label>
      <label class="field"><span>Tempo de reação hardcore (ms)</span><input data-number-bind="hardcore.defendReactionMs" type="number" min="300" step="50"></label>
      <label class="field"><span>Tempo de reação fúria (ms)</span><input data-number-bind="hardcore.defendFuryReactionMs" type="number" min="300" step="50"></label>
    </div>
    <div class="section-heading"><div><h3>Falas da entrada hardcore</h3></div></div>
    <div class="card grid two">
      <label class="field"><span>Primeira frase</span><input data-bind="hardcore.introLine" type="text"></label>
      <label class="field"><span>Segunda frase</span><textarea data-bind="hardcore.hardcoreLine" rows="3"></textarea></label>
    </div>`;
  if (content) content.insertBefore(section, audioPanel || null);
}

injectHardcoreAdmin();
const hardcoreEnabled = document.getElementById("hardcoreEnabled");

function setStatus(message, type = "success", persistent = false) {
  statusBar.hidden = false;
  statusBar.className = `status-bar ${type}`;
  statusBar.textContent = message;
  clearTimeout(setStatus.timer);
  if (!persistent) setStatus.timer = setTimeout(() => { statusBar.hidden = true; }, 7000);
}

function setStorageState(ready, detail = "") {
  storageReady = ready;
  storageBadge.className = `badge ${ready ? "ready" : "error"}`;
  storageBadge.textContent = ready ? "KV conectado" : "KV indisponível";
  storageBadge.title = detail || "";
  publishBtn.disabled = !ready;
}

function collectConfig() {
  let next = readSimpleFields(currentConfig || {});
  next = readRouletteEditors(next);
  next.hardcore = next.hardcore || {};
  if (hardcoreEnabled) next.hardcore.enabled = hardcoreEnabled.checked;
  return next;
}

function syncJsonFromForm() {
  if (!currentConfig) return;
  const next = collectConfig();
  jsonEditor.value = JSON.stringify(next, null, 2);
}

function markDirty() {
  if (hydrating) return;
  dirty = true;
  publishBtn.textContent = "Publicar alterações •";
}

function updateMeta(config) {
  document.getElementById("revisionValue").textContent = String(config.revision ?? 0);
  document.getElementById("updatedAtValue").textContent = config.updatedAt
    ? `Atualizado em ${new Date(config.updatedAt).toLocaleString("pt-BR")}`
    : "Ainda usando configuração padrão";
}

function hydrate(config) {
  hydrating = true;
  currentConfig = clone(config);
  fillSimpleFields(currentConfig);
  renderRouletteEditors(currentConfig, markDirty);
  const angryPreview = document.getElementById("angryClownPreview");
  if (angryPreview && currentConfig.clown?.angryAsset) angryPreview.src = currentConfig.clown.angryAsset;
  if (hardcoreEnabled) hardcoreEnabled.checked = currentConfig.hardcore?.enabled !== false;
  jsonEditor.value = JSON.stringify(currentConfig, null, 2);
  updateMeta(currentConfig);
  hydrating = false;
  dirty = false;
  publishBtn.textContent = "Publicar alterações";
}

function showLogin(message = "") {
  appView.hidden = true;
  loginView.hidden = false;
  loginError.textContent = message;
  document.getElementById("password").focus();
}

function showApp() {
  loginView.hidden = true;
  appView.hidden = false;
}

function applyPayload(payload, { offerDraft = true } = {}) {
  if (!payload?.config) throw new Error("Servidor autenticou, mas não forneceu a configuração do painel.");
  publishedRevision = Number(payload.config?.revision || 0);
  setStorageState(Boolean(payload.storageReady), payload.storageError || "");
  let config = payload.config;

  if (offerDraft) {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const draft = JSON.parse(raw);
        if (draft && confirm("Existe um rascunho salvo neste navegador. Deseja continuar dele?")) {
          config = draft;
          setStatus("Rascunho local restaurado.");
        }
      } catch { localStorage.removeItem(DRAFT_KEY); }
    }
  }

  hydrate(config);
  showApp();

  if (!payload.storageReady) {
    setStatus(`Painel aberto. O KV ainda não está disponível para publicar${payload.storageError ? `: ${payload.storageError}` : "."}`, "error", true);
  }
}

async function loadAdminConfig({ offerDraft = true } = {}) {
  const payload = await adminApi.getConfig();
  applyPayload(payload, { offerDraft });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";
  const button = loginForm.querySelector("button[type=submit]");
  button.disabled = true;
  button.textContent = "Entrando…";

  try {
    const payload = await adminApi.login(document.getElementById("password").value);
    document.getElementById("password").value = "";
    applyPayload(payload);

    adminApi.diagnostic().then((diag) => {
      if (!diag.authenticated) setStatus("Sessão criada, mas o diagnóstico do servidor não confirmou autenticação.", "error", true);
    }).catch((error) => {
      setStatus(`Painel aberto, mas o diagnóstico retornou ${error.status || "erro"}: ${error.message}`, "error", true);
    });
  } catch (error) {
    const extra = error?.payload?.build ? ` [${error.payload.build}]` : "";
    loginError.textContent = `${error.message}${extra}`;
  } finally {
    button.disabled = false;
    button.textContent = "Entrar";
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  try { await adminApi.logout(); } finally { showLogin(); }
});

draftBtn.addEventListener("click", () => {
  const config = collectConfig();
  localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
  setStatus("Rascunho salvo somente neste navegador.");
});

publishBtn.addEventListener("click", async () => {
  if (!storageReady) return setStatus("CONFIG_KV ainda não está disponível no runtime do Cloudflare.", "error", true);
  let config;
  try { config = collectConfig(); } catch (error) { return setStatus(error.message, "error"); }
  publishBtn.disabled = true;
  publishBtn.textContent = "Publicando…";
  try {
    const payload = await adminApi.publish(config, publishedRevision);
    publishedRevision = Number(payload.config.revision || 0);
    hydrate(payload.config);
    localStorage.removeItem(DRAFT_KEY);
    setStatus("Configuração publicada. A página pública já lerá esta revisão.");
  } catch (error) {
    if (error.status === 401) setStatus("A sessão expirou. Saia e entre novamente.", "error", true);
    else if (error.status === 409) setStatus("Outra sessão publicou alterações antes desta. Recarregue a configuração publicada.", "error", true);
    else setStatus(`${error.message}${error.status ? ` (HTTP ${error.status})` : ""}`, "error", true);
  } finally {
    publishBtn.disabled = !storageReady;
    if (dirty) publishBtn.textContent = "Publicar alterações •";
  }
});

document.getElementById("applyJsonBtn").addEventListener("click", () => {
  try {
    const parsed = JSON.parse(jsonEditor.value);
    hydrate(parsed);
    markDirty();
    setStatus("JSON aplicado ao formulário. Ainda não foi publicado.");
  } catch (error) {
    setStatus(`JSON inválido: ${error.message}`, "error");
  }
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const config = collectConfig();
  const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `circoray-config-r${publishedRevision}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.getElementById("importInput").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    hydrate(parsed);
    markDirty();
    setStatus("Arquivo importado. Revise e publique quando estiver pronto.");
  } catch (error) {
    setStatus(`Não foi possível importar: ${error.message}`, "error");
  } finally { event.target.value = ""; }
});

document.getElementById("sectionNav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-section]");
  if (!button) return;
  const section = button.dataset.section;
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item === button));
  document.querySelectorAll(".panel-section").forEach((panel) => panel.classList.toggle("active", panel.dataset.panel === section));
  document.getElementById("sectionTitle").textContent = button.textContent;
  if (section === "avancado") syncJsonFromForm();
});

bindDirtyEvents(markDirty);
hardcoreEnabled?.addEventListener("change", markDirty);
window.addEventListener("beforeunload", (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = "";
});

(async function init() {
  if (!adminApi.hasToken()) {
    showLogin();
    return;
  }

  try {
    await loadAdminConfig();
  } catch (error) {
    adminApi.clearToken();
    showLogin(`Sessão anterior inválida: ${error.message}`);
  }
})();
