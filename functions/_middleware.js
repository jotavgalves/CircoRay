function secure(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "same-origin");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const response = await context.next();

  if (url.pathname !== "/" && url.pathname !== "/index.html") return secure(response);
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("text/html")) return secure(response);

  const transformed = new HTMLRewriter()
    .on('script[src="./assets/js/game-legacy.js"]', {
      element(element) { element.remove(); }
    })
    .on('script[src="/assets/js/game-legacy.js"]', {
      element(element) { element.remove(); }
    })
    .on("body", {
      element(element) {
        element.append('<script type="module" src="/assets/js/boot.js"></script>', { html: true });
      }
    })
    .transform(response);

  return secure(transformed);
}
