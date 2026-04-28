"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, RotateCcw, MapPin } from "lucide-react";
import { RecommendationCard } from "@/components/recommendation-card";
import { RecommendResult } from "@/lib/types";

export function RecommendationStack({
  results,
  isLoading,
  errorMsg,
  onAskAgain,
  onReset,
}: {
  results: RecommendResult[];
  isLoading: boolean;
  errorMsg: string | null;
  onAskAgain: (vibe: string) => void;
  onReset: () => void;
}) {
  const [followUpVibe, setFollowUpVibe] = useState("");
  const lastIntent = results[results.length - 1]?.intent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = followUpVibe.trim();
    if (!trimmed) return;
    onAskAgain(trimmed);
    setFollowUpVibe("");
  };

  return (
    <div className="w-full">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
            Your picks
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.05]">
            {results.length === 1 ? "One spot, sorted." : `${results.length} picks, sorted.`}
          </h2>
          {lastIntent && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="w-3.5 h-3.5" />
              {lastIntent.locationLocked ? lastIntent.location : "Metro Manila"}
              {lastIntent.cuisine && (
                <>
                  <span aria-hidden>·</span>
                  <span>{lastIntent.cuisine}</span>
                </>
              )}
              {lastIntent.occasion && (
                <>
                  <span aria-hidden>·</span>
                  <span>{lastIntent.occasion}</span>
                </>
              )}
              {lastIntent.meal && (
                <>
                  <span aria-hidden>·</span>
                  <span>{lastIntent.meal}</span>
                </>
              )}
            </p>
          )}
        </div>
        <button
          onClick={onReset}
          className="hidden sm:inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] font-mono hover:bg-foreground hover:text-background transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Restart
        </button>
      </div>

      <div className="space-y-6">
        {results.map((r, ri) => (
          <section key={ri} className="space-y-3">
            <RecommendationCard
              rec={r.primary}
              index={ri}
              rank={r.confidence === "high" ? "Confident pick" : `Pick ${ri + 1}`}
              isPrimary
              showAlternates={r.alternates.length === 0}
            />
            {r.confidence === "low" && r.alternates.length > 0 && (
              <details className="group rounded-xl border border-foreground/10 bg-card/60 px-4 py-3">
                <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-between">
                  <span>Close call — {r.alternates.length} more in the running</span>
                  <span className="text-foreground/40 group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="mt-3 space-y-3">
                  {r.alternates.map((alt, ai) => (
                    <RecommendationCard
                      key={alt.venue.id}
                      rec={alt}
                      index={ai}
                      rank={`Alt ${ai + 1}`}
                      isPrimary={false}
                    />
                  ))}
                </div>
              </details>
            )}
          </section>
        ))}

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border-2 border-dashed border-foreground/15 bg-card/40 p-6"
            >
              <div className="flex items-center gap-3">
                <span className="size-2 rounded-full bg-primary animate-pulse" />
                <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                  Scoring the city...
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {errorMsg && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {errorMsg}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-8 rounded-2xl border-2 border-foreground/10 bg-card p-4 sm:p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-2">
          Not it? Ask for another
        </p>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={followUpVibe}
            onChange={(e) => setFollowUpVibe(e.target.value)}
            placeholder="something quieter, no Italian this time..."
            className="flex-1 px-4 py-3 rounded-lg bg-background border-2 border-foreground/10 text-sm focus:border-primary/60 focus:outline-none transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!followUpVibe.trim() || isLoading}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground text-background pl-5 pr-2 py-2 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:translate-y-[-1px] transition-transform"
          >
            {isLoading ? "Looking..." : "Find another"}
            <span className="inline-flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground group-hover:rotate-[-12deg] transition-transform">
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>
        <p className="mt-2 text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground/80">
          Reuses your budget · party · already-shown picks excluded
        </p>
      </form>

      <button
        onClick={onReset}
        className="mt-5 sm:hidden w-full inline-flex items-center justify-center gap-2 rounded-full border border-foreground/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] font-mono hover:bg-foreground hover:text-background transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Restart
      </button>
    </div>
  );
}
