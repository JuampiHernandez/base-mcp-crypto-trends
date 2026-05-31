# ChatGPT prompt — architecture diagram (if you want to regenerate)

Copy everything below into ChatGPT (DALL·E / image) or any image model:

---

Create a 16:9 technical architecture diagram for a hackathon demo. Dark navy background (#07090f), clean infographic (not hand-drawn), blue accent #2f6bff, white text, readable at 1080p.

**Title:** Crypto Trends — Agentic Stack on Base

**Components and connections:**

1. **Cursor Agent** (center-left, large box with AI icon)
2. **Crypto Trends API** (top-right) — subtitle: Vercel • `/api/signal`
   - Arrow from Agent → API: label **x402 USDC ~$0.01**
   - Arrow from API → Agent: label **Signal: BUY / HOLD / SELL + score + factors**
   - Small note under API: **CoinGecko + Fear & Greed → one signal**
3. **Custom Plugin** (small box) — dotted arrow to Crypto Trends API
4. **Base MCP** (bottom-right) — inside list: **x402 pay**, **Balance / wallets**, **Swap USDC→ETH/BTC**, **send_calls**
   - Arrow Agent → Base MCP: **wallet ops**
5. **Morpho** (next to Base MCP) — **Query vaults • Deposit USDC yield**
   - Arrow Base MCP → Morpho: **execute deposit**
   - Dashed arrow Agent → Morpho: **discover APY**
6. **Base Account** (small box above) — **user approves spends** — dotted lines to Base MCP
7. Footer: **Base mainnet • real USDC**

No cluttered logos. Minimal, professional, suitable for end of a 3-minute demo video.

---

**If the image is wrong:** ask ChatGPT to fix labels only, or export as SVG from a diagram tool (Excalidraw / Figma) using the same boxes.
