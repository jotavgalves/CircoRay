import { loadRuntimeConfig, applyStaticPageConfig } from "/assets/js/runtime-config.js";

function loadClassicScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.defer = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Falha ao carregar ${src}`));
    document.body.appendChild(script);
  });
}

async function boot() {
  const configPromise = loadRuntimeConfig();

  // A lógica legada continua isolada neste arquivo durante a migração gradual.
  // Carregá-la por aqui garante que a configuração remota seja aplicada sempre
  // depois que as funções e variáveis do jogo já existirem.
  await loadClassicScript("/assets/js/game-legacy.js");

  const config = await configPromise;
  applyStaticPageConfig(config);

  const { applyLegacyGameConfig } = await import("/assets/js/game-config-adapter.js");
  applyLegacyGameConfig(config);

  window.dispatchEvent(new CustomEvent("circoray:config-ready", { detail: config }));
}

boot().catch((error) => {
  console.error("Falha ao iniciar CircoRay:", error);
  // Se a camada de configuração falhar, ainda tentamos deixar a experiência
  // original disponível em vez de entregar uma tela vazia.
  if (!window.__circorayLegacyFallbackLoaded) {
    window.__circorayLegacyFallbackLoaded = true;
    loadClassicScript("/assets/js/game-legacy.js").catch(console.error);
  }
});
