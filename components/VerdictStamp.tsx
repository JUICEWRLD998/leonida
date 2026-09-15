"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ScoreResult } from "@/lib/scorer";

type Props = {
  verdict: "DISMISSED" | "BUSTED";
  score: ScoreResult;
  onNext: () => void;
  onRetry: () => void;
  isLast: boolean;
};

// The one orchestrated moment in the flow: the disposition gets stamped.
export function VerdictStamp({ verdict, onNext, onRetry, isLast }: Props) {
  const ok = verdict === "DISMISSED";
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col items-start gap-6 pt-4 lg:pt-0">
      <div className="flex w-full flex-wrap items-center justify-between gap-4">
        <div>
          <p className="field text-[var(--on-desk-faint)]">Forensics disposition</p>
          <p className="mt-1.5 text-[14px] text-[var(--on-desk-muted)]">
            {ok
              ? "No flagged region survived analysis. The evidence cannot be used."
              : "At least one flagged region is still legible to forensics."}
          </p>
        </div>
      </div>

      {/* The stamp */}
      <motion.div
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.01, delay: reduced ? 0 : 0.15 }}
        className="w-full"
      >
        <div
          className={`stamp inline-block text-[40px] sm:text-[68px] ${
            ok ? "stamp-green" : "stamp-red"
          } ${reduced ? "" : "stamp-land"}`}
        >
          {ok ? "Dismissed" : "Busted"}
        </div>
      </motion.div>

      <div className="flex flex-wrap gap-3">
        {!ok && (
          <button onClick={onRetry} className="btn btn-stamp" type="button">
            Reopen exhibit
          </button>
        )}
        <button
          onClick={onNext}
          className={`btn ${ok ? "btn-clear" : ""}`}
          type="button"
        >
          {isLast ? (ok ? "See notices" : "Close the file") : "Next exhibit"}
        </button>
      </div>
    </div>
  );
}
