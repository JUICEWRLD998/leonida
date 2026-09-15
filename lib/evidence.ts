/* ── LEONIDA — Evidence definitions ──
   Three exhibits, each a bundled SVG still plus the two bounding boxes
   forensics reads. Bboxes are authored in the 800×500 space the scenes are
   drawn in, and normalised to the canvas at score time (see lib/scorer.ts).

   The art is authored directly in the paper-room palette: a cold developed
   still (#141416 ground) with flag red and plate amber as the only warm
   marks, which are what forensics puts on the print.
*/

export type BoundingBox = { x: number; y: number; w: number; h: number };

export type Evidence = {
  id: string;
  label: string;
  subtitle: string;
  imageBase64: string;
  originalDataUrl: string;
  flags: string[];
  regions: {
    face: BoundingBox;
    plate: BoundingBox;
  };
  difficulty: 1 | 2 | 3;
};

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function cctvSvg(opts: {
  bg: string;
  accent: string;
  title: string;
  time: string;
  cam: string;
  scene: string;
}): string {
  // Deterministic pseudo-noise. `Math.sin` is IEEE-754 stable, so the server
  // and the client generate the identical string — a random seed here would
  // change the data URL between renders and break hydration.
  const seed = Number(opts.cam) || 1;
  const rnd = (n: number) => {
    const x = Math.sin(seed * 977 + n * 131) * 10000;
    return x - Math.floor(x);
  };

  // Horizontal interference bands: the signature of a tape that has been
  // re-recorded. Kept translucent so the flagged zones stay readable.
  const bands = Array.from({ length: 7 }, (_, i) => {
    const y = 40 + rnd(i) * 410;
    const h = 3 + rnd(i + 40) * 14;
    const dark = rnd(i + 80) > 0.45;
    return `<rect x="0" y="${y.toFixed(1)}" width="800" height="${h.toFixed(1)}" fill="${dark ? "#000000" : opts.accent}" opacity="${(dark ? 0.16 + rnd(i + 120) * 0.16 : 0.05 + rnd(i + 120) * 0.06).toFixed(3)}"/>`;
  }).join("");

  // Dropout speckles: individual cells that failed on the original capture.
  const dropouts = Array.from({ length: 34 }, (_, i) => {
    const x = rnd(i + 200) * 792;
    const y = 36 + rnd(i + 300) * 420;
    const s = 1 + rnd(i + 400) * 2.4;
    const bright = rnd(i + 500) > 0.5;
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${s.toFixed(1)}" height="${s.toFixed(1)}" fill="${bright ? "#FFFFFF" : "#000000"}" opacity="${(0.14 + rnd(i + 600) * 0.3).toFixed(3)}"/>`;
  }).join("");

  // A single sync tear: one line displaced off the raster.
  const tearY = 60 + rnd(700) * 360;

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <pattern id="grain" width="3" height="3" patternUnits="userSpaceOnUse">
      <rect width="3" height="3" fill="${opts.bg}"/>
      <rect x="0" y="0" width="1" height="1" fill="#FFFFFF" opacity="0.05"/>
      <rect x="2" y="1" width="1" height="1" fill="#000000" opacity="0.14"/>
      <rect x="1" y="2" width="1" height="1" fill="#FFFFFF" opacity="0.035"/>
    </pattern>
    <radialGradient id="lens" cx="0.5" cy="0.46" r="0.78">
      <stop offset="0%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="62%" stop-color="#000000" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.62"/>
    </radialGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.07"/>
      <stop offset="45%" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.1"/>
    </linearGradient>
  </defs>

  <!-- ground -->
  <rect width="800" height="500" fill="url(#grain)"/>

  <!-- the captured frames themselves -->
  ${opts.scene}

  <!-- degradation sits over the image, not under it -->
  <g>
    ${bands}
    <rect x="0" y="${tearY.toFixed(1)}" width="800" height="2" fill="#FFFFFF" opacity="0.16"/>
    <rect x="0" y="${(tearY + 2).toFixed(1)}" width="800" height="1" fill="#000000" opacity="0.3"/>
    ${dropouts}
  </g>

  <!-- scanlines -->
  <g opacity="0.07">
    ${Array.from({ length: 60 }, (_, i) => `<rect y="${i * 8}" width="800" height="1" fill="${opts.accent}"/>`).join("")}
  </g>

  <rect width="800" height="500" fill="url(#sheen)"/>
  <rect width="800" height="500" fill="url(#lens)"/>

  <!-- header bar -->
  <rect x="0" y="0" width="800" height="28" fill="rgba(0,0,0,0.72)"/>
  <rect x="0" y="28" width="800" height="1" fill="#000000" opacity="0.5"/>
  <circle cx="18" cy="14" r="3.2" fill="#FF3B30"/>
  <text x="27" y="18" font-family="monospace" font-size="10" fill="#FF3B30" font-weight="bold">REC</text>
  <text x="58" y="18" font-family="monospace" font-size="10" fill="#FFFFFF" letter-spacing="1">${opts.time} — CAM ${opts.cam}</text>
  <text x="788" y="18" text-anchor="end" font-family="monospace" font-size="9" fill="${opts.accent}">${opts.title}</text>

  <!-- footer timestamp -->
  <rect x="0" y="471" width="800" height="1" fill="#000000" opacity="0.5"/>
  <rect x="0" y="472" width="800" height="28" fill="rgba(0,0,0,0.68)"/>
  <text x="12" y="490" font-family="monospace" font-size="10" fill="#FFFFFF" opacity="0.88">2026-09-14 ${opts.time} — ${opts.title}</text>
  <text x="788" y="490" text-anchor="end" font-family="monospace" font-size="9" fill="${opts.accent}">LEONIDA-${opts.cam} · CHAIN: INTACT</text>

  <!-- corner brackets -->
  <g stroke="${opts.accent}" stroke-width="1.5" fill="none" opacity="0.55">
    <path d="M 12 40 L 12 60 L 32 60"/>
    <path d="M 788 40 L 788 60 L 768 60"/>
    <path d="M 12 460 L 12 440 L 32 440"/>
    <path d="M 788 460 L 788 440 L 768 440"/>
  </g>
</svg>`;
}

const EVIDENCE_06A_SVG = cctvSvg({
  bg: "#141416",
  accent: "#9AA0A8",
  title: "06-A  CORNER STORE",
  time: "02:14:33",
  cam: "04",
  scene: `
    <!-- store interior: shelves + counter + figure -->
    <rect x="80" y="80" width="640" height="320" rx="4" fill="#1E1E21" stroke="#33333A" stroke-width="1.5"/>
    <text x="400" y="140" text-anchor="middle" font-family="monospace" font-size="11" fill="#5C5C63" letter-spacing="3">FLORIDA CORNER STORE — AISLE 04</text>
    <!-- shelves -->
    <rect x="110" y="160" width="140" height="160" rx="3" fill="#141416" stroke="#33333A"/>
    <rect x="120" y="175" width="120" height="10" rx="2" fill="#33333A"/>
    <rect x="120" y="195" width="120" height="10" rx="2" fill="#33333A"/>
    <rect x="120" y="215" width="100" height="10" rx="2" fill="#33333A"/>
    <rect x="550" y="160" width="140" height="160" rx="3" fill="#141416" stroke="#33333A"/>
    <rect x="560" y="175" width="120" height="10" rx="2" fill="#33333A"/>
    <rect x="560" y="195" width="120" height="10" rx="2" fill="#33333A"/>
    <!-- counter -->
    <rect x="280" y="280" width="240" height="40" rx="3" fill="#1E1E21" stroke="#33333A"/>
    <text x="400" y="305" text-anchor="middle" font-family="monospace" font-size="9" fill="#5C5C63">COUNTER</text>
    <!-- suspect figure (face zone) -->
    <g opacity="0.95">
      <rect x="360" y="165" width="80" height="95" rx="12" fill="#E6E4DE" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
      <circle cx="400" cy="200" r="22" fill="#B8B0A2" stroke="#6E675C"/>
      <text x="400" y="205" text-anchor="middle" font-family="monospace" font-size="9" fill="#1A1400">FACE</text>
      <text x="400" y="250" text-anchor="middle" font-family="monospace" font-size="7" fill="#FF3B30" font-weight="bold">▲ FACE ZONE</text>
    </g>
    <!-- plate visible through window (plate zone) -->
    <g opacity="0.95">
      <rect x="520" y="345" width="140" height="42" rx="4" fill="#FFCC02" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
      <text x="590" y="365" text-anchor="middle" font-family="monospace" font-size="11" fill="#0D0D0F" font-weight="bold">LEON 06</text>
      <text x="590" y="378" text-anchor="middle" font-family="monospace" font-size="6" fill="#1A1400">FLORIDA — SUNSHINE STATE</text>
      <text x="590" y="340" text-anchor="middle" font-family="monospace" font-size="7" fill="#FF3B30" font-weight="bold">▲ PLATE ZONE</text>
    </g>
    <text x="400" y="390" text-anchor="middle" font-family="monospace" font-size="9" fill="#6F6F77" opacity="0.9">CROP the plate · REDACT the face · BLUR the rest</text>
  `,
});

const EVIDENCE_06B_SVG = cctvSvg({
  bg: "#141416",
  accent: "#9AA0A8",
  title: "06-B  GETAWAY CAR",
  time: "02:47:12",
  cam: "07",
  scene: `
    <rect x="80" y="80" width="640" height="320" rx="4" fill="#1E1E21" stroke="#33333A" stroke-width="1.5"/>
    <text x="400" y="140" text-anchor="middle" font-family="monospace" font-size="11" fill="#5C5C63" letter-spacing="3">MOTEL PARKING LOT — BAY 07</text>
    <!-- car silhouette -->
    <rect x="200" y="180" width="400" height="140" rx="18" fill="#141416" stroke="#33333A"/>
    <rect x="220" y="195" width="360" height="55" rx="8" fill="#1E1E21"/>
    <circle cx="260" cy="330" r="28" fill="#0D0D0F" stroke="#33333A"/>
    <circle cx="540" cy="330" r="28" fill="#0D0D0F" stroke="#33333A"/>
    <circle cx="260" cy="330" r="12" fill="#5C5C63"/>
    <circle cx="540" cy="330" r="12" fill="#5C5C63"/>
    <!-- rear window with face -->
    <rect x="360" y="200" width="90" height="45" rx="6" fill="#212125" stroke="#2A2A2E"/>
    <g opacity="0.95">
      <circle cx="405" cy="222" r="14" fill="#B8B0A2" stroke="#FF3B30" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="405" y="226" text-anchor="middle" font-family="monospace" font-size="6" fill="#1A1400">FACE</text>
    </g>
    <!-- plate -->
    <g opacity="0.95">
      <rect x="340" y="285" width="130" height="36" rx="4" fill="#FFCC02" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
      <text x="405" y="307" text-anchor="middle" font-family="monospace" font-size="11" fill="#0D0D0F" font-weight="bold">LEON 06</text>
    </g>
    <text x="405" y="265" text-anchor="middle" font-family="monospace" font-size="7" fill="#FF3B30" font-weight="bold">▲ FACE &#160; ▲ PLATE</text>
  `,
});

const EVIDENCE_06C_SVG = cctvSvg({
  bg: "#141416",
  accent: "#9AA0A8",
  title: "06-C  MOTEL LEDGER",
  time: "03:12:44",
  cam: "02",
  scene: `
    <rect x="80" y="80" width="640" height="320" rx="4" fill="#1E1E21" stroke="#33333A" stroke-width="1.5"/>
    <text x="400" y="140" text-anchor="middle" font-family="monospace" font-size="11" fill="#5C5C63" letter-spacing="3">VICE MOTEL — FRONT DESK — LEDGER</text>
    <!-- desk -->
    <rect x="180" y="160" width="440" height="200" rx="6" fill="#F0EEE8" stroke="#33333A"/>
    <rect x="200" y="175" width="400" height="2" fill="#33333A" opacity="0.3"/>
    <rect x="200" y="185" width="400" height="2" fill="#33333A" opacity="0.2"/>
    <!-- ledger lines + handwriting -->
    <g font-family="monospace" font-size="10" fill="#3A3630">
      <text x="210" y="210">06-14 &#160; R. VANCE &#160;&#160; RM 07 &#160; $80</text>
      <text x="210" y="230">06-14 &#160; L. TORRES &#160; RM 12 &#160; $80</text>
      <g opacity="0.95">
        <rect x="205" y="238" width="260" height="22" rx="3" fill="none" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
        <text x="210" y="253" fill="#FF3B30" font-weight="bold" font-size="10">06-14 &#160; J. WRLD &#160;&#160; RM 06 &#160; $120</text>
        <text x="335" y="235" font-size="7" fill="#FF3B30" font-weight="bold">▲ LEDGER ZONE</text>
      </g>
      <text x="210" y="275">06-15 &#160; M. DIAZ &#160;&#160;&#160; RM 03 &#160; $60</text>
    </g>
    <!-- hands -->
    <ellipse cx="320" cy="330" rx="45" ry="18" fill="#B8B0A2" opacity="0.85"/>
    <ellipse cx="480" cy="330" rx="45" ry="18" fill="#B8B0A2" opacity="0.85"/>
    <!-- plate note taped to ledger -->
    <g opacity="0.95">
      <rect x="480" y="200" width="110" height="32" rx="3" fill="#FFCC02" stroke="#FF3B30" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="535" y="220" text-anchor="middle" font-family="monospace" font-size="9" fill="#0D0D0F" font-weight="bold">LEON 06</text>
      <text x="535" y="198" text-anchor="middle" font-family="monospace" font-size="7" fill="#FF3B30" font-weight="bold">▲ PLATE</text>
    </g>
  `,
});

export const EVIDENCE: Evidence[] = [
  {
    id: "06-A",
    label: "CASE 06-A — CORNER STORE",
    subtitle: "02:14 AM — Suspect at register. Face + plate visible.",
    imageBase64: svgDataUrl(EVIDENCE_06A_SVG),
    originalDataUrl: svgDataUrl(EVIDENCE_06A_SVG),
    flags: ["FACE DETECTED", "PLATE LEON 06 DETECTED"],
    regions: {
      face: { x: 360, y: 165, w: 80, h: 95 },
      plate: { x: 520, y: 345, w: 140, h: 42 },
    },
    difficulty: 1,
  },
  {
    id: "06-B",
    label: "CASE 06-B — GETAWAY CAR",
    subtitle: "02:47 AM — Vehicle rear + occupant face in window.",
    imageBase64: svgDataUrl(EVIDENCE_06B_SVG),
    originalDataUrl: svgDataUrl(EVIDENCE_06B_SVG),
    flags: ["FACE DETECTED", "PLATE LEON 06 DETECTED"],
    regions: {
      face: { x: 391, y: 208, w: 28, h: 28 },
      plate: { x: 340, y: 285, w: 130, h: 36 },
    },
    difficulty: 2,
  },
  {
    id: "06-C",
    label: "CASE 06-C — MOTEL LEDGER",
    subtitle: "03:12 AM — Handwritten entry + plate note taped to desk.",
    imageBase64: svgDataUrl(EVIDENCE_06C_SVG),
    originalDataUrl: svgDataUrl(EVIDENCE_06C_SVG),
    flags: ["LEDGER ENTRY DETECTED", "PLATE LEON 06 DETECTED"],
    regions: {
      face: { x: 205, y: 238, w: 260, h: 22 },
      plate: { x: 480, y: 200, w: 110, h: 32 },
    },
    difficulty: 3,
  },
];
