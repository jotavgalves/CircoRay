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

function slug(value) {
  return String(value || "item").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "item";
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

const ROULETTES = [
  ["normalItems", "Roleta normal", "Resultados usados nos giros comuns."],
  ["finalItems", "Roleta final", "Resultados usados no giro final."],
  ["outcomeItems", "Roleta de resultado", "Probabilidade interna de TICKET / VOLTE / TENTE."]
];

export function renderRouletteEditors(config, onChange) {
  const host = document.getElementById("rouletteEditors");
  const cardTemplate = document.getElementById("rouletteTemplate");
  const itemTemplate = document.getElementById("rouletteItemTemplate");
  host.innerHTML = "";

  ROULETTES.forEach(([key, title, description]) => {
    const fragment = cardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".roulette-card");
    card.dataset.key = key;
    card.querySelector("h4").textContent = title;
    card.querySelector(".roulette-total").textContent = description;
    const itemsHost = card.querySelector(".roulette-items");

    function recalc() {
      const rows = [...itemsHost.querySelectorAll(".roulette-item")];
      const weights = rows.map((row) => row.querySelector(".item-enabled").checked ? Math.max(0, Number(row.querySelector(".item-weight").value) || 0) : 0);
      const total = weights.reduce((sum, value) => sum + value, 0);
      rows.forEach((row, index) => {
        const pct = total > 0 ? (weights[index] / total) * 100 : 0;
        row.querySelector(".item-probability").textContent = `${pct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
      });
      card.querySelector(".roulette-total").textContent = `${description} Peso ativo total: ${total.toLocaleString("pt-BR")}.`;
      onChange?.();
    }

    function addRow(item = {}) {
      const itemFragment = itemTemplate.content.cloneNode(true);
      const row = itemFragment.querySelector(".roulette-item");
      row.dataset.id = item.id || `item-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
      row.querySelector(".item-label").value = item.label || "Novo resultado";
      row.querySelector(".item-weight").value = Number(item.weight ?? 1);
      row.querySelector(".item-enabled").checked = item.enabled !== false;
      row.querySelectorAll("input").forEach((input) => input.addEventListener("input", recalc));
      row.querySelector(".item-enabled").addEventListener("change", recalc);
      row.querySelector(".remove-item").addEventListener("click", () => { row.remove(); recalc(); });
      itemsHost.appendChild(row);
      recalc();
    }

    (config.roulette?.[key] || []).forEach(addRow);
    card.querySelector(".add-item").addEventListener("click", () => addRow());
    host.appendChild(fragment);
  });
}

export function readRouletteEditors(config) {
  const next = clone(config);
  next.roulette = next.roulette || {};
  document.querySelectorAll(".roulette-card").forEach((card) => {
    const key = card.dataset.key;
    next.roulette[key] = [...card.querySelectorAll(".roulette-item")].map((row, index) => {
      const label = row.querySelector(".item-label").value.trim();
      const preservedId = row.dataset.id;
      return {
        id: preservedId && !preservedId.startsWith("item-") ? preservedId : `${slug(label)}-${index + 1}`,
        label,
        weight: Math.max(0, Number(row.querySelector(".item-weight").value) || 0),
        enabled: row.querySelector(".item-enabled").checked
      };
    });
  });
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
