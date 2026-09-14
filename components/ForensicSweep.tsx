"use client";

import type { ScoreResult } from "@/lib/scorer";

type Props = {
  scanning: boolean;
  score: ScoreResult | null;
};

export function ForensicSweep({ scanning, score }: Props) {
  if (scanning) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-1)] p-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span className="font-mono text-xs tracking-[0.2em] text-[var(--accent)]">
            FORENSICS SCANNING…
          </span>
        </div>
        {/* Scan bar */}
        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-[var(--bg-2)]">
          <div className="absolute inset-y-0 left-0 w-1/3 animate-[sweep_1.1s_ease-in-out_infinite] rounded-full bg-[var(--accent)] opacity-80 shadow-[0_0_12px_var(--accent)]" />
        </div>
        <div className="mt-3 flex gap-2 font-mono text-[10px] tracking-widest text-[var(--text-3)]">
          <span className="animate-pulse">ANALYZING PIXELS</span>
          <span>·</span>
          <span className="animate-pulse">CHECKING BBOXES</span>
          <span>·</span>
          <span className="animate-pulse">FLATTENING LAYERS</span>
        </div>
        <style>{`@keyframes sweep { 0%{transform:translateX(-100%)} 100%{transform:translateX(400%)} }`}</style>
      </div>
    );
  }

  if (!score) return null;

  const isDismissed = score.verdict === "DISMISSED";

  return (
    <div
      className={`rounded-xl border p-5 ${isDismissed ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-[var(--danger)]/30 bg-[var(--danger)]/5"}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs tracking-[0.2em] text-[var(--text-2)]">
          FORENSIC REPORT
        </span>
        <span
          className={`rounded px-2 py-1 font-mono text-xs font-bold tracking-widest ${isDismissed ? "bg-[var(--accent)] text-[var(--bg-0)]" : "bg-[var(--danger)] text-white"}`}
        >
          {isDismissed ? "CASE DISMISSED" : "BUSTED"}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {score.regions.map((r) => (
          <div
            key={r.region}
            className="flex items-center justify-between rounded-lg bg-[var(--bg-1)] px-3 py-2"
          >
            <span className="font-mono text-xs tracking-widest text-[var(--text-2)]">
              {r.region === "face" ? "FACE RECOGNITION" : "PLATE OCR"}
            </span>
            <span className="flex items-center gap-2 font-mono text-xs font-bold">
              <span className={r.passed ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
                {r.passed ? "FAILED ✓" : "MATCHED ✗"}
              </span>
              <span className="text-[var(--text-3)]">{r.obscuredPercent}% obscured</span>
            </span>
          </div>
        ))}

        <div className="flex items-center justify-between rounded-lg bg-[var(--bg-0)] px-3 py-2 ring-1 ring-[var(--border)]">
          <span className="font-mono text-xs tracking-widest text-[var(--text-1)]">
            TAMPER SCORE
          </span>
          <span className={`font-mono text-sm font-bold ${isDismissed ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
            {score.tamperScore}% — {isDismissed ? "SUFFICIENT" : "INSUFFICIENT"}
          </span>
        </div>
      </div>
    </div>
  );
}
