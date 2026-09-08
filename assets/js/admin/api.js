const TOKEN_KEY = "circoray:admin:token";

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
    credentials: "same-origin",
    cache: "no-store",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    throw error;
  }
  return payload;
}

export const adminApi = {
  async login(password) {
    const payload = await request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
    if (!payload.token) throw new Error("Login validado, mas o servidor não retornou a sessão administrativa.");
    setToken(payload.token);
    return payload;
  },
  async logout() {
    try { return await request("/api/admin/logout", { method: "POST" }); }
    finally { setToken(""); }
  },
  getConfig() {
    return request("/api/admin/config");
  },
  publish(config, expectedRevision) {
    return request("/api/admin/config", {
      method: "PUT",
      headers: { "X-Admin-Request": "1" },
      body: JSON.stringify({ config, expectedRevision })
    });
  }
};
