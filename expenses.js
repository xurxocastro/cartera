const USERNAME = "jcastrlo";
const AUTH_KEY = "cartera.auth.v2";
const EXPENSES_KEY = "cartera.expenses.v3";
const PORTFOLIO_URL = "data/portfolio.enc.json";
const SESSION_DAYS = 365;

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const MONTH_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const formatEUR = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

const SEED_DATA = [
  {id:"2023-11",incomeNTT:1577,incomeVar:300,incomeNotes:"Regalos Navidad OpenAI+ Savings",revolut:1707,revSaved:0,otherBank:2434,cash:100,extras:"Trip to Madrid",saved:690,spent:1187},
  {id:"2023-12",incomeNTT:2422,incomeVar:300,incomeNotes:"",revolut:1255,revSaved:0,otherBank:756,cash:70,extras:"Mucho tiempo en casa",saved:2156,spent:566},
  {id:"2024-01",incomeNTT:1577,incomeVar:0,incomeNotes:"",revolut:518,revSaved:0,otherBank:771,cash:100,extras:"Nueva tablet",saved:598,spent:979},
  {id:"2024-02",incomeNTT:1359,incomeVar:550,incomeNotes:"OpenAI + Marga",revolut:733,revSaved:0,otherBank:1736,cash:50,extras:"2k to save, (300 eur zara counted) (viaje cerdeña)",saved:520,spent:1389},
  {id:"2024-03",incomeNTT:1384,incomeVar:1300,incomeNotes:"cumple abuela",revolut:1161,revSaved:0,otherBank:574,cash:70,extras:"100 euros ropa",saved:2684,spent:985},
  {id:"2024-04",incomeNTT:1461,incomeVar:0,incomeNotes:"",revolut:488,revSaved:0,otherBank:1723,cash:70,extras:"",saved:0,spent:821},
  {id:"2024-05",incomeNTT:1455,incomeVar:350,incomeNotes:"",revolut:214,revSaved:0,otherBank:2936,cash:115,extras:"1900 eur saved and monitor+table",saved:1900,spent:1414},
  {id:"2024-06",incomeNTT:1444,incomeVar:300,incomeNotes:"",revolut:708,revSaved:0,otherBank:877,cash:110,extras:"pixel, fianza piso y mes julio",saved:0,spent:1830},
  {id:"2024-07",incomeNTT:1414,incomeVar:400,incomeNotes:"Hacienda",revolut:383,revSaved:0,otherBank:2200,cash:60,extras:"ikea, chanclas, viaje Japón pagado",saved:2200,spent:1010},
  {id:"2024-08",incomeNTT:1414,incomeVar:0,incomeNotes:"",revolut:162,revSaved:0,otherBank:680,cash:5,extras:"",saved:0,spent:1353},
  {id:"2024-09",incomeNTT:1389,incomeVar:0,incomeNotes:"Açores",revolut:297,revSaved:0,otherBank:586,cash:50,extras:"Trip to açores, vino ana",saved:0,spent:1291},
  {id:"2024-10",incomeNTT:1587,incomeVar:0,incomeNotes:"",revolut:72,revSaved:0,otherBank:1107,cash:50,extras:"Mac 1180",saved:-650,spent:2183},
  {id:"2024-11",incomeNTT:1617,incomeVar:0,incomeNotes:"",revolut:221,revSaved:0,otherBank:1042,cash:50,extras:"Plane to China",saved:300,spent:1641},
  {id:"2024-12",incomeNTT:1630,incomeVar:50,incomeNotes:"",revolut:207,revSaved:0,otherBank:1095,cash:40,extras:"Hotels china + Party",saved:1600,spent:1483},
  {id:"2025-01",incomeNTT:2965,incomeVar:700,incomeNotes:"Abuela",revolut:316,revSaved:0,otherBank:1568,cash:40,extras:"2k to stocks (unfreezed 1.4k), 250€ zara, china trip",saved:600,spent:1536},
  {id:"2025-02",incomeNTT:1656,incomeVar:0,incomeNotes:"",revolut:500,revSaved:0,otherBank:1363,cash:50,extras:"1.1k maldives plane ticket, 100eur erasmus",saved:0,spent:2391},
  {id:"2025-03",incomeNTT:1628,incomeVar:1000,incomeNotes:"Abuela",revolut:282,revSaved:0,otherBank:180,cash:50,extras:"",saved:400,spent:1046},
  {id:"2025-04",incomeNTT:1551,incomeVar:0,incomeNotes:"",revolut:300,revSaved:906,otherBank:117,cash:200,extras:"Viaje nieve + RD",saved:0,spent:700},
  {id:"2025-05",incomeNTT:1576,incomeVar:0,incomeNotes:"",revolut:514,revSaved:806,otherBank:800,cash:200,extras:"Compra BRK",saved:1000,spent:1171},
  {id:"2025-06",incomeNTT:1577,incomeVar:0,incomeNotes:"",revolut:70,revSaved:807,otherBank:650,cash:200,extras:"1000 saved BRK",saved:0,spent:984},
  {id:"2025-07",incomeNTT:1577,incomeVar:0,incomeNotes:"",revolut:122,revSaved:256,otherBank:191,cash:200,extras:"Viaje marruecos",saved:0,spent:960},
  {id:"2025-08",incomeNTT:1552,incomeVar:1414,incomeNotes:"",revolut:998,revSaved:3250,otherBank:191,cash:200,extras:"Semana en marruecos, fianza (descontada), alquiler septiembre",saved:2250,spent:800},
  {id:"2025-09",incomeNTT:1510,incomeVar:0,incomeNotes:"",revolut:-237,revSaved:0,otherBank:38,cash:50,extras:"Alquiler ya estaba pagado, no hay gastos",saved:0,spent:510},
  {id:"2025-10",incomeNTT:1701,incomeVar:140,incomeNotes:"",revolut:-44,revSaved:0,otherBank:1119,cash:40,extras:"Libros + Zapatos + cenas",saved:1080,spent:1053},
  {id:"2025-11",incomeNTT:1711,incomeVar:50,incomeNotes:"",revolut:105,revSaved:1080,otherBank:408,cash:50,extras:"Black Friday",saved:null,spent:1098},
  {id:"2025-12",incomeNTT:1684,incomeVar:0,incomeNotes:"",revolut:1039,revSaved:0,otherBank:60,cash:50,extras:"Viajes con padres",saved:null,spent:550},
  {id:"2026-01",incomeNTT:3536,incomeVar:50,incomeNotes:"Abuela",revolut:195,revSaved:3233,otherBank:704,cash:50,extras:"renove armario zara + cascos+móvil",saved:3200,spent:2411},
  {id:"2026-02",incomeNTT:1683,incomeVar:0,incomeNotes:"",revolut:337,revSaved:1452,otherBank:171,cash:200,extras:"Serbia",saved:null,spent:1683},
  {id:"2026-03",incomeNTT:1634,incomeVar:0,incomeNotes:"",revolut:337,revSaved:1452,otherBank:171,cash:200,extras:"Texas + pauliña + compras como un animal",saved:null,spent:1754},
  {id:"2026-04",incomeNTT:1685,incomeVar:0,incomeNotes:"",revolut:42,revSaved:395,otherBank:497,cash:100,extras:"",saved:null,spent:1736},
  {id:"2026-05",incomeNTT:1681,incomeVar:0,incomeNotes:"",revolut:0,revSaved:0,otherBank:484,cash:100,extras:"",saved:null,spent:null}
];

const state = { keyBase64: "", entries: [], editing: null };
const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  bindEvents();
  const session = getValidSession();
  if (session) {
    state.keyBase64 = session.keyBase64;
    showApp();
    loadExpenses();
  } else {
    showLogin();
  }
});

function cacheElements() {
  els.loginScreen = document.getElementById("loginScreen");
  els.loginForm = document.getElementById("loginForm");
  els.loginError = document.getElementById("loginError");
  els.appShell = document.getElementById("appShell");
  els.logoutButton = document.getElementById("logoutButton");
  els.currentLiquidity = document.getElementById("currentLiquidity");
  els.avgIncome = document.getElementById("avgIncome");
  els.avgSpent = document.getElementById("avgSpent");
  els.totalSaved = document.getElementById("totalSaved");
  els.chartArea = document.getElementById("chartArea");
  els.expensesBody = document.getElementById("expensesBody");
  els.addMonthButton = document.getElementById("addMonthButton");
  els.expenseDialog = document.getElementById("expenseDialog");
  els.expenseForm = document.getElementById("expenseForm");
  els.expenseDialogTitle = document.getElementById("expenseDialogTitle");
  els.expenseId = document.getElementById("expenseId");
  els.expenseMonth = document.getElementById("expenseMonth");
  els.expenseIncomeNTT = document.getElementById("expenseIncomeNTT");
  els.expenseIncomeVar = document.getElementById("expenseIncomeVar");
  els.expenseIncomeNotes = document.getElementById("expenseIncomeNotes");
  els.expenseRevolut = document.getElementById("expenseRevolut");
  els.expenseRevSaved = document.getElementById("expenseRevSaved");
  els.expenseOtherBank = document.getElementById("expenseOtherBank");
  els.expenseCash = document.getElementById("expenseCash");
  els.expenseSpent = document.getElementById("expenseSpent");
  els.expenseExtras = document.getElementById("expenseExtras");
  els.expenseSaved = document.getElementById("expenseSaved");
  els.deleteExpenseButton = document.getElementById("deleteExpenseButton");
}

function bindEvents() {
  els.loginForm.addEventListener("submit", handleLogin);
  els.logoutButton.addEventListener("click", logout);
  els.addMonthButton.addEventListener("click", () => openEditor(null));
  els.expenseForm.addEventListener("submit", saveExpense);
  els.deleteExpenseButton.addEventListener("click", deleteExpense);
  els.expensesBody.addEventListener("click", handleTableClick);
}

/* ── Auth ───────────────────────────────────────────────────── */

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
    const envelope = await fetchJSON(PORTFOLIO_URL);
    const keyBase64 = await deriveKeyBase64(password, envelope.salt, envelope.iterations);
    await decryptEnvelopeWithKey(envelope, keyBase64);
    state.keyBase64 = keyBase64;
    const expiresAt = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(AUTH_KEY, JSON.stringify({ username, expiresAt, keyBase64 }));
    els.loginForm.reset();
    showApp();
    loadExpenses();
  } catch {
    els.loginError.textContent = "Usuario o contraseña incorrectos.";
  }
}

function getValidSession() {
  try {
    const s = JSON.parse(localStorage.getItem(AUTH_KEY) || "null");
    if (s && s.username === USERNAME && s.expiresAt > Date.now() && s.keyBase64) return s;
  } catch { /* ignore */ }
  return null;
}

function showLogin() { els.loginScreen.classList.remove("hidden"); els.appShell.classList.add("hidden"); }
function showApp() { els.loginScreen.classList.add("hidden"); els.appShell.classList.remove("hidden"); }

function logout() {
  localStorage.removeItem(AUTH_KEY);
  state.keyBase64 = "";
  state.entries = [];
  showLogin();
}

/* ── Data persistence (encrypted localStorage) ─────────────── */

async function loadExpenses() {
  const raw = localStorage.getItem(EXPENSES_KEY);
  if (raw) {
    try {
      const envelope = JSON.parse(raw);
      state.entries = await decryptEnvelopeWithKey(envelope, state.keyBase64);
    } catch {
      state.entries = clone(SEED_DATA);
      await persistExpenses();
    }
  } else {
    state.entries = clone(SEED_DATA);
    await persistExpenses();
  }
  render();
}

async function persistExpenses() {
  const envelope = await encryptWithKey(state.entries, state.keyBase64);
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(envelope));
}

/* ── Rendering ──────────────────────────────────────────────── */

function render() {
  const rows = enrichAll(state.entries);
  renderSummary(rows);
  renderChart(rows);
  renderTable(rows);
}

function enrichAll(entries) {
  const sorted = [...entries].sort((a, b) => a.id.localeCompare(b.id));
  return sorted.map((e) => {
    const liquidity = n(e.revolut) + n(e.revSaved) + n(e.otherBank) + n(e.cash);
    const incomeTotal = n(e.incomeNTT) + n(e.incomeVar);
    const spent = e.spent;
    return { ...e, liquidity, incomeTotal, spent, _label: formatMonthLabel(e.id) };
  });
}

function renderSummary(rows) {
  const latest = rows[rows.length - 1];
  els.currentLiquidity.textContent = latest ? formatEUR.format(latest.liquidity) : "--";

  const incomes = rows.map(r => r.incomeTotal);
  els.avgIncome.textContent = incomes.length ? formatEUR.format(avg(incomes)) : "--";

  const spentValues = rows.map(r => r.spent).filter(v => v !== null && v > 0);
  els.avgSpent.textContent = spentValues.length ? formatEUR.format(avg(spentValues)) : "--";

  const totalSaved = rows.reduce((sum, r) => sum + n(r.saved), 0);
  els.totalSaved.textContent = formatEUR.format(totalSaved);
}

function renderChart(rows) {
  const chartRows = rows.filter(r => r.incomeTotal > 0 || (r.spent !== null && r.spent > 0));
  if (chartRows.length === 0) {
    els.chartArea.innerHTML = "";
    return;
  }

  const maxVal = Math.max(...chartRows.map(r => Math.max(r.incomeTotal, n(r.spent))), 1);
  
  const width = Math.max(800, chartRows.length * 50);
  const height = 180;
  const padX = 30;
  const padY = 20;
  const graphW = width - padX * 2;
  const graphH = height - padY * 2;
  
  const stepX = chartRows.length > 1 ? graphW / (chartRows.length - 1) : graphW;
  
  let incomePoints = "";
  let spentPoints = "";
  let circlesHTML = "";
  let labelsHTML = "";

  chartRows.forEach((r, i) => {
    const x = padX + i * stepX;
    const yIncome = padY + graphH - (r.incomeTotal / maxVal) * graphH;
    
    incomePoints += `${x},${yIncome} `;
    circlesHTML += `<circle cx="${x}" cy="${yIncome}" r="4" fill="var(--panel)" stroke="var(--blue)" stroke-width="2"><title>${r._label} - Ingresos: ${formatEUR.format(r.incomeTotal)}</title></circle>`;
    
    if (r.spent !== null && r.spent > 0) {
      const ySpent = padY + graphH - (r.spent / maxVal) * graphH;
      spentPoints += `${x},${ySpent} `;
      circlesHTML += `<circle cx="${x}" cy="${ySpent}" r="4" fill="var(--panel)" stroke="var(--amber)" stroke-width="2"><title>${r._label} - Gastos: ${formatEUR.format(r.spent)}</title></circle>`;
    }
    
    const [y, m] = r.id.split("-").map(Number);
    const label = `${MONTH_SHORT[m - 1]} ${String(y).slice(2)}`;
    
    labelsHTML += `<text x="${x}" y="${height - 2}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="system-ui, sans-serif" font-weight="600">${label}</text>`;
  });

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" style="width: ${width}px; height: ${height}px; display: block; overflow: visible;">
      <line x1="${padX}" y1="${padY}" x2="${width - padX}" y2="${padY}" stroke="var(--soft-line)" stroke-dasharray="4" />
      <line x1="${padX}" y1="${padY + graphH/2}" x2="${width - padX}" y2="${padY + graphH/2}" stroke="var(--soft-line)" stroke-dasharray="4" />
      <line x1="${padX}" y1="${padY + graphH}" x2="${width - padX}" y2="${padY + graphH}" stroke="var(--line)" />
      
      <polyline points="${incomePoints}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <polyline points="${spentPoints}" fill="none" stroke="var(--amber)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      
      ${circlesHTML}
      ${labelsHTML}
    </svg>
  `;
  
  els.chartArea.innerHTML = svg;
}

function renderTable(rows) {
  const reversed = [...rows].reverse();
  els.expensesBody.innerHTML = reversed.map(row => {
    const spentClass = row.spent === null ? "muted" : row.spent > 1500 ? "negative" : "positive";
    const spentText = row.spent === null ? "—" : formatEUR.format(row.spent);
    const savedText = row.saved === null ? "—" : formatEUR.format(row.saved);
    const notes = [row.extras, row.incomeNotes].filter(Boolean).join(" · ");

    return `
      <tr>
        <td data-label="Mes"><strong>${esc(row._label)}</strong></td>
        <td data-label="Ingresos">
          <div class="value-cell">
            <strong>${formatEUR.format(row.incomeTotal)}</strong>
            <small>${formatEUR.format(n(row.incomeNTT))} + ${formatEUR.format(n(row.incomeVar))}</small>
          </div>
        </td>
        <td data-label="Liquidez">
          <div class="value-cell">
            <strong>${formatEUR.format(row.liquidity)}</strong>
            <small>R${formatEUR.format(n(row.revolut))} B${formatEUR.format(n(row.otherBank))}</small>
          </div>
        </td>
        <td data-label="Gastado"><span class="${spentClass}">${spentText}</span></td>
        <td data-label="Ahorrado">${savedText}</td>
        <td data-label="Notas"><span class="notes-cell">${esc(notes) || "—"}</span></td>
        <td class="actions-cell" data-label="">
          <button class="icon-button small" type="button" data-edit="${row.id}" title="Editar ${esc(row._label)}" aria-label="Editar ${esc(row._label)}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
            </svg>
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

/* ── Editor ─────────────────────────────────────────────────── */

function handleTableClick(event) {
  const btn = event.target.closest("[data-edit]");
  if (btn) openEditor(btn.dataset.edit);
}

function openEditor(id) {
  const entry = id ? state.entries.find(e => e.id === id) : null;
  state.editing = id;

  els.expenseDialogTitle.textContent = entry ? formatMonthLabel(entry.id) : "Nuevo mes";
  els.expenseId.value = id || "";
  els.expenseMonth.value = entry ? entry.id : suggestNextMonth();
  els.expenseMonth.disabled = !!entry;
  els.expenseIncomeNTT.value = entry?.incomeNTT ?? "";
  els.expenseIncomeVar.value = entry?.incomeVar ?? "";
  els.expenseIncomeNotes.value = entry?.incomeNotes ?? "";
  els.expenseRevolut.value = entry?.revolut ?? "";
  els.expenseRevSaved.value = entry?.revSaved ?? "";
  els.expenseOtherBank.value = entry?.otherBank ?? "";
  els.expenseCash.value = entry?.cash ?? "";
  els.expenseSpent.value = entry?.spent ?? "";
  els.expenseExtras.value = entry?.extras ?? "";
  els.expenseSaved.value = entry?.saved ?? "";

  els.deleteExpenseButton.style.display = entry ? "" : "none";
  els.expenseDialog.showModal();
}

async function saveExpense(event) {
  event.preventDefault();
  if (els.expenseDialog.returnValue === "cancel") return;

  const id = els.expenseMonth.value;
  if (!id) return;

  const data = {
    id,
    incomeNTT: parseNum(els.expenseIncomeNTT.value),
    incomeVar: parseNum(els.expenseIncomeVar.value),
    incomeNotes: els.expenseIncomeNotes.value.trim(),
    revolut: parseNum(els.expenseRevolut.value),
    revSaved: parseNum(els.expenseRevSaved.value),
    otherBank: parseNum(els.expenseOtherBank.value),
    cash: parseNum(els.expenseCash.value),
    spent: els.expenseSpent.value.trim() === "" ? null : parseNum(els.expenseSpent.value),
    extras: els.expenseExtras.value.trim(),
    saved: els.expenseSaved.value.trim() === "" ? null : parseNum(els.expenseSaved.value)
  };

  const idx = state.entries.findIndex(e => e.id === id);
  if (idx >= 0) {
    state.entries[idx] = data;
  } else {
    state.entries.push(data);
  }

  await persistExpenses();
  els.expenseDialog.close();
  render();
}

async function deleteExpense() {
  const id = els.expenseId.value;
  if (!id || !confirm("¿Eliminar este mes?")) return;
  state.entries = state.entries.filter(e => e.id !== id);
  await persistExpenses();
  els.expenseDialog.close();
  render();
}

/* ── Crypto ─────────────────────────────────────────────────── */

async function deriveKeyBase64(password, saltBase64, iterations) {
  const passwordKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: base64ToBytes(saltBase64), iterations },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["decrypt"]
  );
  const raw = await crypto.subtle.exportKey("raw", key);
  return bytesToBase64(new Uint8Array(raw));
}

async function decryptEnvelopeWithKey(envelope, keyBase64) {
  const key = await crypto.subtle.importKey("raw", base64ToBytes(keyBase64), { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(envelope.iv) }, key, base64ToBytes(envelope.ciphertext));
  return JSON.parse(new TextDecoder().decode(plaintext));
}

async function encryptWithKey(data, keyBase64) {
  const key = await crypto.subtle.importKey("raw", base64ToBytes(keyBase64), { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

async function fetchJSON(url) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

/* ── Utilities ──────────────────────────────────────────────── */

function base64ToBytes(v) { const b = atob(v); return Uint8Array.from(b, c => c.charCodeAt(0)); }
function bytesToBase64(bytes) { let b = ""; for (const byte of bytes) b += String.fromCharCode(byte); return btoa(b); }
function clone(v) { return JSON.parse(JSON.stringify(v)); }
function n(v) { const num = Number(v); return Number.isFinite(num) ? num : 0; }
function avg(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }

function parseNum(v) {
  const raw = String(v || "").trim().replace(/\s/g, "");
  if (!raw) return 0;
  const commaIdx = raw.lastIndexOf(",");
  const dotIdx = raw.lastIndexOf(".");
  let normalized = raw;
  if (commaIdx !== -1 && dotIdx !== -1) {
    normalized = commaIdx > dotIdx ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  } else if (commaIdx !== -1) {
    normalized = raw.replace(",", ".");
  }
  const num = Number(normalized);
  return Number.isFinite(num) ? num : 0;
}

function formatMonthLabel(id) {
  const [y, m] = id.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

function suggestNextMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function esc(v) {
  return String(v || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
