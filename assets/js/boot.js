import { loadRuntimeConfig, applyStaticPageConfig } from "/assets/js/runtime-config.js";

let legacyLoaded = false;

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (legacyLoaded) return resolve();
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", () => reject(new Error(`Falha ao carregar ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.defer = false;
    script.onload = () => {
      legacyLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(script);
  });
}

async function boot() {
  const configPromise = loadRuntimeConfig();

  // Mantém a experiência existente isolada durante a migração, mas garante
  // que a configuração publicada seja aplicada depois que os globais existirem.
  await loadClassicScript("/assets/js/game-legacy.js");
  legacyLoaded = true;

  const config = await configPromise;
  applyStaticPageConfig(config);

  const { applyLegacyGameConfig } = await import("/assets/js/game-config-adapter.js");
  applyLegacyGameConfig(config);

  window.dispatchEvent(new CustomEvent("circoray:config-ready", { detail: config }));
}

boot().catch((error) => {
  console.error("Falha ao iniciar CircoRay:", error);
  // Se apenas a configuração falhar, não executamos a lógica legada duas vezes.
  if (!legacyLoaded && !window.__circorayLegacyFallbackLoaded) {
    window.__circorayLegacyFallbackLoaded = true;
    loadClassicScript("/assets/js/game-legacy.js").catch(console.error);
  }
});
