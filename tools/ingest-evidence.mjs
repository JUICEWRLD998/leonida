// Ingest the exhibit stills a user drops into public/evidence/.
//
// Reads whatever is there, reports each image's real pixel size, and writes a
// manifest. Deterministic: images are sorted by filename, so the same three
// files always map to 06-A, 06-B, 06-C in the same order. Anything it cannot
// parse is reported and skipped rather than guessed at.
//
// Usage:  node tools/ingest-evidence.mjs
//
// The scoring zones are calibrated afterwards against the real pixel
// positions — see the report this prints.

import fs from "node:fs";
import path from "node:path";

const DIR = "public/evidence";
const OUT = `${DIR}/manifest.json`;

// ── Minimal header readers. Enough to get true dimensions, which is all the
//    bbox calibration needs, without pulling in an image library. ──

function pngSize(buf) {
  // IHDR is the first chunk: 8-byte signature, 4 length, 4 type, then w/h.
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function jpegSize(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    // Any SOF marker carries the dimensions.
    const isSOF =
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf);
    if (isSOF) return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      i += 2;
      continue;
    }
    const len = buf.readUInt16BE(i + 2);
    if (len < 2) return null;
    i += 2 + len;
  }
  return null;
}

function webpSize(buf) {
  if (buf.length < 30) return null;
  if (buf.toString("ascii", 0, 4) !== "RIFF") return null;
  if (buf.toString("ascii", 8, 12) !== "WEBP") return null;
  const fourcc = buf.toString("ascii", 12, 16);
  if (fourcc === "VP8X") {
    // 24-bit little-endian, stored minus one.
    const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { w, h };
  }
  if (fourcc === "VP8 ") {
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === "VP8L") {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function sizeOf(buf) {
  return pngSize(buf) ?? jpegSize(buf) ?? webpSize(buf);
}

// ── Run ──

if (!fs.existsSync(DIR)) {
  console.log(`No ${DIR} directory. Create it and drop three stills in.`);
  process.exit(0);
}

const files = fs
  .readdirSync(DIR)
  .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
  .sort(); // deterministic: 06-A gets the first by name

if (files.length === 0) {
  console.log(`No images in ${DIR}.`);
  console.log("\nDrop three stills named so the order is unambiguous, e.g.:");
  console.log("  public/evidence/01-corner-store.jpg");
  console.log("  public/evidence/02-getaway-car.jpg");
  console.log("  public/evidence/03-motel-ledger.jpg");
  console.log("\nThen run this again.");
  process.exit(0);
}

const SLOTS = ["06-A", "06-B", "06-C"];
const manifest = [];
let failed = 0;

console.log(`Found ${files.length} image(s) in ${DIR}\n`);
console.log("slot   file                          bytes     size        ar    verdict");
console.log("─".repeat(82));

for (const [i, file] of files.entries()) {
  const p = path.join(DIR, file);
  const buf = fs.readFileSync(p);
  const size = sizeOf(buf);
  const slot = SLOTS[i] ?? `extra-${i}`;

  if (!size || !size.w || !size.h) {
    failed++;
    console.log(`${slot.padEnd(6)} ${file.slice(0, 28).padEnd(29)} ${String(buf.length).padStart(8)}  ${"".padEnd(10)}  ${"".padEnd(5)} UNREADABLE — skipped`);
    continue;
  }

  const ar = size.w / size.h;
  // The game frame is 8:5. Anything far from it will letterbox or crop when
  // it is displayed, which matters for where the zones land.
  const arNote =
    ar > 2.4 ? "very wide — will crop hard"
      : ar < 1.1 ? "tall — will crop hard"
        : ar >= 1.45 && ar <= 1.8 ? "close to 8:5 — ideal"
          : "usable, mild crop";

  manifest.push({
    slot,
    file,
    bytes: buf.length,
    width: size.w,
    height: size.h,
    aspect: Number(ar.toFixed(3)),
  });

  console.log(
    `${slot.padEnd(6)} ${file.slice(0, 28).padEnd(29)} ${String(buf.length).padStart(8)}  ` +
      `${`${size.w}x${size.h}`.padEnd(10)}  ${ar.toFixed(2).padEnd(5)} ${arNote}`
  );
}

fs.writeFileSync(OUT, JSON.stringify(manifest, null, 2));
console.log(`\n${manifest.length} usable, ${failed} unreadable -> ${OUT}`);

if (manifest.length < 3) {
  console.log(`\n! Need 3 usable images; have ${manifest.length}.`);
}

// The zones are authored in the same 800x500 space the drawn art uses, so the
// coordinates below are what the scorer reads. Report the frame each slot will
// occupy so zones can be placed against the real content.
if (manifest.length) {
  console.log("\nCalibrate the scoring zones next:");
  console.log("  Author them in the 800x500 space (see lib/scorer.ts mapRegion).");
  console.log("  For a full-bleed 8:5 frame, a point at (px, py) in the source maps to:");
  for (const m of manifest) {
    const sx = 800 / m.width;
    const sy = 500 / m.height;
    console.log(
      `    ${m.slot}: x800 = px * ${sx.toFixed(4)},  y500 = py * ${sy.toFixed(4)}` +
        (Math.abs(sx - sy) > 0.02 ? "   (non-uniform: frame will crop, not stretch)" : "")
    );
  }
}
