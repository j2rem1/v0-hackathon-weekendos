import { NextResponse } from "next/server";
import { planWeekend } from "@/lib/planner";
import { PlanRequest } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PlanRequest;

    // Validate required fields
    if (!body.vibe || typeof body.vibe !== "string") {
      return NextResponse.json(
        { error: "Vibe description is required" },
        { status: 400 }
      );
    }

    if (!body.budget_php || body.budget_php < 0) {
      return NextResponse.json(
        { error: "Valid budget is required" },
        { status: 400 }
      );
    }

    if (!body.party_size || body.party_size < 1) {
      return NextResponse.json(
        { error: "Party size must be at least 1" },
        { status: 400 }
      );
    }

    // Default times if not provided
    const planRequest: PlanRequest = {
      vibe: body.vibe,
      budget_php: body.budget_php,
      party_size: body.party_size,
      start_time: body.start_time || "10:00",
      end_time: body.end_time || "22:00",
    };

    const result = planWeekend(planRequest);

    // Simulate a brief delay for UX (feels more "AI-like")
    await new Promise((resolve) => setTimeout(resolve, 800));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error planning weekend:", error);
    return NextResponse.json(
      { error: "Failed to generate plan" },
      { status: 500 }
    );
  }
}
