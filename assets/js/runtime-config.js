const FALLBACK = {
  event: { title: "Circo da Lua Sangrenta — Convite", invitationUrl: "#", invitationButtonText: "TROCAR PELO CONVITE" },
  page: { parkTitle: "CIRCO DA LUA SANGRENTA" },
  audio: { src: "/michak-whatsapp.mp3", volume: 0.3, loop: true }
};

export async function loadRuntimeConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    return payload.config || FALLBACK;
  } catch (error) {
    console.warn("Falha ao carregar configuração remota; usando fallback.", error);
    return FALLBACK;
  }
}

function setText(id, value) {
  if (typeof value !== "string" || !value) return;
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

export function applyStaticPageConfig(config) {
  document.title = config?.event?.title || "Circo da Lua Sangrenta — Convite";

  const parkTitle = document.querySelector(".park-title");
  if (parkTitle) parkTitle.textContent = config?.page?.parkTitle || "CIRCO DA LUA SANGRENTA";

  const link = document.getElementById("driveLink");
  if (link) {
    if (config?.event?.invitationUrl && config.event.invitationUrl !== "#") link.href = config.event.invitationUrl;
    if (config?.event?.invitationButtonText) link.textContent = config.event.invitationButtonText;
  }

  setText("couponText", config?.page?.couponText);
  setText("couponResText", config?.page?.couponResultText);
  setText("couponTit", config?.page?.couponTitle);
  setText("couponDesc", config?.page?.couponDescription);
  setText("closedLine1", config?.page?.closedLine1);
  setText("closedLine2", config?.page?.closedLine2);

  const audio = document.getElementById("bgMusic");
  if (audio && config?.audio) {
    if (config.audio.src) {
      const source = audio.querySelector("source");
      if (source) source.src = config.audio.src;
      else audio.src = config.audio.src;
      audio.load();
    }
    if (Number.isFinite(Number(config.audio.volume))) audio.volume = Math.max(0, Math.min(1, Number(config.audio.volume)));
    if (typeof config.audio.loop === "boolean") audio.loop = config.audio.loop;
  }
}
