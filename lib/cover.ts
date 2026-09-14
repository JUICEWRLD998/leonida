/* ── Leonida cover SVG — GTA VI Vice City inspired palette ── */

export function leonidaCoverDataUrl(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#070B14"/>
      <stop offset="35%" stop-color="#1a0a2e"/>
      <stop offset="60%" stop-color="#6b1d3a"/>
      <stop offset="80%" stop-color="#c94a2b"/>
      <stop offset="100%" stop-color="#ff8a3d"/>
    </linearGradient>
    <linearGradient id="palm" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f2a1a"/>
      <stop offset="100%" stop-color="#070B14"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>

  <rect width="1200" height="675" fill="url(#sky)"/>

  <!-- sun -->
  <circle cx="960" cy="220" r="90" fill="#FFCC02" opacity="0.95"/>
  <circle cx="960" cy="220" r="110" fill="none" stroke="#FFCC02" stroke-width="1.5" opacity="0.25"/>
  <circle cx="960" cy="220" r="130" fill="none" stroke="#FF6B35" stroke-width="1" opacity="0.15"/>

  <!-- horizon glow -->
  <ellipse cx="600" cy="420" rx="900" ry="40" fill="#FF6B35" opacity="0.12"/>

  <!-- palms silhouette -->
  <g fill="#070B14" opacity="0.92">
    <!-- left palm -->
    <rect x="118" y="360" width="14" height="110" rx="7"/>
    <ellipse cx="125" cy="355" rx="55" ry="22" fill="#0a1a0a"/>
    <ellipse cx="110" cy="345" rx="35" ry="12" fill="#0a1a0a" transform="rotate(-15 110 345)"/>
    <ellipse cx="140" cy="345" rx="35" ry="12" fill="#0a1a0a" transform="rotate(15 140 345)"/>
    <!-- right palm -->
    <rect x="1058" y="340" width="16" height="130" rx="8"/>
    <ellipse cx="1066" cy="335" rx="65" ry="26" fill="#0a1a0a"/>
    <ellipse cx="1048" cy="322" rx="40" ry="14" fill="#0a1a0a" transform="rotate(-12 1048 322)"/>
    <ellipse cx="1084" cy="322" rx="40" ry="14" fill="#0a1a0a" transform="rotate(12 1084 322)"/>
    <!-- mid palms -->
    <rect x="260" y="390" width="10" height="70" rx="5"/>
    <ellipse cx="265" cy="385" rx="35" ry="14" fill="#0a1a0a" opacity="0.7"/>
    <rect x="890" y="380" width="10" height="80" rx="5"/>
    <ellipse cx="895" cy="375" rx="38" ry="15" fill="#0a1a0a" opacity="0.7"/>
  </g>

  <!-- water -->
  <rect x="0" y="470" width="1200" height="120" fill="#0a1628" opacity="0.85"/>
  <rect x="0" y="470" width="1200" height="1" fill="#14F0B8" opacity="0.5"/>
  <g opacity="0.08" stroke="#14F0B8" stroke-width="0.6" fill="none">
    <line x1="0" y1="500" x2="1200" y2="500"/>
    <line x1="0" y1="520" x2="1200" y2="520"/>
    <line x1="0" y1="540" x2="1200" y2="540"/>
    <line x1="0" y1="560" x2="1200" y2="560"/>
  </g>

  <!-- scanlines subtle -->
  <g opacity="0.03">
    ${Array.from({ length: 80 }, (_, i) => `<rect y="${i * 8}" width="1200" height="1" fill="#14F0B8"/>`).join("")}
  </g>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
