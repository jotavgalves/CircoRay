import { adminApi } from "./api.js?v=20260908-1";
import { bindDirtyEvents, fillSimpleFields, readSimpleFields, renderRouletteEditors, readRouletteEditors } from "./form.js?v=20260908-1";

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
