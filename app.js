const USERNAME = "jcastrlo";
const AUTH_KEY = "cartera.auth.v2";
const PORTFOLIO_KEY = "cartera.local-overrides.v2";
const PORTFOLIO_URL = "data/portfolio.enc.json";
const QUOTES_URL = "data/quotes.enc.json";
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
  els.quoteCount = document.getElementById("quoteCount");
  els.donutTotal = document.getElementById("donutTotal");
  els.allocationDonut = document.getElementById("allocationDonut");
  els.allocationLegend = document.getElementById("allocationLegend");
  els.holdingsBody = document.getElementById("holdingsBody");
  els.editDialog = document.getElementById("editDialog");
  els.assetForm = document.getElementById("assetForm");
  els.dialogTitle = document.getElementById("dialogTitle");
  els.assetId = document.getElementById("assetId");
  els.quantityInput = document.getElementById("quantityInput");
  els.averagePriceInput = document.getElementById("averagePriceInput");
  els.buyDateInput = document.getElementById("buyDateInput");
  els.manualValueInput = document.getElementById("manualValueInput");
  els.quoteSymbolInput = document.getElementById("quoteSymbolInput");
  els.resetAssetButton = document.getElementById("resetAssetButton");
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.refreshButton.addEventListener("click", refreshPrices);
  els.logoutButton.addEventListener("click", logout);
  els.holdingsBody.addEventListener("click", handleTableClick);
  els.assetForm.addEventListener("submit", saveAsset);
  els.resetAssetButton.addEventListener("click", resetAsset);
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
  const pricedRows = rows.filter((row) => row.type !== "cash" && row.quote);
  const investableRows = rows.filter((row) => row.type !== "cash");
  const gainRows = rows.filter((row) => row.type !== "cash" && row.costEUR);
  const gainValue = gainRows.reduce((sum, row) => sum + (row.valueEUR - row.costEUR), 0);
  const gainCost = gainRows.reduce((sum, row) => sum + row.costEUR, 0);
  const gainPct = gainCost > 0 ? gainValue / gainCost : null;

  els.totalValue.textContent = total ? formatEUR.format(total) : "--";
  els.totalGain.textContent = gainPct === null ? "Configurar" : `${formatEUR.format(gainValue)} · ${formatPercent.format(gainPct)}`;
  els.cashValue.textContent = cash && total ? `${formatEUR.format(cash.valueEUR)} · ${formatPercent.format(cash.valueEUR / total)}` : "--";
  els.quoteCount.textContent = `${pricedRows.length}/${investableRows.length}`;
  els.donutTotal.textContent = total ? formatEUR.format(total) : "--";

  renderStatus();
  renderDonut(rows, total);
  renderTable(rows, total);
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
  let cursor = 0;
  const slices = rows.map((row, index) => {
    const pct = total > 0 ? (row.valueEUR / total) * 100 : 0;
    const start = cursor;
    const end = cursor + pct;
    cursor = end;
    return `${COLORS[index % COLORS.length]} ${start}% ${end}%`;
  });

  els.allocationDonut.style.background = slices.length
    ? `conic-gradient(${slices.join(", ")})`
    : "conic-gradient(#d9e1ea 0 100%)";

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

function renderTable(rows, total) {
  els.holdingsBody.innerHTML = rows
    .map((row) => {
      const weight = total > 0 ? row.valueEUR / total : 0;
      const priceText = row.currentPrice === null ? "Manual" : formatMoney(row.currentPrice, row.currency, row.priceDigits);
      const averageText = row.averagePrice ? formatMoney(row.averagePrice, row.currency, row.priceDigits) : "Añadir";
      const gainText = row.gainPct === null ? "Añadir" : formatPercent.format(row.gainPct);
      const gainClass = row.gainPct === null ? "muted" : row.gainPct >= 0 ? "positive" : "negative";
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
          <td data-label="Precio medio">${averageText}</td>
          <td data-label="Ganancia"><span class="${gainClass}">${gainText}</span></td>
          <td data-label="Tiempo">${escapeHtml(row.holdingTime)}</td>
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
  const actualQuantity = safeNumber(asset.quantity, null);
  const estimatedQuantity = safeNumber(asset.estimatedQuantity, null);
  const activeQuantity = actualQuantity || estimatedQuantity;
  const valueEUR = asset.type === "cash"
    ? safeNumber(asset.manualValueEUR, 0)
    : activeQuantity && priceEUR
      ? activeQuantity * priceEUR
      : safeNumber(asset.manualValueEUR, 0);
  const nativeValue = asset.currency === "EUR" ? valueEUR : convertFromEUR(valueEUR, asset.currency);
  const averagePrice = safeNumber(asset.averagePrice, null);
  const averageEUR = averagePrice ? convertToEUR(averagePrice, asset.currency) : null;
  const costEUR = activeQuantity && averageEUR ? activeQuantity * averageEUR : null;
  const gainPct = costEUR ? (valueEUR - costEUR) / costEUR : null;

  return {
    ...asset,
    quote,
    currentPrice,
    nativeValue,
    valueEUR,
    averagePrice,
    costEUR,
    gainPct,
    holdingTime: formatHoldingTime(asset.buyDate),
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
  els.quantityInput.value = asset.quantity ?? "";
  els.averagePriceInput.value = asset.averagePrice ?? "";
  els.buyDateInput.value = asset.buyDate || "";
  els.manualValueInput.value = asset.manualValueEUR ?? "";
  els.quoteSymbolInput.value = asset.quoteSymbol || "";

  const disabled = asset.type === "cash";
  els.quantityInput.disabled = disabled;
  els.averagePriceInput.disabled = disabled;
  els.buyDateInput.disabled = disabled;
  els.quoteSymbolInput.disabled = disabled;

  els.editDialog.showModal();
}

function saveAsset(event) {
  event.preventDefault();
  const id = els.assetId.value;
  const asset = state.assets.find((item) => item.id === id);
  if (!asset) {
    return;
  }

  asset.quantity = parseOptionalNumber(els.quantityInput.value);
  asset.averagePrice = parseOptionalNumber(els.averagePriceInput.value);
  asset.buyDate = els.buyDateInput.value || "";
  asset.manualValueEUR = parseOptionalNumber(els.manualValueInput.value) ?? asset.manualValueEUR;
  asset.quoteSymbol = els.quoteSymbolInput.value.trim().toUpperCase();

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
