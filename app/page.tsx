"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { VibeForm } from "@/components/vibe-form";
import { ItineraryTimeline } from "@/components/itinerary-timeline";
import { LoadingState } from "@/components/loading-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { ManilaSkyline } from "@/components/manila-skyline";
import { VibeMarquee } from "@/components/vibe-marquee";
import { SampleItinerary } from "@/components/sample-itinerary";
import { PlanResult, PlanRequest } from "@/lib/types";

type AppState = "hero" | "form" | "loading" | "results";

const VIBES = [
  "rainy poblacion crawl, ₱2K",
  "barkada brunch in Maginhawa",
  "solo coffee + thrift in Cubao",
  "date night, BGC steakhouse, no fuss",
  "katipunan late cravings",
  "antipolo escape sunday",
  "first-date safe pick, under ₱1.5K",
  "art walk, then drinks in Salcedo",
  "rainy day, comfort food only",
  "post-payday treat in Rockwell",
];

export default function Home() {
  const [state, setState] = useState<AppState>("hero");
  const [result, setResult] = useState<PlanResult | null>(null);
  const [lastRequest, setLastRequest] = useState<Omit<PlanRequest, "exclude_ids"> | null>(null);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const runPlan = async (data: Omit<PlanRequest, "exclude_ids">, excluded: string[]) => {
    setState("loading");
    setErrorMsg(null);
    try {
      const response = await fetch("/api/plan-weekend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, exclude_ids: excluded }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || `Request failed (${response.status})`);
      setResult(payload as PlanResult);
      setState("results");
    } catch (error: any) {
      console.error("Error:", error);
      setErrorMsg(error?.message ?? "Something went wrong");
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
    <main className="relative min-h-dvh bg-background text-foreground">
      <AnimatePresence mode="wait">
        {state === "hero" && (
          <motion.div
            key="hero"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4 }}
          >
            <HeroSurface onPlan={() => setState("form")} />
            <Marquee />
            <Proof />
            <HowItWorks onPlan={() => setState("form")} />
            <Stats />
            <SiteFooter />
          </motion.div>
        )}

        {state === "form" && (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35 }}
          >
            <FormShell onBack={() => setState("hero")}>
              {errorMsg && (
                <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {errorMsg}
                </div>
              )}
              <VibeForm onSubmit={handleSubmit} isLoading={false} />
            </FormShell>
          </motion.div>
        )}

        {state === "loading" && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <FormShell onBack={() => setState("form")}>
              <LoadingState />
            </FormShell>
          </motion.div>
        )}

        {state === "results" && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <FormShell onBack={() => setState("hero")}>
              <ItineraryTimeline result={result} onReset={handleReset} onSwap={handleSwap} />
            </FormShell>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────────── */

function Wordmark({ tone = "ink" }: { tone?: "ink" | "cream" }) {
  const color = tone === "ink" ? "text-foreground" : "text-hero-foreground";
  return (
    <a href="/" className={`group inline-flex items-baseline gap-1.5 font-display font-extrabold tracking-tight ${color}`}>
      <span className="text-xl">weekend</span>
      <span className="text-xl text-primary group-hover:rotate-6 transition-transform duration-300 inline-block">os</span>
      <span aria-hidden className="ml-1 inline-block size-1.5 rounded-full bg-primary translate-y-[-2px]" />
    </a>
  );
}

function HeroSurface({ onPlan }: { onPlan: () => void }) {
  return (
    <section className="relative isolate overflow-hidden bg-hero text-hero-foreground">
      {/* skyline behind type, anchored to bottom */}
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-[60%] text-hero-deep">
        <ManilaSkyline className="w-full h-full" />
      </div>
      {/* sun glow, top right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full opacity-60"
        style={{ background: "radial-gradient(circle, oklch(0.92 0.16 78) 0%, transparent 60%)" }}
      />
      {/* film grain */}
      <div className="grain absolute inset-0" />

      {/* header */}
      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 pt-6 flex items-center justify-between">
        <Wordmark tone="cream" />
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-background/30 backdrop-blur px-3 py-1.5 text-xs font-mono uppercase tracking-[0.18em]">
            <span aria-hidden className="size-1.5 rounded-full bg-primary animate-pulse" />
            Manila, Fri 9:42 PM
          </span>
          <ThemeToggle />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-8 pt-12 sm:pt-20 pb-28 sm:pb-36 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-end">
        <div className="lg:col-span-7 xl:col-span-7">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="font-mono text-[11px] sm:text-xs uppercase tracking-[0.32em] text-foreground/70 mb-6"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-foreground/25 px-3 py-1.5">
              <span className="size-1.5 rounded-full bg-primary" />
              Friday Night, Metro Manila
            </span>
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.12 }}
            className="font-display font-extrabold leading-[0.92] tracking-[-0.035em] text-balance"
            style={{ fontSize: "clamp(3.4rem, 9.5vw, 8rem)" }}
          >
            Saturday<br />
            <span className="inline-flex items-baseline">
              in Manila,
            </span>
            <br />
            <span className="relative inline-block italic text-primary">
              sorted.
              <svg
                aria-hidden
                viewBox="0 0 320 24"
                className="absolute left-0 -bottom-2 w-[88%] h-[14px] text-primary/70"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 14 C 80 4, 180 24, 318 8"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32 }}
            className="mt-7 max-w-[58ch] text-base sm:text-lg leading-relaxed text-foreground/80"
          >
            Type a vibe, get a timed itinerary in five seconds. Real venues across QC, Makati, BGC, and Poblacion. Honest budget, weather-aware, no group-chat purgatory.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45 }}
            className="mt-9 flex flex-col sm:flex-row items-start sm:items-center gap-4"
          >
            <button
              onClick={onPlan}
              className="group inline-flex items-center gap-2.5 rounded-full bg-foreground text-background pl-6 pr-2.5 py-2.5 font-semibold text-base shadow-[0_10px_30px_-8px_oklch(0.18_0.04_270/0.5)] hover:translate-y-[-1px] active:translate-y-[1px] transition-transform"
            >
              Plan tonight
              <span className="inline-flex items-center justify-center size-9 rounded-full bg-primary text-primary-foreground group-hover:rotate-[-12deg] transition-transform">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            <a href="#how" className="text-sm font-medium text-foreground/75 hover:text-foreground underline underline-offset-4 decoration-foreground/30">
              See how it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-12 flex items-center gap-5 text-[11px] uppercase tracking-[0.22em] font-mono text-foreground/60"
          >
            <span>9 areas</span>
            <span aria-hidden>·</span>
            <span>live venues</span>
            <span aria-hidden>·</span>
            <span>₱200 — ₱3K</span>
          </motion.div>
        </div>

        {/* pinned itinerary proof — anchored bottom-right */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: 8 }}
          animate={{ opacity: 1, y: 0, rotate: 3.5 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.55 }}
          className="lg:col-span-5 xl:col-span-5 flex justify-center lg:justify-end relative"
        >
          {/* pin */}
          <div aria-hidden className="absolute -top-3 right-6 lg:right-12 z-20 size-3 rounded-full bg-primary shadow-[0_4px_8px_oklch(0.18_0.04_270/0.4)]" />
          <SampleItinerary />
        </motion.div>
      </div>
    </section>
  );
}

function Marquee() {
  return <VibeMarquee vibes={VIBES} className="bg-background text-foreground border-foreground/15" />;
}

function Proof() {
  const items = [
    { num: "16", label: "vibe attitudes mapped" },
    { num: "9",  label: "Metro Manila areas" },
    { num: "<5s", label: "average plan time" },
    { num: "₱0", label: "to use, forever" },
  ];
  return (
    <section className="relative bg-background py-16 sm:py-20 border-b border-foreground/10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        {items.map((it) => (
          <div key={it.label} className="flex flex-col">
            <span className="font-display font-extrabold tracking-[-0.04em] tabular-nums text-foreground" style={{ fontSize: "clamp(2.6rem, 5vw, 4rem)", lineHeight: 0.9 }}>
              {it.num}
            </span>
            <span className="mt-2 text-[12px] sm:text-sm uppercase tracking-[0.18em] font-mono text-muted-foreground">
              {it.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks({ onPlan }: { onPlan: () => void }) {
  const steps = [
    { n: "1", title: "Type a vibe.", body: "\"Rainy date in QC, ₱3K, comfort food, ends early.\" The messier the better." },
    { n: "2", title: "We score the city.", body: "Live venues across food, art, bars, and outdoor get ranked against your vibe, budget, and the forecast." },
    { n: "3", title: "You get a timed run.", body: "Stops, costs, transit gaps, totals. Swap any stop you don't like with one tap." },
  ];
  return (
    <section id="how" className="relative bg-background py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="flex items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-muted-foreground mb-3">How it works</p>
            <h2 className="font-display font-extrabold tracking-[-0.03em]" style={{ fontSize: "clamp(2rem, 4.5vw, 3.4rem)", lineHeight: 1.02 }}>
              Three steps.<br />
              No group chat.
            </h2>
          </div>
          <button
            onClick={onPlan}
            className="hidden md:inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2.5 text-sm font-semibold hover:bg-foreground hover:text-background transition-colors"
          >
            Try it now <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-y-12 md:gap-x-12">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              <span className="step-numeral text-primary">{s.n}</span>
              <div className="mt-3">
                <h3 className="font-display text-xl sm:text-2xl font-bold tracking-tight">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground max-w-[36ch]">{s.body}</p>
              </div>
              {i < steps.length - 1 && (
                <span aria-hidden className="hidden md:block absolute top-7 -right-6 w-3 h-3 rounded-full bg-primary/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="relative isolate overflow-hidden bg-foreground text-background py-16 sm:py-20">
      <div className="grain absolute inset-0 opacity-20" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.32em] text-background/60 mb-6">Honest pitch</p>
        <p
          className="font-display font-extrabold tracking-[-0.025em] text-balance"
          style={{ fontSize: "clamp(1.8rem, 3.6vw, 2.8rem)", lineHeight: 1.15 }}
        >
          Built by Manileños tired of opening Google Maps at 11am, scrolling Reddit for thirty minutes, and ending up at the same Salcedo brunch spot anyway.
        </p>
        <div className="mt-10 inline-flex items-center gap-3 rounded-full border border-background/25 px-4 py-2 text-xs font-mono uppercase tracking-[0.22em] text-background/70">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          Free, no signup, no email
        </div>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="relative bg-background py-12 border-t border-foreground/10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <Wordmark />
          <p className="mt-2 text-sm text-muted-foreground">
            Made in Metro Manila by people who keep canceling on each other.
          </p>
        </div>
        <div className="flex items-center gap-5 text-[12px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
          <a href="/api/debug" className="hover:text-foreground">/debug</a>
          <span aria-hidden>·</span>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
}

function FormShell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="relative min-h-dvh">
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-hero/40" />
      <div className="mx-auto max-w-2xl px-5 sm:px-8 pt-6 pb-16">
        <header className="flex items-center justify-between mb-10">
          <button onClick={onBack} className="inline-flex items-center gap-2">
            <Wordmark />
          </button>
          <ThemeToggle />
        </header>
        {children}
      </div>
    </div>
  );
}
