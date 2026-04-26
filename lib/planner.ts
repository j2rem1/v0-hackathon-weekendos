import { PlanRequest, PlanResult, ItineraryStop, Venue, VenueType } from "./types";

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
  
  // Handle venues that close after midnight
  if (closes < opens) {
    closes += 24 * 60;
  }
  
  // Adjust startMin and endMin if they're before opening (next day scenario)
  let adjustedStart = startMin;
  let adjustedEnd = endMin;
  
  if (adjustedEnd < adjustedStart) {
    adjustedEnd += 24 * 60;
  }
  
  return adjustedStart >= opens && adjustedEnd <= closes;
}

function scoreVenue(venue: Venue, vibeText: string, budgetPerStop: number): number {
  const lowerVibe = vibeText.toLowerCase();
  let score = 0;

  // Rain/weather keywords
  if (/rain|wet|stormy|typhoon/.test(lowerVibe)) {
    if (!venue.weatherProof) return -1000; // Filter out
  }

  // Vibe boosting
  if (/chill|hungover|tired|lazy|relax/.test(lowerVibe)) {
    if (venue.vibe.includes("chill")) score += 3;
  }

  if (/weird|unique|different|adventurous/.test(lowerVibe)) {
    if (venue.vibe.includes("weird")) score += 3;
  }

  if (/food|eat|hungry|foodie/.test(lowerVibe)) {
    if (venue.type === "food") score += 2;
  }

  if (/date|partner|romantic|gf|bf|girlfriend|boyfriend/.test(lowerVibe)) {
    if (venue.vibe.includes("date")) score += 3;
  }

  if (/group|friends|barkada/.test(lowerVibe)) {
    if (venue.vibe.includes("group")) score += 2;
  }

  if (/art|museum|culture/.test(lowerVibe)) {
    if (venue.vibe.includes("art") || venue.type === "culture") score += 2;
  }

  if (/coffee|cafe/.test(lowerVibe)) {
    if (venue.vibe.includes("coffee")) score += 2;
  }

  if (/nature|outdoor|escape|hike/.test(lowerVibe)) {
    if (venue.type === "outdoor" || venue.vibe.includes("escape")) score += 2;
  }

  if (/night|drink|bar|party/.test(lowerVibe)) {
    if (venue.type === "night") score += 2;
  }

  if (/cheap|budget|affordable/.test(lowerVibe)) {
    if (venue.vibe.includes("cheap") || venue.cost < 400) score += 2;
  }

  if (/upscale|fancy|luxur/.test(lowerVibe)) {
    if (venue.vibe.includes("upscale")) score += 2;
  }

  if (/brunch|morning|breakfast/.test(lowerVibe)) {
    if (venue.vibe.includes("brunch")) score += 2;
  }

  if (/shop|vintage|thrift/.test(lowerVibe)) {
    if (venue.type === "shop") score += 2;
  }

  // Budget fit bonus
  if (venue.cost <= budgetPerStop) {
    score += 1;
  }

  // Quality signals from live data
  if (venue.rating) {
    if (venue.rating >= 4.5) score += 2;
    else if (venue.rating >= 4.0) score += 1;
  }
  if (venue.reviewCount && venue.reviewCount >= 500) score += 1; // popular/trending
  if (venue.awards && venue.awards.length > 0) score += 3;

  // Random factor for variety — large enough to actually shuffle similarly-scored venues
  score += Math.random() * 2;

  return score;
}

export function planWeekend(request: PlanRequest, venuePool: Venue[]): PlanResult {
  const { vibe, budget_php, party_size, start_time, end_time, exclude_ids = [] } = request;

  const budgetPerStop = budget_php / 4;
  const totalBudgetPHP = budget_php * party_size;

  const startMinutes = parseTime(start_time);
  let endMinutes = parseTime(end_time);
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const lowerVibe = vibe.toLowerCase();
  const requireWeatherProof = /rain|wet|stormy|typhoon/.test(lowerVibe);

  // Score and filter venues
  const scoredVenues = venuePool
    .filter((v) => !exclude_ids.includes(v.id))
    .filter((v) => !requireWeatherProof || v.weatherProof)
    .map((venue) => ({
      venue,
      score: scoreVenue(venue, vibe, budgetPerStop),
    }))
    .filter((sv) => sv.score > -100)
    .sort((a, b) => b.score - a.score);

  // Build itinerary
  const stops: ItineraryStop[] = [];
  let currentTime = startMinutes;
  let runningCost = 0;
  const usedTypes: VenueType[] = [];
  const TRANSIT_BUFFER = 30; // 30 min between stops
  const MAX_STOPS = 4;

  for (const { venue } of scoredVenues) {
    if (stops.length >= MAX_STOPS) break;

    // Check if we'd exceed budget
    const stopCost = venue.cost * party_size;
    if (runningCost + stopCost > totalBudgetPHP) continue;

    // Check if we'd exceed time
    const stopEndTime = currentTime + venue.duration;
    if (stopEndTime > endMinutes) continue;

    // Check if venue is open at this time
    if (!isVenueOpen(venue, currentTime, stopEndTime)) continue;

    // Avoid repeating same type more than twice
    const typeCount = usedTypes.filter((t) => t === venue.type).length;
    if (typeCount >= 2) continue;

    // Add stop
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

  // Calculate totals
  const totalDuration = stops.reduce((sum, s) => sum + s.venue.duration, 0);
  const allWeatherProof = stops.every((s) => s.venue.weatherProof);

  return {
    stops,
    totalBudget: runningCost,
    totalDuration,
    weatherProof: allWeatherProof,
  };
}
