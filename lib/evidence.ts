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
    <rect x="80" y="80" width="640" height="320" fill="#17181B"/>
    <!-- fluorescent run overhead -->
    <ellipse cx="400" cy="118" rx="250" ry="30" fill="#24262B"/>
    <rect x="300" y="88" width="200" height="7" rx="3" fill="#3A3C43"/>
    <rect x="80" y="150" width="640" height="152" fill="#1B1C20"/>
    <text x="400" y="142" text-anchor="middle" font-family="monospace" font-size="10" fill="#4A4C53" letter-spacing="4">FLORIDA CORNER STORE — AISLE 04</text>

    <!-- floor, tiled -->
    <rect x="80" y="302" width="640" height="98" fill="#1F2126"/>
    <g stroke="#2B2D33" stroke-width="1" opacity="0.7">
      <path d="M80 322 H720"/><path d="M80 350 H720"/><path d="M80 380 H720"/>
      <path d="M170 302 V400"/><path d="M280 302 V400"/><path d="M520 302 V400"/><path d="M630 302 V400"/>
    </g>

    <!-- left gondola, stocked -->
    <rect x="94" y="166" width="152" height="142" fill="#121316" stroke="#2A2C32"/>
    <g fill="#2E3037">
      <rect x="98" y="180" width="144" height="7"/><rect x="98" y="212" width="144" height="7"/>
      <rect x="98" y="244" width="144" height="7"/><rect x="98" y="276" width="144" height="7"/>
    </g>
    <g>
      <rect x="102" y="163" width="16" height="17" fill="#3C3E45"/><rect x="122" y="166" width="13" height="14" fill="#4A4C53"/><rect x="139" y="161" width="15" height="19" fill="#34363C"/><rect x="158" y="165" width="12" height="15" fill="#43454C"/><rect x="174" y="163" width="16" height="17" fill="#383A41"/><rect x="194" y="166" width="13" height="14" fill="#4E5057"/><rect x="211" y="162" width="15" height="18" fill="#35373D"/>
      <rect x="102" y="195" width="15" height="17" fill="#45474E"/><rect x="121" y="198" width="14" height="14" fill="#35373D"/><rect x="139" y="193" width="16" height="19" fill="#3E4047"/><rect x="159" y="197" width="13" height="15" fill="#4C4E55"/><rect x="176" y="194" width="15" height="18" fill="#373940"/><rect x="195" y="198" width="14" height="14" fill="#474950"/><rect x="213" y="195" width="13" height="17" fill="#3A3C43"/>
      <rect x="102" y="227" width="16" height="17" fill="#3B3D44"/><rect x="122" y="230" width="13" height="14" fill="#4B4D54"/><rect x="139" y="225" width="15" height="19" fill="#36383E"/><rect x="158" y="229" width="14" height="15" fill="#484A51"/><rect x="176" y="226" width="16" height="18" fill="#3D3F46"/><rect x="196" y="230" width="13" height="14" fill="#424449"/><rect x="213" y="227" width="15" height="17" fill="#393B42"/>
      <rect x="102" y="259" width="15" height="17" fill="#494B52"/><rect x="121" y="262" width="14" height="14" fill="#34363C"/><rect x="139" y="257" width="16" height="19" fill="#41434A"/><rect x="159" y="261" width="13" height="15" fill="#4D4F56"/><rect x="176" y="258" width="15" height="18" fill="#383A41"/><rect x="195" y="262" width="14" height="14" fill="#464850"/><rect x="213" y="259" width="13" height="17" fill="#3C3E45"/>
    </g>

    <!-- right gondola, stocked -->
    <rect x="544" y="166" width="152" height="142" fill="#121316" stroke="#2A2C32"/>
    <g fill="#2E3037">
      <rect x="548" y="180" width="144" height="7"/><rect x="548" y="212" width="144" height="7"/>
      <rect x="548" y="244" width="144" height="7"/><rect x="548" y="276" width="144" height="7"/>
    </g>
    <g>
      <rect x="552" y="164" width="15" height="16" fill="#3E4047"/><rect x="571" y="167" width="13" height="13" fill="#4A4C53"/><rect x="588" y="162" width="16" height="18" fill="#35373D"/><rect x="608" y="166" width="14" height="14" fill="#45474E"/><rect x="626" y="163" width="15" height="17" fill="#3A3C43"/><rect x="645" y="167" width="13" height="13" fill="#4C4E55"/><rect x="662" y="164" width="14" height="16" fill="#373940"/>
      <rect x="552" y="196" width="14" height="16" fill="#474950"/><rect x="570" y="199" width="15" height="13" fill="#36383E"/><rect x="589" y="194" width="15" height="18" fill="#404249"/><rect x="608" y="198" width="13" height="14" fill="#4B4D54"/><rect x="625" y="195" width="16" height="17" fill="#383A41"/><rect x="645" y="199" width="14" height="13" fill="#464850"/><rect x="663" y="196" width="13" height="16" fill="#3B3D44"/>
      <rect x="552" y="228" width="15" height="16" fill="#3D3F46"/><rect x="571" y="231" width="13" height="13" fill="#4A4C53"/><rect x="588" y="226" width="16" height="18" fill="#34363C"/><rect x="608" y="230" width="14" height="14" fill="#484A51"/><rect x="626" y="227" width="15" height="17" fill="#3C3E45"/><rect x="645" y="231" width="13" height="13" fill="#4D4F56"/><rect x="662" y="228" width="14" height="16" fill="#393B42"/>
      <rect x="552" y="260" width="14" height="16" fill="#4B4D54"/><rect x="570" y="263" width="15" height="13" fill="#35373D"/><rect x="589" y="258" width="15" height="18" fill="#42444B"/><rect x="608" y="262" width="13" height="14" fill="#4E5057"/><rect x="625" y="259" width="16" height="17" fill="#3A3C43"/><rect x="645" y="263" width="14" height="13" fill="#45474E"/><rect x="663" y="260" width="13" height="16" fill="#3D3F46"/>
    </g>

    <!-- checkout counter with register -->
    <rect x="286" y="286" width="228" height="26" fill="#26282E"/>
    <rect x="286" y="312" width="228" height="40" fill="#1A1B1F"/>
    <rect x="286" y="286" width="228" height="3" fill="#3A3C43"/>
    <rect x="438" y="266" width="52" height="22" rx="2" fill="#2E3037" stroke="#43454C"/>
    <rect x="444" y="271" width="40" height="10" fill="#1B1C20"/>

    <!-- storefront glass, right: a car waiting at the kerb -->
    <rect x="512" y="296" width="196" height="104" fill="#12141A"/>
    <path d="M536 350 L688 350 L700 374 L524 374 Z" fill="#1E2027"/>
    <rect x="548" y="318" width="128" height="34" rx="5" fill="#171922" stroke="#2E3037"/>
    <rect x="512" y="296" width="196" height="104" fill="none" stroke="#3A3C43" stroke-width="2"/>
    <rect x="530" y="351" width="120" height="30" rx="3" fill="#FFCC02"/>
    <text x="590" y="372" text-anchor="middle" font-family="monospace" font-size="15" fill="#0D0D0F" font-weight="bold" letter-spacing="1">LEON 06</text>

    <!-- the suspect, behind the counter -->
    <path d="M340 400 Q352 292 400 288 Q448 292 460 400 Z" fill="#22242A"/>
    <path d="M348 400 Q356 300 400 296 Q444 300 452 400 Z" fill="#2A2C33"/>
    <rect x="390" y="248" width="20" height="34" fill="#9E988C"/>
    <ellipse cx="400" cy="212" rx="30" ry="36" fill="#B0A99B"/>
    <path d="M370 206 Q372 166 400 164 Q428 166 430 206 Q424 182 400 180 Q376 182 370 206 Z" fill="#26241F"/>
    <g fill="#3A3630" opacity="0.85">
      <ellipse cx="389" cy="212" rx="3.4" ry="2.2"/>
      <ellipse cx="411" cy="212" rx="3.4" ry="2.2"/>
    </g>
    <path d="M391 231 Q400 236 409 231" stroke="#3A3630" stroke-width="1.6" fill="none" opacity="0.7"/>
    <path d="M382 282 L400 300 L418 282" stroke="#3A3C43" stroke-width="1.5" fill="none"/>

    <!-- flagged zones: outlines only, so the still underneath stays photographic -->
    <rect x="360" y="165" width="80" height="95" fill="none" stroke="#FF3B30" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="400" y="158" text-anchor="middle" font-family="monospace" font-size="8" fill="#FF3B30" font-weight="bold">FACE ZONE</text>
    <rect x="520" y="345" width="140" height="42" fill="none" stroke="#FF3B30" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="590" y="339" text-anchor="middle" font-family="monospace" font-size="8" fill="#FF3B30" font-weight="bold">PLATE ZONE</text>
  `,
});

const EVIDENCE_06B_SVG = cctvSvg({
  bg: "#141416",
  accent: "#9AA0A8",
  title: "06-B  GETAWAY CAR",
  time: "02:47:12",
  cam: "07",
  scene: `
    <rect x="80" y="80" width="640" height="320" fill="#15161A"/>
    <!-- motel facade -->
    <rect x="80" y="96" width="640" height="188" fill="#1C1D22"/>
    <rect x="80" y="278" width="640" height="8" fill="#24262B"/>
    <text x="400" y="134" text-anchor="middle" font-family="monospace" font-size="10" fill="#4A4C53" letter-spacing="4">VICE MOTEL — PARKING BAY 07</text>
    <g>
      <rect x="120" y="160" width="66" height="74" fill="#101116" stroke="#2E3037"/>
      <rect x="216" y="160" width="66" height="74" fill="#3A3428" stroke="#2E3037"/>
      <rect x="312" y="160" width="66" height="74" fill="#101116" stroke="#2E3037"/>
      <rect x="408" y="160" width="66" height="74" fill="#101116" stroke="#2E3037"/>
      <rect x="504" y="160" width="66" height="74" fill="#3A3428" stroke="#2E3037"/>
      <rect x="600" y="160" width="66" height="74" fill="#101116" stroke="#2E3037"/>
    </g>
    <rect x="188" y="168" width="112" height="66" fill="#17181C"/>
    <!-- parked car: profile, facing away -->

    <!-- asphalt with bay markings -->
    <rect x="80" y="286" width="640" height="114" fill="#191A1E"/>
    <g stroke="#2B2D33" stroke-width="2" opacity="0.8">
      <path d="M140 286 V400"/><path d="M660 286 V400"/>
    </g>
    <path d="M240 286 V400" stroke="#2B2D33" stroke-width="1" opacity="0.4" stroke-dasharray="8 10"/>

    <!-- the car, seen from behind -->
    <path d="M250 306 Q262 250 340 240 L470 240 Q548 250 560 306 Z" fill="#22242A"/>
    <rect x="242" y="300" width="326" height="62" rx="6" fill="#1D1F24"/>
    <path d="M256 308 Q268 258 342 250 L468 250 Q542 258 554 308 Z" fill="#2A2C33"/>
    <!-- rear light clusters -->
    <rect x="248" y="306" width="52" height="18" rx="3" fill="#8C2A22"/>
    <rect x="510" y="306" width="52" height="18" rx="3" fill="#8C2A22"/>
    <rect x="250" y="308" width="46" height="6" rx="2" fill="#C4402F"/>
    <rect x="514" y="308" width="46" height="6" rx="2" fill="#C4402F"/>
    <!-- bumper, and the plate mounted on the rear panel -->
    <rect x="242" y="352" width="326" height="16" fill="#16181C"/>
    <rect x="386" y="344" width="38" height="10" fill="#0E0F12"/>
    <rect x="346" y="290" width="118" height="26" rx="2" fill="#0E0F12"/>
    <rect x="348" y="292" width="114" height="22" rx="1" fill="#D9C455"/>
    <text x="405" y="309" text-anchor="middle" font-family="monospace" font-size="14" fill="#12120E" font-weight="bold" letter-spacing="1">LEON 06</text>
    <!-- wheels -->
    <rect x="252" y="358" width="56" height="34" rx="4" fill="#0E0F12"/>
    <rect x="502" y="358" width="56" height="34" rx="4" fill="#0E0F12"/>
    <!-- shadow under the car -->
    <ellipse cx="405" cy="394" rx="176" ry="10" fill="#0B0C0E" opacity="0.65"/>

    <!-- occupant still in the rear seat -->
    <path d="M380 268 Q383 240 405 238 Q427 240 430 268 Z" fill="#1F2126"/>
    <ellipse cx="405" cy="231" rx="11.4" ry="12.4" fill="#A9A294"/>
    <path d="M394 226 Q396 216 405 215 Q414 216 416 226 Q412 220 405 219 Q398 220 394 226 Z" fill="#232019"/>

    <!-- flagged zones: outlines over the still -->
    <circle cx="405" cy="222" r="14" fill="none" stroke="#FF3B30" stroke-width="1.4" stroke-dasharray="4 3"/>
    <text x="405" y="203" text-anchor="middle" font-family="monospace" font-size="8" fill="#FF3B30" font-weight="bold">FACE ZONE</text>
    <rect x="340" y="285" width="130" height="36" fill="none" stroke="#FF3B30" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="405" y="333" text-anchor="middle" font-family="monospace" font-size="8" fill="#FF3B30" font-weight="bold">PLATE ZONE</text>
  `,
});

const EVIDENCE_06C_SVG = cctvSvg({
  bg: "#141416",
  accent: "#9AA0A8",
  title: "06-C  MOTEL LEDGER",
  time: "03:12:44",
  cam: "02",
  scene: `
    <rect x="80" y="80" width="640" height="320" fill="#15161A"/>
    <!-- desk lamp pool, upper left -->
    <ellipse cx="300" cy="196" rx="230" ry="118" fill="#24262C" opacity="0.85"/>
    <text x="400" y="128" text-anchor="middle" font-family="monospace" font-size="10" fill="#4A4C53" letter-spacing="4">VICE MOTEL — FRONT DESK</text>

    <!-- desk surface -->
    <rect x="120" y="176" width="560" height="200" fill="#1F1E1C"/>
    <rect x="120" y="176" width="560" height="6" fill="#2A2825"/>

    <!-- open ledger: two pages under the lamp -->
    <path d="M180 208 Q290 196 400 208 L400 336 Q290 324 180 336 Z" fill="#E7DCC1"/>
    <path d="M400 208 Q510 196 620 208 L620 336 Q510 324 400 336 Z" fill="#DED2B4"/>
    <path d="M400 208 L400 336" stroke="#A89A78" stroke-width="2"/>
    <!-- ruled lines, left page -->
    <g stroke="#B9A986" stroke-width="0.7" opacity="0.75">
      <path d="M192 224 H392"/><path d="M192 248 H392"/><path d="M192 272 H392"/>
      <path d="M192 296 H392"/><path d="M192 320 H392"/>
    </g>
    <!-- entries: the third line is the one that matters -->
    <g font-family="monospace" font-size="11" fill="#4A4331">
      <text x="196" y="221">06-14  R. VANCE    RM 07    $80</text>
      <text x="196" y="245">06-14  L. TORRES   RM 12    $80</text>
      <text x="196" y="293">06-15  M. DIAZ     RM 03    $60</text>
      <text x="196" y="317">06-15  K. ADEYEMI  RM 09    $60</text>
    </g>
    <!-- the incriminating entry, inside the flagged line -->
    <text x="196" y="269" font-family="monospace" font-size="11" fill="#241F14" font-weight="bold">06-14  J. WRLD     RM 06   $120</text>
    <!-- right page: totals and a signature -->
    <g font-family="monospace" font-size="10" fill="#57503C">
      <text x="412" y="245">PAID IN CASH — NO RECEIPT</text>
      <text x="412" y="293">TOTAL   $620</text>
    </g>
    <path d="M496 316 Q512 302 528 316 Q544 330 560 314" stroke="#3A3427" stroke-width="1.4" fill="none"/>

    <!-- a hand resting on the page -->
    <path d="M262 340 Q278 318 302 322 Q322 326 328 342 Z" fill="#A69E90"/>
    <path d="M470 340 Q486 318 510 322 Q530 326 536 342 Z" fill="#A69E90"/>

    <!-- plate note, taped over the right page -->
    <rect x="476" y="196" width="118" height="40" fill="#0E0F12"/>
    <rect x="478" y="198" width="114" height="36" fill="#D9C455"/>
    <text x="535" y="216" text-anchor="middle" font-family="monospace" font-size="12" fill="#12120E" font-weight="bold" letter-spacing="1">LEON 06</text>
    <text x="535" y="229" text-anchor="middle" font-family="monospace" font-size="6" fill="#3A3420">FLORIDA — SUNSHINE STATE</text>

    <!-- flagged zones -->
    <rect x="205" y="238" width="260" height="22" fill="none" stroke="#FF3B30" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="205" y="233" font-family="monospace" font-size="8" fill="#FF3B30" font-weight="bold">LEDGER ZONE</text>
    <rect x="480" y="200" width="110" height="32" fill="none" stroke="#FF3B30" stroke-width="1.4" stroke-dasharray="6 4"/>
    <text x="588" y="216" font-family="monospace" font-size="8" fill="#FF3B30" font-weight="bold">PLATE</text>
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
