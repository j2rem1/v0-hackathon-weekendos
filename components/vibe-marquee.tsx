type Props = {
  vibes: string[];
  className?: string;
};

export function VibeMarquee({ vibes, className }: Props) {
  // Duplicate so the loop reads as continuous when the track is translated -50%.
  const loop = [...vibes, ...vibes];
  return (
    <div
      className={`relative overflow-hidden border-y border-foreground/15 bg-foreground/[0.04] ${className ?? ""}`}
      aria-label="Vibe ideas"
    >
      <div className="marquee-track py-3 whitespace-nowrap">
        {loop.map((v, i) => (
          <span key={i} className="inline-flex items-center gap-3 px-5 text-sm md:text-base font-medium text-foreground/80">
            <span aria-hidden className="inline-block size-1.5 rounded-full bg-primary" />
            {v}
          </span>
        ))}
      </div>
      {/* edge fades, pure pseudo-overlay, no layout cost */}
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--background)] to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--background)] to-transparent" />
    </div>
  );
}
