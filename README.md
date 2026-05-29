# Crypto Trends

Crypto Trends is a Base MCP hackathon demo: a branded, x402-gated market-signal API that an AI agent can pay for with USDC, then use to act on Base.

The demo flow is:

```text
"I have 20 USDC on Base. Use Crypto Trends to make money with it."
```

The agent pays for a premium BTC signal, interprets it, swaps part of the budget to `cbBTC` when the signal is constructive, then deposits the remaining USDC into a Morpho vault via Base MCP approval flows.

## What Is Built

- Branded Next.js 16 landing page at `/`
- Free teaser endpoint at `GET /api/preview?asset=bitcoin`
- x402-gated premium endpoint at `GET /api/signal?asset=bitcoin`
- Multi-source signal engine using:
  - CoinGecko market data
  - CoinGecko global market data
  - Alternative.me Fear & Greed Index
- Base MCP custom plugin spec in `plugins/crypto-trends.md`
- Cursor MCP config in `.cursor/mcp.json` for Base MCP and Morpho MCP

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev -- -H 127.0.0.1 -p 3000
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

Smoke tests:

```bash
curl "http://127.0.0.1:3000/api/preview?asset=bitcoin"
curl -i "http://127.0.0.1:3000/api/signal?asset=bitcoin"
```

The premium endpoint should return `402 Payment Required` until paid through x402.

## Environment Variables

`.env.local` is intentionally gitignored. Fill these locally and in Vercel:

```bash
PAY_TO_ADDRESS=0xYourReceivingWalletAddress
SIGNAL_PRICE=\$0.05
X402_NETWORK=eip155:84532
FACILITATOR_URL=https://x402.org/facilitator
```

For Base mainnet real-USDC demo:

```bash
X402_NETWORK=eip155:8453
FACILITATOR_URL=https://api.cdp.coinbase.com/platform/v2/x402
CDP_API_KEY_ID=...
CDP_API_KEY_SECRET=...
```

Use Base Sepolia first. Flip to mainnet only after the full recording flow works.

## Base MCP Setup

The Base MCP skill has been installed into `.agents/skills/base-mcp`.

Cursor MCP config is in `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "base-mcp": { "url": "https://mcp.base.org" },
    "morpho": { "url": "https://mcp.morpho.org/" }
  }
}
```

Restart Cursor, then open Cursor Settings → MCP and connect/approve Base MCP.

## Custom Plugin

The custom plugin lives at `plugins/crypto-trends.md`.

Use this prompt in Cursor after Base MCP is connected:

```text
Use the Crypto Trends plugin at plugins/crypto-trends.md.
I have 20 USDC on Base. Pay for the BTC signal, decide whether to buy cbBTC, then put the rest of the USDC into the best Morpho vault. Keep every step visible for the demo video.
```

For a safe rehearsal:

```text
Use the Crypto Trends plugin at plugins/crypto-trends.md.
I have 20 USDC on Base. Pay for the BTC signal, then show the exact swaps/deposits you would request, but do not execute them yet.
```

## Video Script

1. Show the landing page: "Crypto Trends is a paid API built for AI agents."
2. Show the free preview: live price, locked signal.
3. In Cursor, run the demo prompt.
4. Agent hits `/api/signal`, receives `402`, pays with Base MCP/x402, and unlocks the signal.
5. Agent explains the BTC signal and allocation.
6. Agent swaps part of USDC to `cbBTC` if constructive.
7. Agent finds a Morpho USDC vault and prepares the deposit.
8. You approve the Base Account links.
9. End on the summary: signal cost, BTC exposure, vault deposit, and tx status.

## Important Notes

- This is a hackathon demo, not financial advice.
- All onchain writes should use small amounts.
- Every Base MCP write action may require a Base Account approval link.
- The current local `.env.local` uses a placeholder `PAY_TO_ADDRESS`; replace it before testing x402 payment.
