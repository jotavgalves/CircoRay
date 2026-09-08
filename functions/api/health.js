export async function onRequestGet({ env }) {
  return new Response(JSON.stringify({
    ok: true,
    adminPassword: Boolean(env.ADMIN_PASSWORD),
    sessionSecret: Boolean(env.SESSION_SECRET),
    configKv: Boolean(env.CONFIG_KV)
  }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}
