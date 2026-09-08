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

function expandWeighted(items, targetSlots = 100) {
  const active = (items || []).filter((item) => item.enabled !== false && Number(item.weight) > 0);
  const total = active.reduce((sum, item) => sum + Number(item.weight), 0);
  if (!active.length || total <= 0) return [];
  const raw = active.map((item) => ({ item, exact: (Number(item.weight) / total) * targetSlots }));
  const slots = raw.map(({ item, exact }) => ({ item, count: Math.floor(exact), remainder: exact - Math.floor(exact) }));
  let missing = targetSlots - slots.reduce((sum, slot) => sum + slot.count, 0);
  [...slots].sort((a, b) => b.remainder - a.remainder).forEach((slot) => { if (missing-- > 0) slot.count += 1; });
  return slots.flatMap(({ item, count }) => Array.from({ length: count }, () => item.label));
}

function replaceArrayGlobal(name, value) {
  if (Array.isArray(value) && value.length) window[name] = [...value];
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

  const normalLabels = expandWeighted(config.roulette?.normalItems);
  const finalLabels = expandWeighted(config.roulette?.finalItems);
  if (normalLabels.length) window.NORMAL_WHEEL_LABELS = normalLabels;
  if (finalLabels.length) window.FINAL_WHEEL_LABELS = finalLabels;

  if (Array.isArray(config.roulette?.outcomeItems) && typeof window.chooseWheelOutcome === "function") {
    window.chooseWheelOutcome = function chooseConfiguredWheelOutcome() {
      return weightedPick(config.roulette.outcomeItems)?.id || "TENTE";
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
      if (window.g1) window.g1.timeLeft = Number(config.game?.game1TimeSeconds || 20);
      if (typeof window.updateG1Timer === "function") window.updateG1Timer();
      return result;
    };
  }

  if (window.g2 && typeof window.initGame2 === "function") {
    const originalInitGame2 = window.initGame2;
    window.initGame2 = function configuredInitGame2() {
      const result = originalInitGame2.apply(this, arguments);
      if (window.g2) window.g2.timeLeft = Number(config.game?.game2TimeSeconds || 12);
      if (typeof window.updateG2Timer === "function") window.updateG2Timer();
      return result;
    };
  }

  if (typeof window.refreshWheel === "function") window.refreshWheel();
  else if (typeof window.renderWheel === "function") window.renderWheel();
  else if (typeof window.drawWheel === "function") window.drawWheel();
}
