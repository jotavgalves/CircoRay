import { loadRuntimeConfig, applyStaticPageConfig } from "/assets/js/runtime-config.js?v=20260909-2";

let legacyLoaded = false;

function executeClassicSource(source, sourceUrl) {
  const script = document.createElement("script");
  script.textContent = `${source}\n//# sourceURL=${sourceUrl}`;
  document.body.appendChild(script);
  legacyLoaded = true;
}

async function loadPatchedLegacyGame() {
  const src = "/assets/js/game-legacy.js";
  const response = await fetch(`${src}?v=20260909-wheel-retry-1`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Falha ao carregar ${src}: ${response.status}`);

  let source = await response.text();
  const retryNeedle = `resultEl.textContent = "Tente novamente!";\n      playSfx("sfxLaugh");\n      sayLine(randomTaunt());\n      document.getElementById("spinBtn").disabled = false;`;
  const retryReplacement = `resultEl.textContent = "Tente novamente!";\n      playSfx("sfxLaugh");\n      sayLine(randomTaunt());\n      g3.spinning = false;\n      document.getElementById("spinBtn").disabled = false;`;

  if (source.includes(retryNeedle)) source = source.replace(retryNeedle, retryReplacement);
  else if (!source.includes(`sayLine(randomTaunt());\n      g3.spinning = false;\n      document.getElementById("spinBtn").disabled = false;`)) throw new Error("Patch seguro da roleta não encontrou o trecho esperado em game-legacy.js");

  executeClassicSource(source, src);
}

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
  await loadPatchedLegacyGame();
  const config = await configPromise;
  applyStaticPageConfig(config);

  const { initSpeechProfiles } = await import("/assets/js/speech-profiles.js?v=20260910-1");
  initSpeechProfiles();

  const { applyLegacyGameConfig } = await import("/assets/js/game-config-adapter.js?v=20260909-4");
  applyLegacyGameConfig(config);

  const { initUiFixes } = await import("/assets/js/ui-fixes.js?v=20260909-10");
  initUiFixes(config);

  const { initGameAudio } = await import("/assets/js/audio-controller.js?v=20260909-2");
  initGameAudio(config);

  const { initHardcoreMode } = await import("/assets/js/hardcore-mode-v4.js?v=20260910-1");
  initHardcoreMode(config);

  const { initMobileChaseInput } = await import("/assets/js/mobile-chase-input-v2.js?v=20260911-1");
  initMobileChaseInput();

  const { initHardcoreIdentity } = await import("/assets/js/hardcore-identity.js?v=20260910-1");
  initHardcoreIdentity();

  const { initHardcorePolish } = await import("/assets/js/hardcore-polish.js?v=20260910-4");
  initHardcorePolish();

  const { initHardcoreAngrySwap } = await import("/assets/js/hardcore-angry-swap-v3.js?v=20260910-1");
  initHardcoreAngrySwap();

  const { initHardcoreDiscovery } = await import("/assets/js/hardcore-discovery.js?v=20260909-3");
  initHardcoreDiscovery(config);

  const { initExperienceController } = await import("/assets/js/experience-controller.js?v=20260909-1");
  initExperienceController(config);

  const { initRanking } = await import("/assets/js/ranking.js?v=20260910-1");
  initRanking();

  const { initFinalRankingBridge } = await import("/assets/js/ranking-final-bridge.js?v=20260910-1");
  initFinalRankingBridge();

  const { initClownInteractions } = await import("/assets/js/clown-interactions.js?v=20260910-1");
  initClownInteractions();

  const { initFuryClownGuard } = await import("/assets/js/fury-clown-guard.js?v=20260910-4");
  initFuryClownGuard();

  if (!new URLSearchParams(location.search).has('test')) {
    const { initIntroAnalytics } = await import("/assets/js/intro-analytics.js?v=20260909-5");
    initIntroAnalytics();
  } else {
    document.documentElement.classList.remove('cr-intro-pending');
    const { initTestLayoutFix } = await import("/assets/js/test-layout-fix.js?v=20260910-1");
    initTestLayoutFix();
    const { initTestController } = await import("/assets/js/test-controller.js?v=20260910-3");
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
