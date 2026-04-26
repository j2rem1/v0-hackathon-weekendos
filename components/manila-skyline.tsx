type Props = { className?: string };

export function ManilaSkyline({ className }: Props) {
  return (
    <svg
      viewBox="0 0 1600 320"
      preserveAspectRatio="xMidYEnd slice"
      className={className}
      aria-hidden
    >
      {/* back layer, deep silhouette */}
      <g fill="currentColor" opacity="0.16">
        <path d="M0 320 L0 230 L40 230 L40 200 L70 200 L70 220 L100 220 L100 180 L150 180 L150 210 L200 210 L200 170 L230 170 L230 200 L260 200 L260 160 L320 160 L320 200 L360 200 L360 230 L400 230 L400 190 L450 190 L450 220 L490 220 L490 250 L520 250 L520 200 L560 200 L560 240 L600 240 L600 210 L650 210 L650 180 L700 180 L700 230 L750 230 L750 200 L800 200 L800 240 L840 240 L840 220 L900 220 L900 180 L950 180 L950 220 L1000 220 L1000 200 L1050 200 L1050 240 L1100 240 L1100 210 L1150 210 L1150 180 L1200 180 L1200 220 L1250 220 L1250 200 L1300 200 L1300 230 L1350 230 L1350 210 L1400 210 L1400 240 L1450 240 L1450 220 L1500 220 L1500 200 L1560 200 L1560 240 L1600 240 L1600 320 Z" />
      </g>
      {/* front layer, taller foreground towers (BGC silhouette feel) */}
      <g fill="currentColor" opacity="0.30">
        <rect x="180" y="220" width="22" height="100" />
        <rect x="208" y="190" width="28" height="130" />
        <rect x="244" y="170" width="20" height="150" />
        <rect x="272" y="140" width="36" height="180" rx="2" />
        <rect x="316" y="200" width="22" height="120" />
        <rect x="346" y="180" width="30" height="140" />
        <rect x="384" y="160" width="22" height="160" />

        <rect x="700" y="200" width="20" height="120" />
        <rect x="726" y="160" width="32" height="160" rx="2" />
        <rect x="764" y="140" width="40" height="180" rx="2" />
        <rect x="812" y="120" width="28" height="200" />
        <rect x="846" y="170" width="22" height="150" />
        <rect x="874" y="200" width="20" height="120" />

        <rect x="1140" y="190" width="22" height="130" />
        <rect x="1168" y="160" width="32" height="160" />
        <rect x="1206" y="180" width="22" height="140" />
        <rect x="1234" y="150" width="36" height="170" rx="2" />
        <rect x="1278" y="200" width="22" height="120" />
        <rect x="1306" y="170" width="28" height="150" />
      </g>
      {/* tiny window dots — only on a few towers, late-night warmth */}
      <g fill="currentColor" opacity="0.55">
        {[
          [284, 210], [284, 226], [284, 242], [284, 258],
          [296, 210], [296, 226], [296, 242], [296, 258],
          [776, 200], [776, 216], [776, 232], [776, 248], [776, 264],
          [792, 200], [792, 216], [792, 232], [792, 248], [792, 264],
          [822, 180], [822, 196], [822, 212], [822, 228], [822, 244],
          [1248, 200], [1248, 216], [1248, 232],
          [1260, 200], [1260, 216], [1260, 232],
        ].map(([x, y], i) => (
          <rect key={i} x={x} y={y} width="3" height="3" rx="0.5" />
        ))}
      </g>
    </svg>
  );
}
