"use client";

import { motion } from "framer-motion";
import { ExternalLink, Instagram, MapPin, Star, Sparkles } from "lucide-react";
import { Recommendation } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  food: "Food",
  culture: "Culture",
  outdoor: "Outdoor",
  night: "Drinks",
  shop: "Shop",
};

function ScorePill({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-foreground/15 bg-card px-2.5 py-1 text-[11px] font-mono uppercase tracking-[0.16em] text-foreground/80">
      <span>{label}</span>
      <span className="tabular-nums font-bold text-foreground">{pct}</span>
    </div>
  );
}

export function RecommendationCard({
  rec,
  index,
  rank,
  showAlternates = false,
  isPrimary = true,
}: {
  rec: Recommendation;
  index: number;
  rank?: string;
  showAlternates?: boolean;
  isPrimary?: boolean;
}) {
  const v = rec.venue;
  const finalPct = Math.round(rec.score.final * 100);

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border-2 bg-card transition-colors ${
        isPrimary ? "border-foreground/15 shadow-[0_18px_40px_-22px_oklch(0.18_0.04_270/0.45)]" : "border-foreground/10"
      }`}
    >
      {isPrimary && (
        <div className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.22em] text-primary-foreground">
          <Sparkles className="w-3 h-3" />
          Pick
        </div>
      )}

      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-muted-foreground mb-1.5">
              {rank ?? (isPrimary ? "Top pick" : "Alternate")}
            </p>
            <h3 className="font-display text-2xl sm:text-[28px] font-extrabold tracking-tight leading-[1.05] text-foreground">
              {v.name}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {v.area}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-foreground/30" />
                {TYPE_LABEL[v.type] ?? v.type}
              </span>
              {typeof v.rating === "number" && (
                <span className="inline-flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-current text-primary" />
                  <span className="font-mono tabular-nums">{v.rating.toFixed(1)}</span>
                  {typeof v.reviewCount === "number" && v.reviewCount > 0 && (
                    <span className="text-muted-foreground/70">({v.reviewCount})</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {v.blurb && (
          <p className="mt-4 text-[15px] leading-relaxed text-foreground/80 max-w-prose">
            {v.blurb}
          </p>
        )}

        {rec.why.length > 0 && (
          <ul className="mt-5 space-y-2">
            {rec.why.map((line, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed text-foreground/85">
                <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 flex flex-wrap gap-1.5">
          <ScorePill label="Match" value={rec.score.final} />
          <ScorePill label="Fit" value={rec.score.context} />
          <ScorePill label="Vibe" value={rec.score.vibe} />
          <ScorePill label="Occasion" value={rec.score.occasion} />
          <ScorePill label="Buzz" value={rec.score.sentiment} />
        </div>

        <div className="mt-5 flex items-end justify-between gap-4 border-t border-foreground/10 pt-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              Per person {v.costEstimated && <span className="text-foreground/40">· estimate</span>}
            </p>
            <p className="font-display text-2xl font-extrabold tabular-nums text-foreground">
              {v.costEstimated && <span className="text-foreground/50">~</span>}
              ₱{v.cost.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              {finalPct}% match
            </span>
            {v.instagram && (
              <a
                href={v.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 px-3 py-2 text-xs font-semibold hover:bg-foreground hover:text-background transition-colors"
              >
                <Instagram className="w-3.5 h-3.5" /> IG
              </a>
            )}
            {v.website && (
              <a
                href={v.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-foreground/20 px-3.5 py-2 text-xs font-semibold hover:bg-foreground hover:text-background transition-colors"
              >
                Visit <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {showAlternates && rec.bias.positive.length > 0 && (
          <p className="mt-4 rounded-lg bg-foreground/[0.04] px-3 py-2 text-[12px] italic text-muted-foreground">
            Locals say it's <span className="text-foreground/80 not-italic font-medium">"{rec.bias.positive[0]}"</span>.
          </p>
        )}
      </div>
    </motion.article>
  );
}
