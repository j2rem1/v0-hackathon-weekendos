"use client";

import { MapPin, Star, Sparkles } from "lucide-react";

export function SampleRecommendation() {
  return (
    <div className="relative w-full max-w-[380px] rounded-2xl border-2 border-foreground/15 bg-card p-5 shadow-[0_22px_50px_-25px_oklch(0.18_0.04_270/0.55)]">
      <div className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-primary-foreground">
        <Sparkles className="w-3 h-3" />
        Pick
      </div>

      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">
        Confident pick
      </p>
      <h3 className="font-display text-2xl font-extrabold tracking-tight leading-[1.05] text-foreground pr-16">
        Toyo Eatery
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" />
          Makati
        </span>
        <span className="size-1 rounded-full bg-foreground/30" aria-hidden />
        <span>Food</span>
        <span className="inline-flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5 fill-current text-primary" />
          <span className="font-mono tabular-nums">4.8</span>
        </span>
      </div>

      <ul className="mt-4 space-y-2">
        {[
          "Right in Makati, where you wanted to be.",
          "Reads strongly date — intimate, candlelit room.",
          "Carries an Asia's 50 Best mention.",
        ].map((line) => (
          <li key={line} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground/85">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {[
          ["Match", 92],
          ["Fit", 100],
          ["Vibe", 90],
          ["Occasion", 100],
          ["Buzz", 88],
        ].map(([label, value]) => (
          <span
            key={label as string}
            className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/80"
          >
            <span>{label}</span>
            <span className="tabular-nums font-bold text-foreground">{value as number}</span>
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-foreground/10 pt-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Per person
          </p>
          <p className="font-display text-2xl font-extrabold tabular-nums text-foreground">
            ₱2,400
          </p>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
          92% match
        </span>
      </div>
    </div>
  );
}
