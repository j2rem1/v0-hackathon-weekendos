export type VenueType = "food" | "culture" | "outdoor" | "night" | "shop";

export type Vibe =
  | "foodie"
  | "date"
  | "upscale"
  | "brunch"
  | "casual"
  | "group"
  | "local"
  | "aesthetic"
  | "coffee"
  | "work"
  | "chill"
  | "art"
  | "weird"
  | "family"
  | "interactive"
  | "escape"
  | "nature"
  | "active"
  | "cocktails"
  | "party"
  | "vintage"
  | "cheap";

export interface Venue {
  id: string;
  name: string;
  area: string;
  type: VenueType;
  vibe: Vibe[];
  cost: number; // PHP per person
  costEstimated: boolean; // true when cost was inferred from a tier indicator or category fallback rather than an explicit ₱-amount
  duration: number; // minutes
  opens: string; // HH:MM
  closes: string; // HH:MM
  weatherProof: boolean;
  blurb: string;
  lat: number;
  lng: number;
  website?: string;
  rating?: number;
  reviewCount?: number;
  awards?: string[];
  instagram?: string;
  // Raw search-result text we keep so the recommender can mine it for bias signals.
  haystack?: string;
}

export type MealKind = "breakfast" | "brunch" | "lunch" | "dinner" | "drinks" | null;
export type OccasionKind = "date" | "group" | "solo" | "family" | "work" | "casual" | null;

export interface RecommendRequest {
  vibe: string;
  budget_php: number;
  party_size: number;
  exclude_ids?: string[];
}

export interface ParsedIntent {
  rawQuery: string;
  location: string;             // canonical area; "Metro Manila" when nothing extracted
  locationLocked: boolean;      // hard filter — drop out-of-area venues when true
  cuisine: string | null;       // hard filter — drop venues that don't match this cuisine when set
  occasion: OccasionKind;
  meal: MealKind;               // soft signal that feeds the context score
  vibeDescriptors: string[];    // abstract descriptors mined from the query: "intimate", "weird", "trendy", etc.
}

export interface ScoreBreakdown {
  context: number;   // 0..1 — scenario coherence (meal-window fit, type-for-time)
  cuisine: number;   // 0 or 1 — binary; 1 when no cuisine specified or cuisine matches
  vibe: number;      // 0..1 — abstract descriptor match
  occasion: number;  // 0..1 — date/group/solo/etc. fit
  sentiment: number; // 0..1 — bias triggers + rating quality
  final: number;     // weighted sum, 0..1
}

export interface BiasSignals {
  positive: string[];   // matched positive trigger phrases
  negative: string[];   // matched negative trigger phrases
  netSentiment: number; // -1..1
}

export interface Recommendation {
  venue: Venue;
  score: ScoreBreakdown;
  bias: BiasSignals;
  why: string[]; // 2-3 short, human-readable bullets
}

export interface RecommendResult {
  intent: ParsedIntent;
  primary: Recommendation;
  alternates: Recommendation[]; // empty when confidence === "high"
  confidence: "high" | "low";
  poolSize: number;
}
