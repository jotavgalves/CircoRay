import { createSessionCookie, isPasswordValid, json } from "../../_shared/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: "Admin ainda não configurado no Cloudflare." }, 503);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Requisição inválida." }, 400);
  }
  if (!isPasswordValid(body?.password, env.ADMIN_PASSWORD)) {
    return json({ error: "Senha inválida." }, 401);
  }
  const cookie = await createSessionCookie(env.SESSION_SECRET);
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
}
