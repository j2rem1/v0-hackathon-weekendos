"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";
import { VibeForm } from "@/components/vibe-form";
import { ItineraryTimeline } from "@/components/itinerary-timeline";
import { LoadingState } from "@/components/loading-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { PlanResult, PlanRequest } from "@/lib/types";

type AppState = "hero" | "form" | "loading" | "results";

const FEATURES = [
  { label: "Budget-aware", icon: "₱" },
  { label: "Weather-proof", icon: "☔" },
  { label: "Real venues", icon: "📍" },
];

export default function Home() {
  const [state, setState] = useState<AppState>("hero");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [lastRequest, setLastRequest] = useState<Omit<PlanRequest, "exclude_ids"> | null>(null);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);

  const handleStart = () => setState("form");

  const runPlan = async (data: Omit<PlanRequest, "exclude_ids">, excluded: string[]) => {
    setState("loading");
    try {
      const response = await fetch("/api/plan-weekend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, exclude_ids: excluded }),
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

  const handleSubmit = async (data: Omit<PlanRequest, "exclude_ids">) => {
    setLastRequest(data);
    setExcludedIds([]);
    await runPlan(data, []);
  };

  const handleSwap = async (venueId: string) => {
    if (!lastRequest) return;
    const newExcluded = [...excludedIds, venueId];
    setExcludedIds(newExcluded);
    await runPlan(lastRequest, newExcluded);
  };

  const handleReset = () => {
    setResult(null);
    setExcludedIds([]);
    setState("form");
  };

  return (
    <main className="relative min-h-dvh bg-background overflow-hidden">
      {/* Warm peach glow — hero anchor */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] scale-x-125 rounded-full bg-primary/18 blur-[100px]"
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
            <span className="text-xl font-black tracking-tight text-foreground">WeekendOS</span>
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
              className="text-center pt-24 pb-28"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05, duration: 0.35 }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/8 text-primary text-xs font-semibold mb-8 tracking-wide uppercase"
              >
                <Sparkles className="w-3 h-3" />
                Metro Manila weekend planner
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-5xl sm:text-6xl md:text-7xl font-black text-foreground mb-7 text-balance leading-[1.05] tracking-tighter"
              >
                Plan your Saturday
                <br />
                <span className="text-primary">in 5 seconds.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg md:text-xl text-muted-foreground mb-12 max-w-sm mx-auto text-pretty leading-relaxed"
              >
                Tell us your vibe, budget, and crew. Get a timed, weather-proof
                Metro Manila itinerary instantly.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={handleStart}
                  className="group inline-flex items-center gap-2.5 px-10 py-5 rounded-2xl text-base font-bold text-white hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-lg"
                  style={{ background: 'linear-gradient(135deg, oklch(0.78 0.14 52), oklch(0.60 0.22 28))', boxShadow: '0 8px 32px oklch(0.60 0.22 28 / 0.35)' }}
                >
                  <Sparkles className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                  Plan my weekend
                </button>
              </motion.div>

              {/* Feature pills */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-14 flex items-center justify-center gap-3 flex-wrap"
              >
                {FEATURES.map((f) => (
                  <span
                    key={f.label}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-border bg-card text-sm font-medium text-foreground/70"
                  >
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
              <ItineraryTimeline result={result} onReset={handleReset} onSwap={handleSwap} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
