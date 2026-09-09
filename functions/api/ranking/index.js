import { json } from "../../_shared/auth.js";
import { verifyRankingSession } from "../../_shared/ranking-auth.js";

const LEGACY_KEY = "ranking:v1";
const RANKING_KEYS = { normal: "ranking:v2:normal", hardcore: "ranking:v2:hardcore" };
const MAX_ENTRIES = 50;
const MIN_TIME_MS = 3000;
const MAX_TIME_MS = 2 * 60 * 60 * 1000;

function cleanName(value) {
  return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 24);
}
function cleanClientId(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}
function cleanMode(value) {
  return value === "hardcore" ? "hardcore" : "normal";
}
function normalizeEntries(value, mode = "normal") {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      name: cleanName(item.name) || "Jogador",
      timeMs: Math.max(0, Number(item.timeMs) || 0),
      completedAt: Number(item.completedAt) || 0,
      clientId: cleanClientId(item.clientId),
      mode: cleanMode(item.mode || mode)
    }))
    .filter((item) => item.timeMs >= MIN_TIME_MS && item.timeMs <= MAX_TIME_MS)
    .sort((a, b) => a.timeMs - b.timeMs || a.completedAt - b.completedAt)
    .slice(0, MAX_ENTRIES);
}
async function readRanking(env, mode) {
  if (!env.CONFIG_KV) return [];
  try {
    const current = await env.CONFIG_KV.get(RANKING_KEYS[mode], "json");
    if (Array.isArray(current) && current.length) return normalizeEntries(current, mode);
    if (mode === "normal") {
      const legacy = await env.CONFIG_KV.get(LEGACY_KEY, "json");
      return normalizeEntries(legacy || [], "normal");
    }
    return [];
  } catch { return []; }
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const requestedMode = url.searchParams.get("mode");
  if (requestedMode === "normal" || requestedMode === "hardcore") {
    const ranking = await readRanking(env, requestedMode);
    return json({ ranking, mode: requestedMode, storageReady: Boolean(env.CONFIG_KV) });
  }
  const [normalRanking, hardcoreRanking] = await Promise.all([
    readRanking(env, "normal"),
    readRanking(env, "hardcore")
  ]);
  return json({ ranking: normalRanking, normalRanking, hardcoreRanking, storageReady: Boolean(env.CONFIG_KV) });
}

export async function onRequestPost({ request, env }) {
  if (!env.CONFIG_KV) return json({ error: "Ranking global indisponível: CONFIG_KV não configurado." }, 503);
  if (!env.SESSION_SECRET) return json({ error: "Ranking global indisponível: SESSION_SECRET não configurado." }, 503);

  let body;
  try { body = await request.json(); } catch { return json({ error: "Requisição inválida." }, 400); }

  const session = await verifyRankingSession(body?.sessionToken, env.SESSION_SECRET);
  if (!session) return json({ error: "Sessão de ranking inválida ou expirada." }, 401);

  const name = cleanName(body?.name);
  const clientId = cleanClientId(body?.clientId);
  const timeMs = Math.round(Number(body?.timeMs));
  const completedAt = Number(body?.completedAt) || Date.now();
  const mode = cleanMode(body?.mode);

  if (name.length < 2) return json({ error: "Use um nome com pelo menos 2 caracteres." }, 422);
  if (!clientId) return json({ error: "Identificador local inválido." }, 422);
  if (!Number.isFinite(timeMs) || timeMs < MIN_TIME_MS || timeMs > MAX_TIME_MS) return json({ error: "Tempo de conclusão inválido." }, 422);

  const calculated = completedAt - session.startedAt;
  if (!Number.isFinite(calculated) || calculated < MIN_TIME_MS || calculated > MAX_TIME_MS) return json({ error: "Tempo de sessão incompatível." }, 422);
  if (Math.abs(calculated - timeMs) > 5000) return json({ error: "O tempo enviado não corresponde à sessão iniciada." }, 422);
  if (completedAt > Date.now() + 5000) return json({ error: "Data de conclusão inválida." }, 422);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const rateKey = `ranking-rate:${mode}:${ip}`;
  if (await env.CONFIG_KV.get(rateKey)) return json({ error: "Aguarde um minuto antes de enviar outro resultado neste modo." }, 429);

  const current = await readRanking(env, mode);
  const nextEntry = { name, timeMs, completedAt, clientId, mode };
  const bestExisting = current.filter((item) => item.clientId === clientId).sort((a, b) => a.timeMs - b.timeMs)[0];
  const withoutClient = current.filter((item) => item.clientId !== clientId);
  const best = !bestExisting || timeMs < bestExisting.timeMs ? nextEntry : bestExisting;
  const ranking = normalizeEntries([...withoutClient, best], mode);

  await env.CONFIG_KV.put(RANKING_KEYS[mode], JSON.stringify(ranking));
  await env.CONFIG_KV.put(rateKey, "1", { expirationTtl: 60 });

  const position = ranking.findIndex((item) => item.clientId === clientId) + 1;
  return json({ ok: true, position: position || null, ranking, mode });
}
