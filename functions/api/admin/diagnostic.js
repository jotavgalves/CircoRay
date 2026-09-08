import { isAuthenticated, json } from "../../_shared/auth.js";

export async function onRequestGet({ request, env }) {
  const hasSessionSecret = Boolean(env.SESSION_SECRET);
  const authenticated = hasSessionSecret ? await isAuthenticated(request, env.SESSION_SECRET) : false;

  return json({
    ok: authenticated,
    authenticated,
    adminPasswordConfigured: Boolean(env.ADMIN_PASSWORD),
    sessionSecretConfigured: hasSessionSecret,
    configKvConfigured: Boolean(env.CONFIG_KV),
    build: "admin-fix-20260908-1"
  }, authenticated ? 200 : 401);
}
