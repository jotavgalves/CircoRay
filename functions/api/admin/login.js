import { createSessionCookie, isPasswordValid, json } from "../../_shared/auth.js";

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 8;

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
      error: "Admin ainda não configurado no Cloudflare. Defina ADMIN_PASSWORD e SESSION_SECRET."
    }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }

  const hasKv = Boolean(env.CONFIG_KV);
  let key = null;
  let attempts = 0;

  if (hasKv) {
    key = await rateKey(request, env.SESSION_SECRET);
    attempts = Number((await env.CONFIG_KV.get(key)) || 0);

    if (attempts >= MAX_FAILURES && !isPasswordValid(body?.password, env.ADMIN_PASSWORD)) {
      return json(
        { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
        429,
        { "Retry-After": String(WINDOW_SECONDS) }
      );
    }
  }

  if (!isPasswordValid(body?.password, env.ADMIN_PASSWORD)) {
    if (hasKv && key) {
      await env.CONFIG_KV.put(key, String(attempts + 1), { expirationTtl: WINDOW_SECONDS });
    }
    return json({
      error: "Senha inválida.",
      attemptsRemaining: hasKv ? Math.max(0, MAX_FAILURES - attempts - 1) : null
    }, 401);
  }

  if (hasKv && key) await env.CONFIG_KV.delete(key);

  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return json({ ok: true, storageReady: hasKv }, 200, { "Set-Cookie": cookie });
}
