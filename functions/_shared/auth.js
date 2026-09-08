const COOKIE_NAME = "circoray_admin";
const SESSION_SECONDS = 8 * 60 * 60;

function bytesToBase64Url(bytes) {
  let binary = "";
  bytes.forEach((b) => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
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

function parseCookies(request) {
  const raw = request.headers.get("Cookie") || "";
  return raw.split(";").reduce((acc, pair) => {
    const index = pair.indexOf("=");
    if (index < 0) return acc;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    if (key) acc[key] = value;
    return acc;
  }, {});
}

export async function createSessionCookie(secret) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = `v1.${exp}`;
  const signature = await sign(secret, payload);
  const token = `${payload}.${signature}`;
  return `${COOKIE_NAME}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`;
}

export async function isAuthenticated(request, secret) {
  if (!secret) return false;
  const token = parseCookies(request)[COOKIE_NAME];
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) return false;
  const payload = `${parts[0]}.${parts[1]}`;
  const expected = await sign(secret, payload);
  return safeEqual(parts[2], expected);
}

export function isPasswordValid(provided, expected) {
  return safeEqual(String(provided || ""), String(expected || ""));
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers }
  });
}
