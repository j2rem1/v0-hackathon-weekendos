"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Users, Wallet } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

interface VibeFormProps {
  onSubmit: (data: {
    vibe: string;
    budget_php: number;
    party_size: number;
  }) => void;
  isLoading: boolean;
}

const QUICK_VIBES = [
  "rainy poblacion crawl, ₱2K",
  "barkada brunch in Maginhawa",
  "solo coffee + thrift, Cubao",
  "first date, BGC, no fuss",
  "antipolo half-day escape",
  "post-payday treat in Rockwell",
];

export function VibeForm({ onSubmit, isLoading }: VibeFormProps) {
  const [vibe, setVibe] = useState("");
  const [budget, setBudget] = useState(3000);
  const [partySize, setPartySize] = useState(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibe.trim()) return;
    onSubmit({ vibe, budget_php: budget, party_size: partySize });
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      onSubmit={handleSubmit}
      className="w-full"
    >
      <div className="mb-2">
        <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-2">Step 01</p>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.05]">
          What's the move?
        </h2>
      </div>

      {/* Vibe input */}
      <div className="mt-7 mb-9">
        <Textarea
          value={vibe}
          onChange={(e) => setVibe(e.target.value)}
          placeholder="rainy afternoon in QC, ₱3K, with my partner, comfort food and something weird after..."
          className="min-h-[120px] text-base resize-none bg-card border-2 border-foreground/10 focus:border-primary/60 transition-colors rounded-xl px-4 py-3 leading-relaxed"
        />
        <div className="mt-3 flex flex-wrap gap-1.5">
          {QUICK_VIBES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setVibe(q)}
              className="rounded-full border border-foreground/15 bg-card px-3 py-1.5 text-xs font-medium text-foreground/75 hover:border-primary/60 hover:text-primary transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Budget */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/85">
            <Wallet className="w-4 h-4" /> Budget per person
          </label>
          <span className="font-mono tabular-nums text-2xl font-extrabold text-foreground">
            ₱{budget.toLocaleString()}
          </span>
        </div>
        <Slider
          value={[budget]}
          onValueChange={(v) => setBudget(v[0])}
          min={500}
          max={10000}
          step={500}
        />
        <div className="mt-2 flex justify-between text-[11px] font-mono uppercase tracking-[0.16em] text-muted-foreground">
          <span>₱500</span>
          <span>₱10K</span>
        </div>
      </div>

      {/* Party size */}
      <div className="mb-8">
        <div className="flex items-end justify-between mb-3">
          <label className="inline-flex items-center gap-2 text-sm font-semibold text-foreground/85">
            <Users className="w-4 h-4" /> Party size
          </label>
          <span className="font-mono tabular-nums text-sm text-muted-foreground">
            {partySize === 1 ? "going solo" : `${partySize} people`}
          </span>
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPartySize(n)}
              className={`py-2.5 rounded-lg font-display text-base font-bold transition-all border-2 ${
                partySize === n
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card text-foreground/70 border-foreground/10 hover:border-foreground/30"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!vibe.trim() || isLoading}
        className="group w-full inline-flex items-center justify-between rounded-full bg-foreground text-background pl-6 pr-2 py-2 text-base font-semibold shadow-[0_10px_30px_-8px_oklch(0.18_0.04_270/0.45)] hover:translate-y-[-1px] active:translate-y-[1px] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        <span>{isLoading ? "Looking..." : "Find my pick"}</span>
        <span className="inline-flex items-center justify-center size-11 rounded-full bg-primary text-primary-foreground group-hover:rotate-[-12deg] transition-transform">
          <ArrowRight className="w-5 h-5" />
        </span>
      </button>
    </motion.form>
  );
}
