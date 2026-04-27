import { NextResponse } from "next/server";
import { searchVenuesByVibe } from "@/lib/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const vibe = url.searchParams.get("vibe") ?? "chill afternoon with friends in BGC";

  const key = process.env.SCRAPERAPI_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, hasKey: false, message: "SCRAPERAPI_KEY not set" });
  }

  try {
    const result = await searchVenuesByVibe(vibe);
    return NextResponse.json({
      ok: true,
      hasKey: true,
      keyPreview: key.slice(0, 4) + "..." + key.slice(-4),
      vibe,
      lockedArea: result.area,
      areaLocked: result.areaLocked,
      venueCount: result.venues.length,
      sample: result.venues.slice(0, 5).map((v) => ({
        name: v.name,
        type: v.type,
        area: v.area,
        cost: v.cost,
        rating: v.rating,
        reviewCount: v.reviewCount,
        vibe: v.vibe,
        blurb: v.blurb,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, hasKey: true, error: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
