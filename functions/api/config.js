import { cloneDefaultConfig } from "../_shared/default-config.js";
import { json } from "../_shared/auth.js";

const CONFIG_KEY = "published-config";

export async function onRequestGet({ env }) {
  let config = cloneDefaultConfig();
  if (env.CONFIG_KV) {
    try {
      const stored = await env.CONFIG_KV.get(CONFIG_KEY, "json");
      if (stored && typeof stored === "object") config = stored;
    } catch (error) {
      console.error("CONFIG_KV read failed", error);
    }
  }
  return json({ config, source: env.CONFIG_KV ? "kv" : "default" });
}
