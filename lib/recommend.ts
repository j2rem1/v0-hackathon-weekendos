import {
  Venue,
  ParsedIntent,
  ScoreBreakdown,
  BiasSignals,
  Recommendation,
  RecommendResult,
  OccasionKind,
  MealKind,
} from "./types";

// Composite weights — sum to 1.
// 0.25 cuisine is binary AFTER the hard filter, so when cuisine is specified
// every surviving venue contributes the full 0.25 (it's effectively a "pass"
// floor); when cuisine isn't specified, every venue gets 1 by default.
const W_CONTEXT   = 0.35;
const W_CUISINE   = 0.25;
const W_VIBE      = 0.15;
const W_OCCASION  = 0.15;
const W_SENTIMENT = 0.10;

// Confidence: a primary is "significantly higher" than the runner-up when the
// gap clears this absolute threshold on the 0..1 final-score scale.
const CONFIDENCE_GAP = 0.08;

const POSITIVE_TRIGGERS = [
  "best", "go-to", "go to", "highly recommend", "must try", "must visit",
  "favorite", "favourite", "love this", "incredible", "amazing", "perfect",
  "date spot", "hidden gem", "underrated",
];
const POSITIVE_STRONG = ["best", "go-to", "highly recommend", "date spot"];

const NEGATIVE_TRIGGERS = [
  "overrated", "not worth it", "skip", "disappointing", "underwhelming",
  "mediocre", "avoid", "don't bother",
];
const NEGATIVE_STRONG = ["overrated", "not worth it"];

// ── Cuisine table ──────────────────────────────────────────────────────────
// `queryPattern` decides what the user asked for; `venueKeywords` is the set
// scanned against the venue's text bundle (name + blurb + vibe tags + raw
// haystack). A miss → cuisine_match = 0 → hard reject.
export const CUISINE_DEFS: { cuisine: string; queryPattern: RegExp; venueKeywords: string[] }[] = [
  {
    cuisine: "Japanese",
    queryPattern: /\b(japanese|sushi|ramen|omakase|izakaya|tempura|udon|donburi|kaiseki|teppanyaki|yakitori|tonkatsu|soba|wagyu|nippon|washoku)\b/i,
    venueKeywords: ["japanese", "sushi", "ramen", "omakase", "izakaya", "tempura", "udon", "donburi", "kaiseki", "teppanyaki", "yakitori", "tonkatsu", "soba", "wagyu"],
  },
  {
    cuisine: "Korean",
    queryPattern: /\b(korean|kbbq|k-?bbq|bibimbap|samgyup(?:sal)?|kimchi|korean bbq)\b/i,
    venueKeywords: ["korean", "kbbq", "k-bbq", "korean bbq", "bibimbap", "samgyup", "kimchi"],
  },
  {
    cuisine: "Italian",
    queryPattern: /\b(italian|pasta|pizz(?:a|eria)|trattoria|osteria|risotto|gnocchi|focaccia)\b/i,
    venueKeywords: ["italian", "pasta", "pizza", "pizzeria", "trattoria", "osteria", "risotto", "gnocchi"],
  },
  {
    cuisine: "Filipino",
    queryPattern: /\b(filipino|pinoy|lutong bahay|sinigang|adobo|kamayan|kapampangan)\b/i,
    venueKeywords: ["filipino", "pinoy", "lutong bahay", "sinigang", "adobo", "kamayan", "kapampangan"],
  },
  {
    cuisine: "Chinese",
    queryPattern: /\b(chinese|dimsum|dim sum|shabu|hotpot|hot pot|cantonese|sichuan|szechuan|peking|mandarin cuisine)\b/i,
    venueKeywords: ["chinese", "dimsum", "dim sum", "shabu", "hotpot", "hot pot", "cantonese", "sichuan", "szechuan", "peking"],
  },
  {
    cuisine: "Thai",
    queryPattern: /\b(thai|pad thai|tom yum|thailand)\b/i,
    venueKeywords: ["thai", "pad thai", "tom yum"],
  },
  {
    cuisine: "Vietnamese",
    queryPattern: /\b(vietnamese|pho|banh mi|vietnam)\b/i,
    venueKeywords: ["vietnamese", "pho", "banh mi"],
  },
  {
    cuisine: "Mexican",
    queryPattern: /\b(mexican|taco|taqueria|burrito|tex-mex|nachos|quesadilla)\b/i,
    venueKeywords: ["mexican", "taco", "taqueria", "burrito", "tex-mex", "nachos", "quesadilla"],
  },
  {
    cuisine: "Indian",
    queryPattern: /\b(indian|biryani|curry house|tandoori|naan)\b/i,
    venueKeywords: ["indian", "biryani", "tandoori", "naan", "curry house"],
  },
  {
    cuisine: "Spanish",
    queryPattern: /\b(spanish|tapas|paella|jamon|jamón)\b/i,
    venueKeywords: ["spanish", "tapas", "paella", "jamon"],
  },
  {
    cuisine: "French",
    queryPattern: /\b(french|bistro|brasserie|patisserie|coq au vin)\b/i,
    venueKeywords: ["french", "bistro", "brasserie", "patisserie"],
  },
  {
    cuisine: "American",
    queryPattern: /\b(american|burger|steakhouse|diner|smokehouse|barbecue (?!chicken))\b/i,
    venueKeywords: ["american", "burger", "steakhouse", "smokehouse", "diner"],
  },
  {
    cuisine: "Mediterranean",
    queryPattern: /\b(mediterranean|greek|hummus|falafel|kebab)\b/i,
    venueKeywords: ["mediterranean", "greek", "hummus", "falafel", "kebab"],
  },
  {
    cuisine: "Middle Eastern",
    queryPattern: /\b(middle eastern|shawarma|lebanese|persian|arabian)\b/i,
    venueKeywords: ["middle eastern", "shawarma", "lebanese", "persian", "arabian"],
  },
];

// ── Abstract vibe descriptors ──────────────────────────────────────────────
// Different from venue.vibe[] tags (a fixed enum). These are free-form
// adjectives the user might use to describe the *feeling* of a place.
export const VIBE_DESCRIPTORS = [
  "intimate", "cozy", "romantic", "moody", "dimly lit", "candlelit",
  "aesthetic", "instagrammable", "scenic", "scenic view", "view",
  "conversational", "quiet", "calm", "low-key",
  "loud", "lively", "energetic", "buzzy", "bustling",
  "trendy", "hip", "viral", "popular", "happening",
  "weird", "unique", "quirky", "hidden", "underrated",
  "minimalist", "sleek", "modern", "industrial",
  "chill", "laid-back", "casual", "relaxed",
  "upscale", "fancy", "elegant", "bougie", "fine dining",
  "hole-in-the-wall", "no-frills", "dive",
  "rustic", "homey", "warm",
  "outdoor", "alfresco", "rooftop", "garden",
];

const OCCASION_STRONG: Record<NonNullable<OccasionKind>, string[]> = {
  date:    ["romantic", "intimate", "date spot", "candlelit", "couples"],
  group:   ["group friendly", "barkada", "shareable", "communal", "large groups"],
  solo:    ["solo friendly", "counter seating", "bar seating"],
  family:  ["family", "kid friendly", "kid-friendly", "children"],
  work:    ["wifi", "laptop friendly", "remote work", "good for work"],
  casual:  ["casual", "laid-back", "easy-going"],
};
const OCCASION_MODERATE: Record<NonNullable<OccasionKind>, string[]> = {
  date:    ["cozy", "ambient", "atmosphere", "ambiance", "quiet"],
  group:   ["spacious", "lively"],
  solo:    ["counter", "low-key"],
  family:  ["spacious"],
  work:    ["coffee shop", "quiet"],
  casual:  ["relaxed", "easy"],
};
const OCCASION_NEGATIVE: Record<NonNullable<OccasionKind>, string[]> = {
  date:    ["loud", "crowded", "fast food", "rowdy"],
  group:   ["intimate", "couples only", "very small"],
  solo:    ["family-style only"],
  family:  ["bar only", "club", "loud"],
  work:    ["loud", "club", "no wifi"],
  casual:  ["formal", "fine dining"],
};

const MEAL_KEYWORDS: Record<NonNullable<MealKind>, string[]> = {
  breakfast: ["breakfast", "early bird", "morning"],
  brunch:    ["brunch", "all-day breakfast"],
  lunch:     ["lunch", "midday"],
  dinner:    ["dinner", "supper", "evening dining"],
  drinks:    ["drinks", "cocktail", "speakeasy", "bar"],
};

const MEAL_HOURS: Record<NonNullable<MealKind>, [number, number]> = {
  breakfast: [7  * 60, 10 * 60],
  brunch:    [10 * 60, 14 * 60],
  lunch:     [11 * 60, 14 * 60],
  dinner:    [18 * 60, 22 * 60],
  drinks:    [18 * 60, 24 * 60],
};

function parseTime(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function closesAt(opens: string, closes: string): number {
  const o = parseTime(opens);
  let c = parseTime(closes);
  if (c < o) c += 24 * 60;
  return c;
}

// ── Intent parsing ─────────────────────────────────────────────────────────

function detectCuisine(lower: string): string | null {
  for (const def of CUISINE_DEFS) {
    if (def.queryPattern.test(lower)) return def.cuisine;
  }
  return null;
}

function detectVibeDescriptors(lower: string): string[] {
  const found: string[] = [];
  for (const word of VIBE_DESCRIPTORS) {
    if (lower.includes(word) && !found.includes(word)) found.push(word);
  }
  return found;
}

export function parseIntent(query: string, area: string, areaLocked: boolean): ParsedIntent {
  const lower = query.toLowerCase();

  const meal: MealKind =
    /\bbreakfast\b|\bearly\b/.test(lower)         ? "breakfast" :
    /\bbrunch\b/.test(lower)                       ? "brunch" :
    /\blunch\b/.test(lower)                        ? "lunch" :
    /\bdinner\b|\bsupper\b/.test(lower)            ? "dinner" :
    /\bdrinks?\b|\bcocktails?\b|\bnightcap\b/.test(lower) ? "drinks" :
    null;

  const occasion: OccasionKind =
    /\bdate\b|romantic|partner|\bgf\b|\bbf\b|girlfriend|boyfriend|anniversary/.test(lower) ? "date" :
    /\bgroup\b|barkada|friends|squad|\bbarka(da)?\b/.test(lower) ? "group" :
    /\bsolo\b|alone|by myself|by my self/.test(lower)            ? "solo" :
    /\bfamily\b|parents|kids|children/.test(lower)               ? "family" :
    /\bwork\b|laptop|remote|wifi/.test(lower)                    ? "work" :
    /\bcasual\b|chill|relaxed/.test(lower)                       ? "casual" :
    null;

  return {
    rawQuery: query,
    location: area,
    locationLocked: areaLocked,
    cuisine: detectCuisine(lower),
    occasion,
    meal,
    vibeDescriptors: detectVibeDescriptors(lower),
  };
}

// ── Scoring helpers ────────────────────────────────────────────────────────

function venueText(venue: Venue): string {
  return `${venue.name} ${venue.blurb} ${venue.vibe.join(" ")} ${venue.haystack ?? ""}`.toLowerCase();
}

// Binary: 1 when cuisine isn't specified OR the venue's text matches; 0 otherwise.
function cuisineMatch(venue: Venue, intent: ParsedIntent): 0 | 1 {
  if (!intent.cuisine) return 1;
  const def = CUISINE_DEFS.find((d) => d.cuisine === intent.cuisine);
  if (!def) return 1; // unknown cuisine label — don't reject, fail open
  const text = venueText(venue);
  return def.venueKeywords.some((kw) => text.includes(kw)) ? 1 : 0;
}

// Scenario fit: combines meal-window appropriateness with venue-type alignment.
function contextScore(venue: Venue, intent: ParsedIntent): number {
  if (!intent.meal) {
    // No meal/time signal → soft neutral, but penalize obvious type mismatches.
    if (intent.occasion === "work" && venue.type === "night") return 0.3;
    return 0.6;
  }

  if (intent.meal === "drinks") {
    if (venue.type === "night") return 1.0;
    if (venue.type === "food")  return 0.4;
    return 0.2;
  }

  // For meal queries (breakfast/brunch/lunch/dinner), non-food venues are wrong.
  if (venue.type !== "food") return 0.2;

  const text = venueText(venue);
  for (const kw of MEAL_KEYWORDS[intent.meal]) {
    if (text.includes(kw)) return 1.0;
  }
  if (intent.meal === "brunch"    && venue.vibe.includes("brunch")) return 1.0;
  if (intent.meal === "breakfast" && venue.vibe.includes("brunch")) return 0.7;

  // Open during the window?
  const opens  = parseTime(venue.opens);
  const closes = closesAt(venue.opens, venue.closes);
  const [windowStart, windowEnd] = MEAL_HOURS[intent.meal];
  if (opens <= windowStart && closes >= windowEnd) return 0.7;

  return 0.3;
}

function vibeScore(venue: Venue, intent: ParsedIntent): number {
  if (intent.vibeDescriptors.length === 0) return 0.5; // neutral when nothing requested
  const text = venueText(venue);
  let hits = 0;
  for (const desc of intent.vibeDescriptors) {
    if (text.includes(desc)) hits++;
  }
  // Saturate: even one strong descriptor match is meaningful, full marks at 3+.
  return Math.min(1, hits / Math.min(3, intent.vibeDescriptors.length));
}

function occasionScore(venue: Venue, intent: ParsedIntent): number {
  if (!intent.occasion) return 0.5; // neutral when no occasion requested
  const text = venueText(venue);

  for (const phrase of OCCASION_NEGATIVE[intent.occasion]) {
    if (text.includes(phrase)) return 0;
  }

  if (intent.occasion === "date"   && venue.vibe.includes("date"))   return 1.0;
  if (intent.occasion === "group"  && venue.vibe.includes("group"))  return 1.0;
  if (intent.occasion === "family" && venue.vibe.includes("family")) return 1.0;
  if (intent.occasion === "work"   && venue.vibe.includes("work"))   return 1.0;
  if (intent.occasion === "casual" && venue.vibe.includes("casual")) return 1.0;

  for (const phrase of OCCASION_STRONG[intent.occasion]) {
    if (text.includes(phrase)) return 1.0;
  }
  for (const phrase of OCCASION_MODERATE[intent.occasion]) {
    if (text.includes(phrase)) return 0.7;
  }
  return 0.3;
}

function biasFromText(text: string): BiasSignals {
  const lower = text.toLowerCase();
  const positive: string[] = [];
  const negative: string[] = [];
  for (const t of POSITIVE_TRIGGERS) if (lower.includes(t)) positive.push(t);
  for (const t of NEGATIVE_TRIGGERS) if (lower.includes(t)) negative.push(t);
  const total = positive.length + negative.length;
  const netSentiment = total === 0 ? 0 : (positive.length - negative.length) / total;
  return { positive, negative, netSentiment };
}

// Sentiment combines bias triggers with rating quality (since rating dropped
// out of the headline weights).
function sentimentScore(venue: Venue, bias: BiasSignals): number {
  let biasComponent = bias.positive.length + bias.negative.length === 0
    ? 0.5
    : (bias.netSentiment + 1) / 2;
  for (const phrase of POSITIVE_STRONG) if (bias.positive.includes(phrase)) biasComponent += 0.2;
  for (const phrase of NEGATIVE_STRONG) if (bias.negative.includes(phrase)) biasComponent -= 0.2;
  if (typeof venue.reviewCount === "number" && venue.reviewCount > 100) biasComponent += 0.05;
  biasComponent = Math.max(0, Math.min(1, biasComponent));

  const ratingComponent = typeof venue.rating === "number"
    ? Math.max(0, Math.min(1, venue.rating / 5))
    : 0.6;

  return 0.7 * biasComponent + 0.3 * ratingComponent;
}

function explain(rec: Recommendation, intent: ParsedIntent): string[] {
  const why: string[] = [];

  if (intent.locationLocked) {
    why.push(`Right in ${rec.venue.area}, where you wanted to be.`);
  }

  if (intent.cuisine && rec.score.cuisine === 1) {
    why.push(`Authentic ${intent.cuisine}.`);
  }

  if (intent.occasion && rec.score.occasion >= 1) {
    const tag = rec.venue.vibe.find((v) => ["date", "group", "casual", "family", "chill", "work"].includes(v));
    why.push(`Reads strongly ${intent.occasion}${tag ? ` — ${tag} energy` : ""}.`);
  } else if (intent.occasion && rec.score.occasion >= 0.7) {
    const tag = intent.occasion;
    why.push(`${tag.charAt(0).toUpperCase() + tag.slice(1)}-friendly atmosphere.`);
  }

  if (intent.meal && rec.score.context >= 1) {
    why.push(`Known for ${intent.meal}.`);
  } else if (intent.meal && rec.score.context >= 0.7 && rec.venue.type === "food") {
    why.push(`Open and suitable through the ${intent.meal} window.`);
  }

  if (intent.vibeDescriptors.length > 0 && rec.score.vibe >= 0.6) {
    const matched = intent.vibeDescriptors.find((d) => venueText(rec.venue).includes(d));
    if (matched) why.push(`Reads ${matched} from the room and the room talk.`);
  }

  if (rec.bias.positive.length > 0) {
    const phrase = rec.bias.positive.find((p) => POSITIVE_STRONG.includes(p)) ?? rec.bias.positive[0];
    why.push(`Locals call it "${phrase}".`);
  }

  if (rec.venue.awards && rec.venue.awards.length > 0) {
    why.push(`Mentioned in ${rec.venue.awards[0]} coverage.`);
  }

  return why.slice(0, 3);
}

// ── Main entry ─────────────────────────────────────────────────────────────

// Thrown when a hard filter wipes the pool. The route handler unpacks the
// `reason` to produce an accurate user-facing message — generic "nothing fits
// your budget" wording is misleading when the real culprit was cuisine/location.
export class FilterError extends Error {
  constructor(public reason: "exclude" | "budget" | "location" | "cuisine" | "scoring") {
    super(`FILTER:${reason}`);
    this.name = "FilterError";
  }
}

// Estimated costs are guesses (tier indicators, upscale-phrase floors, or
// category fallbacks) — give them more headroom against the user's budget so
// we don't drop a venue purely on our own approximation.
function withinBudget(venue: Venue, budgetPHP: number): boolean {
  const ceiling = venue.costEstimated ? budgetPHP * 1.5 : budgetPHP * 1.1;
  return venue.cost <= ceiling;
}

export function recommendFromPool(
  venuePool: Venue[],
  intent: ParsedIntent,
  excludeIds: string[],
  budgetPHP: number
): RecommendResult {
  // Hard filters, staged so we can attribute pool-empty failures correctly.
  const afterExclude = venuePool.filter((v) => !excludeIds.includes(v.id));
  if (afterExclude.length === 0) throw new FilterError("exclude");

  const afterBudget = afterExclude.filter((v) => withinBudget(v, budgetPHP));
  if (afterBudget.length === 0) throw new FilterError("budget");

  const afterLocation = afterBudget.filter((v) => !intent.locationLocked || v.area === intent.location);
  if (afterLocation.length === 0) throw new FilterError("location");

  const afterCuisine = afterLocation.filter((v) => cuisineMatch(v, intent) === 1);
  if (afterCuisine.length === 0) throw new FilterError("cuisine");

  const scored: Recommendation[] = afterCuisine
    .map((venue) => {
      const text = `${venue.blurb} ${venue.haystack ?? ""}`;
      const bias = biasFromText(text);

      const ctx = contextScore(venue, intent);
      const cui = cuisineMatch(venue, intent); // always 1 here (filtered above)
      const vib = vibeScore(venue, intent);
      const occ = occasionScore(venue, intent);
      const sen = sentimentScore(venue, bias);

      const final =
        W_CONTEXT   * ctx +
        W_CUISINE   * cui +
        W_VIBE      * vib +
        W_OCCASION  * occ +
        W_SENTIMENT * sen;

      const score: ScoreBreakdown = {
        context: ctx,
        cuisine: cui,
        vibe: vib,
        occasion: occ,
        sentiment: sen,
        final,
      };
      const rec: Recommendation = { venue, score, bias, why: [] };
      rec.why = explain(rec, intent);
      return rec;
    })
    .sort((a, b) => b.score.final - a.score.final);

  if (scored.length === 0) throw new FilterError("scoring");

  const primary = scored[0];
  const second = scored[1];
  const gap = second ? primary.score.final - second.score.final : 1;
  const confidence: "high" | "low" = gap >= CONFIDENCE_GAP ? "high" : "low";
  const alternates = confidence === "high" ? [] : scored.slice(1, 3);

  return { intent, primary, alternates, confidence, poolSize: venuePool.length };
}
