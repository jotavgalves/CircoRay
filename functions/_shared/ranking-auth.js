function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function sign(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createRankingSession(secret) {
  const startedAt = Date.now();
  const nonceBytes = crypto.getRandomValues(new Uint8Array(12));
  const nonce = Array.from(nonceBytes, (b) => b.toString(16).padStart(2, "0")).join("");
  const payload = `rank.v1.${startedAt}.${nonce}`;
  const signature = await sign(secret, payload);
  return { token: `${payload}.${signature}`, startedAt };
}

export async function verifyRankingSession(token, secret) {
  if (!token || !secret) return null;
  const parts = String(token).split(".");
  if (parts.length !== 6 || parts[0] !== "rank" || parts[1] !== "v1") return null;
  const startedAt = Number(parts[2]);
  const nonce = parts[3];
  const signature = parts[4] === undefined ? "" : parts.at(-1);
  const payload = `rank.v1.${startedAt}.${nonce}`;
  const expected = await sign(secret, payload);
  if (!Number.isFinite(startedAt) || !safeEqual(signature, expected)) return null;
  const age = Date.now() - startedAt;
  if (age < -5000 || age > 2 * 60 * 60 * 1000) return null;
  return { startedAt, nonce };
}
