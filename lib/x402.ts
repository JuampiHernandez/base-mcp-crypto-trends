import { x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import {
  FACILITATOR_URL,
  IS_MAINNET,
  PAY_TO_ADDRESS,
  SIGNAL_PRICE,
  X402_NETWORK,
} from "@/lib/config";

// Mainnet settlement requires the Coinbase CDP facilitator, which is
// authenticated with CDP API keys. createFacilitatorConfig returns a config
// with both the CDP url and a createAuthHeaders() signer. The free x402.org
// facilitator (testnet) needs no auth, so we just pass its url.
const usesCdpFacilitator =
  IS_MAINNET || FACILITATOR_URL.includes("cdp.coinbase.com");

const facilitatorConfig = usesCdpFacilitator
  ? createFacilitatorConfig(
      process.env.CDP_API_KEY_ID,
      process.env.CDP_API_KEY_SECRET,
    )
  : { url: FACILITATOR_URL };

export const x402Server = new x402ResourceServer(
  new HTTPFacilitatorClient(facilitatorConfig),
).register(X402_NETWORK, new ExactEvmScheme());

export const signalPaymentConfig = {
  accepts: {
    scheme: "exact" as const,
    price: SIGNAL_PRICE,
    network: X402_NETWORK,
    payTo: PAY_TO_ADDRESS,
  },
  description:
    "Crypto Trends — one explainable buy/hold/sell signal (price momentum + market structure + crowd sentiment).",
  mimeType: "application/json",
};
