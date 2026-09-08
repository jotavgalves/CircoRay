import { createSessionToken, isPasswordValid, json } from "../../_shared/auth.js";
import { cloneDefaultConfig } from "../../_shared/default-config.js";

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 8;
const CONFIG_KEY = "published-config";
const BUILD = "admin-fix-20260908-1";

async function digest(value) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function rateKey(request, secret) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  return `admin-login:${await digest(`${secret}:${ip}`)}`;
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({
      error: "Admin ainda não configurado no Cloudflare. Defina ADMIN_PASSWORD e SESSION_SECRET.",
      build: BUILD
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Requisição inválida.", build: BUILD }, 400);
  }

  const passwordOk = isPasswordValid(body?.password, env.ADMIN_PASSWORD);
  const hasKv = Boolean(env.CONFIG_KV);
  let key = null;
  let attempts = 0;

  if (hasKv) {
    try {
      key = await rateKey(request, env.SESSION_SECRET);
      attempts = Number((await env.CONFIG_KV.get(key)) || 0);
    } catch {
      key = null;
      attempts = 0;
    }
  }

  if (!passwordOk) {
    if (key && attempts >= MAX_FAILURES) {
      return json(
        { error: "Muitas tentativas de login. Tente novamente em alguns minutos.", build: BUILD },
        429,
        { "Retry-After": String(WINDOW_SECONDS) }
      );
    }

    if (key) {
      try {
        await env.CONFIG_KV.put(key, String(attempts + 1), { expirationTtl: WINDOW_SECONDS });
      } catch {}
    }

    return json({
      error: "Senha inválida.",
      attemptsRemaining: key ? Math.max(0, MAX_FAILURES - attempts - 1) : null,
      build: BUILD
    }, 401);
  }

  if (key) {
    try { await env.CONFIG_KV.delete(key); } catch {}
  }

  const token = await createSessionToken(env.SESSION_SECRET);
  let config = cloneDefaultConfig();
  let storageReady = false;
  let storageError = null;

  if (hasKv) {
    try {
      const stored = await env.CONFIG_KV.get(CONFIG_KEY, "json");
      if (stored && typeof stored === "object") config = stored;
      storageReady = true;
    } catch (error) {
      storageError = error?.message || "Falha ao acessar CONFIG_KV.";
    }
  }

  return json({
    ok: true,
    token,
    config,
    storageReady,
    storageError,
    build: BUILD
  });
}
