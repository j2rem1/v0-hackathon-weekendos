import { NextResponse } from "next/server";
import { planItinerary } from "@/lib/planner";
import { searchVenuesByVibe } from "@/lib/search";
import { PlanRequest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanRequest;

    if (!body.vibe || typeof body.vibe !== "string") {
      return NextResponse.json({ error: "Tell me what you're up for, even one line." }, { status: 400 });
    }
    if (!body.budget_php || body.budget_php < 0) {
      return NextResponse.json({ error: "Set a budget per person." }, { status: 400 });
    }
    if (!body.party_size || body.party_size < 1) {
      return NextResponse.json({ error: "Party size must be at least 1." }, { status: 400 });
    }

    const planRequest: PlanRequest = {
      vibe: body.vibe,
      budget_php: body.budget_php,
      party_size: body.party_size,
      start_time: body.start_time || "10:00",
      end_time: body.end_time || "22:00",
      exclude_ids: Array.isArray(body.exclude_ids) ? body.exclude_ids : [],
    };

    let search;
    try {
      search = await searchVenuesByVibe(planRequest.vibe);
    } catch (err: any) {
      console.error("[plan] search failed:", err);
      return NextResponse.json(
        { error: `Venue search failed: ${err?.message ?? "unknown error"}` },
        { status: 502 }
      );
    }

    if (search.venues.length === 0) {
      return NextResponse.json(
        { error: "No venues came back. Try a broader vibe or different area." },
        { status: 503 }
      );
    }

    const result = planItinerary(planRequest, search.venues, {
      area: search.area,
      areaLocked: search.areaLocked,
    });

    if (result.stops.length === 0) {
      return NextResponse.json(
        {
          error: search.areaLocked
            ? `Found ${search.venues.length} ${search.area} venues but none fit your budget, time, or weather. Loosen one and try again.`
            : "Found venues but none fit your budget, time, or weather. Try a wider window or higher budget.",
          poolSize: search.venues.length,
          area: search.area,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[plan] unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to generate plan: ${error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }
}
