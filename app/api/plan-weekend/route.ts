import { NextResponse } from "next/server";
import { planWeekend } from "@/lib/planner";
import { searchVenuesByVibe } from "@/lib/search";
import { PlanRequest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanRequest;

    if (!body.vibe || typeof body.vibe !== "string") {
      return NextResponse.json({ error: "Vibe description is required" }, { status: 400 });
    }
    if (!body.budget_php || body.budget_php < 0) {
      return NextResponse.json({ error: "Valid budget is required" }, { status: 400 });
    }
    if (!body.party_size || body.party_size < 1) {
      return NextResponse.json({ error: "Party size must be at least 1" }, { status: 400 });
    }

    const planRequest: PlanRequest = {
      vibe: body.vibe,
      budget_php: body.budget_php,
      party_size: body.party_size,
      start_time: body.start_time || "10:00",
      end_time: body.end_time || "22:00",
      exclude_ids: Array.isArray(body.exclude_ids) ? body.exclude_ids : [],
    };

    let venuePool;
    try {
      venuePool = await searchVenuesByVibe(planRequest.vibe);
    } catch (err: any) {
      console.error("[plan-weekend] search failed:", err);
      return NextResponse.json(
        { error: `Venue search failed: ${err?.message ?? "unknown error"}` },
        { status: 502 }
      );
    }

    if (venuePool.length === 0) {
      return NextResponse.json(
        { error: "No venues returned from ScraperAPI — try a different vibe or check the key" },
        { status: 503 }
      );
    }

    const result = planWeekend(planRequest, venuePool);

    if (result.stops.length === 0) {
      return NextResponse.json(
        {
          error: "Found venues but none matched your budget/time/weather constraints",
          poolSize: venuePool.length,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[plan-weekend] unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to generate plan: ${error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }
}
