function clone(value) { return JSON.parse(JSON.stringify(value)); }

export function getPath(obj, path) {
  return path.split(".").reduce((value, key) => value?.[key], obj);
}

export function setPath(obj, path, value) {
  const keys = path.split(".");
  let cursor = obj;
  keys.slice(0, -1).forEach((key) => {
    if (!cursor[key] || typeof cursor[key] !== "object") cursor[key] = {};
    cursor = cursor[key];
  });
  cursor[keys.at(-1)] = value;
}

export function fillSimpleFields(config) {
  document.querySelectorAll("[data-bind]").forEach((el) => { el.value = getPath(config, el.dataset.bind) ?? ""; });
  document.querySelectorAll("[data-array-bind]").forEach((el) => {
    const value = getPath(config, el.dataset.arrayBind);
    el.value = Array.isArray(value) ? value.join("\n") : "";
  });
  document.querySelectorAll("[data-number-bind]").forEach((el) => { el.value = getPath(config, el.dataset.numberBind) ?? 0; });
  document.querySelectorAll("[data-ms-bind]").forEach((el) => {
    const ms = Number(getPath(config, el.dataset.msBind) || 0);
    el.value = Number((ms / 1000).toFixed(3));
  });
  const volume = Math.round(Number(config.audio?.volume ?? .3) * 100);
  document.getElementById("audioVolume").value = volume;
  document.getElementById("audioVolumeValue").textContent = `${volume}%`;
  document.getElementById("audioLoop").checked = Boolean(config.audio?.loop);
}

export function readSimpleFields(config) {
  const next = clone(config);
  document.querySelectorAll("[data-bind]").forEach((el) => setPath(next, el.dataset.bind, el.value));
  document.querySelectorAll("[data-array-bind]").forEach((el) => {
    setPath(next, el.dataset.arrayBind, el.value.split("\n").map((line) => line.trim()).filter(Boolean));
  });
  document.querySelectorAll("[data-number-bind]").forEach((el) => setPath(next, el.dataset.numberBind, Number(el.value)));
  document.querySelectorAll("[data-ms-bind]").forEach((el) => setPath(next, el.dataset.msBind, Math.round(Number(el.value) * 1000)));
  next.audio = next.audio || {};
  next.audio.volume = Number(document.getElementById("audioVolume").value) / 100;
  next.audio.loop = document.getElementById("audioLoop").checked;
  return next;
}

export function renderRouletteEditors(config, onChange) {
  const host = document.getElementById("rouletteEditors");
  const cardTemplate = document.getElementById("rouletteTemplate");
  const itemTemplate = document.getElementById("rouletteItemTemplate");
  host.innerHTML = "";

  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".roulette-card");
  card.dataset.key = "outcomeItems";
  card.querySelector("h4").textContent = "Roleta real do jogo";
  card.querySelector(".roulette-total").textContent = "Probabilidade dos três resultados que realmente existem: TICKET, VOLTE e TENTE.";
  const addButton = card.querySelector(".add-item");
  if (addButton) addButton.remove();
  const itemsHost = card.querySelector(".roulette-items");

  function recalc() {
    const rows = [...itemsHost.querySelectorAll(".roulette-item")];
    const weights = rows.map((row) => row.querySelector(".item-enabled").checked ? Math.max(0, Number(row.querySelector(".item-weight").value) || 0) : 0);
    const total = weights.reduce((sum, value) => sum + value, 0);
    rows.forEach((row, index) => {
      const pct = total > 0 ? (weights[index] / total) * 100 : 0;
      row.querySelector(".item-probability").textContent = `${pct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    });
    card.querySelector(".roulette-total").textContent = `Somente TICKET, VOLTE e TENTE existem no jogo. Peso ativo total: ${total.toLocaleString("pt-BR")}.`;
    onChange?.();
  }

  function addFixedRow(item = {}) {
    const itemFragment = itemTemplate.content.cloneNode(true);
    const row = itemFragment.querySelector(".roulette-item");
    row.dataset.id = item.id;
    const label = row.querySelector(".item-label");
    label.value = item.label || item.id;
    label.readOnly = true;
    label.title = "Este resultado corresponde diretamente à lógica do jogo e não pode ser renomeado.";
    row.querySelector(".item-weight").value = Number(item.weight ?? 1);
    row.querySelector(".item-enabled").checked = item.enabled !== false;
    const removeButton = row.querySelector(".remove-item");
    if (removeButton) removeButton.remove();
    row.querySelector(".item-weight").addEventListener("input", recalc);
    row.querySelector(".item-enabled").addEventListener("change", recalc);
    itemsHost.appendChild(row);
  }

  const current = Array.isArray(config.roulette?.outcomeItems) ? config.roulette.outcomeItems : [];
  ["TICKET", "VOLTE", "TENTE"].forEach((id) => {
    const item = current.find((candidate) => candidate.id === id) || { id, label: id, weight: 1, enabled: true };
    addFixedRow({ ...item, id, label: id });
  });
  recalc();
  host.appendChild(fragment);
}

export function readRouletteEditors(config) {
  const next = clone(config);
  next.roulette = next.roulette || {};
  const card = document.querySelector('.roulette-card[data-key="outcomeItems"]');
  next.roulette.outcomeItems = card ? [...card.querySelectorAll(".roulette-item")].map((row) => ({
    id: row.dataset.id,
    label: row.dataset.id,
    weight: Math.max(0, Number(row.querySelector(".item-weight").value) || 0),
    enabled: row.querySelector(".item-enabled").checked
  })) : (next.roulette.outcomeItems || []);
  delete next.roulette.normalItems;
  delete next.roulette.finalItems;
  return next;
}

export function bindDirtyEvents(callback) {
  document.querySelectorAll("[data-bind],[data-array-bind],[data-number-bind],[data-ms-bind],#audioVolume,#audioLoop").forEach((el) => {
    el.addEventListener(el.type === "checkbox" ? "change" : "input", callback);
  });
  document.getElementById("audioVolume").addEventListener("input", (event) => {
    document.getElementById("audioVolumeValue").textContent = `${event.target.value}%`;
  });
}
