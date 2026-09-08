async function request(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    cache: "no-store",
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  let payload = {};
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const error = new Error(payload.error || `Erro HTTP ${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

export const adminApi = {
  login(password) {
    return request("/api/admin/login", { method: "POST", body: JSON.stringify({ password }) });
  },
  logout() {
    return request("/api/admin/logout", { method: "POST" });
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
