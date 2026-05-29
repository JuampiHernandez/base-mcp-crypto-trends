import { paymentProxy, x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  X402_NETWORK,
  FACILITATOR_URL,
  PAY_TO_ADDRESS,
  SIGNAL_PRICE,
} from "@/lib/config";

/**
 * x402 paywall. Next.js 16 runs this file as the request proxy (the successor
 * to middleware.ts). Any request matching the config matcher must include a
 * settled USDC payment or it gets an HTTP 402 with payment instructions —
 * which AI agents (via Base MCP) pay automatically and then retry.
 */
const facilitatorClient = new HTTPFacilitatorClient({ url: FACILITATOR_URL });

const server = new x402ResourceServer(facilitatorClient).register(
  X402_NETWORK,
  new ExactEvmScheme(),
);

export const proxy = paymentProxy(
  {
    "/api/signal": {
      accepts: [
        {
          scheme: "exact",
          price: SIGNAL_PRICE,
          network: X402_NETWORK,
          payTo: PAY_TO_ADDRESS,
        },
      ],
      description:
        "Crypto Trends — one explainable buy/hold/sell signal (price momentum + market structure + crowd sentiment).",
      mimeType: "application/json",
    },
  },
  server,
);

export const config = {
  matcher: ["/api/signal/:path*", "/api/signal"],
};
