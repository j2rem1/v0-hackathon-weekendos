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
  duration: number; // minutes
  opens: string; // HH:MM
  closes: string; // HH:MM
  weatherProof: boolean;
  blurb: string;
  lat: number;
  lng: number;
}

export interface PlanRequest {
  vibe: string;
  budget_php: number;
  party_size: number;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
}

export interface ItineraryStop {
  venue: Venue;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  totalCost: number; // cost × party_size
}

export interface PlanResult {
  stops: ItineraryStop[];
  totalBudget: number;
  totalDuration: number; // minutes
  weatherProof: boolean;
}
