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
  const ok = verdict === "DISMISSED";
  return (
    <div className={`rounded-2xl border p-6 text-center shadow-[var(--shadow-card)] ${ok ? "border-[var(--success-line)] bg-[var(--success-soft)]" : "border-[var(--danger-line)] bg-[var(--danger-soft)]"}`}>
      <div className={`mx-auto inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-[-0.15px] ${ok ? "bg-[var(--success)] text-[#042a1e]" : "bg-[var(--danger)] text-white"}`}>
        {ok ? "★ Wanted level cleared ★" : "Wasted — case remains open"}
      </div>
      <h2 className={`gta-stencil mt-3 text-[40px] tracking-[0.04em] sm:text-[48px] ${ok ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
        {ok ? "DISMISSED" : "BUSTED"}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-[1.6] tracking-[-0.15px] text-[var(--muted)]">
        {ok ? "Forensics could not match. The case is thrown out." : "Forensics matched at least one region. You left evidence behind."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {!ok && (
          <button onClick={onRetry} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold tracking-[-0.2px] text-[var(--ink)] hover:border-[var(--line-strong)]">
            Retry this evidence
          </button>
        )}
        <button
          onClick={onNext}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold tracking-[-0.2px] transition-all hover:translate-y-[-1px] active:translate-y-0 ${ok ? "bg-[var(--accent)] text-[var(--on-accent)] shadow-[0_2px_0_rgba(232,72,20,0.12)] hover:bg-[var(--accent-hover)]" : "bg-[var(--surface)] text-[var(--ink)] ring-1 ring-[var(--line)] hover:bg-[var(--surface-raised)]"}`}
        >
          {isLast ? (ok ? "View posters →" : "View results →") : "Next evidence →"}
        </button>
      </div>
    </div>
  );
}
