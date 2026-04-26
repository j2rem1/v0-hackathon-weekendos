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
} from "lucide-react";
import { PlanResult, ItineraryStop, VenueType } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface ItineraryTimelineProps {
  result: PlanResult;
  onReset: () => void;
}

function getTypeIcon(type: VenueType): string {
  switch (type) {
    case "food":
      return "🍽️";
    case "culture":
      return "🎨";
    case "outdoor":
      return "🌳";
    case "night":
      return "🍸";
    case "shop":
      return "🛍️";
    default:
      return "📍";
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

function TimelineStop({
  stop,
  index,
  isLast,
}: {
  stop: ItineraryStop;
  index: number;
  isLast: boolean;
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${stop.venue.lat},${stop.venue.lng}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.15 }}
      className="relative flex gap-4"
    >
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 shadow-sm ${getTypeColor(
            stop.venue.type
          )}`}
        >
          {getTypeIcon(stop.venue.type)}
        </div>
        {!isLast && (
          <div className="w-px flex-1 min-h-[60px] bg-border/60 mt-2 border-l border-dashed border-border" />
        )}
      </div>

      {/* Stop content */}
      <div className="flex-1 pb-8">
        <div className="bg-card rounded-xl border border-border/50 p-4 shadow-sm">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-foreground text-balance">
              {stop.venue.name}
            </h3>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
              Map
            </a>
          </div>

          {/* Blurb */}
          <p className="text-sm text-muted-foreground mb-3 text-pretty">
            {stop.venue.blurb}
          </p>

          {/* Meta info */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {stop.startTime} - {stop.endTime}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {stop.venue.area}
            </span>
            <span className="flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />₱{stop.totalCost.toLocaleString()}
            </span>
            {stop.venue.weatherProof ? (
              <span className="flex items-center gap-1 text-emerald-600">
                <Umbrella className="w-3.5 h-3.5" />
                Indoor
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-600">
                <Sun className="w-3.5 h-3.5" />
                Outdoor
              </span>
            )}
          </div>

          {/* Vibes */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {stop.venue.vibe.map((v) => (
              <span
                key={v}
                className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
              >
                {v}
              </span>
            ))}
          </div>
        </div>

        {/* Transit indicator */}
        {!isLast && (
          <div className="mt-3 ml-1 text-xs text-muted-foreground italic">
            ~30 min transit
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function ItineraryTimeline({ result, onReset }: ItineraryTimelineProps) {
  if (result.stops.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
      >
        <p className="text-muted-foreground mb-4">
          No venues match your criteria. Try adjusting your vibe, budget, or
          time window.
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
      className="w-full max-w-lg mx-auto"
    >
      {/* Summary Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 p-5 rounded-2xl bg-primary/10 border border-primary/25"
      >
        <h2 className="font-black text-xl text-foreground mb-3 tracking-tight">
          Your Weekend Plan
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {Math.floor(result.totalDuration / 60)}h {result.totalDuration % 60}m
          </span>
          <span className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4" />₱{result.totalBudget.toLocaleString()}{" "}
            total
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

      {/* Timeline */}
      <div className="space-y-0">
        {result.stops.map((stop, index) => (
          <TimelineStop
            key={stop.venue.id}
            stop={stop}
            index={index}
            isLast={index === result.stops.length - 1}
          />
        ))}
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: result.stops.length * 0.15 + 0.3 }}
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
