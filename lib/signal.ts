/**
 * Crypto Trends signal engine.
 *
 * Aggregates several FREE public data sources into one explainable signal:
 *   - CoinGecko /coins/markets  -> price + 24h/7d/30d momentum
 *   - CoinGecko /global         -> BTC dominance + total market-cap trend
 *   - Alternative.me Fear&Greed -> crowd sentiment (contrarian factor)
 *
 * The output is intentionally compact and machine-readable so an AI agent can
 * read `signal` + `confidence` and decide whether to act. This is a demo, not
 * financial advice.
 */

export type SignalLabel =
  | "STRONG_BUY"
  | "ACCUMULATE"
  | "HOLD"
  | "REDUCE"
  | "AVOID";

export type Factor = {
  name: string;
  value: string;
  weight: number;
  /** signed contribution to the composite score, roughly -1..+1 */
  contribution: number;
  note: string;
};

export type Signal = {
  brand: "Crypto Trends";
  asset: string;
  symbol: string;
  asOf: string;
  price: number;
  change24h: number;
  change7d: number;
  signal: SignalLabel;
  /** 0..1 */
  confidence: number;
  /** 0..100 composite */
  score: number;
  horizon: string;
  rationale: string;
  factors: Factor[];
  sources: string[];
  disclaimer: string;
};

const SUPPORTED: Record<string, { id: string; symbol: string; name: string }> = {
  bitcoin: { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  btc: { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  ethereum: { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  eth: { id: "ethereum", symbol: "ETH", name: "Ethereum" },
};

export function resolveAsset(input?: string | null) {
  const key = (input ?? "bitcoin").trim().toLowerCase();
  return SUPPORTED[key] ?? SUPPORTED.bitcoin;
}

type MarketRow = {
  current_price: number;
  price_change_percentage_24h_in_currency?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
};

type GlobalData = {
  data: {
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
  };
};

type FngData = {
  data: { value: string; value_classification: string }[];
};

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    // cache briefly so the landing page + repeated agent calls stay snappy
    // and we don't hammer the free tiers
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Upstream ${res.status} for ${url}`);
  return (await res.json()) as T;
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** map a -1..+1 composite into a label */
function labelFor(composite: number): SignalLabel {
  if (composite >= 0.45) return "STRONG_BUY";
  if (composite >= 0.12) return "ACCUMULATE";
  if (composite > -0.12) return "HOLD";
  if (composite > -0.45) return "REDUCE";
  return "AVOID";
}

export async function buildSignal(assetInput?: string | null): Promise<Signal> {
  const asset = resolveAsset(assetInput);

  const [markets, global, fng] = await Promise.all([
    getJson<MarketRow[]>(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${asset.id}&price_change_percentage=24h,7d,30d`,
    ),
    getJson<GlobalData>("https://api.coingecko.com/api/v3/global"),
    getJson<FngData>("https://api.alternative.me/fng/?limit=1"),
  ]);

  const row = markets[0];
  const price = row?.current_price ?? 0;
  const change24h = row?.price_change_percentage_24h_in_currency ?? 0;
  const change7d = row?.price_change_percentage_7d_in_currency ?? 0;
  const change30d = row?.price_change_percentage_30d_in_currency ?? 0;

  const fngValue = Number(fng.data?.[0]?.value ?? "50");
  const fngClass = fng.data?.[0]?.value_classification ?? "Neutral";

  const totalMcap24h = global.data?.market_cap_change_percentage_24h_usd ?? 0;
  const btcDominance = global.data?.market_cap_percentage?.btc ?? 0;

  // --- factor scoring (each contribution roughly -1..+1) ---

  // Sentiment is contrarian: extreme fear (low FNG) = accumulation zone.
  const sentiment = clamp((50 - fngValue) / 50, -1, 1);

  // Medium-term momentum: 7d + 30d trend. Positive structure is constructive.
  const momentum = clamp((change7d * 0.6 + change30d * 0.4) / 12, -1, 1);

  // Short-term: a sharp 24h drop into fear is a dip-buy nudge, a sharp spike
  // into greed is a chase warning.
  const shortTerm = clamp(-change24h / 8, -1, 1) * 0.5;

  // Market breadth: is the whole market expanding or contracting today?
  const breadth = clamp(totalMcap24h / 6, -1, 1);

  const factors: Factor[] = [
    {
      name: "Fear & Greed Index",
      value: `${fngValue} (${fngClass})`,
      weight: 0.4,
      contribution: sentiment,
      note:
        sentiment > 0
          ? "Crowd fear historically marks accumulation zones"
          : "Crowd greed raises the risk of chasing",
    },
    {
      name: "Medium-term momentum",
      value: `7d ${change7d.toFixed(1)}% · 30d ${change30d.toFixed(1)}%`,
      weight: 0.3,
      contribution: momentum,
      note: momentum >= 0 ? "Trend structure intact" : "Trend rolling over",
    },
    {
      name: "Short-term move",
      value: `24h ${change24h.toFixed(1)}%`,
      weight: 0.15,
      contribution: shortTerm,
      note: shortTerm > 0 ? "Pullback into support" : "Extended short-term",
    },
    {
      name: "Market breadth",
      value: `total mcap 24h ${totalMcap24h.toFixed(1)}% · BTC dom ${btcDominance.toFixed(1)}%`,
      weight: 0.15,
      contribution: breadth,
      note: breadth >= 0 ? "Liquidity expanding" : "Liquidity contracting",
    },
  ];

  const composite = factors.reduce(
    (acc, f) => acc + f.weight * f.contribution,
    0,
  ); // ~ -1..+1

  const signal = labelFor(composite);
  const score = Math.round(clamp((composite + 1) / 2, 0, 1) * 100);
  const confidence = Number(clamp(0.5 + Math.abs(composite) * 0.5, 0.5, 0.95).toFixed(2));

  const lead =
    signal === "STRONG_BUY" || signal === "ACCUMULATE"
      ? `Conditions favor adding ${asset.symbol} exposure.`
      : signal === "HOLD"
        ? `Signals are mixed for ${asset.symbol}; no edge to act on right now.`
        : `Caution on ${asset.symbol}; conditions favor trimming exposure.`;

  const rationale =
    `${lead} Fear & Greed sits at ${fngValue} (${fngClass}); ` +
    `7d momentum is ${change7d.toFixed(1)}% and 30d is ${change30d.toFixed(1)}%; ` +
    `total market cap moved ${totalMcap24h.toFixed(1)}% in 24h. ` +
    `Composite score ${score}/100, confidence ${(confidence * 100).toFixed(0)}%.`;

  return {
    brand: "Crypto Trends",
    asset: asset.name,
    symbol: asset.symbol,
    asOf: new Date().toISOString(),
    price,
    change24h: Number(change24h.toFixed(2)),
    change7d: Number(change7d.toFixed(2)),
    signal,
    confidence,
    score,
    horizon: "swing (1–4 weeks)",
    rationale,
    factors,
    sources: [
      "CoinGecko /coins/markets",
      "CoinGecko /global",
      "Alternative.me Fear & Greed",
    ],
    disclaimer:
      "Crypto Trends signals are for demonstration only and are not financial advice.",
  };
}

/** A free, intentionally-degraded teaser used by the public landing page. */
export function toPreview(signal: Signal) {
  return {
    brand: signal.brand,
    asset: signal.asset,
    symbol: signal.symbol,
    asOf: signal.asOf,
    price: signal.price,
    change24h: signal.change24h,
    teaser: `${signal.symbol} signal is ready.`,
    locked: {
      signal: "•••••••",
      confidence: "••%",
      score: "••/100",
      rationale: "Unlock the full signal, score, and factor breakdown with one x402 payment.",
    },
    unlock: {
      price: undefined as string | undefined, // filled by the route
      method: "x402",
      endpoint: "/api/signal",
    },
    sources: signal.sources,
  };
}
