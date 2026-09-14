/* ── Poster generator — 1080×1350 canvas ── */

export async function generatePoster(
  editedDataUrl: string,
  opts: { caseLabel: string; score: number; dismissed: boolean }
): Promise<string> {
  const W = 1080;
  const H = 1350;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // bg
  ctx.fillStyle = "#070B14";
  ctx.fillRect(0, 0, W, H);

  // top bar
  ctx.fillStyle = "#0E1629";
  ctx.fillRect(0, 0, W, 72);
  ctx.fillStyle = "#1E2D5A";
  ctx.fillRect(0, 71, W, 1);

  ctx.fillStyle = "#14F0B8";
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "left";
  ctx.fillText("LEONIDA  POLICE  DEPT.", 32, 32);
  ctx.fillStyle = "#8A9AB8";
  ctx.font = "11px monospace";
  ctx.fillText("EVIDENCE LOCKER  •  FORENSICS DIVISION", 32, 54);

  ctx.fillStyle = opts.dismissed ? "#14F0B8" : "#FF3B30";
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "right";
  ctx.fillText(opts.dismissed ? "CASE DISMISSED" : "CASE OPEN", W - 32, 32);
  ctx.fillStyle = "#8A9AB8";
  ctx.font = "11px monospace";
  ctx.fillText(opts.caseLabel, W - 32, 54);

  // image
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = editedDataUrl;
  });

  const imgTop = 96;
  const imgH = 880;
  const imgW = W - 48;
  const imgX = 24;

  // rounded clip
  ctx.save();
  const r = 12;
  ctx.beginPath();
  ctx.moveTo(imgX + r, imgTop);
  ctx.lineTo(imgX + imgW - r, imgTop);
  ctx.quadraticCurveTo(imgX + imgW, imgTop, imgX + imgW, imgTop + r);
  ctx.lineTo(imgX + imgW, imgTop + imgH - r);
  ctx.quadraticCurveTo(imgX + imgW, imgTop + imgH, imgX + imgW - r, imgTop + imgH);
  ctx.lineTo(imgX + r, imgTop + imgH);
  ctx.quadraticCurveTo(imgX, imgTop + imgH, imgX, imgTop + imgH - r);
  ctx.lineTo(imgX, imgTop + r);
  ctx.quadraticCurveTo(imgX, imgTop, imgX + r, imgTop);
  ctx.closePath();
  ctx.clip();

  // cover
  const scale = Math.max(imgW / img.naturalWidth, imgH / img.naturalHeight);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = imgX + (imgW - dw) / 2;
  const dy = imgTop + (imgH - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();

  // border around image
  ctx.strokeStyle = "#1E2D5A";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(imgX + 0.5, imgTop + 0.5, imgW - 1, imgH - 1);

  // stamp
  const stampY = imgTop + imgH + 36;
  ctx.save();
  ctx.translate(W / 2, stampY + 30);
  ctx.rotate((-6 * Math.PI) / 180);
  ctx.strokeStyle = opts.dismissed ? "#14F0B8" : "#FF3B30";
  ctx.lineWidth = 3;
  ctx.strokeRect(-180, -28, 360, 56);
  ctx.fillStyle = opts.dismissed ? "#14F0B8" : "#FF3B30";
  ctx.font = "bold 28px monospace";
  ctx.textAlign = "center";
  ctx.fillText(opts.dismissed ? "DISMISSED" : "FLAGGED", 0, 10);
  ctx.restore();

  // score
  ctx.fillStyle = "#E8EEF8";
  ctx.font = "13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(`TAMPER SCORE  ${opts.score}%`, W / 2, stampY + 88);
  ctx.fillStyle = "#4A5A7A";
  ctx.font = "10px monospace";
  ctx.fillText("leonida.app  •  #BuiltWithImageEditor  •  @unlayer", W / 2, H - 28);
  ctx.fillStyle = "#4A5A7A";
  ctx.font = "9px monospace";
  ctx.fillText("GTA VI INSPIRED — NOT AFFILIATED WITH ROCKSTAR GAMES", W / 2, H - 14);

  return canvas.toDataURL("image/png");
}
