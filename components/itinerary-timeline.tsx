"use client";

import { motion } from "framer-motion";
import {
  MapPin,
  Clock,
  Wallet,
  ExternalLink,
  Umbrella,
  Sun,
  RotateCcw,
  Globe,
  RefreshCw,
  Star,
  Lock,
} from "lucide-react";
import { PlanResult, ItineraryStop, VenueType } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface ItineraryTimelineProps {
  result: PlanResult;
  onReset: () => void;
  onSwap: (venueId: string) => void;
}

function getTypeIcon(type: VenueType): string {
  switch (type) {
    case "food":    return "🍽️";
    case "culture": return "🎨";
    case "outdoor": return "🌳";
    case "night":   return "🍸";
    case "shop":    return "🛍️";
    default:        return "📍";
  }
}

function getTypeColor(type: VenueType): string {
  switch (type) {
    case "food":
      return "bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400";
    case "culture":
      return "bg-rose-100 border-rose-300 text-rose-700 dark:bg-rose-900/30 dark:border-rose-700/50 dark:text-rose-400";
    case "outdoor":
      return "bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700/50 dark:text-emerald-400";
    case "night":
      return "bg-violet-100 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-700/50 dark:text-violet-400";
    case "shop":
      return "bg-sky-100 border-sky-300 text-sky-700 dark:bg-sky-900/30 dark:border-sky-700/50 dark:text-sky-400";
    default:
      return "bg-secondary border-border text-foreground/60";
  }
}

function formatReviewCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function StopCard({
  stop,
  index,
  isLast,
  onSwap,
}: {
  stop: ItineraryStop;
  index: number;
  isLast: boolean;
  onSwap: (venueId: string) => void;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${stop.venue.lat},${stop.venue.lng}`;
  const tiktokUrl = `https://www.tiktok.com/search?q=${encodeURIComponent(stop.venue.name + " " + stop.venue.area)}`;
  const igUrl = `https://www.instagram.com/explore/search/keyword/?q=${encodeURIComponent(stop.venue.name)}`;

  return (
    <motion.article
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.12 }}
      className="relative"
    >
      <div className="grid grid-cols-[auto_1fr] sm:grid-cols-[auto_1fr_auto] gap-4 sm:gap-5 items-start rounded-2xl border border-border/60 bg-card p-4 sm:p-5 shadow-sm">
        {/* Left rail: time bracket + type icon */}
        <div className="flex flex-col items-center gap-2 min-w-[56px]">
          <span className="font-mono text-[11px] tabular-nums font-bold text-foreground">{stop.startTime}</span>
          <span
            className={`size-11 sm:size-12 rounded-full flex items-center justify-center text-xl border-2 ${getTypeColor(stop.venue.type)}`}
            aria-hidden
          >
            {getTypeIcon(stop.venue.type)}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">{stop.endTime}</span>
        </div>

        {/* Middle: name + blurb + inline meta */}
        <div className="min-w-0 flex flex-col gap-2">
          {stop.venue.awards && stop.venue.awards.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {stop.venue.awards.slice(0, 2).map((award) => (
                <span
                  key={award}
                  className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 border border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400 font-medium"
                >
                  🏆 {award}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-lg sm:text-xl font-bold leading-tight tracking-tight text-foreground text-balance">
              {stop.venue.name}
            </h3>
            <span className="sm:hidden font-mono tabular-nums text-base font-extrabold text-foreground shrink-0">
              ₱{stop.totalCost.toLocaleString()}
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-snug text-pretty line-clamp-2">
            {stop.venue.blurb}
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
            {stop.venue.rating && (
              <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Star className="w-3.5 h-3.5 fill-current" />
                {stop.venue.rating.toFixed(1)}
                {stop.venue.reviewCount && (
                  <span className="text-muted-foreground font-normal">({formatReviewCount(stop.venue.reviewCount)})</span>
                )}
              </span>
            )}
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />{stop.venue.area}
            </span>
            {stop.venue.weatherProof ? (
              <span className="inline-flex items-center gap-1 text-emerald-600">
                <Umbrella className="w-3.5 h-3.5" />Indoor
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <Sun className="w-3.5 h-3.5" />Outdoor
              </span>
            )}
            {stop.venue.vibe.slice(0, 3).map((v) => (
              <span
                key={v}
                className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-[11px]"
              >
                {v}
              </span>
            ))}
          </div>

          {/* Mobile-only action row */}
          <div className="sm:hidden flex items-center justify-between gap-3 pt-2 mt-1 border-t border-border/50">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary">
                <ExternalLink className="w-3 h-3" />Map
              </a>
              <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">TikTok ↗</a>
              <a href={igUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">IG ↗</a>
            </div>
            <button
              onClick={() => onSwap(stop.venue.id)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <RefreshCw className="w-3 h-3" />Swap
            </button>
          </div>
        </div>

        {/* Right rail: cost + links + swap (sm and up) */}
        <div className="hidden sm:flex flex-col items-end justify-between gap-3 min-w-[112px] self-stretch">
          <span className="font-mono tabular-nums text-2xl font-extrabold text-foreground leading-none">
            ₱{stop.totalCost.toLocaleString()}
          </span>
          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />Map
            </a>
            {stop.venue.website && (
              <a
                href={stop.venue.website}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground inline-flex items-center gap-1"
              >
                <Globe className="w-3 h-3" />Site
              </a>
            )}
            <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">TikTok ↗</a>
            <a href={igUrl} target="_blank" rel="noopener noreferrer" className="hover:text-foreground">Instagram ↗</a>
          </div>
          <button
            onClick={() => onSwap(stop.venue.id)}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors border border-border/60 rounded-full px-3 py-1"
          >
            <RefreshCw className="w-3 h-3" />Swap
          </button>
        </div>
      </div>

      {/* Transit between stops */}
      {!isLast && (
        <div className="flex items-center gap-2 pl-7 my-3 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          <span aria-hidden className="size-1 rounded-full bg-foreground/30" />
          <span aria-hidden className="size-1 rounded-full bg-foreground/30" />
          <span aria-hidden className="size-1 rounded-full bg-foreground/30" />
          <span>~30 min transit</span>
        </div>
      )}
    </motion.article>
  );
}

export function ItineraryTimeline({ result, onReset, onSwap }: ItineraryTimelineProps) {
  if (result.stops.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <p className="text-muted-foreground mb-4">
          No venues match your criteria. Try adjusting your vibe, budget, or time window.
        </p>
        <Button onClick={onReset} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" />
          Try again
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-5 rounded-2xl bg-primary/10 border border-primary/25"
      >
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <h2 className="font-display font-extrabold text-xl sm:text-2xl text-foreground tracking-tight">
            Your {result.area} run
          </h2>
          {result.areaLocked ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-[0.16em] text-primary">
              <Lock className="w-3 h-3" />Locked to {result.area}
            </span>
          ) : (
            <span className="text-[10px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
              Wider Metro Manila
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {Math.floor(result.totalDuration / 60)}h {result.totalDuration % 60}m
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4" />
            ₱{result.totalBudget.toLocaleString()} total
          </span>
          <span className="flex items-center gap-1.5">
            {result.weatherProof ? (
              <>
                <Umbrella className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600">Rain-proof</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-600" />
                <span className="text-amber-600">Weather dependent</span>
              </>
            )}
          </span>
        </div>
      </motion.div>

      <div className="space-y-0">
        {result.stops.map((stop, index) => (
          <StopCard
            key={stop.venue.id}
            stop={stop}
            index={index}
            isLast={index === result.stops.length - 1}
            onSwap={onSwap}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: result.stops.length * 0.12 + 0.3 }}
        className="mt-8 flex gap-3"
      >
        <Button onClick={onReset} variant="outline" className="flex-1 gap-2">
          <RotateCcw className="w-4 h-4" />
          New plan
        </Button>
      </motion.div>
    </motion.div>
  );
}
