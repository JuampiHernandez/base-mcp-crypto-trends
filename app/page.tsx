import { PreviewCard } from "./preview-card";
import { BRAND, SIGNAL_PRICE, NETWORK_LABEL } from "@/lib/config";

export default function Home() {
  return (
    <div className="bg-grid min-h-screen">
      <Header />

      <main className="mx-auto w-full max-w-6xl px-6">
        {/* Hero */}
        <section className="grid items-center gap-10 pt-16 pb-20 md:grid-cols-2 md:pt-24">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Pay-per-call API · USDC over x402 · {NETWORK_LABEL}
            </div>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Market signals,
              <br />
              <span className="text-brand">priced per call.</span>
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
              {BRAND.description}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#api"
                className="rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition hover:brightness-110"
              >
                View the API
              </a>
              <div className="rounded-xl border border-border bg-surface px-5 py-3 text-sm">
                <span className="text-muted">from </span>
                <span className="font-semibold">{SIGNAL_PRICE}</span>
                <span className="text-muted"> / signal</span>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
              <Stat label="No API keys" />
              <Stat label="No subscription" />
              <Stat label="Agent-native (x402)" />
              <Stat label="Settles in seconds" />
            </div>
          </div>

          <PreviewCard />
        </section>

        {/* How it works */}
        <section className="border-t border-border py-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            How agents use it
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Step
              n="1"
              title="Request the signal"
              body="An AI agent calls GET /api/signal. With no payment, it gets HTTP 402 and the exact USDC price + pay-to details."
            />
            <Step
              n="2"
              title="Pay autonomously"
              body={`The agent pays ${SIGNAL_PRICE} USDC over x402 (via Base MCP) and retries — no human approval per call, no keys.`}
            />
            <Step
              n="3"
              title="Act on the result"
              body="It receives an explainable buy / hold / sell signal with a 0–100 score, then acts onchain — swap, stake, or report."
            />
          </div>
        </section>

        {/* What goes into a signal */}
        <section className="border-t border-border py-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            What goes into one signal
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Feed name="Price momentum" detail="24h · 7d · 30d trend structure" />
            <Feed name="Crowd sentiment" detail="Fear & Greed Index (contrarian)" />
            <Feed name="Market breadth" detail="Total mcap trend · BTC dominance" />
            <Feed name="Composite score" detail="Weighted 0–100 + confidence" />
          </div>
          <p className="mt-4 text-xs text-muted">
            Aggregated from multiple public market data feeds into a single,
            machine-readable verdict.
          </p>
        </section>

        {/* API */}
        <section id="api" className="border-t border-border py-16">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted">
            The API
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <Code
              title="Request"
              lines={[
                "$ curl https://crypto-trends.app/api/signal?asset=bitcoin",
                "",
                "HTTP/1.1 402 Payment Required",
                "{",
                `  "accepts": [{ "scheme": "exact",`,
                `     "price": "${SIGNAL_PRICE}", "network": "${NETWORK_LABEL}" }]`,
                "}",
              ]}
            />
            <Code
              title="After payment (200 OK)"
              lines={[
                "{",
                '  "symbol": "BTC",',
                '  "signal": "ACCUMULATE",',
                '  "confidence": 0.72,',
                '  "score": 68,',
                '  "rationale": "Fear & Greed at 22…",',
                '  "factors": [ … ]',
                "}",
              ]}
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-8 text-xs text-muted md:flex-row md:items-center md:justify-between">
          <span>© {new Date().getFullYear()} Crypto Trends — demo project.</span>
          <span>
            Signals are for demonstration only and are not financial advice.
          </span>
        </div>
      </footer>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-brand text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M3 16l5-6 4 4 5-7 4 5"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight">
            Crypto Trends
          </span>
        </div>
        <nav className="flex items-center gap-5 text-sm text-muted">
          <a href="#api" className="hover:text-foreground">
            API
          </a>
          <span className="hidden rounded-full border border-border px-3 py-1 text-xs sm:inline">
            x402 · {NETWORK_LABEL}
          </span>
        </nav>
      </div>
    </header>
  );
}

function Stat({ label }: { label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-brand">
        <path
          d="M5 12l4 4 10-10"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label}
    </span>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-sm font-bold text-brand">
        {n}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{body}</p>
    </div>
  );
}

function Feed({ name, detail }: { name: string; detail: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="font-semibold">{name}</div>
      <div className="mt-1 text-xs text-muted">{detail}</div>
    </div>
  );
}

function Code({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-black/40">
      <div className="border-b border-border px-4 py-2 text-xs font-medium text-muted">
        {title}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-foreground/90">
        {lines.join("\n")}
      </pre>
    </div>
  );
}
