"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Sparkles } from "lucide-react";
import { VibeForm } from "@/components/vibe-form";
import { ItineraryTimeline } from "@/components/itinerary-timeline";
import { LoadingState } from "@/components/loading-state";
import { PlanResult } from "@/lib/types";

type AppState = "hero" | "form" | "loading" | "results";

export default function Home() {
  const [state, setState] = useState<AppState>("hero");
  const [result, setResult] = useState<PlanResult | null>(null);

  const handleStart = () => {
    setState("form");
  };

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

      if (!response.ok) {
        throw new Error("Failed to generate plan");
      }

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
    <main className="min-h-dvh bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header - Always visible */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <button
            onClick={() => setState("hero")}
            className="inline-flex items-center gap-2 mb-2"
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">WeekendOS</span>
          </button>
          {state !== "hero" && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground"
            >
              Plan your Saturday in 5 seconds
            </motion.p>
          )}
        </motion.header>

        {/* Content */}
        <AnimatePresence mode="wait">
          {state === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance"
              >
                Your AI Chief-of-Staff
                <br />
                <span className="text-primary">for Free Time</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg text-muted-foreground mb-8 max-w-md mx-auto text-pretty"
              >
                Tell us your vibe, budget, and crew. Get a timed, weather-aware
                Metro Manila itinerary in seconds.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  onClick={handleStart}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-full text-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-5 h-5" />
                  Plan my weekend
                </button>
              </motion.div>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-16 grid grid-cols-3 gap-4 max-w-md mx-auto"
              >
                {[
                  { label: "Budget-aware", icon: "₱" },
                  { label: "Weather-proof", icon: "☔" },
                  { label: "Real venues", icon: "📍" },
                ].map((feature) => (
                  <div
                    key={feature.label}
                    className="text-center p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="text-2xl mb-2">{feature.icon}</div>
                    <div className="text-xs text-muted-foreground">
                      {feature.label}
                    </div>
                  </div>
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
