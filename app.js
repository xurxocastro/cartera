const USERNAME = "jcastrlo";
const AUTH_KEY = "cartera.auth.v2";
const PORTFOLIO_KEY = "cartera.local-overrides.v2";
const PORTFOLIO_URL = "data/portfolio.enc.json";
const QUOTES_URL = "data/quotes.enc.json";
const SNAPSHOTS_KEY = "cartera.snapshots.v1";
const SESSION_DAYS = 365;

const COLORS = ["#0f766e", "#2563eb", "#b45309", "#7c3aed", "#15803d", "#c2410c", "#0e7490", "#475569"];

const formatEUR = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0
});

const formatPercent = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 1
});

const state = {
  keyBase64: "",
  portfolio: null,
  assets: [],
  prices: null,
  loading: false,
  priceError: ""
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();

  const session = getValidSession();
  if (session) {
    state.keyBase64 = session.keyBase64;
    showApp();
    loadPrivateData();
  } else {
    showLogin();
  }
});

function cacheElements() {
  els.loginScreen = document.getElementById("loginScreen");
  els.loginForm = document.getElementById("loginForm");
  els.loginError = document.getElementById("loginError");
  els.appShell = document.getElementById("appShell");
  els.refreshButton = document.getElementById("refreshButton");
  els.logoutButton = document.getElementById("logoutButton");
  els.statusDot = document.getElementById("statusDot");
  els.statusText = document.getElementById("statusText");
  els.fxText = document.getElementById("fxText");
  els.totalValue = document.getElementById("totalValue");
  els.totalGain = document.getElementById("totalGain");
  els.cashValue = document.getElementById("cashValue");
  els.change30d = document.getElementById("change30d");
  els.donutTotal = document.getElementById("donutTotal");
  els.allocationDonut = document.getElementById("allocationDonut");
  els.allocationLegend = document.getElementById("allocationLegend");
  els.continentDonut = document.getElementById("continentDonut");
  els.continentLegend = document.getElementById("continentLegend");
  els.continentTotal = document.getElementById("continentTotal");
  els.holdingsBody = document.getElementById("holdingsBody");
  els.editDialog = document.getElementById("editDialog");
  els.assetForm = document.getElementById("assetForm");
  els.dialogTitle = document.getElementById("dialogTitle");
  els.assetId = document.getElementById("assetId");
  els.continentInput = document.getElementById("continentInput");
  els.countryInput = document.getElementById("countryInput");
  els.manualValueInput = document.getElementById("manualValueInput");
  els.quoteSymbolInput = document.getElementById("quoteSymbolInput");
  els.lotsContainer = document.getElementById("lotsContainer");
  els.addLotButton = document.getElementById("addLotButton");
  els.resetAssetButton = document.getElementById("resetAssetButton");
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.refreshButton.addEventListener("click", refreshPrices);
  els.logoutButton.addEventListener("click", logout);
  els.holdingsBody.addEventListener("click", handleTableClick);
  els.assetForm.addEventListener("submit", saveAsset);
  els.resetAssetButton.addEventListener("click", resetAsset);
  els.addLotButton.addEventListener("click", addLotRow);
  els.lotsContainer.addEventListener("click", (e) => {
    if (e.target.closest(".remove-lot")) e.target.closest(".lot-row").remove();
  });
}

async function handleLogin(event) {
  event.preventDefault();
  els.loginError.textContent = "";

  const form = new FormData(els.loginForm);
  const username = String(form.get("username") || "").trim();
  const password = String(form.get("password") || "");

  if (username !== USERNAME) {
    els.loginError.textContent = "Usuario o contraseña incorrectos.";
    return;
  }

  try {
    const envelope = await fetchEnvelope(PORTFOLIO_URL);
    const keyBase64 = await deriveKeyBase64(password, envelope.salt, envelope.iterations);
    const portfolio = await decryptEnvelopeWithKey(envelope, keyBase64);
    state.keyBase64 = keyBase64;
    state.portfolio = portfolio;
    state.assets = loadAssets(portfolio.assets || []);

    const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username, expiresAt, keyBase64 }));
    els.loginForm.reset();
    showApp();
    await refreshPrices();
  } catch {
    els.loginError.textContent = "Usuario o contraseña incorrectos.";
  }
}

async function loadPrivateData() {
  state.loading = true;
  state.priceError = "";
  renderStatus();

  try {
    if (!state.portfolio) {
      const envelope = await fetchEnvelope(PORTFOLIO_URL);
      state.portfolio = await decryptEnvelopeWithKey(envelope, state.keyBase64);
    }

    state.assets = loadAssets(state.portfolio.assets || []);
    await refreshPrices();
  } catch {
    logout();
    els.loginError.textContent = "La sesión guardada no pudo descifrar los datos. Inicia sesión otra vez.";
  }
}

function getValidSession() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    if (session && session.username === USERNAME && session.expiresAt > Date.now() && session.keyBase64) {
      return session;
    }
  } catch {
    return null;
  }

  return null;
}

function showLogin() {
  els.loginScreen.classList.remove("hidden");
  els.appShell.classList.add("hidden");
}

function showApp() {
  els.loginScreen.classList.add("hidden");
  els.appShell.classList.remove("hidden");
  render();
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  state.keyBase64 = "";
  state.portfolio = null;
  state.assets = [];
  state.prices = null;
  state.loading = false;
  showLogin();
}

function loadAssets(defaultAssets) {
  try {
    const saved = JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || "[]");
    if (!Array.isArray(saved)) {
      return clone(defaultAssets);
    }

    return defaultAssets.map((asset) => {
      const savedAsset = saved.find((item) => item.id === asset.id);
      return { ...asset, ...(savedAsset || {}) };
    });
  } catch {
    return clone(defaultAssets);
  }
}

function saveAssets() {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(state.assets));
}

async function refreshPrices() {
  if (!state.keyBase64) {
    return;
  }

  state.loading = true;
  state.priceError = "";
  renderStatus();

  try {
    const envelope = await fetchEnvelope(`${QUOTES_URL}?ts=${Date.now()}`);
    state.prices = await decryptEnvelopeWithKey(envelope, state.keyBase64);
  } catch {
    state.priceError = "No se pudieron descifrar los precios; usando valores manuales.";
    state.prices = null;
  }

  if (state.prices?.fx) {
    try {
      state.prices.fx = await fetchFxData();
    } catch {
      // The encrypted FX snapshot is enough if the live request fails.
    }
  }

  state.loading = false;
  render();
}

async function fetchEnvelope(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url}`);
  }
  return response.json();
}

async function fetchFxData() {
  const response = await fetch("https://api.frankfurter.dev/v1/latest", { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`fx ${response.status}`);
  }
  const data = await response.json();
  return {
    amount: data.amount,
    base: data.base,
    date: data.date,
    rates: {
      CAD: data.rates.CAD,
      GBP: data.rates.GBP,
      USD: data.rates.USD
    }
  };
}

function render() {
  const rows = state.assets.map(enrichAsset);
  const total = rows.reduce((sum, row) => sum + row.valueEUR, 0);
  const cash = rows.find((row) => row.type === "cash");
  const gainRows = rows.filter((row) => row.type !== "cash" && row.costEUR);
  const gainValue = gainRows.reduce((sum, row) => sum + (row.valueEUR - row.costEUR), 0);
  const gainCost = gainRows.reduce((sum, row) => sum + row.costEUR, 0);
  const gainPct = gainCost > 0 ? gainValue / gainCost : null;

  els.totalValue.textContent = total ? formatEUR.format(total) : "--";
  els.totalGain.textContent = gainPct === null ? "Configurar" : `${formatEUR.format(gainValue)} · ${formatPercent.format(gainPct)}`;
  els.cashValue.textContent = cash && total ? `${formatEUR.format(cash.valueEUR)} · ${formatPercent.format(cash.valueEUR / total)}` : "--";
  els.donutTotal.textContent = total ? formatEUR.format(total) : "--";

  render30dChange(total);
  renderStatus();
  renderDonut(rows, total);
  renderContinentDonut(rows, total);
  renderTable(rows, total);
}

function render30dChange(total) {
  if (!total) {
    els.change30d.textContent = "--";
    return;
  }

  saveSnapshot(total);
  const snapshots = loadSnapshots();
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const oldSnap = snapshots.filter(s => s.t <= thirtyDaysAgo).pop()
    || snapshots.filter(s => s.t < now - 24 * 60 * 60 * 1000).shift();

  if (!oldSnap) {
    els.change30d.textContent = "Sin datos";
    els.change30d.className = "";
    return;
  }

  const diff = total - oldSnap.v;
  const pct = oldSnap.v > 0 ? diff / oldSnap.v : 0;
  const sign = diff >= 0 ? "+" : "";
  els.change30d.textContent = `${sign}${formatEUR.format(diff)} · ${sign}${formatPercent.format(pct)}`;
  els.change30d.className = diff >= 0 ? "positive" : "negative";
}

function saveSnapshot(total) {
  const today = new Date().toISOString().slice(0, 10);
  const snapshots = loadSnapshots();
  const existing = snapshots.find(s => new Date(s.t).toISOString().slice(0, 10) === today);
  if (existing) {
    existing.v = total;
  } else {
    snapshots.push({ t: Date.now(), v: total });
  }
  const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
  const pruned = snapshots.filter(s => s.t > cutoff);
  localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(pruned));
}

function loadSnapshots() {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOTS_KEY) || "[]");
  } catch {
    return [];
  }
}

function renderStatus() {
  const updated = state.prices?.updatedAt ? formatDateTime(state.prices.updatedAt) : "sin precios";
  const fxDate = state.prices?.fx?.date || "sin cambio";
  const warning = Boolean(state.priceError);

  els.statusDot.classList.toggle("warning", warning || state.loading);
  els.statusText.textContent = state.loading
    ? "Actualizando datos cifrados..."
    : warning
      ? state.priceError
      : `Precios cargados: ${updated}`;
  els.fxText.textContent = "";
}

function renderDonut(rows, total) {
  let cumulativePct = 0;
  const slices = rows.map((row, index) => {
    const pct = total > 0 ? (row.valueEUR / total) * 100 : 0;
    if (pct === 0) return "";
    
    const offset = 25 - cumulativePct;
    cumulativePct += pct;
    
    return `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="${COLORS[index % COLORS.length]}" stroke-width="8" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"><title>${escapeHtml(row.name)}: ${formatEUR.format(row.valueEUR)} (${formatPercent.format(pct / 100)})</title></circle>`;
  });

  const svgHTML = slices.length 
    ? `<svg viewBox="0 0 42 42" width="100%" height="100%">${slices.join("")}</svg>`
    : `<svg viewBox="0 0 42 42" width="100%" height="100%"><circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#d9e1ea" stroke-width="8"></circle></svg>`;

  els.allocationDonut.style.background = "none";
  els.allocationDonut.innerHTML = svgHTML;

  els.allocationLegend.innerHTML = rows
    .map((row, index) => {
      const pct = total > 0 ? row.valueEUR / total : 0;
      return `
        <div class="legend-item">
          <span class="legend-color" style="background:${COLORS[index % COLORS.length]}"></span>
          <span class="legend-name">${escapeHtml(row.name)}</span>
          <span class="legend-value">${formatPercent.format(pct)}</span>
        </div>
      `;
    })
    .join("");
}

function renderContinentDonut(rows, total) {
  const continents = {};
  for (const row of rows) {
    if (row.type === "cash" && !row.continent) continue;
    const c = row.continent || "Desconocido";
    continents[c] = (continents[c] || 0) + row.valueEUR;
  }
  const entries = Object.entries(continents).sort((a,b) => b[1] - a[1]);
  let cumulativePct = 0;
  const slices = entries.map(([name, val], index) => {
    const pct = total > 0 ? (val / total) * 100 : 0;
    if (pct === 0) return "";
    
    const offset = 25 - cumulativePct;
    cumulativePct += pct;
    
    return `<circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="${COLORS[index % COLORS.length]}" stroke-width="8" stroke-dasharray="${pct} ${100 - pct}" stroke-dashoffset="${offset}"><title>${escapeHtml(name)}: ${formatEUR.format(val)} (${formatPercent.format(pct / 100)})</title></circle>`;
  });

  const svgHTML = slices.length 
    ? `<svg viewBox="0 0 42 42" width="100%" height="100%">${slices.join("")}</svg>`
    : `<svg viewBox="0 0 42 42" width="100%" height="100%"><circle cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#d9e1ea" stroke-width="8"></circle></svg>`;

  els.continentDonut.style.background = "none";
  els.continentDonut.innerHTML = svgHTML;

  els.continentTotal.textContent = total ? formatEUR.format(total) : "--";

  els.continentLegend.innerHTML = entries
    .map(([name, val], index) => {
      const pct = total > 0 ? val / total : 0;
      return `
        <div class="legend-item">
          <span class="legend-color" style="background:${COLORS[index % COLORS.length]}"></span>
          <span class="legend-name">${escapeHtml(name)}</span>
          <span class="legend-value">${formatPercent.format(pct)}</span>
        </div>
      `;
    })
    .join("");
}

function renderTable(rows, total) {
  els.holdingsBody.innerHTML = rows
    .map((row) => {
      const weight = total > 0 ? row.valueEUR / total : 0;
      const priceText = row.currentPrice === null ? "Manual" : formatMoney(row.currentPrice, row.currency, row.priceDigits);
      const averageText = row.averagePrice ? formatMoney(row.averagePrice, row.currency, row.priceDigits) : "Añadir";
      const gainText = row.gainPct === null ? "Añadir" : formatPercent.format(row.gainPct);
      const gainClass = row.gainPct === null ? "muted" : row.gainPct >= 0 ? "positive" : "negative";
      
      const change1DText = row.change1D === null ? "—" : formatPercent.format(row.change1D);
      const change1DClass = row.change1D === null ? "muted" : row.change1D >= 0 ? "positive" : "negative";
      
      const change1MText = row.change1M === null ? "—" : formatPercent.format(row.change1M);
      const change1MClass = row.change1M === null ? "muted" : row.change1M >= 0 ? "positive" : "negative";
      
      const sourceText = row.quote ? `${row.quote.source || "Fuente"} · ${formatQuoteDate(row.quote.asOf)}` : "Valor manual";
      const nativeValueText = row.currentPrice === null ? "" : `${formatMoney(row.nativeValue, row.currency, 0)}`;

      return `
        <tr>
          <td data-label="Activo">
            <div class="asset-name">
              <strong>${escapeHtml(row.name)}</strong>
              <span class="asset-source">${escapeHtml(sourceText)}</span>
            </div>
          </td>
          <td data-label="Ticker"><span class="ticker-pill">${escapeHtml(row.ticker)}</span></td>
          <td class="hide-mobile" data-label="País">${escapeHtml(row.country || row.continent || "—")}</td>
          <td data-label="Valor">
            <div class="value-cell">
              <strong>${formatEUR.format(row.valueEUR)}</strong>
              <small>${nativeValueText}</small>
            </div>
          </td>
          <td data-label="Peso">
            <div class="weight-bar">
              <strong>${formatPercent.format(weight)}</strong>
              <span class="bar-track"><span class="bar-fill" style="width:${Math.max(weight * 100, 0.5)}%; background:${row.color}"></span></span>
            </div>
          </td>
          <td data-label="Precio">${priceText}</td>
          <td data-label="1D"><span class="${change1DClass}">${change1DText}</span></td>
          <td data-label="1M"><span class="${change1MClass}">${change1MText}</span></td>
          <td data-label="Precio medio">${averageText}</td>
          <td data-label="Ganancia"><span class="${gainClass}">${gainText}</span></td>
          <td class="actions-cell" data-label="">
            <button class="icon-button small" type="button" data-edit="${row.id}" title="Editar ${escapeHtml(row.name)}" aria-label="Editar ${escapeHtml(row.name)}">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function enrichAsset(asset, index = state.assets.findIndex((item) => item.id === asset.id)) {
  const quote = asset.type === "cash" ? null : getQuote(asset);
  const currentPrice = quote?.price ? quote.price / (asset.priceScale || 1) : null;
  const priceEUR = currentPrice === null ? null : convertToEUR(currentPrice, asset.currency);

  const lots = Array.isArray(asset.lots) ? asset.lots : [];
  let computedQuantity = null;
  let computedCostNative = null;
  let oldestDate = null;

  if (lots.length > 0) {
    computedQuantity = 0;
    computedCostNative = 0;
    for (const lot of lots) {
      computedQuantity += safeNumber(lot.quantity, 0);
      computedCostNative += safeNumber(lot.quantity, 0) * safeNumber(lot.price, 0);
      if (lot.date && (!oldestDate || lot.date < oldestDate)) oldestDate = lot.date;
    }
  }

  const actualQuantity = computedQuantity !== null && computedQuantity > 0 ? computedQuantity : safeNumber(asset.quantity, null);
  const estimatedQuantity = safeNumber(asset.estimatedQuantity, null);
  const activeQuantity = actualQuantity || estimatedQuantity;

  const valueEUR = asset.type === "cash"
    ? safeNumber(asset.manualValueEUR, 0)
    : activeQuantity && priceEUR
      ? activeQuantity * priceEUR
      : safeNumber(asset.manualValueEUR, 0);
      
  const nativeValue = asset.currency === "EUR" ? valueEUR : convertFromEUR(valueEUR, asset.currency);
  
  const averagePrice = computedQuantity !== null && computedQuantity > 0 
    ? computedCostNative / computedQuantity 
    : safeNumber(asset.averagePrice, null);
    
  const averageEUR = averagePrice ? convertToEUR(averagePrice, asset.currency) : null;
  const costEUR = activeQuantity && averageEUR ? activeQuantity * averageEUR : null;
  const gainPct = costEUR ? (valueEUR - costEUR) / costEUR : null;
  const buyDate = oldestDate || asset.buyDate || null;
  
  let change1D = null;
  let change1M = null;

  if (quote && quote.history && quote.history.length > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const history = quote.history;
    
    let prev1D = null;
    let prev1M = null;

    if (history.length > 1) {
      const index1D = history[history.length - 1].date === today ? history.length - 2 : history.length - 1;
      if (index1D >= 0) prev1D = history[index1D].price;

      if (history.length >= 20) {
        prev1M = history[0].price;
      }
    }

    const scale = asset.priceScale || 1;
    if (currentPrice !== null && prev1D !== null && prev1D > 0) {
      change1D = (currentPrice - (prev1D / scale)) / (prev1D / scale);
    }
    if (currentPrice !== null && prev1M !== null && prev1M > 0) {
      change1M = (currentPrice - (prev1M / scale)) / (prev1M / scale);
    }
  }

  return {
    ...asset,
    quote,
    currentPrice,
    averagePrice,
    valueEUR,
    nativeValue,
    costEUR,
    gainPct,
    change1D,
    change1M,
    buyDate,
    holdingTime: buyDate ? formatHoldingTime(buyDate) : "—",
    priceDigits: asset.currency === "EUR" && currentPrice && currentPrice < 10 ? 3 : 2,
    color: COLORS[index % COLORS.length]
  };
}

function getQuote(asset) {
  const quotes = state.prices?.quotes || {};
  return quotes[asset.quoteSymbol] || quotes[asset.ticker] || null;
}

function convertToEUR(amount, currency) {
  if (currency === "EUR") {
    return amount;
  }

  const rate = state.prices?.fx?.rates?.[currency];
  return rate ? amount / rate : null;
}

function convertFromEUR(amount, currency) {
  if (currency === "EUR") {
    return amount;
  }

  const rate = state.prices?.fx?.rates?.[currency];
  return rate ? amount * rate : amount;
}

function handleTableClick(event) {
  const button = event.target.closest("[data-edit]");
  if (!button) {
    return;
  }

  openEditor(button.dataset.edit);
}

function openEditor(id) {
  const asset = state.assets.find((item) => item.id === id);
  if (!asset) {
    return;
  }

  els.assetId.value = asset.id;
  els.dialogTitle.textContent = `${asset.name} (${asset.ticker})`;
  els.continentInput.value = asset.continent || "";
  els.countryInput.value = asset.country || "";
  els.manualValueInput.value = asset.manualValueEUR ?? "";
  els.quoteSymbolInput.value = asset.quoteSymbol || "";

  els.lotsContainer.innerHTML = "";
  const lots = Array.isArray(asset.lots) && asset.lots.length > 0 
    ? asset.lots 
    : (asset.quantity ? [{ quantity: asset.quantity, price: asset.averagePrice, date: asset.buyDate }] : []);
    
  for (const lot of lots) {
    addLotRow(lot);
  }

  const disabled = asset.type === "cash";
  els.continentInput.disabled = disabled;
  els.countryInput.disabled = disabled;
  els.quoteSymbolInput.disabled = disabled;
  els.addLotButton.style.display = disabled ? "none" : "";

  els.editDialog.showModal();
}

function addLotRow(lot = {}) {
  const div = document.createElement("div");
  div.className = "lot-row";
  div.innerHTML = `
    <label>Cantidad <input type="number" step="any" class="lot-quantity" value="${lot.quantity || ''}"></label>
    <label>Precio local <input type="number" step="any" class="lot-price" value="${lot.price || ''}"></label>
    <label>Fecha <input type="date" class="lot-date" value="${lot.date || ''}"></label>
    <button type="button" class="icon-button small remove-lot" title="Eliminar" aria-label="Eliminar">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>
    </button>
  `;
  els.lotsContainer.appendChild(div);
}

function saveAsset(event) {
  event.preventDefault();
  const id = els.assetId.value;
  const asset = state.assets.find((item) => item.id === id);
  if (!asset) {
    return;
  }

  asset.continent = els.continentInput.value;
  asset.country = els.countryInput.value.trim();
  asset.manualValueEUR = parseOptionalNumber(els.manualValueInput.value) ?? asset.manualValueEUR;
  asset.quoteSymbol = els.quoteSymbolInput.value.trim().toUpperCase();

  if (asset.type !== "cash") {
    const lotRows = els.lotsContainer.querySelectorAll(".lot-row");
    asset.lots = Array.from(lotRows).map(row => {
      const q = parseOptionalNumber(row.querySelector(".lot-quantity").value);
      const p = parseOptionalNumber(row.querySelector(".lot-price").value);
      const d = row.querySelector(".lot-date").value || "";
      if (q !== null && q > 0) {
        return { quantity: q, price: p, date: d };
      }
      return null;
    }).filter(Boolean);
    
    // Clear legacy fields to ensure enrichAsset computes from lots
    asset.quantity = undefined;
    asset.averagePrice = undefined;
    asset.buyDate = undefined;
  }

  saveAssets();
  els.editDialog.close();
  render();
}

function resetAsset() {
  const id = els.assetId.value;
  const original = state.portfolio?.assets?.find((item) => item.id === id);
  const index = state.assets.findIndex((item) => item.id === id);

  if (!original || index === -1) {
    return;
  }

  state.assets[index] = clone(original);
  saveAssets();
  els.editDialog.close();
  render();
}

async function deriveKeyBase64(password, saltBase64, iterations) {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: base64ToBytes(saltBase64),
      iterations
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  return bytesToBase64(new Uint8Array(raw));
}

async function decryptEnvelopeWithKey(envelope, keyBase64) {
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBytes(keyBase64),
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(envelope.iv) },
    key,
    base64ToBytes(envelope.ciphertext)
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

function parseOptionalNumber(value) {
  const normalized = normalizeNumber(value);
  if (!normalized) {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function normalizeNumber(value) {
  const raw = String(value || "").trim().replace(/\s/g, "");
  if (!raw) {
    return "";
  }

  const commaIndex = raw.lastIndexOf(",");
  const dotIndex = raw.lastIndexOf(".");

  if (commaIndex !== -1 && dotIndex !== -1) {
    if (commaIndex > dotIndex) {
      return raw.replace(/\./g, "").replace(",", ".");
    }

    return raw.replace(/,/g, "");
  }

  if (commaIndex !== -1) {
    return raw.replace(",", ".");
  }

  return raw;
}

function safeNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function formatMoney(value, currency, digits = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "--";
  }

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
}

function formatHoldingTime(value) {
  if (!value) {
    return "Añadir";
  }

  const start = new Date(`${value}T00:00:00`);
  if (Number.isNaN(start.getTime()) || start > new Date()) {
    return "Añadir";
  }

  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) {
    months -= 1;
  }

  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  if (years > 0 && restMonths > 0) {
    return `${years} a ${restMonths} m`;
  }

  if (years > 0) {
    return `${years} a`;
  }

  if (restMonths > 0) {
    return `${restMonths} m`;
  }

  const days = Math.max(1, Math.floor((now - start) / (24 * 60 * 60 * 1000)));
  return `${days} d`;
}

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatQuoteDate(value) {
  if (!value) {
    return "sin fecha";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
