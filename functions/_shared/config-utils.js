import { cloneDefaultConfig } from "./default-config.js";

const MAX_TEXT = 5000;
const MAX_ITEMS = 200;

function text(value, fallback = "") {
  return typeof value === "string" ? value.slice(0, MAX_TEXT) : fallback;
}

function number(value, fallback, min = 0, max = 86400000) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

function bool(value, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function stringArray(value, fallback = []) {
  if (!Array.isArray(value)) return fallback;
  return value.slice(0, MAX_ITEMS).map((item) => text(item)).filter(Boolean);
}

function weightedItems(value, fallback) {
  if (!Array.isArray(value) || !value.length) return fallback;
  return value.slice(0, MAX_ITEMS).map((item, index) => ({
    id: text(item?.id, `item-${index + 1}`).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 80),
    label: text(item?.label, `Item ${index + 1}`),
    weight: number(item?.weight, 1, 0, 1000000),
    enabled: bool(item?.enabled, true)
  })).filter((item) => item.label);
}

export function normalizeConfig(input, previousRevision = 0) {
  const d = cloneDefaultConfig();
  const c = input && typeof input === "object" ? input : {};
  const intro = c.clown?.introLines || {};
  const config = {
    version: 1,
    revision: Math.max(0, Math.floor(Number(previousRevision) || 0)),
    updatedAt: null,
    event: {
      title: text(c.event?.title, d.event.title),
      invitationUrl: text(c.event?.invitationUrl, d.event.invitationUrl),
      invitationButtonText: text(c.event?.invitationButtonText, d.event.invitationButtonText)
    },
    page: {
      couponText: text(c.page?.couponText, d.page.couponText),
      couponResultText: text(c.page?.couponResultText, d.page.couponResultText),
      couponTitle: text(c.page?.couponTitle, d.page.couponTitle),
      couponDescription: text(c.page?.couponDescription, d.page.couponDescription),
      closedLine1: text(c.page?.closedLine1, d.page.closedLine1),
      closedLine2: text(c.page?.closedLine2, d.page.closedLine2)
    },
    game: {
      maxSpins: Math.round(number(c.game?.maxSpins, d.game.maxSpins, 1, 100)),
      speechDurationMs: number(c.game?.speechDurationMs, d.game.speechDurationMs, 100, 60000),
      introDelayMs: number(c.game?.introDelayMs, d.game.introDelayMs, 0, 60000),
      winSpeechDurationMs: number(c.game?.winSpeechDurationMs, d.game.winSpeechDurationMs, 100, 60000),
      winTransitionDelayMs: number(c.game?.winTransitionDelayMs, d.game.winTransitionDelayMs, 0, 60000),
      spinDurationMs: number(c.game?.spinDurationMs, d.game.spinDurationMs, 250, 60000),
      spinRevealDelayMs: number(c.game?.spinRevealDelayMs, d.game.spinRevealDelayMs, 0, 60000),
      game1TimeSeconds: number(c.game?.game1TimeSeconds, d.game.game1TimeSeconds, 1, 600),
      game1WrongPenaltySeconds: number(c.game?.game1WrongPenaltySeconds, d.game.game1WrongPenaltySeconds, 0, 600),
      game1RestartDelayMs: number(c.game?.game1RestartDelayMs, d.game.game1RestartDelayMs, 0, 60000),
      game2TimeSeconds: number(c.game?.game2TimeSeconds, d.game.game2TimeSeconds, 1, 600)
    },
    clown: {
      taunts: stringArray(c.clown?.taunts, d.clown.taunts),
      clickTaunts: stringArray(c.clown?.clickTaunts, d.clown.clickTaunts),
      winLines: stringArray(c.clown?.winLines, d.clown.winLines),
      introLines: {
        game1: text(intro.game1, d.clown.introLines.game1),
        game2: text(intro.game2, d.clown.introLines.game2),
        game3: text(intro.game3, d.clown.introLines.game3)
      }
    },
    roulette: {
      normalItems: weightedItems(c.roulette?.normalItems, d.roulette.normalItems),
      finalItems: weightedItems(c.roulette?.finalItems, d.roulette.finalItems),
      outcomeItems: weightedItems(c.roulette?.outcomeItems, d.roulette.outcomeItems)
    },
    audio: {
      src: text(c.audio?.src, d.audio.src),
      volume: number(c.audio?.volume, d.audio.volume, 0, 1),
      loop: bool(c.audio?.loop, d.audio.loop)
    }
  };

  const allWeighted = [config.roulette.normalItems, config.roulette.finalItems, config.roulette.outcomeItems];
  if (allWeighted.some((items) => !items.some((item) => item.enabled && item.weight > 0))) {
    throw new Error("Cada roleta precisa ter pelo menos um item ativo com peso maior que zero.");
  }
  if (config.event.invitationUrl && config.event.invitationUrl !== "#") {
    try {
      const parsed = new URL(config.event.invitationUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new Error("O link do convite precisa ser uma URL http/https válida.");
    }
  }
  return config;
}
