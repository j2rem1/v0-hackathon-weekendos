import { Venue, VenueType, Vibe } from "./types";

const SCRAPERAPI_BASE = "https://api.scraperapi.com/structured/google/maps";

const AWARD_KEYWORDS = [
  "michelin", "asia's 50 best", "world's 50 best", "50 best",
  "tatler", "miele guide", "cnn travel", "award", "best restaurant",
  "zagat", "james beard", "bib gourmand",
];

export async function searchVenuesByVibe(vibe: string): Promise<Venue[]> {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) {
    console.log("[search] SCRAPERAPI_KEY not set — using seeded venues");
    return [];
  }

  const url = new URL(SCRAPERAPI_BASE);
  url.searchParams.set("api_key", key);
  url.searchParams.set("query", buildQuery(vibe));
  url.searchParams.set("type", "search");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });

    if (!res.ok) {
      console.error("[search] ScraperAPI error:", res.status, await res.text());
      return [];
    }

    const data = await res.json();
    const results: any[] = data.local_results ?? data.results ?? [];
    console.log(`[search] ScraperAPI returned ${results.length} results`);

    return results
      .slice(0, 16)
      .map((r, i) => mapToVenue(r, i))
      .filter((v): v is Venue => v !== null);
  } catch (err) {
    console.error("[search] ScraperAPI fetch failed:", err);
    return [];
  }
}

function buildQuery(vibe: string): string {
  const lower = vibe.toLowerCase();
  const tags: string[] = [];

  if (/food|eat|hungry|foodie/.test(lower)) tags.push("restaurants");
  if (/bar|night|drink|party|cocktail/.test(lower)) tags.push("bars");
  if (/art|museum|culture/.test(lower)) tags.push("museums");
  if (/coffee|cafe|chill/.test(lower)) tags.push("cafes");
  if (/nature|outdoor|park|escape/.test(lower)) tags.push("parks");
  if (/shop|vintage|thrift/.test(lower)) tags.push("shops");
  if (tags.length === 0) tags.push("things to do");

  if (/date|romantic|partner/.test(lower)) tags.push("romantic");
  if (/weird|unique|different/.test(lower)) tags.push("unique hidden gems");
  if (/group|friends|barkada/.test(lower)) tags.push("group-friendly");
  if (/cheap|budget/.test(lower)) tags.push("affordable");
  if (/upscale|fancy/.test(lower)) tags.push("upscale fine dining");
  if (/trending|popular|viral/.test(lower)) tags.push("trending popular");

  tags.push("Metro Manila Philippines");
  return tags.join(" ");
}

function inferType(result: any): VenueType {
  const raw = [result.type ?? "", ...(result.types ?? [])].join(" ").toLowerCase();
  if (/restaurant|food|dining|cuisine|cafe|coffee|bakery|eatery/.test(raw)) return "food";
  if (/museum|gallery|art|exhibit|cultural|heritage/.test(raw)) return "culture";
  if (/park|nature|garden|eco|outdoor|trail/.test(raw)) return "outdoor";
  if (/bar|club|pub|cocktail|lounge|nightlife/.test(raw)) return "night";
  if (/shop|store|mall|market|boutique|vintage/.test(raw)) return "shop";
  return "food";
}

function inferVibes(result: any, type: VenueType): Vibe[] {
  const raw = [result.type ?? "", result.description ?? ""].join(" ").toLowerCase();
  const vibes: Vibe[] = [];

  if (type === "food") vibes.push("foodie");
  if (/coffee|cafe/.test(raw)) vibes.push("coffee");
  if (/romantic|intimate|couples/.test(raw) || type === "night") vibes.push("date");
  if (/art|gallery/.test(raw)) vibes.push("art");
  if (result.price === "$$$" || result.price === "$$$$") vibes.push("upscale");
  if (result.price === "$") vibes.push("cheap");
  if (/brunch|breakfast/.test(raw)) vibes.push("brunch");
  if (/casual/.test(raw)) vibes.push("casual");
  if (/family/.test(raw)) vibes.push("family");
  if (/chill|relax/.test(raw) || type === "outdoor") vibes.push("chill");
  if (type === "outdoor") { vibes.push("escape"); vibes.push("nature"); }
  if (type === "shop") vibes.push("aesthetic");
  if (/vintage|antique|thrift/.test(raw)) vibes.push("vintage");
  if (/interactive|hands.on/.test(raw)) vibes.push("interactive");
  if (/group|barkada/.test(raw)) vibes.push("group");
  if (/cocktail/.test(raw)) vibes.push("cocktails");
  if (/party/.test(raw)) vibes.push("party");
  if (/active|sport|fitness/.test(raw)) vibes.push("active");

  return [...new Set(vibes)];
}

function detectAwards(result: any): string[] {
  const haystack = [
    result.description ?? "",
    result.type ?? "",
    ...(result.types ?? []),
    result.extensions?.service_options ?? "",
  ].join(" ").toLowerCase();

  return AWARD_KEYWORDS.filter((kw) => haystack.includes(kw)).map((kw) => {
    const labels: Record<string, string> = {
      "michelin": "Michelin",
      "asia's 50 best": "Asia's 50 Best",
      "world's 50 best": "World's 50 Best",
      "50 best": "50 Best",
      "bib gourmand": "Bib Gourmand",
      "tatler": "Tatler Best",
    };
    return labels[kw] ?? kw;
  });
}

function priceToCost(price: string | undefined): number {
  const map: Record<string, number> = { "$": 250, "$$": 600, "$$$": 1400, "$$$$": 2500 };
  return map[price ?? ""] ?? 500;
}

function inferArea(address: string): string {
  if (/bgc|bonifacio|fort taguig/i.test(address)) return "BGC";
  if (/makati|salcedo|legaspi|poblacion|ayala/i.test(address)) return "Makati";
  if (/quezon|qc|cubao|maginhawa|katipunan|diliman|fairview/i.test(address)) return "QC";
  if (/antipolo/i.test(address)) return "Antipolo";
  return "Makati";
}

function inferHours(result: any, type: VenueType): { opens: string; closes: string } {
  const hoursStr: string = result.hours ?? "";
  const closeMatch = hoursStr.match(/closes?\s+(\d+)(?::(\d+))?\s*(am|pm)/i);
  if (closeMatch) {
    let hour = parseInt(closeMatch[1]);
    const mins = closeMatch[2] ? parseInt(closeMatch[2]) : 0;
    const period = closeMatch[3].toLowerCase();
    if (period === "pm" && hour !== 12) hour += 12;
    if (period === "am" && hour === 12) hour = 0;
    return {
      opens: "09:00",
      closes: `${hour.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`,
    };
  }

  const defaults: Record<VenueType, { opens: string; closes: string }> = {
    food:    { opens: "10:00", closes: "22:00" },
    culture: { opens: "09:00", closes: "18:00" },
    outdoor: { opens: "06:00", closes: "20:00" },
    night:   { opens: "18:00", closes: "02:00" },
    shop:    { opens: "10:00", closes: "21:00" },
  };
  return defaults[type];
}

function mapToVenue(result: any, index: number): Venue | null {
  if (!result.title) return null;

  const type = inferType(result);
  const address = result.address ?? "";
  const reviewCount: number = result.reviews ?? result.review_count ?? 0;

  return {
    id: `scraper-${result.place_id ?? result.data_id ?? index}`,
    name: result.title,
    area: inferArea(address),
    type,
    vibe: inferVibes(result, type),
    cost: priceToCost(result.price),
    duration: ({ culture: 120, outdoor: 120, night: 90, food: 75, shop: 90 } as Record<VenueType, number>)[type],
    ...inferHours(result, type),
    weatherProof: type !== "outdoor",
    blurb: result.description ?? result.type ?? result.title,
    lat: result.gps_coordinates?.latitude ?? 14.5547,
    lng: result.gps_coordinates?.longitude ?? 121.0244,
    website: result.website ?? result.links?.website,
    rating: result.rating,
    reviewCount: reviewCount > 0 ? reviewCount : undefined,
    awards: detectAwards(result),
  };
}
