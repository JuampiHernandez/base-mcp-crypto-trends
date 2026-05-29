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

## Agent Investment Orchestration

Use this for prompts like:

```text
I have 20 USDC on Base. Use Crypto Trends to make money with it.
```

Recommended flow:

1. Complete Base MCP onboarding and get the user's Base Account wallet only when needed.
2. Check the user's USDC balance on Base.
3. Fetch the Crypto Trends premium signal for `bitcoin`.
4. Interpret the signal:
   - `STRONG_BUY` or `ACCUMULATE`: allocate up to 50% of the user-approved budget to `cbBTC` using Base MCP `swap`.
   - `HOLD`: do not buy BTC; continue to the USDC yield step.
   - `REDUCE` or `AVOID`: do not buy BTC; explain why and ask before taking any market-risk action.
5. Find a USDC yield destination on Base:
   - Prefer Morpho CLI in Cursor:
     ```bash
     npx @morpho-org/cli@latest query-vaults --chain base --asset-symbol USDC --sort apy_desc --limit 5
     ```
   - Choose a vault only if it has reasonable liquidity and no obvious warnings. If the best choice is ambiguous, ask the user.
6. Prepare a deposit for the remaining budget:
   ```bash
   npx @morpho-org/cli@latest prepare-deposit --chain base --vault-address <vault> --user-address <address> --amount <amount>
   ```
7. Review simulation output. If `simulationOk` is false, stop and report the revert or warning.
8. Map prepared transactions into Base MCP `send_calls`:
   ```json
   {
     "chain": "base",
     "calls": [
       {
         "to": "<transaction.to>",
         "value": "<transaction.value or 0x0>",
         "data": "<transaction.data>"
       }
     ]
   }
   ```
9. Follow approval mode, wait for confirmation, then report:
   - x402 signal cost
   - signal, confidence, rationale
   - cbBTC amount bought, if any
   - USDC vault selected and APY
   - transaction links/status

---

## Demo Prompt

```text
Use the Crypto Trends plugin. I have 20 USDC on Base. Pay for the BTC signal, decide whether to buy cbBTC, then put the rest of the USDC into the best Morpho vault. Keep every step visible for the demo video.
```

For a safer dry run, replace the final sentence with:

```text
Do not execute swaps or deposits yet. Show me the exact actions and approval links you would request.
```
