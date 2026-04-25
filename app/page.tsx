"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";
import { VibeForm } from "@/components/vibe-form";
import { ItineraryTimeline } from "@/components/itinerary-timeline";
import { LoadingState } from "@/components/loading-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanResult } from "@/lib/types";

type AppState = "hero" | "form" | "loading" | "results";

const FEATURES = [
  { label: "Budget-aware", icon: "₱" },
  { label: "Weather-proof", icon: "☔" },
  { label: "Real venues", icon: "📍" },
];

export default function Home() {
  const [state, setState] = useState<AppState>("hero");
  const [result, setResult] = useState<PlanResult | null>(null);

  const handleStart = () => setState("form");

  const handleSubmit = async (data: {
    vibe: string;
    budget_php: number;
    party_size: number;
    start_time: string;
    end_time: string;
  }) => {
    setState("loading");
    try {
      const response = await fetch("/api/plan-weekend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to generate plan");
      const planResult = (await response.json()) as PlanResult;
      setResult(planResult);
      setState("results");
    } catch (error) {
      console.error("Error:", error);
      setState("form");
    }
  };

  const handleReset = () => {
    setResult(null);
    setState("form");
  };

  return (
    <main className="relative min-h-dvh bg-background overflow-hidden">
      {/* Subtle radial glow — hero only */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 bg-primary/5 blur-3xl"
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <button
            onClick={() => setState("hero")}
            className="inline-flex items-center gap-2"
          >
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">WeekendOS</span>
          </button>

          <div className="flex items-center gap-3">
            {state !== "hero" && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-muted-foreground hidden sm:block"
              >
                Plan your Saturday in 5 seconds
              </motion.p>
            )}
            <ThemeToggle />
          </div>
        </motion.header>

        {/* Content */}
        <AnimatePresence mode="wait">
          {state === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center pt-20 pb-24"
            >
              {/* Badge — tight lead-in to headline */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-5 tracking-wide"
              >
                <Sparkles className="w-3 h-3" />
                Metro Manila weekend planner
              </motion.div>

              {/* Headline — medium gap to subtitle */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-foreground mb-6 text-balance leading-tight"
              >
                Your AI Chief-of-Staff
                <br />
                <span className="text-primary">for Free Time</span>
              </motion.h1>

              {/* Subtitle — generous gap before CTA (the key action) */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground mb-12 max-w-md mx-auto text-pretty"
              >
                Tell us your vibe, budget, and crew. Get a timed, weather-aware
                itinerary in seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={handleStart}
                  className="group inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full text-base font-semibold hover:scale-[1.03] active:scale-[0.97] transition-transform duration-150"
                >
                  <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                  Plan my weekend
                </button>
              </motion.div>

              {/* Feature strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 flex items-center justify-center gap-2 text-sm text-muted-foreground flex-wrap"
              >
                {FEATURES.map((f, i) => (
                  <span key={f.label} className="inline-flex items-center gap-1.5">
                    {i > 0 && (
                      <span className="mr-1 text-border/60 select-none" aria-hidden>·</span>
                    )}
                    <span aria-hidden>{f.icon}</span>
                    {f.label}
                  </span>
                ))}
              </motion.div>
            </motion.div>
          )}

          {state === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <VibeForm onSubmit={handleSubmit} isLoading={false} />
            </motion.div>
          )}

          {state === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingState />
            </motion.div>
          )}

          {state === "results" && result && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ItineraryTimeline result={result} onReset={handleReset} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
