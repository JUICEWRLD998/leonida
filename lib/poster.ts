/* ── Dismissal notice — 1080×1350 ──
   The trophy is a piece of paperwork: a Leonida PD form, typed on the same
   Courier the interface uses, with the exhibit mounted and the disposition
   stamped across the bottom. Colours come from the live tokens so the notice
   and the terminal it was issued from stay one system. */

const W = 1080;
const H = 1350;
const PAD = 64;

function tokenVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export async function generatePoster(
  editedDataUrl: string,
  opts: { caseLabel: string; score: number; dismissed: boolean }
): Promise<string> {
  if (typeof document !== "undefined" && document.fonts) {
    try {
      await document.fonts.ready;
    } catch {}
  }

  const TYPE = tokenVar("--font-courier", "Courier New");
  const STAMP = tokenVar("--font-archivo-black", "Impact");

  const c = {
    paper: "#E9E0CB",
    paperDeep: "#D8CBB0",
    rule: "#B9A884",
    ink: "#2A2620",
    muted: "#6A6153",
    desk: "#16130F",
    exhibit: "#0A0C0E",
    stampRed: "#A33220",
    clear: "#1F6B45",
  };

  const disposition = opts.dismissed ? "DISMISSED" : "BUSTED";
  const dispositionColor = opts.dismissed ? c.clear : c.stampRed;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // ── Paper ──
  ctx.fillStyle = c.paper;
  ctx.fillRect(0, 0, W, H);

  // Paper tooth: sparse specks, so the ground is stock not a flat fill.
  ctx.fillStyle = "rgba(42, 38, 32, 0.055)";
  for (let i = 0; i < 2200; i++) {
    const x = (i * 197.3) % W;
    const y = (i * 331.7) % H;
    ctx.fillRect(x, y, 1, 1);
  }

  // ── Letterhead ──
  ctx.fillStyle = c.ink;
  ctx.fillRect(PAD, 74, 62, 62);

  ctx.fillStyle = c.paper;
  ctx.font = `700 26px ${TYPE}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LPD", PAD + 31, 106);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = c.ink;
  ctx.font = `700 34px ${TYPE}`;
  ctx.fillText("LEONIDA POLICE DEPARTMENT", PAD + 84, 104);

  ctx.fillStyle = c.muted;
  ctx.font = `400 15px ${TYPE}`;
  ctx.fillText("PROPERTY & EVIDENCE DIVISION", PAD + 85, 126);

  // Case number, right aligned
  ctx.textAlign = "right";
  ctx.fillStyle = c.muted;
  ctx.font = `400 13px ${TYPE}`;
  ctx.fillText("CASE FILE", W - PAD, 92);

  ctx.fillStyle = c.ink;
  ctx.font = `700 32px ${TYPE}`;
  ctx.fillText(opts.caseLabel, W - PAD, 124);

  // Double rule under the letterhead
  ctx.fillStyle = c.ink;
  ctx.fillRect(PAD, 168, W - PAD * 2, 2);
  ctx.fillStyle = c.rule;
  ctx.fillRect(PAD, 172, W - PAD * 2, 1);

  // ── Form heading ──
  ctx.textAlign = "left";
  ctx.fillStyle = c.muted;
  ctx.font = `400 14px ${TYPE}`;
  ctx.fillText("NOTICE OF DISPOSITION — EXHIBIT ANALYSIS", PAD, 214);

  // ── Mounted exhibit ──
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = editedDataUrl;
  });

  const imgTop = 240;
  const imgH = 720;
  const imgW = W - PAD * 2;
  const imgX = PAD;

  // Mount board
  ctx.fillStyle = c.desk;
  ctx.fillRect(imgX - 12, imgTop - 12, imgW + 24, imgH + 24);

  ctx.save();
  ctx.beginPath();
  ctx.rect(imgX, imgTop, imgW, imgH);
  ctx.clip();

  const scale = Math.max(imgW / img.naturalWidth, imgH / img.naturalHeight);
  ctx.drawImage(
    img,
    imgX + (imgW - img.naturalWidth * scale) / 2,
    imgTop + (imgH - img.naturalHeight * scale) / 2,
    img.naturalWidth * scale,
    img.naturalHeight * scale
  );
  ctx.restore();

  ctx.strokeStyle = c.exhibit;
  ctx.lineWidth = 1;
  ctx.strokeRect(imgX + 0.5, imgTop + 0.5, imgW - 1, imgH - 1);

  // Exhibit tag, taped to the mount
  const tagY = imgTop + imgH + 26;
  ctx.fillStyle = c.paperDeep;
  ctx.fillRect(imgX, tagY, 340, 40);
  ctx.strokeStyle = c.rule;
  ctx.strokeRect(imgX + 0.5, tagY + 0.5, 340, 40);

  ctx.fillStyle = c.muted;
  ctx.font = `400 13px ${TYPE}`;
  ctx.textAlign = "left";
  ctx.fillText("EXHIBIT AS ALTERED", imgX + 14, tagY + 26);

  // ── Analysis lines with dotted leaders ──
  let y = tagY + 96;

  const row = (label: string, value: string, color?: string) => {
    ctx.fillStyle = c.muted;
    ctx.font = `400 16px ${TYPE}`;
    ctx.textAlign = "left";
    ctx.fillText(label, PAD, y);

    const labelW = ctx.measureText(label).width;

    ctx.fillStyle = c.rule;
    ctx.font = `400 16px ${TYPE}`;
    const dots = ".".repeat(60);
    ctx.save();
    ctx.beginPath();
    ctx.rect(PAD + labelW + 12, y - 16, W - PAD * 2 - labelW - 210, 20);
    ctx.clip();
    ctx.fillText(dots, PAD + labelW + 12, y);
    ctx.restore();

    ctx.fillStyle = color ?? c.ink;
    ctx.font = `700 16px ${TYPE}`;
    ctx.textAlign = "right";
    ctx.fillText(value, W - PAD, y);

    y += 38;
  };

  ctx.fillStyle = c.ink;
  ctx.font = `700 17px ${TYPE}`;
  ctx.textAlign = "left";
  ctx.fillText("ANALYSIS", PAD, y - 18);
  ctx.fillStyle = c.ink;
  ctx.fillRect(PAD, y - 8, W - PAD * 2, 1.5);
  y += 30;

  row("Face recognition", opts.dismissed ? "NO MATCH" : "MATCHED", opts.dismissed ? c.clear : c.stampRed);
  row("Plate OCR", opts.dismissed ? "NO MATCH" : "MATCHED", opts.dismissed ? c.clear : c.stampRed);
  row("Tamper score", `${opts.score}%`, dispositionColor);

  // ── The stamp: the whole point of the notice ──
  const stampY = H - 250;

  ctx.save();
  ctx.translate(W / 2, stampY);
  ctx.rotate((-7 * Math.PI) / 180);

  const stampText = disposition;
  ctx.font = `400 92px ${STAMP}`;
  const tw = ctx.measureText(stampText).width;
  const boxW = tw + 96;
  const boxH = 132;

  ctx.strokeStyle = dispositionColor;
  ctx.lineWidth = 7;
  ctx.strokeRect(-boxW / 2, -boxH / 2, boxW, boxH);

  // Inner rule, as a rubber stamp frame has
  ctx.lineWidth = 2;
  ctx.strokeRect(-boxW / 2 + 12, -boxH / 2 + 12, boxW - 24, boxH - 24);

  ctx.fillStyle = dispositionColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(stampText, 0, 6);
  ctx.restore();

  ctx.textBaseline = "alphabetic";

  // Ink wear over the stamp
  ctx.fillStyle = c.paper;
  for (let i = 0; i < 900; i++) {
    const x = PAD + ((i * 251.9) % (W - PAD * 2));
    const yy = stampY - 110 + ((i * 173.3) % 220);
    ctx.fillRect(x, yy, 2, 2);
  }

  // ── Footer ──
  ctx.fillStyle = c.rule;
  ctx.fillRect(PAD, H - 96, W - PAD * 2, 1);

  ctx.fillStyle = c.muted;
  ctx.font = `400 13px ${TYPE}`;
  ctx.textAlign = "left";
  ctx.fillText("#BuiltWithImageEditor  ·  @unlayer", PAD, H - 64);

  ctx.textAlign = "right";
  ctx.fillText("A WORK OF FICTION — NOT AFFILIATED WITH ROCKSTAR GAMES", W - PAD, H - 64);

  return canvas.toDataURL("image/png");
}
