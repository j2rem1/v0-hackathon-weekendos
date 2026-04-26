import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) return NextResponse.json({ hasKey: false });

  const url = new URL("https://api.scraperapi.com/structured/google/search");
  url.searchParams.set("api_key", key);
  url.searchParams.set("query", "restaurants Metro Manila Philippines");
  url.searchParams.set("country_code", "ph");
  url.searchParams.set("hl", "en");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    const packs: any[] = data.local_packs ?? [];
    const results = packs.flatMap((p: any) => p.locals ?? p.results ?? [p]).filter((r: any) => r.title);
    const sampleKeys = results[0] ? Object.keys(results[0]) : packs[0] ? Object.keys(packs[0]) : [];
    return NextResponse.json({
      hasKey: true,
      status: res.status,
      hasLocalResults: Array.isArray(results) && results.length > 0,
      resultCount: results.length,
      topLevelKeys: Object.keys(data),
      sampleResultKeys: sampleKeys,
      error: data.error ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ hasKey: true, fetchError: err.message });
  }
}
