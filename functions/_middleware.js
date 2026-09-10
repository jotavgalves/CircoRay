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

  if (url.pathname.startsWith("/api/")) return response;

  const contentType = response.headers.get("Content-Type") || "";

  if ((url.pathname === "/adm" || url.pathname === "/adm/" || url.pathname === "/adm/index.html") && contentType.includes("text/html")) {
    const transformedAdmin = new HTMLRewriter()
      .on("head", {
        element(element) {
          element.append('<style id="admin-hidden-fix">[hidden]{display:none!important}</style>', { html: true });
        }
      })
      .on("body", {
        element(element) {
          element.append('<script type="module">import { initAdminTools } from "/assets/js/admin/tools.js?v=20260910-2"; initAdminTools();</script>', { html: true });
        }
      })
      .transform(response);
    return secure(transformedAdmin);
  }

  if (url.pathname !== "/" && url.pathname !== "/index.html") return secure(response);
  if (!contentType.includes("text/html")) return secure(response);

  const isTest = url.searchParams.has("test");
  let rewriter = new HTMLRewriter()
    .on('script[src="./assets/js/game-legacy.js"]', { element(element) { element.remove(); } })
    .on('script[src="/assets/js/game-legacy.js"]', { element(element) { element.remove(); } })
    .on("head", {
      element(element) {
        element.append('<style id="cr-fury-visual-force">body.cr-hardcore-fury .clown-wrap{position:absolute!important}body.cr-hardcore-fury #clownImg{opacity:0!important}body.cr-hardcore-fury .clown-wrap::before{content:"";position:absolute;inset:0;z-index:20;pointer-events:none;background:url("/assets/images/clown/clown-fury.png?v=20260910-4") center bottom/contain no-repeat;filter:drop-shadow(0 0 18px #ff1d1d) drop-shadow(0 0 44px #b00000) drop-shadow(0 0 78px #5a0000)}body.cr-hardcore-fury .clown-wrap::after{z-index:19}</style>', { html: true });
      }
    });

  if (!isTest) {
    rewriter = rewriter.on("head", {
      element(element) {
        element.append('<style id="cr-intro-lock-style">html.cr-intro-pending body{background:#050202!important}html.cr-intro-pending #app{visibility:hidden!important;opacity:0!important;pointer-events:none!important}</style><script>document.documentElement.classList.add("cr-intro-pending")</script>', { html: true });
      }
    });
  }

  const transformed = rewriter
    .on("body", {
      element(element) {
        element.append('<script type="module" src="/assets/js/boot.js?v=20260910-13"></script>', { html: true });
      }
    })
    .transform(response);

  return secure(transformed);
}
