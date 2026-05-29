/**
 * Central config for the Crypto Trends x402 service.
 *
 * Defaults target Base Sepolia + the free x402.org facilitator so the whole
 * flow runs with zero signup. Flip the env vars below to accept real USDC on
 * Base mainnet (CDP facilitator) for the live "real money" demo.
 */

// CAIP-2 network id. Base mainnet = eip155:8453, Base Sepolia = eip155:84532
export const X402_NETWORK = (process.env.X402_NETWORK ?? "eip155:84532") as
  | "eip155:8453"
  | "eip155:84532";

// Facilitator that verifies + settles the payment.
// - Base Sepolia (no signup): https://x402.org/facilitator
// - Mainnet (CDP, needs keys): https://api.cdp.coinbase.com/platform/v2/x402
export const FACILITATOR_URL =
  process.env.FACILITATOR_URL ?? "https://x402.org/facilitator";

// Wallet that receives the USDC paywall payments. MUST be set in prod.
export const PAY_TO_ADDRESS = (process.env.PAY_TO_ADDRESS ??
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

// Price per premium signal call, as a USDC dollar string. Dotenv treats `$`
// as expansion syntax, so normalize values like `.05` or `0.05` back to `$0.05`.
const rawSignalPrice = (process.env.SIGNAL_PRICE ?? "$0.05").replace(
  /^\\\$/,
  "$",
);
export const SIGNAL_PRICE = rawSignalPrice.startsWith("$")
  ? rawSignalPrice
  : `$${rawSignalPrice.startsWith(".") ? `0${rawSignalPrice}` : rawSignalPrice}`;

export const IS_MAINNET = X402_NETWORK === "eip155:8453";

export const NETWORK_LABEL = IS_MAINNET ? "Base" : "Base Sepolia";

export const BRAND = {
  name: "Crypto Trends",
  tagline: "Machine-readable market signals, priced per call.",
  description:
    "One paid API call returns a single, explainable buy / hold / sell signal — distilled from price momentum, on-chain market structure, and crowd sentiment. Built for AI agents to pay with USDC and act, no API keys.",
} as const;
