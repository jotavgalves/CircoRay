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
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.CONFIG_KV) {
    return json({
      error: "Admin ainda não configurado no Cloudflare. Defina ADMIN_PASSWORD, SESSION_SECRET e o binding CONFIG_KV."
    }, 503);
  }

  const key = await rateKey(request, env.SESSION_SECRET);
  const attempts = Number((await env.CONFIG_KV.get(key)) || 0);
  if (attempts >= MAX_FAILURES) {
    return json(
      { error: "Muitas tentativas de login. Tente novamente em alguns minutos." },
      429,
      { "Retry-After": String(WINDOW_SECONDS) }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }

  if (!isPasswordValid(body?.password, env.ADMIN_PASSWORD)) {
    await env.CONFIG_KV.put(key, String(attempts + 1), { expirationTtl: WINDOW_SECONDS });
    return json({
      error: "Senha inválida.",
      attemptsRemaining: Math.max(0, MAX_FAILURES - attempts - 1)
    }, 401);
  }

  await env.CONFIG_KV.delete(key);
  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
