import { PlanRequest, PlanResult, ItineraryStop, Venue, VenueType } from "./types";

interface PlanContext {
  area: string;        // canonical area surfaced back to the UI
  areaLocked: boolean; // true when extracted from vibe text (strict binding active)
}

function parseTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatTime(minutes: number): string {
  const hrs = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

function isVenueOpen(venue: Venue, startMin: number, endMin: number): boolean {
  const opens = parseTime(venue.opens);
  let closes = parseTime(venue.closes);

  if (closes < opens) closes += 24 * 60;

  let adjustedStart = startMin;
  let adjustedEnd = endMin;
  if (adjustedEnd < adjustedStart) adjustedEnd += 24 * 60;

  return adjustedStart >= opens && adjustedEnd <= closes;
}

function scoreVenue(venue: Venue, vibeText: string, budgetPerStop: number, ctx: PlanContext): number {
  const lowerVibe = vibeText.toLowerCase();
  let score = 0;

  if (/rain|wet|stormy|typhoon/.test(lowerVibe)) {
    if (!venue.weatherProof) return -1000;
  }

  // Hard location binding — the strongest signal in the model.
  // When the user names an area, anything outside it is dropped from the pool
  // before scheduling kicks in.
  if (ctx.areaLocked) {
    if (venue.area === ctx.area) score += 6;
    else return -1000;
  } else if (venue.area === ctx.area) {
    score += 1;
  }

  if (/chill|hungover|tired|lazy|relax/.test(lowerVibe) && venue.vibe.includes("chill")) score += 3;
  if (/weird|unique|different|adventurous/.test(lowerVibe) && venue.vibe.includes("weird")) score += 3;
  if (/food|eat|hungry|foodie/.test(lowerVibe) && venue.type === "food") score += 2;
  if (/date|partner|romantic|gf|bf|girlfriend|boyfriend/.test(lowerVibe) && venue.vibe.includes("date")) score += 3;
  if (/group|friends|barkada/.test(lowerVibe) && venue.vibe.includes("group")) score += 2;
  if (/art|museum|culture/.test(lowerVibe) && (venue.vibe.includes("art") || venue.type === "culture")) score += 2;
  if (/coffee|cafe/.test(lowerVibe) && venue.vibe.includes("coffee")) score += 2;
  if (/nature|outdoor|escape|hike/.test(lowerVibe) && (venue.type === "outdoor" || venue.vibe.includes("escape"))) score += 2;
  if (/night|drink|bar|party/.test(lowerVibe) && venue.type === "night") score += 2;
  if (/cheap|budget|affordable/.test(lowerVibe) && (venue.vibe.includes("cheap") || venue.cost < 400)) score += 2;
  if (/upscale|fancy|luxur/.test(lowerVibe) && venue.vibe.includes("upscale")) score += 2;
  if (/brunch|morning|breakfast/.test(lowerVibe) && venue.vibe.includes("brunch")) score += 2;
  if (/shop|vintage|thrift/.test(lowerVibe) && venue.type === "shop") score += 2;

  if (venue.cost <= budgetPerStop) score += 1;

  if (venue.rating) {
    if (venue.rating >= 4.5) score += 2;
    else if (venue.rating >= 4.0) score += 1;
  }
  if (venue.reviewCount && venue.reviewCount >= 500) score += 1;
  if (venue.awards && venue.awards.length > 0) score += 3;

  // Tie-breaker: shuffles same-scored venues so reroll feels fresh.
  score += Math.random() * 2;

  return score;
}

export function planItinerary(request: PlanRequest, venuePool: Venue[], ctx: PlanContext): PlanResult {
  const { vibe, budget_php, party_size, start_time, end_time, exclude_ids = [] } = request;

  const budgetPerStop = budget_php / 4;
  const totalBudgetPHP = budget_php * party_size;

  const startMinutes = parseTime(start_time);
  let endMinutes = parseTime(end_time);
  if (endMinutes < startMinutes) endMinutes += 24 * 60;

  const lowerVibe = vibe.toLowerCase();
  const requireWeatherProof = /rain|wet|stormy|typhoon/.test(lowerVibe);

  let scoredVenues = venuePool
    .filter((v) => !exclude_ids.includes(v.id))
    .filter((v) => !requireWeatherProof || v.weatherProof)
    .map((venue) => ({ venue, score: scoreVenue(venue, vibe, budgetPerStop, ctx) }))
    .filter((sv) => sv.score > -100)
    .sort((a, b) => b.score - a.score);

  // Defensive fallback: if strict area binding wiped the pool clean (rare —
  // search.ts already handles this), retry without the binding so the user
  // still gets a plan rather than an empty state.
  let effectiveLocked = ctx.areaLocked;
  if (effectiveLocked && scoredVenues.length === 0) {
    console.warn(`[planner] area lock "${ctx.area}" left no venues — releasing the lock`);
    effectiveLocked = false;
    scoredVenues = venuePool
      .filter((v) => !exclude_ids.includes(v.id))
      .filter((v) => !requireWeatherProof || v.weatherProof)
      .map((venue) => ({
        venue,
        score: scoreVenue(venue, vibe, budgetPerStop, { area: ctx.area, areaLocked: false }),
      }))
      .sort((a, b) => b.score - a.score);
  }

  const stops: ItineraryStop[] = [];
  let currentTime = startMinutes;
  let runningCost = 0;
  const usedTypes: VenueType[] = [];
  const TRANSIT_BUFFER = 30;
  const MAX_STOPS = 4;

  for (const { venue } of scoredVenues) {
    if (stops.length >= MAX_STOPS) break;

    const stopCost = venue.cost * party_size;
    if (runningCost + stopCost > totalBudgetPHP) continue;

    const stopEndTime = currentTime + venue.duration;
    if (stopEndTime > endMinutes) continue;

    if (!isVenueOpen(venue, currentTime, stopEndTime)) continue;

    const typeCount = usedTypes.filter((t) => t === venue.type).length;
    if (typeCount >= 2) continue;

    stops.push({
      venue,
      startTime: formatTime(currentTime),
      endTime: formatTime(stopEndTime),
      totalCost: stopCost,
    });

    usedTypes.push(venue.type);
    runningCost += stopCost;
    currentTime = stopEndTime + TRANSIT_BUFFER;
  }

  const totalDuration = stops.reduce((sum, s) => sum + s.venue.duration, 0);
  const allWeatherProof = stops.every((s) => s.venue.weatherProof);

  return {
    stops,
    totalBudget: runningCost,
    totalDuration,
    weatherProof: allWeatherProof,
    area: ctx.area,
    areaLocked: effectiveLocked,
  };
}
