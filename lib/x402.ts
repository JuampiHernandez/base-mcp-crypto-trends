import { x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import {
  FACILITATOR_URL,
  PAY_TO_ADDRESS,
  SIGNAL_PRICE,
  X402_NETWORK,
} from "@/lib/config";

export const x402Server = new x402ResourceServer(
  new HTTPFacilitatorClient({ url: FACILITATOR_URL }),
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
