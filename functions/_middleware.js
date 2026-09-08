export async function onRequest(context) {
  const url = new URL(context.request.url);
  const response = await context.next();

  if (url.pathname !== "/" && url.pathname !== "/index.html") return response;
  const contentType = response.headers.get("Content-Type") || "";
  if (!contentType.includes("text/html")) return response;

  return new HTMLRewriter()
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
}
