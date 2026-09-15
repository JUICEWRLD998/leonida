"use client";

import type { ScoreResult } from "@/lib/scorer";

const THRESHOLD = 70;

const REGION_NAME: Record<string, string> = {
  face: "Face recognition",
  plate: "Plate OCR",
};

export function ScanReport({
  score,
  evidenceId,
}: {
  score: ScoreResult;
  evidenceId: string;
}) {
  const ok = score.verdict === "DISMISSED";

  return (
    <div className="form">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--form-line)] px-4 py-3 sm:px-5">
        <span className="field text-[var(--form-muted)]">
          Analysis report — exhibit {evidenceId}
        </span>
        <span className="field text-[var(--form-muted)]">
          Threshold {THRESHOLD}% per zone
        </span>
      </div>

      <div className="px-4 sm:px-5">
        {score.regions.map((r) => (
          <div
            key={r.region}
            className="flex items-baseline gap-3 border-b border-[var(--form-line)] py-[13px]"
          >
            <span className="field w-[132px] shrink-0 text-[var(--form-muted)] sm:w-[150px]">
              {REGION_NAME[r.region] ?? r.region}
            </span>
            <span className="rule" />
            <span className="ledger w-[52px] shrink-0 text-right text-[14px] text-[var(--form-ink)]">
              {r.obscuredPercent}%
            </span>
            <span
              className="field w-[86px] shrink-0 text-right"
              style={{ color: r.passed ? "var(--clear)" : "var(--stamp)" }}
            >
              {r.passed ? "No match" : "Matched"}
            </span>
          </div>
        ))}

        <div className="flex items-baseline gap-3 py-[13px]">
          <span className="field w-[132px] shrink-0 font-bold text-[var(--form-ink)] sm:w-[150px]">
            Tamper score
          </span>
          <span className="rule" />
          <span
            className="ledger w-[52px] shrink-0 text-right text-[17px]"
            style={{ color: ok ? "var(--clear)" : "var(--stamp)" }}
          >
            {score.tamperScore}%
          </span>
          <span className="field w-[86px] shrink-0 text-right text-[var(--form-muted)]">
            Overall
          </span>
        </div>
      </div>

      <div className="border-t border-[var(--form-line)] px-4 py-3 sm:px-5">
        <p className="text-[12.5px] leading-[1.7] text-[var(--form-muted)]">
          {score.untouched
            ? "No tampering detected. The exhibit was submitted exactly as filed, so every flagged zone still reads."
            : ok
              ? "Every flagged zone reads below the matching threshold. The exhibit is unusable and the case cannot proceed."
              : "Zones marked Matched remain legible. Obscure them further before resubmitting."}
        </p>
        {score.frameAltered && (
          <p className="mt-2 text-[12.5px] leading-[1.7] text-[var(--form-muted)]">
            The submitted frame does not match the filed dimensions. Areas the
            frame no longer reaches are recorded as removed.
          </p>
        )}
      </div>
    </div>
  );
}
