import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { decryptJson, encryptJson } from "./crypto-utils.mjs";

const root = process.cwd();
const portfolioPath = path.join(root, "data", "portfolio.enc.json");
const outputPath = path.join(root, "data", "quotes.enc.json");
const password = process.env.PORTFOLIO_PASSWORD;

if (!password) {
  throw new Error("Missing PORTFOLIO_PASSWORD secret");
}

const portfolioEnvelope = JSON.parse(await readFile(portfolioPath, "utf8"));
const portfolio = await decryptJson(portfolioEnvelope, password);
const previous = await readPrevious(password);
const assets = (portfolio.assets || []).filter((asset) => asset.type !== "cash" && asset.quoteSymbol);
const stooqAssets = assets.filter((asset) => (asset.quoteSource || "stooq") === "stooq");
const yahooAssets = assets.filter((asset) => asset.quoteSource === "yahoo");
const stooqQuotes = await getStooqQuotes(stooqAssets);
const yahooQuotes = await getYahooQuotes(yahooAssets);
const stooqYields = await getDividendYields(stooqAssets);
const fx = await getFxRates(previous.fx);

const quotes = {
  ...(previous.quotes || {}),
  ...stooqQuotes,
  ...yahooQuotes
};

for (const [symbol, yieldPct] of Object.entries(stooqYields)) {
  if (quotes[symbol]) quotes[symbol].dividendYield = yieldPct;
}

const today = new Date().toISOString().slice(0, 10);
for (const [symbol, quote] of Object.entries(quotes)) {
  const prevQuote = previous.quotes?.[symbol];
  const history = prevQuote?.history || [];
  
  if (history.length > 0 && history[history.length - 1].date === today) {
    history[history.length - 1].price = quote.price;
  } else {
    history.push({ date: today, price: quote.price });
  }
  
  while (history.length > 40) history.shift();
  quote.history = history;
}

const dataChanged = JSON.stringify({ quotes, fx }) !== JSON.stringify({
  quotes: previous.quotes || {},
  fx: previous.fx || null
});

const payload = {
  updatedAt: dataChanged || !previous.updatedAt ? new Date().toISOString() : previous.updatedAt,
  source: "GitHub Actions + Stooq + Frankfurter",
  quotes,
  fx
};

if (!dataChanged && previous.updatedAt) {
  console.log("No encrypted quote changes");
  process.exit(0);
}

const envelope = await encryptJson(payload, password, { saltBase64: portfolioEnvelope.salt });

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(envelope, null, 2)}\n`, "utf8");

console.log(`Saved ${Object.keys(quotes).length} encrypted quotes to ${path.relative(root, outputPath)}`);

async function readPrevious(secret) {
  try {
    const envelope = JSON.parse(await readFile(outputPath, "utf8"));
    return decryptJson(envelope, secret);
  } catch {
    return { quotes: {}, fx: null };
  }
}

async function getStooqQuotes(items) {
  if (!items.length) {
    return {};
  }

  const symbols = items.map((item) => item.quoteSymbol).join("+");
  const url = `https://stooq.com/q/l/?s=${encodeURIComponent(symbols).replaceAll("%2B", "+")}&f=sd2t2ohlcv&h&e=csv`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Stooq returned ${response.status}`);
  }

  const csv = await response.text();
  const rows = parseCsv(csv);
  const result = {};

  for (const row of rows) {
    const symbol = row.Symbol;
    const close = Number(row.Close);
    const asset = items.find((item) => item.quoteSymbol === symbol);

    if (!asset || !Number.isFinite(close)) {
      continue;
    }

    result[symbol] = {
      symbol,
      price: close,
      currency: asset.currency,
      source: "Stooq",
      asOf: `${row.Date}T${row.Time}`
    };
  }

  return result;
}

async function getYahooQuotes(items) {
  const result = {};

  for (const item of items) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.quoteSymbol)}?interval=1d&range=5d`;
      const response = await fetch(url, {
        headers: {
          "user-agent": "Mozilla/5.0"
        }
      });

      if (!response.ok) {
        console.warn(`Yahoo quote failed: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const quote = data.chart?.result?.[0];
      const meta = quote?.meta || {};
      const closeSeries = quote?.indicators?.quote?.[0]?.close || [];
      const lastClose = [...closeSeries].reverse().find((value) => Number.isFinite(value));
      const price = Number(meta.regularMarketPrice || lastClose);

      if (!Number.isFinite(price)) {
        continue;
      }

      const dividendYield = Number.isFinite(meta.trailingAnnualDividendYield)
        ? +(meta.trailingAnnualDividendYield * 100).toFixed(2)
        : null;

      result[item.quoteSymbol] = {
        symbol: item.quoteSymbol,
        price,
        currency: meta.currency || item.currency,
        source: "Yahoo",
        asOf: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : new Date().toISOString(),
        ...(dividendYield !== null && { dividendYield })
      };
    } catch (error) {
      console.warn(`Yahoo quote failed: ${error.message}`);
    }
  }

  return result;
}

async function getFxRates(previousFx) {
  try {
    const response = await fetch("https://api.frankfurter.dev/v1/latest");
    if (!response.ok) {
      throw new Error(`Frankfurter returned ${response.status}`);
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
  } catch (error) {
    if (previousFx) {
      console.warn(`Using previous FX rates: ${error.message}`);
      return previousFx;
    }

    throw error;
  }
}

async function getDividendYields(items) {
  const result = {};
  for (const item of items) {
    try {
      const yahooSymbol = stooqToYahoo(item.quoteSymbol);
      const url = `https://query1.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(yahooSymbol)}?modules=summaryDetail`;
      const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
      if (!response.ok) continue;
      const data = await response.json();
      const raw = data.quoteSummary?.result?.[0]?.summaryDetail?.dividendYield?.raw;
      if (Number.isFinite(raw) && raw > 0) {
        result[item.quoteSymbol] = +(raw * 100).toFixed(2);
      }
    } catch {
      // best-effort, skip on error
    }
  }
  return result;
}

function stooqToYahoo(symbol) {
  return symbol
    .replace(/\//g, "-")   // BRK/B.US → BRK-B.US
    .replace(/\.US$/, "")  // AAPL.US → AAPL
    .replace(/\.PL$/, ".WA"); // PKN.PL → PKN.WA
}

function parseCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  const header = splitCsvLine(lines.shift() || "");

  return lines.map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(header.map((key, index) => [key, cells[index]]));
  });
}

function splitCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;

  for (const char of line) {
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }

    if (char === "," && !quoted) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}
