"use client";

import type { ScoreResult } from "@/lib/scorer";

type Props = {
  verdict: "DISMISSED" | "BUSTED";
  score: ScoreResult;
  onNext: () => void;
  onRetry: () => void;
  isLast: boolean;
};

export function VerdictScreen({ verdict, onNext, onRetry, isLast }: Props) {
  const dismissed = verdict === "DISMISSED";

  return (
    <div
      className={`rounded-xl border p-6 text-center ${dismissed ? "border-[var(--accent)]/30 bg-[var(--accent)]/5" : "border-[var(--danger)]/30 bg-[var(--danger)]/5"}`}
    >
      <div
        className={`mx-auto inline-flex rounded-full px-3 py-1 font-mono text-xs font-bold tracking-widest ${dismissed ? "bg-[var(--accent)] text-[var(--bg-0)]" : "bg-[var(--danger)] text-white"}`}
      >
        {dismissed ? "★ WANTED LEVEL CLEARED ★" : "WASTED — CASE REMAINS OPEN"}
      </div>

      <h2
        className={`mt-4 text-4xl font-black tracking-tight ${dismissed ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}
        style={{ fontFamily: "var(--font-display)" }}
      >
        {dismissed ? "DISMISSED" : "BUSTED"}
      </h2>

      <p className="mt-2 font-mono text-xs text-[var(--text-2)]">
        {dismissed
          ? "Forensics could not match. The case is thrown out."
          : "Forensics matched at least one region. You left evidence behind."}
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {!dismissed && (
          <button
            onClick={onRetry}
            className="rounded-lg border border-[var(--border)] bg-[var(--bg-1)] px-5 py-2.5 font-mono text-xs font-bold tracking-widest text-[var(--text-1)] hover:bg-[var(--bg-2)]"
          >
            RETRY THIS EVIDENCE
          </button>
        )}
        <button
          onClick={onNext}
          className={`rounded-lg px-5 py-2.5 font-mono text-xs font-bold tracking-widest ${dismissed ? "bg-[var(--accent)] text-[var(--bg-0)] hover:bg-[var(--accent-dim)]" : "bg-[var(--bg-2)] text-[var(--text-1)] hover:bg-[var(--bg-3)]"}`}
        >
          {isLast ? (dismissed ? "VIEW POSTERS →" : "VIEW RESULTS →") : "NEXT EVIDENCE →"}
        </button>
      </div>
    </div>
  );
}
