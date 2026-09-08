const TOKEN_KEY = "circoray:admin:token";
const BUILD = "admin-fix-20260908-1";

function getToken() {
  try { return sessionStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
}

function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {}
}

async function request(url, options = {}) {
  const token = getToken();
  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "X-Admin-Build": BUILD,
      ...(options.headers || {})
    }
  });

  let payload = {};
  try { payload = await response.json(); } catch {}

  if (!response.ok) {
    if (response.status === 401) setToken("");
    const error = new Error(payload.error || `Erro HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    error.url = url;
    throw error;
  }
  return payload;
}

export const adminApi = {
  build: BUILD,
  hasToken() {
    return Boolean(getToken());
  },
  clearToken() {
    setToken("");
  },
  async login(password) {
    const response = await fetch("/api/admin/login", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", "X-Admin-Build": BUILD },
      body: JSON.stringify({ password })
    });
    let payload = {};
    try { payload = await response.json(); } catch {}
    if (!response.ok) {
      const error = new Error(payload.error || `Erro HTTP ${response.status}`);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    if (!payload.token) throw new Error("Senha aceita, mas o servidor não retornou token de sessão.");
    setToken(payload.token);
    return payload;
  },
  async logout() {
    try { return await request("/api/admin/logout", { method: "POST" }); }
    catch { return { ok: true }; }
    finally { setToken(""); }
  },
  getConfig() {
    return request("/api/admin/config");
  },
  diagnostic() {
    return request("/api/admin/diagnostic");
  },
  publish(config, expectedRevision) {
    return request("/api/admin/config", {
      method: "PUT",
      headers: { "X-Admin-Request": "1" },
      body: JSON.stringify({ config, expectedRevision })
    });
  }
};
