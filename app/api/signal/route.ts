import { NextRequest, NextResponse } from "next/server";
import { buildSignal } from "@/lib/signal";

/**
 * PREMIUM endpoint — gated by x402 (see proxy.ts).
 *
 * By the time this handler runs, the x402 middleware has already verified that
 * the caller paid the required USDC. We just compute and return the full signal.
 */
export async function GET(req: NextRequest) {
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
