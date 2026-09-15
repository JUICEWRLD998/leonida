/* ── LEONIDA — Forensic scorer ──
   Deterministic pixel diff, entirely on the client. No network, no model.

   The comparison happens in the *source* frame's coordinate space:
   the original is drawn 1:1, and the edited frame is fitted into it
   preserving aspect. Whatever the edited frame does not cover is marked as
   gone, which is how a region that was cropped out scores as obscured.

   The pure functions (mapRegion, fitFrame, countObscured) hold all the
   scoring logic and take plain arrays, so they are testable without a DOM.
*/

import type { Evidence, BoundingBox } from "./evidence";

export type RegionScore = {
  region: "face" | "plate";
  obscuredPercent: number;
  passed: boolean;
};

export type ScoreResult = {
  regions: RegionScore[];
  tamperScore: number;
  verdict: "DISMISSED" | "BUSTED";
  /** True when the submitted frame is a different shape than the exhibit. */
  frameAltered: boolean;
  /** True when the edit did not measurably change a single flagged pixel. */
  untouched: boolean;
};

/** A pixel counts as obscured once any channel moves by more than this. */
const DIFF_THRESHOLD = 30;
/** Every flagged region must clear this to get the case thrown out. */
const PASS_MARK = 70;

/** Region boxes are authored against the 800×500 space the scenes are drawn in. */
const AUTHOR_W = 800;
const AUTHOR_H = 500;

/** Marks pixels of the source frame that the edit no longer covers. */
const GONE: [number, number, number] = [1, 2, 3];

/** Raised when the pixels cannot be read at all (tainted canvas, decode failure). */
export class ForensicsUnavailableError extends Error {
  constructor(message = "Forensic analysis could not read the exhibit") {
    super(message);
    this.name = "ForensicsUnavailableError";
  }
}

// ── Pure geometry ──────────────────────────────────────────────

/** Map an authored region into a canvas of the given size. */
export function mapRegion(region: BoundingBox, w: number, h: number) {
  return {
    x: Math.round((region.x / AUTHOR_W) * w),
    y: Math.round((region.y / AUTHOR_H) * h),
    w: Math.round((region.w / AUTHOR_W) * w),
    h: Math.round((region.h / AUTHOR_H) * h),
  };
}

/**
 * Where a `sw × sh` frame lands inside a `dw × dh` box, scaled to fit entirely
 * inside it and centred.
 *
 * Contain, not cover: cover would scale every frame up until it filled the
 * canvas, so a frame that no longer holds a region would still paint over it
 * and the crop could never be detected. Fitting inside means the surround the
 * edit does not reach stays marked as gone — which is exactly the content the
 * crop removed — while a proportionally-resized frame maps with no margin.
 */
export function placeFrame(sw: number, sh: number, dw: number, dh: number) {
  if (sw <= 0 || sh <= 0) return { x: 0, y: 0, w: 0, h: 0 };
  const scale = Math.min(dw / sw, dh / sh);
  const w = sw * scale;
  const h = sh * scale;
  return { x: (dw - w) / 2, y: (dh - h) / 2, w, h };
}

/** True when a rect falls entirely outside the covered area. */
export function fullyUncovered(
  rect: { x: number; y: number; w: number; h: number },
  cover: { x: number; y: number; w: number; h: number },
  eps = 0.5
) {
  return (
    rect.x + rect.w <= cover.x + eps ||
    rect.x >= cover.x + cover.w - eps ||
    rect.y + rect.h <= cover.y + eps ||
    rect.y >= cover.y + cover.h - eps
  );
}

// ── Pure scoring ───────────────────────────────────────────────

/**
 * Count pixels in one region that differ from the baseline, or that carry the
 * GONE marker (content the edit no longer covers).
 * `orig` and `edit` are RGBA byte arrays of the same dimensions.
 */
export function countObscured(
  orig: Uint8ClampedArray | number[],
  edit: Uint8ClampedArray | number[],
  threshold = DIFF_THRESHOLD
) {
  let obscured = 0;
  for (let i = 0; i < orig.length; i += 4) {
    if (
      edit[i] === GONE[0] &&
      edit[i + 1] === GONE[1] &&
      edit[i + 2] === GONE[2] &&
      edit[i + 3] === 255
    ) {
      obscured++;
      continue;
    }
    const dr = Math.abs(orig[i] - edit[i]);
    const dg = Math.abs(orig[i + 1] - edit[i + 1]);
    const db = Math.abs(orig[i + 2] - edit[i + 2]);
    if (dr > threshold || dg > threshold || db > threshold) obscured++;
  }
  return obscured;
}

/** Average the region scores into the headline number. */
export function tamperScoreOf(regions: RegionScore[]) {
  if (regions.length === 0) return 0;
  const sum = regions.reduce((s, r) => s + r.obscuredPercent, 0);
  return Math.round((sum / regions.length) * 10) / 10;
}

// ── Image loading ──────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () =>
      reject(new ForensicsUnavailableError("The submitted exhibit could not be read"));
    img.src = src;
  });
}

function readPixels(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  try {
    return ctx.getImageData(x, y, w, h).data;
  } catch (err) {
    // A tainted canvas throws SecurityError here; so does an out-of-bounds read.
    throw new ForensicsUnavailableError(
      err instanceof Error && err.name === "SecurityError"
        ? "Forensics is offline — the submitted image taints the canvas"
        : "Forensic analysis could not read those pixels"
    );
  }
}

/**
 * Compare the submitted frame against the exhibit inside each flagged region.
 * A pixel is obscured when it differs past the threshold, or when the edit no
 * longer covers it (cropped out).
 */
export async function scoreForensics(
  originalDataUrl: string,
  editedDataUrl: string,
  evidence: Evidence
): Promise<ScoreResult> {
  const [origImg, editImg] = await Promise.all([
    loadImage(originalDataUrl),
    loadImage(editedDataUrl),
  ]);

  const W = origImg.naturalWidth;
  const H = origImg.naturalHeight;
  const eW = editImg.naturalWidth;
  const eH = editImg.naturalHeight;

  if (!W || !H) throw new ForensicsUnavailableError("The exhibit has no readable pixels");

  const frameAltered = eW !== W || eH !== H;

  const canvasOrig = document.createElement("canvas");
  const canvasEdit = document.createElement("canvas");
  canvasOrig.width = W;
  canvasOrig.height = H;
  canvasEdit.width = W;
  canvasEdit.height = H;

  const ctxOrig = canvasOrig.getContext("2d", { willReadFrequently: true });
  const ctxEdit = canvasEdit.getContext("2d", { willReadFrequently: true });
  if (!ctxOrig || !ctxEdit) throw new ForensicsUnavailableError();

  ctxOrig.drawImage(origImg, 0, 0, W, H);

  // Fill with the GONE marker, then lay the edit over it. The surround the
  // edit does not reach stays marked, so content a crop removed reads as
  // obscured rather than silently scoring zero.
  const cover = placeFrame(eW, eH, W, H);
  ctxEdit.fillStyle = `rgb(${GONE[0]}, ${GONE[1]}, ${GONE[2]})`;
  ctxEdit.fillRect(0, 0, W, H);
  ctxEdit.drawImage(editImg, cover.x, cover.y, cover.w, cover.h);

  const regions: RegionScore[] = [];
  let totalObscured = 0;
  let totalPixels = 0;

  for (const key of ["face", "plate"] as const) {
    const box = mapRegion(evidence.regions[key], W, H);

    // Clamp into the canvas before reading.
    const x = Math.max(0, Math.min(box.x, W - 1));
    const y = Math.max(0, Math.min(box.y, H - 1));
    const w = Math.max(1, Math.min(box.w, W - x));
    const h = Math.max(1, Math.min(box.h, H - y));

    // A region the frame no longer reaches is gone entirely.
    const obscuredPercent = fullyUncovered({ x, y, w, h }, cover)
      ? 100
      : (() => {
          const orig = readPixels(ctxOrig, x, y, w, h);
          const edit = readPixels(ctxEdit, x, y, w, h);
          const total = w * h;
          return total === 0 ? 100 : (countObscured(orig, edit) / total) * 100;
        })();

    const rounded = Math.round(obscuredPercent * 10) / 10;
    totalObscured += rounded;
    totalPixels += 1;
    regions.push({ region: key, obscuredPercent: rounded, passed: rounded >= PASS_MARK });
  }

  const tamperScore =
    totalPixels === 0
      ? 0
      : Math.round((totalObscured / totalPixels) * 10) / 10;

  return {
    regions,
    tamperScore,
    verdict: regions.every((r) => r.passed) ? "DISMISSED" : "BUSTED",
    frameAltered,
    // Below a hair of movement, the examiner simply submitted the exhibit back.
    untouched: tamperScore < 1,
  };
}
