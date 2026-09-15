/* ── LEONIDA — Evidence definitions ──
   Each evidence has a bundled base64 image + hidden bboxes for forensics.
   Bboxes are normalized 0-1000 → mapped to actual canvas size at score time.
   Phase 1: SVG-based CCTV placeholders (zero network, no CORS taint).
   Replace with photorealistic base64 in polish pass.
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

/* An exhibit is a developed surveillance still: cold silver-grey, sitting in
   the warm manila it is filed in. The scene geometry below is fixed; this maps
   the original blue-screen palette onto the paper-room system in one place.
   Flag red and plate amber are deliberately left alone — they are the marks
   forensics put on the print, and they should read against cold stock. */
const COLD: Record<string, string> = {
  "#0E1629": "#141416", // ground
  "#070B14": "#0D0D0F", // deep ground
  "#162040": "#1E1E21", // panel fill
  "#1A2744": "#212125",
  "#2A3A5A": "#2A2A2E",
  "#1E2D5A": "#33333A", // structure line
  "#4A5A7A": "#5C5C63", // muted type
  "#8A9AB8": "#6F6F77", // secondary type
  "#E8EEF8": "#E6E4DE", // highlight
  "#F0EDE4": "#F0EEE8",
  "#C9B89A": "#B8B0A2", // skin
  "#8A7A60": "#6E675C",
  "#4A3A2A": "#3A3630",
  "#4A2A00": "#1A1400", // type on the plate
  "#4A3A00": "#1A1400",
  "#14F0B8": "#9AA0A8", // scanlines and brackets: desaturated off the old teal
};

function recolor(svg: string): string {
  return svg.replace(/#[0-9A-Fa-f]{6}/g, (hex) => COLD[hex.toUpperCase()] ?? hex);
}

function svgDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(recolor(svg))}`;
}

function cctvSvg(opts: {
  bg: string;
  accent: string;
  title: string;
  time: string;
  cam: string;
  scene: string;
}): string {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="${opts.bg}"/>
      <circle cx="1" cy="1" r="0.6" fill="white" opacity="0.04"/>
      <circle cx="3" cy="3" r="0.4" fill="white" opacity="0.03"/>
    </pattern>
    <linearGradient id="vignette" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="transparent"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.55)"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#grain)"/>
  <rect width="800" height="500" fill="url(#vignette)"/>

  <!-- scanlines -->
  <g opacity="0.06">
    ${Array.from({ length: 60 }, (_, i) => `<rect y="${i * 8}" width="800" height="1" fill="#14F0B8"/>`).join("")}
  </g>

  <!-- scene placeholder shapes -->
  ${opts.scene}

  <!-- header bar -->
  <rect x="0" y="0" width="800" height="28" fill="rgba(0,0,0,0.7)"/>
  <text x="12" y="18" font-family="monospace" font-size="10" fill="#FF3B30" font-weight="bold">● REC</text>
  <text x="52" y="18" font-family="monospace" font-size="10" fill="white" letter-spacing="1">${opts.time} — CAM ${opts.cam}</text>
  <text x="720" y="18" font-family="monospace" font-size="9" fill="#8A9AB8">${opts.title}</text>

  <!-- footer timestamp -->
  <rect x="0" y="472" width="800" height="28" fill="rgba(0,0,0,0.65)"/>
  <text x="12" y="490" font-family="monospace" font-size="10" fill="white" opacity="0.85">2026-09-14 ${opts.time} — ${opts.title}</text>
  <text x="640" y="490" font-family="monospace" font-size="9" fill="#8A9AB8">LEONIDA-${opts.cam}  •  CHAIN: INTACT</text>

  <!-- corner brackets -->
  <g stroke="#14F0B8" stroke-width="1.5" fill="none" opacity="0.5">
    <path d="M 12 40 L 12 60 L 32 60"/>
    <path d="M 788 40 L 788 60 L 768 60"/>
    <path d="M 12 460 L 12 440 L 32 440"/>
    <path d="M 788 460 L 788 440 L 768 440"/>
  </g>
</svg>`;
}

const EVIDENCE_06A_SVG = cctvSvg({
  bg: "#0e1629",
  accent: "#14F0B8",
  title: "06-A  CORNER STORE",
  time: "02:14:33",
  cam: "04",
  scene: `
    <!-- store interior: shelves + counter + figure -->
    <rect x="80" y="80" width="640" height="320" rx="4" fill="#162040" stroke="#1E2D5A" stroke-width="1.5"/>
    <text x="400" y="140" text-anchor="middle" font-family="monospace" font-size="11" fill="#4A5A7A" letter-spacing="3">FLORIDA CORNER STORE — AISLE 04</text>
    <!-- shelves -->
    <rect x="110" y="160" width="140" height="160" rx="3" fill="#0E1629" stroke="#1E2D5A"/>
    <rect x="120" y="175" width="120" height="10" rx="2" fill="#1E2D5A"/>
    <rect x="120" y="195" width="120" height="10" rx="2" fill="#1E2D5A"/>
    <rect x="120" y="215" width="100" height="10" rx="2" fill="#1E2D5A"/>
    <rect x="550" y="160" width="140" height="160" rx="3" fill="#0E1629" stroke="#1E2D5A"/>
    <rect x="560" y="175" width="120" height="10" rx="2" fill="#1E2D5A"/>
    <rect x="560" y="195" width="120" height="10" rx="2" fill="#1E2D5A"/>
    <!-- counter -->
    <rect x="280" y="280" width="240" height="40" rx="3" fill="#162040" stroke="#1E2D5A"/>
    <text x="400" y="305" text-anchor="middle" font-family="monospace" font-size="9" fill="#4A5A7A">COUNTER</text>
    <!-- suspect figure (face zone) -->
    <g opacity="0.95">
      <rect x="360" y="165" width="80" height="95" rx="12" fill="#E8EEF8" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
      <circle cx="400" cy="200" r="22" fill="#C9B89A" stroke="#8A7A60"/>
      <text x="400" y="205" text-anchor="middle" font-family="monospace" font-size="9" fill="#4A2A00">FACE</text>
      <text x="400" y="250" text-anchor="middle" font-family="monospace" font-size="7" fill="#FF3B30" font-weight="bold">▲ FACE ZONE</text>
    </g>
    <!-- plate visible through window (plate zone) -->
    <g opacity="0.95">
      <rect x="520" y="345" width="140" height="42" rx="4" fill="#FFCC02" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
      <text x="590" y="365" text-anchor="middle" font-family="monospace" font-size="11" fill="#070B14" font-weight="bold">LEON 06</text>
      <text x="590" y="378" text-anchor="middle" font-family="monospace" font-size="6" fill="#4A3A00">FLORIDA — SUNSHINE STATE</text>
      <text x="590" y="340" text-anchor="middle" font-family="monospace" font-size="7" fill="#FF3B30" font-weight="bold">▲ PLATE ZONE</text>
    </g>
    <text x="400" y="390" text-anchor="middle" font-family="monospace" font-size="9" fill="#8A9AB8" opacity="0.9">CROP the plate · REDACT the face · BLUR the rest</text>
  `,
});

const EVIDENCE_06B_SVG = cctvSvg({
  bg: "#0e1629",
  accent: "#14F0B8",
  title: "06-B  GETAWAY CAR",
  time: "02:47:12",
  cam: "07",
  scene: `
    <rect x="80" y="80" width="640" height="320" rx="4" fill="#162040" stroke="#1E2D5A" stroke-width="1.5"/>
    <text x="400" y="140" text-anchor="middle" font-family="monospace" font-size="11" fill="#4A5A7A" letter-spacing="3">MOTEL PARKING LOT — BAY 07</text>
    <!-- car silhouette -->
    <rect x="200" y="180" width="400" height="140" rx="18" fill="#0E1629" stroke="#1E2D5A"/>
    <rect x="220" y="195" width="360" height="55" rx="8" fill="#162040"/>
    <circle cx="260" cy="330" r="28" fill="#070B14" stroke="#1E2D5A"/>
    <circle cx="540" cy="330" r="28" fill="#070B14" stroke="#1E2D5A"/>
    <circle cx="260" cy="330" r="12" fill="#4A5A7A"/>
    <circle cx="540" cy="330" r="12" fill="#4A5A7A"/>
    <!-- rear window with face -->
    <rect x="360" y="200" width="90" height="45" rx="6" fill="#1a2744" stroke="#2a3a5a"/>
    <g opacity="0.95">
      <circle cx="405" cy="222" r="14" fill="#C9B89A" stroke="#FF3B30" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="405" y="226" text-anchor="middle" font-family="monospace" font-size="6" fill="#4A2A00">FACE</text>
    </g>
    <!-- plate -->
    <g opacity="0.95">
      <rect x="340" y="285" width="130" height="36" rx="4" fill="#FFCC02" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
      <text x="405" y="307" text-anchor="middle" font-family="monospace" font-size="11" fill="#070B14" font-weight="bold">LEON 06</text>
    </g>
    <text x="405" y="265" text-anchor="middle" font-family="monospace" font-size="7" fill="#FF3B30" font-weight="bold">▲ FACE &nbsp; ▲ PLATE</text>
  `,
});

const EVIDENCE_06C_SVG = cctvSvg({
  bg: "#0e1629",
  accent: "#14F0B8",
  title: "06-C  MOTEL LEDGER",
  time: "03:12:44",
  cam: "02",
  scene: `
    <rect x="80" y="80" width="640" height="320" rx="4" fill="#162040" stroke="#1E2D5A" stroke-width="1.5"/>
    <text x="400" y="140" text-anchor="middle" font-family="monospace" font-size="11" fill="#4A5A7A" letter-spacing="3">VICE MOTEL — FRONT DESK — LEDGER</text>
    <!-- desk -->
    <rect x="180" y="160" width="440" height="200" rx="6" fill="#F0EDE4" stroke="#1E2D5A"/>
    <rect x="200" y="175" width="400" height="2" fill="#1E2D5A" opacity="0.3"/>
    <rect x="200" y="185" width="400" height="2" fill="#1E2D5A" opacity="0.2"/>
    <!-- ledger lines + handwriting -->
    <g font-family="monospace" font-size="10" fill="#4A3A2A">
      <text x="210" y="210">06-14 &nbsp; R. VANCE &nbsp;&nbsp; RM 07 &nbsp; $80</text>
      <text x="210" y="230">06-14 &nbsp; L. TORRES &nbsp; RM 12 &nbsp; $80</text>
      <g opacity="0.95">
        <rect x="205" y="238" width="260" height="22" rx="3" fill="none" stroke="#FF3B30" stroke-width="1.2" stroke-dasharray="5 4"/>
        <text x="210" y="253" fill="#FF3B30" font-weight="bold" font-size="10">06-14 &nbsp; J. WRLD &nbsp;&nbsp; RM 06 &nbsp; $120</text>
        <text x="335" y="235" font-size="7" fill="#FF3B30" font-weight="bold">▲ LEDGER ZONE</text>
      </g>
      <text x="210" y="275">06-15 &nbsp; M. DIAZ &nbsp;&nbsp;&nbsp; RM 03 &nbsp; $60</text>
    </g>
    <!-- hands -->
    <ellipse cx="320" cy="330" rx="45" ry="18" fill="#C9B89A" opacity="0.85"/>
    <ellipse cx="480" cy="330" rx="45" ry="18" fill="#C9B89A" opacity="0.85"/>
    <!-- plate note taped to ledger -->
    <g opacity="0.95">
      <rect x="480" y="200" width="110" height="32" rx="3" fill="#FFCC02" stroke="#FF3B30" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="535" y="220" text-anchor="middle" font-family="monospace" font-size="9" fill="#070B14" font-weight="bold">LEON 06</text>
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
