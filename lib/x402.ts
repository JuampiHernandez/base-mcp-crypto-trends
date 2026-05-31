import { x402ResourceServer } from "@x402/next";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { HTTPFacilitatorClient } from "@x402/core/server";
import type { FacilitatorClient } from "@x402/core/server";
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

function dump(value: unknown): string {
  try {
    if (value instanceof Error) {
      const extra: Record<string, unknown> = {};
      for (const key of Object.getOwnPropertyNames(value)) {
        extra[key] = (value as unknown as Record<string, unknown>)[key];
      }
      return JSON.stringify({ message: value.message, ...extra });
    }
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

// Diagnostic wrapper: surfaces the facilitator's real verify/settle rejection
// reason into the runtime logs (the x402 lib otherwise swallows it into an
// empty 402). Look for "[X402_DIAG]" in Vercel logs.
function withDiagnostics(inner: FacilitatorClient): FacilitatorClient {
  return {
    async verify(payload, requirements) {
      try {
        const res = await inner.verify(payload, requirements);
        if (!res?.isValid) {
          console.error("[X402_DIAG] verify invalid:", dump(res));
        }
        return res;
      } catch (err) {
        console.error("[X402_DIAG] verify threw:", dump(err));
        throw err;
      }
    },
    async settle(payload, requirements) {
      try {
        const res = await inner.settle(payload, requirements);
        if (!res?.success) {
          console.error("[X402_DIAG] settle failed:", dump(res));
        }
        return res;
      } catch (err) {
        console.error("[X402_DIAG] settle threw:", dump(err));
        throw err;
      }
    },
    getSupported() {
      return inner.getSupported();
    },
  };
}

export const x402Server = new x402ResourceServer(
  withDiagnostics(new HTTPFacilitatorClient(facilitatorConfig)),
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
