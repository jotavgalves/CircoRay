const BRIDGE_FLAG = "circoray:ranking-final-bridge:v1";

function waitForRankingUi() {
  return new Promise((resolve) => {
    const ready = () => {
      const name = document.getElementById("cr-rank-name");
      const submit = document.getElementById("cr-rank-submit");
      const status = document.getElementById("cr-rank-status");
      if (name && submit && status) return { name, submit, status };
      return null;
    };
    const now = ready();
    if (now) return resolve(now);
    let tries = 0;
    const timer = setInterval(() => {
      const found = ready();
      if (found || ++tries >= 40) {
        clearInterval(timer);
        resolve(found);
      }
    }, 50);
  });
}

function cleanName(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 24);
}

function isSuccess(text) {
  return /tempo salvo/i.test(text || "");
}

export async function initFinalRankingBridge() {
  if (window.__circorayFinalRankingBridgeLoaded) return;
  window.__circorayFinalRankingBridgeLoaded = true;

  const publicInput = document.getElementById("playerName");
  const publicButton = document.getElementById("saveResultBtn");
  const publicStatus = document.getElementById("finalStatus");
  if (!publicInput || !publicButton || !publicStatus) return;

  const rankingUi = await waitForRankingUi();
  if (!rankingUi) {
    console.warn("Ranking final: interface do ranking não foi encontrada.");
    return;
  }

  let pending = false;
  let requestSeq = 0;

  const mirrorStatus = (text, success = false) => {
    if (!text) return;
    publicStatus.textContent = success ? text : `Ranking: ${text}`;
    publicStatus.dataset.rankingState = success ? "success" : "error";
  };

  publicButton.addEventListener("click", () => {
    const name = cleanName(publicInput.value);
    if (name.length < 2 || pending) return;

    pending = true;
    const seq = ++requestSeq;
    const originalLabel = publicButton.textContent;
    publicButton.disabled = true;
    publicButton.textContent = "SALVANDO NO RANKING...";
    rankingUi.name.value = name;

    let settled = false;
    const finish = (text) => {
      if (settled || seq !== requestSeq || !text) return;
      if (/salvando no ranking/i.test(text)) return;
      settled = true;
      observer.disconnect();
      clearTimeout(timeout);
      const success = isSuccess(text);
      mirrorStatus(text, success);
      publicButton.disabled = success;
      publicButton.textContent = success ? "REGISTRADO NO RANKING" : originalLabel;
      publicButton.dataset.rankingSaved = success ? "1" : "0";
      pending = false;
    };

    const observer = new MutationObserver(() => finish(rankingUi.status.textContent.trim()));
    observer.observe(rankingUi.status, { childList: true, characterData: true, subtree: true });

    const timeout = setTimeout(() => {
      if (settled || seq !== requestSeq) return;
      settled = true;
      observer.disconnect();
      mirrorStatus("não houve resposta do servidor. Tente novamente.", false);
      publicButton.disabled = false;
      publicButton.textContent = originalLabel;
      pending = false;
    }, 10000);

    // O ranking já conclui a tentativa quando os tickets ficam preenchidos.
    // Um pequeno defer garante que esse estado seja processado antes do envio do nome.
    setTimeout(() => {
      if (seq !== requestSeq || settled) return;
      rankingUi.submit.click();
      const immediate = rankingUi.status.textContent.trim();
      if (immediate && !/salvando no ranking/i.test(immediate)) finish(immediate);
    }, 80);
  });

  publicInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    publicButton.click();
  });

  try { sessionStorage.setItem(BRIDGE_FLAG, "1"); } catch {}
}
