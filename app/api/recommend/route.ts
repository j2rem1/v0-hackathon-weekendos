import { NextResponse } from "next/server";
import { searchVenuesByVibe } from "@/lib/search";
import { parseIntent, recommendFromPool, FilterError } from "@/lib/recommend";
import { RecommendRequest } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendRequest;

    if (!body.vibe || typeof body.vibe !== "string" || body.vibe.trim().length === 0) {
      return NextResponse.json({ error: "Tell me what you're up for." }, { status: 400 });
    }
    if (!body.budget_php || body.budget_php < 0) {
      return NextResponse.json({ error: "Set a budget per person." }, { status: 400 });
    }
    if (!body.party_size || body.party_size < 1) {
      return NextResponse.json({ error: "Party size must be at least 1." }, { status: 400 });
    }

    const exclude = Array.isArray(body.exclude_ids) ? body.exclude_ids : [];

    let search;
    try {
      search = await searchVenuesByVibe(body.vibe);
    } catch (err: any) {
      console.error("[recommend] search failed:", err);
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

    const intent = parseIntent(body.vibe, search.area, search.areaLocked);

    try {
      const result = recommendFromPool(search.venues, intent, exclude, body.budget_php);
      return NextResponse.json(result);
    } catch (err: any) {
      if (err instanceof FilterError) {
        const where = search.areaLocked ? `in ${search.area}` : "in Metro Manila";
        const messages: Record<FilterError["reason"], string> = {
          exclude:  "We've already shown you everything we found. Try a different vibe.",
          budget:   `Found ${search.venues.length} venues ${where}, but nothing fits ₱${body.budget_php.toLocaleString()} per person. Try a higher budget.`,
          location: `Nothing matched ${where}. Try a wider area or different keywords.`,
          cuisine:  intent.cuisine
            ? `No ${intent.cuisine} spots showed up ${where}. Try a different cuisine or wider area.`
            : `Cuisine filter wiped the pool ${where}.`,
          scoring:  "Found venues but none scored well. Try refining your vibe.",
        };
        return NextResponse.json(
          {
            error: messages[err.reason],
            reason: err.reason,
            poolSize: search.venues.length,
            area: search.area,
          },
          { status: 422 }
        );
      }
      console.error("[recommend] scoring failed:", err);
      return NextResponse.json(
        { error: `Couldn't find a match: ${err?.message ?? "unknown"}`, area: search.area },
        { status: 422 }
      );
    }
  } catch (error: any) {
    console.error("[recommend] unexpected error:", error);
    return NextResponse.json(
      { error: `Failed to recommend: ${error?.message ?? "unknown"}` },
      { status: 500 }
    );
  }
}
