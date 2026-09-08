import { cloneDefaultConfig } from "../../_shared/default-config.js";
import { normalizeConfig } from "../../_shared/config-utils.js";
import { isAuthenticated, json } from "../../_shared/auth.js";

const CONFIG_KEY = "published-config";
const BUILD = "admin-fix-20260908-1";

async function requireAuth(request, env) {
  if (!env.SESSION_SECRET) return { error: json({ error: "SESSION_SECRET não configurado.", build: BUILD }, 503) };
  const ok = await isAuthenticated(request, env.SESSION_SECRET);
  return ok ? { ok: true } : { error: json({ error: "Sessão expirada ou não autorizada.", build: BUILD }, 401) };
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth.error;

  let config = cloneDefaultConfig();
  let storageReady = false;
  let storageError = null;

  if (env.CONFIG_KV) {
    try {
      const stored = await env.CONFIG_KV.get(CONFIG_KEY, "json");
      if (stored && typeof stored === "object") config = stored;
      storageReady = true;
    } catch (error) {
      storageError = error?.message || "Falha ao ler CONFIG_KV.";
    }
  }

  return json({ config, storageReady, storageError, build: BUILD });
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAuth(request, env);
  if (auth.error) return auth.error;
  if (request.headers.get("X-Admin-Request") !== "1") {
    return json({ error: "Cabeçalho administrativo ausente.", build: BUILD }, 403);
  }
  if (!env.CONFIG_KV) {
    return json({ error: "CONFIG_KV não está vinculado ao projeto Cloudflare Pages.", build: BUILD }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "JSON inválido.", build: BUILD }, 400);
  }

  let current;
  try {
    current = (await env.CONFIG_KV.get(CONFIG_KEY, "json")) || cloneDefaultConfig();
  } catch (error) {
    return json({ error: `Falha ao ler CONFIG_KV: ${error?.message || "erro desconhecido"}`, build: BUILD }, 503);
  }

  const expectedRevision = Number(body?.expectedRevision);
  const currentRevision = Number(current.revision || 0);
  if (Number.isFinite(expectedRevision) && expectedRevision !== currentRevision) {
    return json({
      error: "A configuração foi alterada em outra sessão. Recarregue antes de publicar.",
      code: "REVISION_CONFLICT",
      currentRevision,
      build: BUILD
    }, 409);
  }

  let normalized;
  try {
    normalized = normalizeConfig(body?.config, currentRevision + 1);
  } catch (error) {
    return json({ error: error?.message || "Configuração inválida.", build: BUILD }, 422);
  }

  normalized.revision = currentRevision + 1;
  normalized.updatedAt = new Date().toISOString();

  try {
    await env.CONFIG_KV.put(CONFIG_KEY, JSON.stringify(normalized));
  } catch (error) {
    return json({ error: `Falha ao gravar CONFIG_KV: ${error?.message || "erro desconhecido"}`, build: BUILD }, 503);
  }

  return json({ ok: true, config: normalized, build: BUILD });
}
