import { createRankingSession } from "../../_shared/ranking-auth.js";
import { json } from "../../_shared/auth.js";

export async function onRequestGet({ env }) {
  if (!env.SESSION_SECRET) {
    return json({ error: "Ranking indisponível: SESSION_SECRET não configurado." }, 503);
  }
  const session = await createRankingSession(env.SESSION_SECRET);
  return json({ ...session, expiresInMs: 2 * 60 * 60 * 1000 });
}
