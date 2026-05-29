import { NextRequest, NextResponse } from "next/server";
import { buildSignal, toPreview } from "@/lib/signal";
import { SIGNAL_PRICE } from "@/lib/config";

/**
 * FREE teaser endpoint. Returns live price + a locked signal so the landing
 * page (and curious humans) can see the product is real, while the actual
 * call/score stays behind the x402 paywall on /api/signal.
 */
export async function GET(req: NextRequest) {
  const asset = req.nextUrl.searchParams.get("asset");
  try {
    const signal = await buildSignal(asset);
    const preview = toPreview(signal);
    preview.unlock.price = SIGNAL_PRICE;
    return NextResponse.json(preview, {
      headers: { "cache-control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "preview_unavailable",
        message: err instanceof Error ? err.message : "Upstream data error",
      },
      { status: 502 },
    );
  }
}
