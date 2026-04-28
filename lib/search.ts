import { Venue, VenueType, Vibe } from "./types";
import { CUISINE_DEFS, VIBE_DESCRIPTORS } from "./recommend";

const SCRAPERAPI_BASE = "https://api.scraperapi.com/structured/google/search";

// Award detection requires a strong phrase context, not a bare keyword.
// "michelin-trained chef" or "award-winning kitchen" must NOT pass — only an
// actual recognition (Michelin star/guide, Bib Gourmand, 50 Best listing, etc.).
const AWARD_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Michelin",        pattern: /\bmichelin[- ]?(?:star(?:red|s)?|guide|recommended|selected)\b/i },
  { label: "Bib Gourmand",    pattern: /\bbib gourmand\b/i },
  { label: "Asia's 50 Best",  pattern: /asia['']?s 50 best (?:restaurants?|bars?)/i },
  { label: "World's 50 Best", pattern: /world['']?s 50 best (?:restaurants?|bars?)/i },
  { label: "James Beard",     pattern: /\bjames beard (?:award|nominee|finalist|semifinalist|winner)/i },
  { label: "Tatler Best",     pattern: /\btatler['']?s? best (?:restaurants?|bars?|of)\b/i },
];

interface RawPack {
  title: string;
  rating?: number;
  rating_vote_count?: number;
  details?: string[];
  position?: number;
}

export interface SearchResult {
  venues: Venue[];
  area: string;        // canonical, always set ("Metro Manila" on fallback)
  areaLocked: boolean; // true when extracted from input
}

// Patterns are scanned both ways: against user vibe text AND against ScraperAPI
// detail strings (which often concat without spaces, e.g. "RestaurantQuezon City").
// Order matters — first match wins, so neighbourhoods belonging to a parent
// city sit alongside the city itself ("Poblacion" → "Makati").
const AREA_KEYWORDS: { area: string; pattern: RegExp }[] = [
  { area: "BGC",          pattern: /(bgc|bonifacio global city|fort bonifacio)/i },
  { area: "Makati",       pattern: /(makati|salcedo|legaspi|poblacion|rockwell)/i },
  { area: "QC",           pattern: /(quezon city|\bqc\b|cubao|maginhawa|katipunan|diliman|fairview|tomas morato|timog|new manila)/i },
  { area: "Taguig",       pattern: /taguig/i },
  { area: "Antipolo",     pattern: /antipolo/i },
  { area: "Pasig",        pattern: /(pasig|kapitolyo|capitol commons|ortigas)/i },
  { area: "Pasay",        pattern: /(pasay|mall of asia|moa)/i },
  { area: "Mandaluyong",  pattern: /(mandaluyong|greenfield)/i },
  { area: "San Juan",     pattern: /san juan/i },
  { area: "Manila",       pattern: /(ermita|malate|intramuros|binondo|escolta|chinatown|\bmanila\b)/i },
];

// Search-query hints biased to each area so ScraperAPI surfaces in-area venues.
const AREA_QUERY_HINT: Record<string, string> = {
  "BGC":         "BGC Taguig Metro Manila",
  "Makati":      "Makati Metro Manila",
  "QC":          "Quezon City Metro Manila",
  "Taguig":      "Taguig Metro Manila",
  "Antipolo":    "Antipolo Rizal",
  "Pasig":       "Pasig Metro Manila",
  "Pasay":       "Pasay Metro Manila",
  "Mandaluyong": "Mandaluyong Metro Manila",
  "San Juan":    "San Juan Metro Manila",
  "Manila":      "Manila Philippines",
};

export function extractArea(text: string): { area: string | null; canonical: string } {
  for (const { area, pattern } of AREA_KEYWORDS) {
    if (pattern.test(text)) return { area, canonical: area };
  }
  return { area: null, canonical: "Metro Manila" };
}

function inferAreaFromHaystack(haystack: string): string {
  for (const { area, pattern } of AREA_KEYWORDS) {
    if (pattern.test(haystack)) return area;
  }
  return "Metro Manila";
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

export async function searchVenuesByVibe(vibe: string): Promise<SearchResult> {
  const key = process.env.SCRAPERAPI_KEY;
  if (!key) throw new Error("SCRAPERAPI_KEY is not set");

  const { area } = extractArea(vibe);
  const queries = buildQueries(vibe, area);
  console.log(`[search] area="${area ?? "Metro Manila (fallback)"}" firing ${queries.length} queries`);

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

  console.log(`[search] merged ${merged.length} unique venues`);

  const allVenues = merged
    .map((r, i) => mapToVenue(r, i))
    .filter((v): v is Venue => v !== null);

  // Location binding — if the user named an area, only return matching venues.
  // Fall back to the full pool when the strict filter would leave too few stops
  // to plan an itinerary (≥3 keeps a 4-stop plan possible).
  if (area) {
    const inArea = allVenues.filter((v) => v.area === area);
    if (inArea.length >= 3) {
      console.log(`[search] locked to ${area} → ${inArea.length} venues`);
      return { venues: inArea, area, areaLocked: true };
    }
    console.warn(`[search] only ${inArea.length} venues match "${area}" — falling back to wider pool`);
  }

  return {
    venues: allVenues,
    area: area ?? "Metro Manila",
    areaLocked: false,
  };
}

// Cap on how many queries we fire per recommendation — keeps ScraperAPI cost
// bounded while still giving the recommender a varied pool.
const MAX_QUERIES = 6;

interface VibeTokens {
  cuisineWord: string | null;     // user's literal word ("ramen"), not the canonical label
  descriptors: string[];          // matched VIBE_DESCRIPTORS, in order
  meal: "breakfast" | "brunch" | "lunch" | "dinner" | "drinks" | null;
  occasion: "date" | "group" | "solo" | "family" | "work" | null;
  activities: string[];           // coffee / art / nature / shop / nightlife
  isRainy: boolean;
}

// Pull the literal token the user typed for cuisine (e.g. "ramen", "omakase")
// rather than the canonical category label ("Japanese") — Google ranks better
// when the query mirrors how people actually search.
function extractCuisineWord(lower: string): string | null {
  for (const def of CUISINE_DEFS) {
    const m = lower.match(def.queryPattern);
    if (m) return m[0].trim();
  }
  return null;
}

function extractTokens(lower: string): VibeTokens {
  const descriptors = VIBE_DESCRIPTORS.filter((d) => lower.includes(d)).slice(0, 3);

  const meal: VibeTokens["meal"] =
    /\bbreakfast\b|\bearly\b/.test(lower)                  ? "breakfast" :
    /\bbrunch\b/.test(lower)                                ? "brunch" :
    /\blunch\b/.test(lower)                                 ? "lunch" :
    /\bdinner\b|\bsupper\b/.test(lower)                     ? "dinner" :
    /\bdrinks?\b|\bcocktails?\b|\bnightcap\b/.test(lower)   ? "drinks" :
    null;

  const occasion: VibeTokens["occasion"] =
    /\bdate\b|romantic|partner|anniversary|girlfriend|boyfriend|\bgf\b|\bbf\b/.test(lower) ? "date" :
    /\bgroup\b|barkada|friends|squad/.test(lower)                                          ? "group" :
    /\bsolo\b|alone|by myself/.test(lower)                                                 ? "solo" :
    /\bfamily\b|parents|kids|children/.test(lower)                                         ? "family" :
    /\bwork\b|laptop|wifi|remote/.test(lower)                                              ? "work" :
    null;

  const activities: string[] = [];
  if (/coffee|espresso|latte/.test(lower))            activities.push("specialty coffee");
  if (/\bart\b|museum|gallery|exhibit/.test(lower))   activities.push("museums galleries");
  if (/nature|outdoor|park|hike|trail/.test(lower))   activities.push("nature parks");
  if (/shop|vintage|thrift|market|boutique/.test(lower)) activities.push("shops markets");
  if (/\bclub\b|nightlife|party/.test(lower))         activities.push("nightlife");

  return {
    cuisineWord: extractCuisineWord(lower),
    descriptors,
    meal,
    occasion,
    activities,
    isRainy: /rain|wet|stormy|typhoon|flood/.test(lower),
  };
}

// Compose ScraperAPI queries from the user's actual words. The previous
// version always led with "best <category> <region>" boilerplate, so the same
// four results came back no matter what the user said. Now: cuisine, vibe
// adjectives, meal, and occasion shape every query, and the broad baseline
// only fires when the user gave nothing specific to anchor on.
function buildQueries(vibe: string, area: string | null): string[] {
  const lower = vibe.toLowerCase();
  const region = area ? AREA_QUERY_HINT[area] ?? area : "Metro Manila Philippines";
  const t = extractTokens(lower);
  const queries = new Set<string>();

  const adj1 = t.descriptors[0] ?? "";
  const adj2 = t.descriptors.slice(0, 2).join(" ");

  // Cuisine = highest signal. Lead with the user's word, layer on descriptors
  // and occasion as variants so we surface a range of matching venues.
  if (t.cuisineWord) {
    queries.add(`${t.cuisineWord} ${region}`.trim());
    if (adj2)              queries.add(`${adj2} ${t.cuisineWord} ${region}`);
    if (t.occasion === "date")  queries.add(`romantic ${t.cuisineWord} ${region}`);
    if (t.occasion === "group") queries.add(`${t.cuisineWord} for groups ${region}`);
    if (t.meal === "dinner")    queries.add(`${t.cuisineWord} dinner ${region}`);
    if (t.meal === "lunch")     queries.add(`${t.cuisineWord} lunch ${region}`);
  }

  // Meal-driven (covers cases without a cuisine — e.g. "looking for brunch")
  if (t.meal === "brunch")    queries.add(`${adj1} brunch ${region}`.trim());
  if (t.meal === "breakfast") queries.add(`${adj1} breakfast ${region}`.trim());
  if (t.meal === "drinks") {
    queries.add(`${adj1 || "cocktail"} bars ${region}`.trim());
    queries.add(`speakeasy ${region}`);
  }
  if (t.meal === "dinner" && !t.cuisineWord) {
    queries.add(`${adj2 || "dinner"} restaurants ${region}`.trim());
  }
  if (t.meal === "lunch" && !t.cuisineWord) {
    queries.add(`${adj1} lunch spots ${region}`.trim());
  }

  // Descriptor-led — when the user gave vibes but no cuisine, search the vibe
  // verbatim so Google returns places people actually describe that way.
  if (!t.cuisineWord && t.descriptors.length > 0) {
    queries.add(`${adj2 || adj1} restaurants ${region}`.trim());
    queries.add(`${adj2 || adj1} ${region}`.trim());
  }

  // Occasion-driven (no cuisine context)
  if (!t.cuisineWord) {
    if (t.occasion === "date")   queries.add(`romantic date spots ${region}`);
    if (t.occasion === "group")  queries.add(`group friendly restaurants ${region}`);
    if (t.occasion === "family") queries.add(`family friendly restaurants ${region}`);
    if (t.occasion === "work")   queries.add(`laptop friendly cafes ${region}`);
  }

  // Activity-driven — these are non-dining intents; fire them straight.
  for (const act of t.activities) {
    queries.add(`${adj1 ? adj1 + " " : ""}${act} ${region}`.trim());
  }

  // Weather context — rainy vibe → indoor cozy spots
  if (t.isRainy) queries.add(`indoor cozy ${t.cuisineWord ?? "spots"} ${region}`.trim());

  // Baseline floor — only when the user said nothing specific. This used to
  // always fire and was the source of the "queries are always the same" feel.
  if (queries.size === 0) {
    queries.add(`restaurants ${region}`);
    queries.add(`cafes ${region}`);
    queries.add(`things to do ${region}`);
  }

  return Array.from(queries).slice(0, MAX_QUERIES);
}

const TYPE_KEYWORDS: { type: VenueType; words: string[] }[] = [
  { type: "night",   words: ["bar", "pub", "club", "cocktail", "lounge", "speakeasy", "nightclub", "brewery",
                              "rooftop", "roofdeck", "roof deck", "skybar", "sky bar", "observatory",
                              "penthouse", "tap room", "taproom", "wine bar", "whiskey bar"] },
  { type: "culture", words: ["museum", "gallery", "exhibit", "theater", "theatre", "heritage", "cultural"] },
  { type: "outdoor", words: ["park", "garden", "trail", "zoo", "farm", "nature reserve", "botanical"] },
  { type: "shop",    words: ["boutique", "vintage shop", "thrift", "market", "bazaar", "concept store"] },
  { type: "food",    words: ["restaurant", "cafe", "café", "coffee", "bakery", "eatery", "bistro", "diner",
                              "filipino", "japanese", "korean", "italian", "chinese", "thai", "vietnamese",
                              "mexican", "spanish", "french", "american", "fusion", "ramen", "sushi",
                              "pizzeria", "bbq", "steakhouse", "seafood", "vegetarian", "vegan", "brunch",
                              "omakase", "kaiseki", "izakaya", "trattoria", "osteria"] },
];

// Phrase-level signals that the venue is upscale; floors the cost estimate at
// ₱2000 when ScraperAPI gave us no explicit price. Cuisine words alone don't
// qualify — we need an explicit "fine dining" / "tasting menu" / etc.
const UPSCALE_PATTERN = /\b(?:fine dining|tasting menu|omakase|kaiseki|degustation|prix fixe|chef['']?s table|set menu|wine pairing)\b/i;

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
  // Capture both explicit prices ("₱500–1,000") and tier indicators ("₱₱₱").
  const priceLine = stripped.find((d) => /₱(?:[\d,]|₱)/.test(d)) ?? "";
  const quote = haystack.match(/"([^"]+)"/)?.[1] ?? "";

  return { haystack, priceLine, quote };
}

function inferType(title: string, haystack: string): VenueType {
  // Title is included so a venue called "Encima Roofdeck" wins as `night` even
  // when its haystack mentions a nearby park / garden / etc.
  const t = `${title} ${haystack}`.toLowerCase();
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

function detectAwards(haystack: string): string[] {
  const found: string[] = [];
  for (const { label, pattern } of AWARD_PATTERNS) {
    if (pattern.test(haystack) && !found.includes(label)) found.push(label);
  }
  return found;
}

// Tier-indicator → midpoint cost. Calibrated to typical Metro Manila pricing.
const TIER_COST: Record<number, number> = {
  1: 250,   // ₱
  2: 700,   // ₱₱
  3: 1500,  // ₱₱₱
  4: 3500,  // ₱₱₱₱
};

// Category fallbacks when neither an explicit price nor a tier indicator is
// found. These are deliberately not low — a wrong-low cost lies to the user
// AND lets the budget gate include venues that won't fit. `estimated: true`
// is always set so the UI can label the figure as approximate.
const FALLBACK_COST: Record<VenueType, number> = {
  food:    800,
  night:   1200,
  culture: 300,
  outdoor: 200,
  shop:    500,
};

// Returns { cost, estimated }. `estimated: false` only when an explicit
// "₱<digits>" amount was parsed; tier indicators, upscale-phrase floors, and
// category fallbacks all flag as estimated.
function priceToCost(priceLine: string, haystack: string, type: VenueType): { cost: number; estimated: boolean } {
  const explicit = priceLine.match(/₱\s*([\d,]+)(?:\s*[–-]\s*([\d,]+))?/);
  if (explicit) {
    const lo = parseInt(explicit[1].replace(/,/g, ""), 10);
    const hi = explicit[2] ? parseInt(explicit[2].replace(/,/g, ""), 10) : lo;
    if (!isNaN(lo)) {
      return { cost: Math.round((lo + (isNaN(hi) ? lo : hi)) / 2), estimated: false };
    }
  }

  // Tier indicator: a run of "₱" symbols not followed by a digit. Search the
  // priceLine first, then fall back to the full haystack.
  const tierMatch = (priceLine.match(/(₱{1,4})(?!\d)/) ?? haystack.match(/(₱{1,4})(?!\d)/));
  if (tierMatch) {
    const tier = tierMatch[1].length as 1 | 2 | 3 | 4;
    return { cost: TIER_COST[tier], estimated: true };
  }

  // Upscale-phrase floor: when the haystack explicitly calls out fine dining,
  // tasting menus, omakase etc., the per-person price is almost always ₱2000+.
  if (UPSCALE_PATTERN.test(haystack)) {
    return { cost: 2000, estimated: true };
  }

  return { cost: FALLBACK_COST[type], estimated: true };
}

// Stable venue ID derived from the title alone, so the same venue gets the same
// ID across separate ScraperAPI calls (search position changes between calls,
// so position-based IDs broke the `exclude_ids` "ask for another" flow).
function makeVenueId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `v-${slug || "untitled"}`;
}

// Pull a real Instagram profile out of the haystack. Excludes post/reel/story
// path segments so we don't link to a content URL by accident.
const IG_PROFILE_BLOCKLIST = new Set(["p", "reel", "reels", "tv", "stories", "explore", "accounts", "direct"]);
function extractInstagram(haystack: string): string | undefined {
  const match = haystack.match(/instagram\.com\/([a-zA-Z0-9._]+)/i);
  if (!match) return undefined;
  const handle = match[1].replace(/[._]+$/, "");
  if (handle.length < 3 || handle.length > 30) return undefined;
  if (IG_PROFILE_BLOCKLIST.has(handle.toLowerCase())) return undefined;
  return `https://instagram.com/${handle}`;
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
  const type = inferType(result.title, lower);
  const blurb = quote || haystack.replace(/"[^"]*"/g, "").trim().slice(0, 140) || result.title;
  const { cost, estimated } = priceToCost(priceLine, haystack, type);

  return {
    id: makeVenueId(result.title),
    name: result.title,
    area: inferAreaFromHaystack(haystack),
    type,
    vibe: inferVibes(lower, type, priceLine),
    cost,
    costEstimated: estimated,
    duration: ({ culture: 120, outdoor: 120, night: 90, food: 75, shop: 90 } as Record<VenueType, number>)[type],
    ...defaultHours(type),
    weatherProof: type !== "outdoor",
    blurb,
    lat: 14.5547,
    lng: 121.0244,
    rating: result.rating,
    reviewCount: normalizeReviewCount(result.rating_vote_count),
    awards: detectAwards(haystack),
    instagram: extractInstagram(haystack),
    haystack,
  };
}
