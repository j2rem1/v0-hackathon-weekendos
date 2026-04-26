import { NextResponse } from "next/server";

export async function GET() {
  const key = process.env.SERPAPI_KEY;
  if (!key) return NextResponse.json({ hasKey: false });

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google_maps");
  url.searchParams.set("q", "restaurants Metro Manila Philippines");
  url.searchParams.set("type", "search");
  url.searchParams.set("api_key", key);
  url.searchParams.set("hl", "en");
  url.searchParams.set("gl", "ph");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json({
      hasKey: true,
      status: res.status,
      hasLocalResults: Array.isArray(data.local_results),
      resultCount: data.local_results?.length ?? 0,
      error: data.error ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ hasKey: true, fetchError: err.message });
  }
}
