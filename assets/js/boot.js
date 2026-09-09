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
    script.onload = () => { legacyLoaded = true; resolve(); };
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(script);
  });
}

async function boot() {
  const configPromise = loadRuntimeConfig();
  await loadClassicScript("/assets/js/game-legacy.js");
  legacyLoaded = true;
  const config = await configPromise;
  applyStaticPageConfig(config);

  const { applyLegacyGameConfig } = await import("/assets/js/game-config-adapter.js?v=20260909-4");
  applyLegacyGameConfig(config);

  const { initUiFixes } = await import("/assets/js/ui-fixes.js?v=20260909-6");
  initUiFixes(config);

  const { initGameAudio } = await import("/assets/js/audio-controller.js?v=20260909-2");
  initGameAudio(config);

  const { initHardcoreMode } = await import("/assets/js/hardcore-mode.js?v=20260909-3");
  initHardcoreMode(config);

  const { initHardcoreDiscovery } = await import("/assets/js/hardcore-discovery.js?v=20260909-3");
  initHardcoreDiscovery(config);

  const { initExperienceController } = await import("/assets/js/experience-controller.js?v=20260909-1");
  initExperienceController(config);

  const { initRanking } = await import("/assets/js/ranking.js?v=20260909-2");
  initRanking();

  const { initClownInteractions } = await import("/assets/js/clown-interactions.js?v=20260909-3");
  initClownInteractions(config);

  if (!new URLSearchParams(location.search).has('test')) {
    const { initIntroAnalytics } = await import("/assets/js/intro-analytics.js?v=20260909-3");
    initIntroAnalytics();
  } else {
    document.documentElement.classList.remove('cr-intro-pending');
    const { initTestController } = await import("/assets/js/test-controller.js?v=20260909-1");
    initTestController();
  }

  window.dispatchEvent(new CustomEvent("circoray:config-ready", { detail: config }));
}

boot().catch((error) => {
  document.documentElement.classList.remove('cr-intro-pending');
  console.error("Falha ao iniciar CircoRay:", error);
  if (!legacyLoaded && !window.__circorayLegacyFallbackLoaded) {
    window.__circorayLegacyFallbackLoaded = true;
    loadClassicScript("/assets/js/game-legacy.js").catch(console.error);
  }
});
