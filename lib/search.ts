import { Venue, VenueType, Vibe } from "./types";

const SCRAPERAPI_BASE = "https://api.scraperapi.com/structured/google/search";

const AWARD_KEYWORDS = [
  "michelin", "asia's 50 best", "world's 50 best", "50 best",
  "tatler", "miele guide", "cnn travel", "award", "best restaurant",
  "zagat", "james beard", "bib gourmand",
];

interface RawPack {
  title: string;
  rating?: number;
  rating_vote_count?: number;
  details?: string[];
  position?: number;
}

async function fetchQuery(key: string, query: string): Promise<RawPack[]> {
  const url = new URL(SCRAPERAPI_BASE);
  url.searchParams.set("api_key", key);
  url.searchParams.set("query", query);
  url.searchParams.set("country_code", "ph");
  url.searchParams.set("hl", "en");

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      console.error(`[search] "${query}" → HTTP ${res.status}`);
      return [];
    }
    const data = await res.json();
    const packs: RawPack[] = (data.local_packs ?? []).filter((p: any) => p?.title);
    console.log(`[search] "${query}" → ${packs.length} packs`);
    return packs;
  } catch (err) {
    console.error(`[search] "${query}" failed:`, err);
    return [];
  }
}

export async function searchVenuesByVibe(vibe: string): Promise<Venue[]> {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) throw new Error("SCRAPERAPI_KEY is not set");

  const queries = buildQueries(vibe);
  console.log(`[search] firing ${queries.length} queries for vibe: "${vibe}"`);

  const batches = await Promise.all(queries.map((q) => fetchQuery(key, q)));

  const seen = new Set<string>();
  const merged: RawPack[] = [];
  for (const batch of batches) {
    for (const r of batch) {
      const k = r.title.toLowerCase().trim();
      if (!seen.has(k)) {
        seen.add(k);
        merged.push(r);
      }
    }
  }

  console.log(`[search] merged ${merged.length} unique venues from ScraperAPI`);

  return merged
    .map((r, i) => mapToVenue(r, i))
    .filter((v): v is Venue => v !== null);
}

function buildQueries(vibe: string): string[] {
  const lower = vibe.toLowerCase();
  const modifiers: string[] = [];

  if (/date|romantic|partner/.test(lower)) modifiers.push("romantic");
  if (/weird|unique|different|hidden/.test(lower)) modifiers.push("hidden gems unique");
  if (/group|friends|barkada/.test(lower)) modifiers.push("group friendly");
  if (/cheap|budget|affordable/.test(lower)) modifiers.push("affordable cheap eats");
  if (/upscale|fancy|luxury/.test(lower)) modifiers.push("upscale fine dining");
  if (/trending|popular|viral|hyped/.test(lower)) modifiers.push("trending popular");

  const mod = modifiers.length ? modifiers.join(" ") + " " : "";
  const region = "Metro Manila Philippines";

  // Always fire a broad baseline so the pool is never empty regardless of vibe.
  const queries = new Set<string>([
    `best ${mod}restaurants ${region}`,
    `best ${mod}cafes ${region}`,
    `best ${mod}bars ${region}`,
    `things to do ${region}`,
  ]);

  // Add vibe-targeted queries
  if (/food|eat|hungry|foodie|brunch/.test(lower)) {
    queries.add(`best ${mod}brunch spots ${region}`);
  }
  if (/bar|night|drink|cocktail|party/.test(lower)) {
    queries.add(`best ${mod}cocktail bars Poblacion Makati`);
  }
  if (/coffee|cafe|chill/.test(lower)) {
    queries.add(`best specialty coffee shops ${region}`);
  }
  if (/art|museum|culture|gallery/.test(lower)) {
    queries.add(`best museums galleries ${region}`);
  }
  if (/nature|outdoor|park|escape|hike/.test(lower)) {
    queries.add(`best parks nature spots ${region}`);
  }
  if (/shop|vintage|thrift|market/.test(lower)) {
    queries.add(`best shops boutiques markets ${region}`);
  }
  if (/rain|wet|stormy|typhoon|indoor/.test(lower)) {
    queries.add(`best indoor activities ${region}`);
  }

  return Array.from(queries);
}

const TYPE_KEYWORDS: { type: VenueType; words: string[] }[] = [
  { type: "night",   words: ["bar", "pub", "club", "cocktail", "lounge", "speakeasy", "nightclub", "brewery"] },
  { type: "culture", words: ["museum", "gallery", "exhibit", "theater", "theatre", "heritage", "cultural"] },
  { type: "outdoor", words: ["park", "garden", "trail", "zoo", "farm", "nature reserve", "botanical"] },
  { type: "shop",    words: ["boutique", "vintage shop", "thrift", "market", "bazaar", "concept store"] },
  { type: "food",    words: ["restaurant", "cafe", "café", "coffee", "bakery", "eatery", "bistro", "diner",
                              "filipino", "japanese", "korean", "italian", "chinese", "thai", "vietnamese",
                              "mexican", "spanish", "french", "american", "fusion", "ramen", "sushi",
                              "pizzeria", "bbq", "steakhouse", "seafood", "vegetarian", "vegan", "brunch"] },
];

// Patterns intentionally omit leading word boundaries — ScraperAPI concats
// detail strings without spaces ("RestaurantQuezon City, Metro Manila").
const AREA_KEYWORDS: { area: string; pattern: RegExp }[] = [
  { area: "BGC",          pattern: /(bgc|bonifacio global city|fort bonifacio)/i },
  { area: "Makati",       pattern: /(makati|salcedo|legaspi|poblacion|rockwell)/i },
  { area: "QC",           pattern: /(quezon city|cubao|maginhawa|katipunan|diliman|fairview|tomas morato|timog)/i },
  { area: "Taguig",       pattern: /taguig/i },
  { area: "Antipolo",     pattern: /antipolo/i },
  { area: "Pasig",        pattern: /(pasig|kapitolyo|capitol commons|ortigas)/i },
  { area: "Pasay",        pattern: /(pasay|mall of asia)/i },
  { area: "Mandaluyong",  pattern: /mandaluyong/i },
  { area: "San Juan",     pattern: /san juan/i },
  { area: "Manila",       pattern: /(ermita|malate|intramuros|binondo|escolta|chinatown|manila)/i },
];

interface ParsedDetails {
  haystack: string;
  priceLine: string;
  quote: string;
}

function parseDetails(result: RawPack): ParsedDetails {
  const details = result.details ?? [];

  // Strip the "<title><rating>(<votes>)" header from details[0]
  const stripped = details.map((d, i) => {
    if (i === 0 && d.toLowerCase().startsWith(result.title.toLowerCase())) {
      return d.slice(result.title.length).replace(/^\s*\d+(?:\.\d+)?\s*\(\s*[\d.]+K?\s*\)\s*/i, "").trim();
    }
    return d;
  });

  const haystack = stripped.join(" ").trim();
  const priceLine = stripped.find((d) => /₱[\d,]/.test(d)) ?? "";
  const quote = haystack.match(/"([^"]+)"/)?.[1] ?? "";

  return { haystack, priceLine, quote };
}

function inferType(haystack: string): VenueType {
  const t = haystack.toLowerCase();
  for (const { type, words } of TYPE_KEYWORDS) {
    if (words.some((w) => t.includes(w))) return type;
  }
  return "food";
}

function inferVibes(raw: string, type: VenueType, price: string): Vibe[] {
  const vibes: Vibe[] = [];

  if (type === "food") vibes.push("foodie");
  if (/coffee|cafe|espresso|latte/.test(raw)) vibes.push("coffee");
  if (/romantic|intimate|couples|date/.test(raw) || type === "night") vibes.push("date");
  if (/art|gallery|museum/.test(raw)) vibes.push("art");
  if (price.includes("2,000") || price.includes("2000") || /upscale|fine dining/.test(raw)) vibes.push("upscale");
  if (price.includes("200") && !price.includes("2,000") && !price.includes("2000")) vibes.push("cheap");
  if (/brunch|breakfast/.test(raw)) vibes.push("brunch");
  if (/casual|laid.?back/.test(raw)) vibes.push("casual");
  if (/family|kid/.test(raw)) vibes.push("family");
  if (/chill|relax|cozy/.test(raw) || type === "outdoor") vibes.push("chill");
  if (type === "outdoor") { vibes.push("escape"); vibes.push("nature"); }
  if (type === "shop") vibes.push("aesthetic");
  if (/vintage|antique|thrift/.test(raw)) vibes.push("vintage");
  if (/interactive|hands.on/.test(raw)) vibes.push("interactive");
  if (/group|barkada|sharing/.test(raw)) vibes.push("group");
  if (/cocktail/.test(raw)) vibes.push("cocktails");
  if (/party|club|dance/.test(raw)) vibes.push("party");
  if (/active|sport|fitness/.test(raw)) vibes.push("active");

  return [...new Set(vibes)];
}

function detectAwards(raw: string): string[] {
  return AWARD_KEYWORDS.filter((kw) => raw.includes(kw)).map((kw) => {
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

// Parse "₱500–1,000" → midpoint as PHP per person. Only digits AFTER ₱ count.
function priceToCost(price: string, type: VenueType): number {
  const m = price.match(/₱\s*([\d,]+)(?:\s*[–-]\s*([\d,]+))?/);
  const fallback: Record<VenueType, number> = { food: 500, night: 700, culture: 200, outdoor: 100, shop: 400 };
  if (!m) return fallback[type];
  const lo = parseInt(m[1].replace(/,/g, ""), 10);
  const hi = m[2] ? parseInt(m[2].replace(/,/g, ""), 10) : lo;
  if (isNaN(lo)) return fallback[type];
  return Math.round((lo + (isNaN(hi) ? lo : hi)) / 2);
}

function inferArea(haystack: string): string {
  for (const { area, pattern } of AREA_KEYWORDS) {
    if (pattern.test(haystack)) return area;
  }
  return "Metro Manila";
}

function defaultHours(type: VenueType): { opens: string; closes: string } {
  const defaults: Record<VenueType, { opens: string; closes: string }> = {
    food:    { opens: "10:00", closes: "22:00" },
    culture: { opens: "09:00", closes: "18:00" },
    outdoor: { opens: "06:00", closes: "20:00" },
    night:   { opens: "18:00", closes: "02:00" },
    shop:    { opens: "10:00", closes: "21:00" },
  };
  return defaults[type];
}

// rating_vote_count is sometimes a decimal in thousands (1.8 = 1.8K) and sometimes the raw int.
function normalizeReviewCount(n: number | undefined): number | undefined {
  if (typeof n !== "number" || n <= 0) return undefined;
  if (n < 50) return Math.round(n * 1000); // 1.8 → 1800
  return Math.round(n);
}

function mapToVenue(result: RawPack, index: number): Venue | null {
  if (!result.title) return null;

  const { haystack, priceLine, quote } = parseDetails(result);
  const lower = haystack.toLowerCase();
  const type = inferType(lower);
  const blurb = quote || haystack.replace(/"[^"]*"/g, "").trim().slice(0, 140) || result.title;

  return {
    id: `scraper-${result.position ?? index}-${result.title.slice(0, 12).replace(/\s/g, "")}`,
    name: result.title,
    area: inferArea(haystack),
    type,
    vibe: inferVibes(lower, type, priceLine),
    cost: priceToCost(priceLine, type),
    duration: ({ culture: 120, outdoor: 120, night: 90, food: 75, shop: 90 } as Record<VenueType, number>)[type],
    ...defaultHours(type),
    weatherProof: type !== "outdoor",
    blurb,
    lat: 14.5547,
    lng: 121.0244,
    rating: result.rating,
    reviewCount: normalizeReviewCount(result.rating_vote_count),
    awards: detectAwards(lower),
  };
}
