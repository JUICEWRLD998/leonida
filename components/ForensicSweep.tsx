"use client";

import type { ScoreResult } from "@/lib/scorer";

type Props = { scanning: boolean; score: ScoreResult | null };

export function ForensicSweep({ scanning, score }: Props) {
  if (scanning) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
          <span className="text-sm font-semibold tracking-[-0.2px] text-[var(--ink)]">Forensics scanning…</span>
          <span className="micro text-[var(--faint)]">reading pixels</span>
        </div>
        <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-[var(--paper-soft)]">
          <div className="absolute inset-y-0 left-0 w-1/3 animate-[scan-sweep_1.1s_ease-in-out_infinite] rounded-full bg-[var(--accent)] opacity-85 shadow-[0_0_12px_rgba(255,107,53,0.5)]" />
        </div>
        <div className="micro mt-3 flex gap-2 tracking-[0.3px] text-[var(--faint)]">
          <span className="animate-pulse">Analyzing pixels</span>·<span className="animate-pulse">Checking bboxes</span>·<span className="animate-pulse">Flattening layers</span>
        </div>
      </div>
    );
  }
  if (!score) return null;
  const ok = score.verdict === "DISMISSED";
  return (
    <div className={`rounded-2xl border p-5 shadow-[var(--shadow-card)] ${ok ? "border-[var(--success-line)] bg-[var(--success-soft)]" : "border-[var(--danger-line)] bg-[var(--danger-soft)]"}`}>
      <div className="flex items-center justify-between">
        <span className="micro tracking-[0.4px] text-[var(--muted)]">Forensic report</span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold tracking-[-0.15px] ${ok ? "bg-[var(--success)] text-[#042a1e]" : "bg-[var(--danger)] text-white"}`}>
          {ok ? "Case dismissed" : "Busted"}
        </span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {score.regions.map((r) => (
          <div key={r.region} className="flex items-center justify-between rounded-xl bg-[var(--surface)] px-4 py-3 ring-1 ring-[var(--line)]">
            <span className="text-sm font-medium tracking-[-0.15px] text-[var(--ink)]">{r.region === "face" ? "Face recognition" : "Plate OCR"}</span>
            <span className="flex items-center gap-2 text-sm">
              <span className={`font-semibold ${r.passed ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>{r.passed ? "Failed ✓" : "Matched ✗"}</span>
              <span className="text-xs text-[var(--faint)]">{r.obscuredPercent}% obscured</span>
            </span>
          </div>
        ))}
        <div className="flex items-center justify-between rounded-xl bg-[var(--paper)] px-4 py-3 ring-1 ring-[var(--line)]">
          <span className="text-sm font-semibold tracking-[-0.15px] text-[var(--ink)]">Tamper score</span>
          <span className={`text-sm font-bold ${ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
            {score.tamperScore}% — {ok ? "Sufficient" : "Insufficient"}
          </span>
        </div>
      </div>
    </div>
  );
}
