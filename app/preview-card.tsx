"use client";

import { useEffect, useState } from "react";

type Preview = {
  asset: string;
  symbol: string;
  price: number;
  change24h: number;
  asOf: string;
  locked: { signal: string; confidence: string; score: string; rationale: string };
  unlock: { price?: string; method: string; endpoint: string };
  sources: string[];
};

const ASSETS = [
  { key: "bitcoin", label: "BTC" },
  { key: "ethereum", label: "ETH" },
];

export function PreviewCard() {
  const [asset, setAsset] = useState("bitcoin");
  const [data, setData] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPreview() {
      try {
        const res = await fetch(`/api/preview?asset=${asset}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const preview = (await res.json()) as Preview;
        if (!cancelled) {
          setData(preview);
          setError(null);
        }
      } catch {
        if (!cancelled) setError("Live data unavailable right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [asset]);

  const up = (data?.change24h ?? 0) >= 0;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xl shadow-black/40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-muted">
            Live preview
          </span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
          </span>
        </div>
        <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1">
          {ASSETS.map((a) => (
            <button
              key={a.key}
              onClick={() => {
                setLoading(true);
                setAsset(a.key);
              }}
              className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                asset === a.key
                  ? "bg-brand text-white"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight">
          {loading || !data
            ? "—"
            : `$${data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
        </span>
        {data && (
          <span
            className={`text-sm font-semibold ${up ? "text-green" : "text-red"}`}
          >
            {up ? "▲" : "▼"} {Math.abs(data.change24h).toFixed(2)}% 24h
          </span>
        )}
      </div>
      <div className="mt-0.5 text-xs text-muted">
        {data ? `${data.asset} · sources: ${data.sources.length} feeds` : "\u00a0"}
      </div>

      {/* locked signal */}
      <div className="relative mt-5 overflow-hidden rounded-xl border border-border bg-surface-2 p-4">
        <div className="grid grid-cols-3 gap-3 blur-[5px] select-none">
          {["Signal", "Confidence", "Score"].map((k) => (
            <div key={k}>
              <div className="text-[10px] uppercase tracking-wider text-muted">
                {k}
              </div>
              <div className="mt-1 text-lg font-bold">••••</div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-2/70 backdrop-blur-[1px]">
          <div className="flex items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-3 py-1 text-xs font-semibold text-foreground">
            <LockIcon /> Locked
          </div>
          <p className="px-6 text-center text-xs text-muted">
            Full signal, score & factor breakdown unlock with one{" "}
            <span className="font-semibold text-foreground">
              {data?.unlock.price ?? "$0.05"}
            </span>{" "}
            x402 payment.
          </p>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red">{error}</p>}

      <div className="mt-4 rounded-lg border border-border bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-muted">
        <span className="text-brand">GET</span> {data?.unlock.endpoint ?? "/api/signal"}
        ?asset={asset}
        <br />
        <span className="text-amber">← 402 Payment Required</span> · pay{" "}
        {data?.unlock.price ?? "$0.05"} USDC → retry → 200
      </div>
    </div>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="10" width="16" height="11" rx="2" fill="currentColor" />
      <path
        d="M8 10V7a4 4 0 1 1 8 0v3"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}
