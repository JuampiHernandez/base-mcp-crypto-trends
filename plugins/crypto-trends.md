# Crypto Trends Base MCP Plugin

> [!IMPORTANT]
> ## STOP — COMPLETE BASE MCP ONBOARDING BEFORE USING THIS PLUGIN
>
> Before using Crypto Trends in an agent workflow, complete the Base MCP onboarding flow:
> 1. Detect Base MCP tools and call `get_wallets` only when the workflow needs the user's address or balances.
> 2. Show the Base MCP disclaimer from the Base MCP skill.
> 3. For every write action, use Base MCP approval mode and wait for confirmation before reporting success.

Crypto Trends is a paid x402 market-signal API for AI agents. It aggregates public crypto data feeds into a compact buy / hold / sell signal, then lets the agent act through Base MCP tools such as `swap` and `send_calls`.

This plugin is optimized for Cursor or another CLI-capable harness. Use direct HTTP (`curl`/fetch) for this custom API rather than Base MCP `web_request`, because custom hosts are not guaranteed to be allowlisted.

---

## Product

- **Brand:** Crypto Trends
- **Premium endpoint:** `GET <BASE_URL>/api/signal?asset=<bitcoin|ethereum>`
- **Free preview endpoint:** `GET <BASE_URL>/api/preview?asset=<bitcoin|ethereum>`
- **Default local base URL:** `http://127.0.0.1:3000`
- **Default production base URL:** replace with the Vercel deployment URL.
- **Payment:** x402 exact USDC payment, configured by the API's HTTP 402 response.
- **Supported signal assets:** `bitcoin` (`BTC`) and `ethereum` (`ETH`).

The API response is market research only. It is not financial advice.

---

## Read Endpoints

### Free preview

```http
GET /api/preview?asset=bitcoin
```

Returns live price data and a locked signal teaser:

```json
{
  "brand": "Crypto Trends",
  "asset": "Bitcoin",
  "symbol": "BTC",
  "price": 73851,
  "change24h": 0.68,
  "locked": {
    "signal": "•••••••",
    "rationale": "Unlock the full signal..."
  },
  "unlock": {
    "price": "$0.05",
    "method": "x402",
    "endpoint": "/api/signal"
  }
}
```

### Premium x402 signal

```http
GET /api/signal?asset=bitcoin
```

If unpaid, the server returns `402 Payment Required` with x402 payment requirements.

After payment, it returns:

```json
{
  "brand": "Crypto Trends",
  "asset": "Bitcoin",
  "symbol": "BTC",
  "price": 73851,
  "change24h": 0.68,
  "change7d": -4.12,
  "signal": "ACCUMULATE",
  "confidence": 0.72,
  "score": 68,
  "horizon": "swing (1-4 weeks)",
  "rationale": "Conditions favor adding BTC exposure...",
  "factors": [
    {
      "name": "Fear & Greed Index",
      "value": "22 (Extreme Fear)",
      "weight": 0.4,
      "contribution": 0.56,
      "note": "Crowd fear historically marks accumulation zones"
    }
  ],
  "sources": [
    "CoinGecko /coins/markets",
    "CoinGecko /global",
    "Alternative.me Fear & Greed"
  ],
  "disclaimer": "Crypto Trends signals are for demonstration only and are not financial advice."
}
```

---

## x402 Payment Flow

1. Fetch `GET <BASE_URL>/api/signal?asset=bitcoin`.
2. If the response is `402`, inspect the payment requirements.
3. Use the Base MCP x402 payment/fetch tool exposed in the current MCP catalog to pay the requested USDC amount and retry the request. Follow the tool description exactly; tool names can change.
4. If the x402 tool returns an approval URL, present it as **Approve Transaction**, open it automatically on macOS with `open "<url>"`, then wait for the user to confirm approval before polling status.
5. Parse the paid `200 OK` JSON and continue.

Do not claim the paid signal is unlocked until the API returns the full JSON payload.

---

## Orchestration

Apply these rules for **every** Crypto Trends workflow, including vague prompts like “make money with this $20”.

### Autonomy

The user gives a **goal**, not a script. You decide:

- which asset to query (`bitcoin` and/or `ethereum`)
- whether to pay for one or two premium signals
- how to split budget between a directional buy and stable yield
- which Morpho vault or market fits the remainder

Run tools and terminal commands **without asking permission** for reads, previews, quotes, and simulations. Only stop when Base MCP requires a **Base Account approval** for spending or moving funds.

Do **not** ask “should I pay for the API?” or “should I swap?” when the user already asked you to make money with their USDC. Proceed with a clear plan, then surface approval links.

### Narration (demo and normal use)

Explain each phase in plain English **before and after** tool use so a non-technical viewer can follow:

1. **Intent** — what you are trying to accomplish next.
2. **Tool** — which capability you are using (Crypto Trends x402, Base MCP `swap`, Morpho, etc.).
3. **Result** — what came back (402 challenge, signal label, APY, approval link).
4. **Why it matters** — one sentence tying the step to the user’s goal.

When recording or demoing, explicitly call out:

- **Crypto Trends** — “I’m buying a machine-readable signal from our paid API.”
- **x402** — “No API key; the wallet pays USDC per HTTP 402, then retries.”
- **Custom plugin** — “This workflow is defined in the Crypto Trends plugin, not generic MCP.”
- **Base MCP** — “Swap and batch calls go through the user’s Base Account.”
- **Morpho** — “Remaining USDC goes to the best vault APY I can find.”

Keep narration concise; do not dump raw JSON unless the user asks.

### Product URL

Prefer the deployed API unless the user specifies local dev:

`https://basebuilderques.vercel.app`

---

## Agent Investment Orchestration

Typical user prompt:

```text
I have 20 USDC on Base. Make some money with it.
```

Autonomous flow (you decide details):

1. Complete Base MCP onboarding; call `get_wallets` when you need the payer address or balances.
2. Confirm USDC (and gas) on the payer wallet for the chain in use (`base` mainnet by default).
3. Pay for premium signal(s) via x402 on `GET /api/signal?asset=bitcoin` and/or `.../ethereum`.
4. Read `signal`, `symbol`, `confidence`, `score`, `rationale`, and `factors`. Choose the stronger opportunity if you fetched both.
5. Interpret signals:
   - `STRONG_BUY` or `ACCUMULATE` on **BTC** → swap part of USDC to **cbBTC** via Base MCP `swap`.
   - `STRONG_BUY` or `ACCUMULATE` on **ETH** → swap part of USDC to **ETH** (or WETH per swap tool) via Base MCP `swap`.
   - `HOLD` → skip directional buy; explain why.
   - `REDUCE` or `AVOID` → do not open risk; park in yield or report cash.
6. Default sizing unless the user specified otherwise: up to **~50%** of budget for the directional leg, **remainder** for yield.
7. Yield leg — find the best **USDC** Morpho vault on the same chain (Cursor: Morpho CLI or Morpho MCP):
   ```bash
   npx @morpho-org/cli@latest query-vaults --chain base --asset-symbol USDC --sort apy_desc --limit 5
   ```
   Match `--chain` to the chain holding the user’s funds (`base` for mainnet).
8. Prepare deposit, check `simulationOk`, then `send_calls` with all prepared calls in one batch when possible.
9. After confirmations, report: x402 cost, signal summary, swap (if any), vault + APY, and status.

Use Base MCP **`swap`** for token trades. A separate Uniswap plugin is not required for this demo.

---

## Approvals

Base MCP write tools (x402 pay, `swap`, `send_calls`) return an **approval URL**. Present each as **Approve Transaction**, refer to the destination as **Base Account**, and on macOS run `open "<url>"` when a shell is available.

Wait for the user to confirm each approval before calling `get_request_status` or `complete_x402_request`. Do not claim success early.

If the user asks for maximum autonomy: you still cannot skip wallet approvals in approval mode — that is a Base Account security boundary, not a Cursor limitation.

---

## Demo Prompt

Minimal (preferred on video):

```text
I have 20 USDC on Base. Make some money with it.
```

Dry run (rehearsal only):

```text
I have 20 USDC on Base. Make some money with it. Show your full plan and narrate each step, but do not execute swaps or deposits yet.
```
