const SAMPLE = [
  { time: "11:00", name: "Tablo Kitchen",   area: "QC",            cost: 750, kind: "brunch" },
  { time: "13:30", name: "Pinto Art Museum", area: "Antipolo",     cost: 250, kind: "culture" },
  { time: "16:00", name: "LOLA Cafe",        area: "Tomas Morato", cost: 400, kind: "coffee" },
  { time: "19:30", name: "The Pearl Room",   area: "Poblacion",    cost: 900, kind: "drinks" },
];

export function SampleItinerary() {
  const total = SAMPLE.reduce((s, x) => s + x.cost, 0);
  return (
    <div className="float-card relative w-[290px] sm:w-[320px] md:w-[360px] rounded-2xl bg-card text-card-foreground shadow-[0_30px_70px_-20px_oklch(0.18_0.04_270/0.45)] border border-foreground/10 p-5 select-none">
      <div className="absolute -top-3 -right-3 rotate-[10deg]">
        <div className="rounded-full bg-pop text-pop-foreground px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] border border-foreground/20 shadow-sm">
          PLANNED
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">SAMPLE PLAN</p>
          <p className="font-display text-lg font-bold leading-tight">Date crawl, QC to Poblacion</p>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground text-right">
          <div>4 STOPS</div>
          <div>9 HRS</div>
        </div>
      </div>

      <ol className="relative space-y-2.5">
        <span aria-hidden className="absolute left-[27px] top-3 bottom-3 w-px bg-foreground/15" />
        {SAMPLE.map((s) => (
          <li key={s.name} className="flex items-center gap-3">
            <span className="font-mono text-[11px] tabular-nums text-muted-foreground w-12 shrink-0">{s.time}</span>
            <span className="relative z-10 size-2.5 rounded-full bg-primary ring-4 ring-card" />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold truncate">{s.name}</span>
              <span className="block text-[11px] text-muted-foreground">{s.area} · {s.kind}</span>
            </span>
            <span className="font-mono text-[12px] tabular-nums font-semibold text-foreground">
              ₱{s.cost.toLocaleString()}
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 pt-3 border-t border-foreground/10 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">2 pax · weather-aware · within ₱3K each</span>
        <span className="font-mono text-sm font-bold tabular-nums">₱{total.toLocaleString()}</span>
      </div>
    </div>
  );
}
