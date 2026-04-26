import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return NextResponse.json({ hasKey: false });

  const url = new URL("https://api.scraperapi.com/structured/google/maps");
  url.searchParams.set("api_key", key);
  url.searchParams.set("query", "restaurants Metro Manila Philippines");
  url.searchParams.set("type", "search");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    const results = data.local_results ?? data.results ?? [];
    return NextResponse.json({
      hasKey: true,
      status: res.status,
      hasLocalResults: Array.isArray(results),
      resultCount: results.length,
      error: data.error ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ hasKey: true, fetchError: err.message });
  }
}
