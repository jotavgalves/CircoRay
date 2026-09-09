function weightedPick(items) {
  const active = (items || []).filter((item) => item.enabled !== false && Number(item.weight) > 0);
  const total = active.reduce((sum, item) => sum + Number(item.weight), 0);
  if (!active.length || total <= 0) return null;
  let cursor = Math.random() * total;
  for (const item of active) {
    cursor -= Number(item.weight);
    if (cursor < 0) return item;
  }
  return active.at(-1);
}

function replaceArrayGlobal(name, value) {
  if (Array.isArray(value) && value.length) window[name] = [...value];
}

function difficultyMultiplier(normalHardcore = 0.72, fury = 0.58) {
  if (window.__circorayHardcoreFury) return fury;
  if (window.__circorayHardcoreArmed) return normalHardcore;
  return 1;
}

function hardenedRouletteItems(items) {
  if (!window.__circorayHardcoreArmed) return items;
  const fury = Boolean(window.__circorayHardcoreFury);
  return (items || []).map((item) => {
    if (item.id === "TICKET") return { ...item, weight: Number(item.weight) * (fury ? 0.5 : 0.68) };
    if (item.id === "VOLTE") return { ...item, weight: Number(item.weight) * (fury ? 1.32 : 1.18) };
    return item;
  });
}

export function applyLegacyGameConfig(config) {
  if (!config) return;
  window.CIRCO_CONFIG = config;

  replaceArrayGlobal("TAUNTS", config.clown?.taunts);
  replaceArrayGlobal("CLICK_TAUNTS", config.clown?.clickTaunts);
  replaceArrayGlobal("WIN_LINES", config.clown?.winLines);

  if (config.clown?.introLines && typeof window.INTRO_LINES === "object") {
    window.INTRO_LINES = { ...window.INTRO_LINES, ...config.clown.introLines };
  }

  if (Array.isArray(config.roulette?.outcomeItems) && typeof window.chooseWheelOutcome === "function") {
    window.chooseWheelOutcome = function chooseConfiguredWheelOutcome() {
      if (window.fifthTryMode) return "TICKET";
      const source = hardenedRouletteItems(config.roulette.outcomeItems);
      const id = weightedPick(source)?.id;
      return id === "TICKET" || id === "VOLTE" || id === "TENTE" ? id : "TENTE";
    };
  }

  if (typeof window.sayLine === "function") {
    const originalSayLine = window.sayLine;
    window.sayLine = function configuredSayLine(text, duration) {
      const configuredDuration = Number(config.game?.speechDurationMs || 2600);
      return originalSayLine(text, duration == null ? configuredDuration : duration);
    };
  }

  if (typeof window.winGame === "function" && typeof window.playSfx === "function" && typeof window.goTo === "function") {
    window.winGame = function configuredWinGame(stageKey) {
      window.playSfx("sfxWin");
      const lines = config.clown?.winLines || [];
      const line = lines.length ? lines[Math.floor(Math.random() * lines.length)] : "VOCÊ CONSEGUIU.";
      window.sayLine(line, Number(config.game?.winSpeechDurationMs || 2000));
      setTimeout(function () {
        if (stageKey === "game1") window.goTo("trans1");
        else if (stageKey === "game2") window.goTo("trans2");
        else if (stageKey === "game3") { window.goTo("final"); if (typeof window.showFinalResult === "function") window.showFinalResult(); }
      }, Number(config.game?.winTransitionDelayMs || 1200));
    };
  }

  if (window.g1 && typeof window.initGame1 === "function") {
    const originalInitGame1 = window.initGame1;
    window.initGame1 = function configuredInitGame1() {
      const result = originalInitGame1.apply(this, arguments);
      const base = Number(config.game?.game1TimeSeconds || 20);
      if (window.g1) window.g1.timeLeft = Math.max(3, Math.ceil(base * difficultyMultiplier(0.72, 0.58)));
      if (typeof window.updateG1Timer === "function") window.updateG1Timer();
      return result;
    };
  }

  if (window.g2 && typeof window.initGame2 === "function") {
    const originalInitGame2 = window.initGame2;
    window.initGame2 = function configuredInitGame2() {
      const result = originalInitGame2.apply(this, arguments);
      const base = Number(config.game?.game2TimeSeconds || 12);
      if (window.g2) window.g2.timeLeft = Math.max(3, Math.ceil(base * difficultyMultiplier(0.76, 0.62)));
      if (typeof window.updateG2Timer === "function") window.updateG2Timer();
      return result;
    };
  }

  window.addEventListener("circoray:hardcore-armed", () => {
    document.querySelector("#screen-game1.active") && window.updateG1Timer?.();
    document.querySelector("#screen-game2.active") && window.updateG2Timer?.();
  });

  if (typeof window.rebuildWheelLabels === "function") window.rebuildWheelLabels();
  else if (typeof window.refreshWheel === "function") window.refreshWheel();
  else if (typeof window.renderWheel === "function") window.renderWheel();
  else if (typeof window.drawWheel === "function") window.drawWheel();
}
