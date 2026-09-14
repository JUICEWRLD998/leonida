"use client";

import { useState, useCallback } from "react";

type Phase = "idle" | "evidence" | "terminal";

export default function Home() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [evidenceIndex] = useState(0);

  const handleOpenTerminal = useCallback(() => {
    setPhase("terminal");
  }, []);

  const handleBack = useCallback(() => {
    setPhase("evidence");
  }, []);

  return (
    <div className="flex flex-1 flex-col min-h-screen">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-1)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[960px] items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-[var(--accent)] text-[10px] font-bold tracking-widest text-[var(--bg-0)]">
              LPD
            </div>
            <div>
              <p
                className="text-[11px] font-bold tracking-[0.18em] text-[var(--text-1)]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                LEONIDA
              </p>
              <p className="text-[9px] tracking-[0.2em] text-[var(--text-2)]">
                EVIDENCE LOCKER
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Wanted stars */}
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="text-sm leading-none transition-colors"
                  style={{
                    color: i < 5 ? "var(--warning)" : "var(--bg-3)",
                    filter: i < 5 ? "drop-shadow(0 0 4px var(--warning))" : undefined,
                  }}
                  aria-hidden
                >
                  ★
                </span>
              ))}
            </div>
            <span className="hidden text-xs font-mono text-[var(--text-2)] sm:inline">
              WANTED ★★★★★
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--bg-2)] px-2 py-1 font-mono text-xs text-[var(--text-2)]">
              CASE LEONIDA-06
            </span>
            <span className="hidden rounded bg-[var(--accent)]/10 px-2 py-1 font-mono text-xs font-bold text-[var(--accent)] sm:inline">
              $0
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto flex w-full max-w-[960px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {phase === "idle" && (
          <IdleState onEnter={() => setPhase("evidence")} />
        )}

        {phase === "evidence" && (
          <EvidenceState
            index={evidenceIndex}
            onOpenTerminal={handleOpenTerminal}
          />
        )}

        {phase === "terminal" && (
          <TerminalState onBack={handleBack} />
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--border)] py-4 text-center">
        <p className="font-mono text-[10px] tracking-widest text-[var(--text-3)]">
          LEONIDA POLICE DEPT. — FORENSICS DIVISION — BUILD WITH REACT IMAGE EDITOR CHALLENGE
        </p>
      </footer>
    </div>
  );
}

/* ── Idle / boot ── */
function IdleState({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 py-12 text-center">
      <div className="relative">
        {/* Glow */}
        <div className="absolute inset-0 -z-10 blur-3xl opacity-20 bg-[var(--accent)] rounded-full scale-150" />
        <h1
          className="text-5xl font-black tracking-tighter text-[var(--text-1)] sm:text-7xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          LEONIDA
        </h1>
        <p className="mt-1 font-mono text-xs tracking-[0.4em] text-[var(--accent)]">
          EVIDENCE LOCKER
        </p>
      </div>

      <p className="max-w-md font-mono text-sm leading-relaxed text-[var(--text-2)]">
        Three surveillance photos. Two incriminating details each.
        <br />
        Doctor the evidence before forensics clears the case.
      </p>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onEnter}
          className="group relative overflow-hidden rounded bg-[var(--accent)] px-8 py-3 font-mono text-sm font-bold tracking-widest text-[var(--bg-0)] transition-all hover:bg-[var(--accent-dim)] hover:shadow-[0_0_24px_var(--accent-glow)] active:scale-[0.98]"
        >
          ENTER EVIDENCE LOCKER →
        </button>
        <span className="font-mono text-[10px] tracking-widest text-[var(--text-3)]">
          PHASE 0 — TERMINAL SHELL · EDITOR LANDS IN PHASE 1
        </span>
      </div>

      {/* Phase roadmap */}
      <div className="mt-4 flex gap-2 font-mono text-[10px]">
        {[
          { label: "SHELL", done: true },
          { label: "EDITOR", done: false },
          { label: "FORENSICS", done: false },
          { label: "VERDICT", done: false },
        ].map((s) => (
          <span
            key={s.label}
            className={`rounded px-2 py-1 tracking-widest ${
              s.done
                ? "bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/30"
                : "bg-[var(--bg-1)] text-[var(--text-3)] border border-[var(--border)]"
            }`}
          >
            {s.done ? "●" : "○"} {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Evidence bag (Phase 0 placeholder — no real photos yet) ── */
function EvidenceState({
  index,
  onOpenTerminal,
}: {
  index: number;
  onOpenTerminal: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Evidence header */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-bold tracking-tight text-[var(--text-1)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            EVIDENCE 06-A
          </h2>
          <p className="font-mono text-xs text-[var(--text-2)]">
            CORNER STORE — 02:14 AM — CHAIN OF CUSTODY: INTACT
          </p>
        </div>
        <span className="rounded bg-[var(--danger)]/10 px-2 py-1 font-mono text-xs font-bold text-[var(--danger)] border border-[var(--danger)]/20">
          ● 2 FLAGS
        </span>
      </div>

      {/* Evidence bag card */}
      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-1)]">
        {/* Scanline overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20,240,184,1) 2px, rgba(20,240,184,1) 3px)",
          }}
        />

        {/* Placeholder evidence image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg-2)]">
          {/* CCTV grain placeholder */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-[var(--bg-2)] to-[var(--bg-1)]">
            <div className="rounded bg-[var(--bg-3)] px-3 py-1 font-mono text-xs tracking-widest text-[var(--text-3)]">
              ● REC 02:14:33 — CAM 04
            </div>
            <p className="font-mono text-xs text-[var(--text-3)]">
              Evidence photo loads in Phase 1
            </p>
            <p className="font-mono text-[10px] text-[var(--text-3)]">
              {index + 1} / 3 — bundled base64, no network
            </p>
          </div>

          {/* Flag badges */}
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
            <span className="rounded bg-[var(--danger)] px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-white shadow-lg">
              ● FACE DETECTED
            </span>
            <span className="rounded bg-[var(--danger)] px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-white shadow-lg">
              ● PLATE LEON 06 DETECTED
            </span>
          </div>

          {/* Timestamp */}
          <div className="absolute bottom-3 right-3 z-10 rounded bg-black/60 px-2 py-1 font-mono text-[10px] tracking-widest text-white/80 backdrop-blur">
            2026-09-14 02:14:33 — LEONIDA-06-A
          </div>
        </div>

        {/* Action bar */}
        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-1)] px-4 py-3">
          <span className="font-mono text-xs text-[var(--text-2)]">
            TAMPER COUNT: 0 EDITS — NO CHANGES
          </span>
          <button
            onClick={onOpenTerminal}
            className="rounded bg-[var(--accent)] px-5 py-2 font-mono text-xs font-bold tracking-widest text-[var(--bg-0)] transition hover:bg-[var(--accent-dim)] hover:shadow-[0_0_16px_var(--accent-glow)]"
          >
            OPEN FORENSICS TERMINAL →
          </button>
        </div>
      </div>

      <p className="text-center font-mono text-[11px] text-[var(--text-3)]">
        Phase 0 — shell only. The React Image Editor mounts here in Phase 1.
      </p>
    </div>
  );
}

/* ── Terminal placeholder ── */
function TerminalState({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <button
        onClick={onBack}
        className="self-start font-mono text-xs tracking-widest text-[var(--text-2)] hover:text-[var(--text-1)]"
      >
        ← BACK TO EVIDENCE
      </button>

      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-1)]/50 p-8 text-center">
        <div className="rounded bg-[var(--bg-2)] px-3 py-1 font-mono text-xs tracking-widest text-[var(--accent)]">
          FORENSICS TERMINAL
        </div>
        <h3
          className="mt-4 text-lg font-bold text-[var(--text-1)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          IMAGE FORENSICS TERMINAL
        </h3>
        <p className="mt-2 max-w-sm font-mono text-xs leading-relaxed text-[var(--text-2)]">
          React Image Editor mounts here in Phase 1.
          <br />
          Tools: crop · filter · draw · text · shapes · stickers · frame · corners
        </p>
        <div className="mt-6 flex gap-2 font-mono text-[10px]">
          {["CROP", "DRAW", "FILTER", "STICKER", "TEXT", "SHAPES", "FRAME"].map(
            (t) => (
              <span
                key={t}
                className="rounded bg-[var(--bg-2)] px-2 py-1 tracking-widest text-[var(--text-3)] border border-[var(--border)]"
              >
                {t}
              </span>
            )
          )}
        </div>
        <p className="mt-6 font-mono text-[10px] tracking-widest text-[var(--text-3)]">
          onSave → scorer → verdict → poster
        </p>
      </div>
    </div>
  );
}
