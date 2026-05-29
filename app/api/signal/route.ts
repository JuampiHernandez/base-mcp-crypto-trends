import { NextRequest, NextResponse } from "next/server";
import { withX402 } from "@x402/next";
import { buildSignal } from "@/lib/signal";
import { signalPaymentConfig, x402Server } from "@/lib/x402";

/**
 * PREMIUM endpoint — gated by x402 (see proxy.ts).
 *
 * withX402 is the recommended protection for API routes because it settles
 * only after the route returns a successful response.
 */
async function handler(req: NextRequest) {
  const asset = req.nextUrl.searchParams.get("asset");
  try {
    const signal = await buildSignal(asset);
    return NextResponse.json(signal, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "signal_unavailable",
        message: err instanceof Error ? err.message : "Upstream data error",
      },
      { status: 502 },
    );
  }
}

export const GET = withX402<unknown>(handler, signalPaymentConfig, x402Server);
