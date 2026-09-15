"use client";

import { useState, useCallback, useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EVIDENCE } from "@/lib/evidence";
import { scoreForensics, type ScoreResult } from "@/lib/scorer";
import { generatePoster } from "@/lib/poster";
import { ForensicsTerminal } from "@/components/ForensicsTerminal";
import { VerdictStamp } from "@/components/VerdictStamp";
import { ScanReport } from "@/components/ScanReport";

type GamePhase = "landing" | "evidence" | "terminal" | "scanning" | "verdict" | "complete";

type GameState = {
  evidenceIndex: number;
  phase: GamePhase;
  editedDataUrl: string | null;
  score: ScoreResult | null;
  posterUrl: string | null;
  posters: string[];
};

// "CASE 06-A — CORNER STORE" → { id: "06-A", name: "CORNER STORE" }
function splitLabel(label: string, id: string) {
  const name = label.includes("—") ? label.split("—").slice(1).join("—").trim() : label;
  const short = label.replace(/^CASE\s*/i, "").split("—")[0].trim();
  return { court: short || id, name };
}

export default function Home() {
  const [state, setState] = useState<GameState>({
    evidenceIndex: 0,
    phase: "landing",
    editedDataUrl: null,
    score: null,
    posterUrl: null,
    posters: [],
  });

  const evidence = EVIDENCE[state.evidenceIndex];
  const isLast = state.evidenceIndex === EVIDENCE.length - 1;
  const cleared = state.posters.length;

  const handleEnter = useCallback(() => setState((s) => ({ ...s, phase: "evidence" })), []);
  const handleOpenTerminal = useCallback(
    () => setState((s) => ({ ...s, phase: "terminal", score: null, posterUrl: null })),
    []
  );
  const handleBack = useCallback(() => setState((s) => ({ ...s, phase: "evidence" })), []);

  const handleSubmit = useCallback(
    async (dataUrl: string) => {
      setState((s) => ({ ...s, phase: "scanning", editedDataUrl: dataUrl }));
      await new Promise((r) => setTimeout(r, 2200));
      const ev = EVIDENCE[state.evidenceIndex];
      let result: ScoreResult;
      try {
        result = await scoreForensics(ev.originalDataUrl, dataUrl, ev);
      } catch {
        result = {
          regions: [
            { region: "face", obscuredPercent: 0, passed: false },
            { region: "plate", obscuredPercent: 0, passed: false },
          ],
          tamperScore: 0,
          verdict: "BUSTED",
        };
      }
      let posterUrl: string | null = null;
      if (result.verdict === "DISMISSED") {
        try {
          posterUrl = await generatePoster(dataUrl, {
            caseLabel: ev.id,
            score: result.tamperScore,
            dismissed: true,
          });
        } catch {}
      }
      setState((s) => ({
        ...s,
        phase: "verdict",
        score: result,
        posterUrl,
        posters: posterUrl ? [...s.posters, posterUrl] : s.posters,
      }));
    },
    [state.evidenceIndex]
  );

  const handleNext = useCallback(() => {
    if (isLast) setState((s) => ({ ...s, phase: "complete" }));
    else
      setState((s) => ({
        ...s,
        evidenceIndex: s.evidenceIndex + 1,
        phase: "evidence",
        editedDataUrl: null,
        score: null,
        posterUrl: null,
      }));
  }, [isLast]);

  const handleRetry = useCallback(
    () => setState((s) => ({ ...s, phase: "terminal", score: null, posterUrl: null })),
    []
  );
  const handleRestart = useCallback(
    () =>
      setState({
        evidenceIndex: 0,
        phase: "landing",
        editedDataUrl: null,
        score: null,
        posterUrl: null,
        posters: [],
      }),
    []
  );

  return (
    <>
      {/* Sits below the grain layer, which is below the work itself. */}
      <div className="backdrop" aria-hidden />

      <div className="relative z-[2] flex min-h-screen flex-col">
        <Letterhead onRestart={handleRestart} cleared={cleared} />

      <div className="mx-auto grid w-full max-w-[1440px] flex-1 grid-cols-1 gap-0 px-4 sm:px-6 lg:grid-cols-[290px_1fr] lg:gap-8 lg:py-8">
        <DocketRail
          index={state.evidenceIndex}
          phase={state.phase}
          cleared={cleared}
          onJump={(i) => setState((s) => ({ ...s, evidenceIndex: i, phase: "evidence" }))}
        />

        <main className="min-w-0 pb-14 lg:pb-0">
          <AnimatePresence mode="wait" initial={false}>
            {state.phase === "landing" && (
              <Phase key="landing">
                <CaseFile onEnter={handleEnter} cleared={cleared} onRestart={handleRestart} />
              </Phase>
            )}

            {state.phase === "evidence" && (
              <Phase key={`evidence-${state.evidenceIndex}`}>
                <ExhibitFolder
                  evidence={evidence}
                  index={state.evidenceIndex}
                  total={EVIDENCE.length}
                  onOpen={handleOpenTerminal}
                />
              </Phase>
            )}

            {state.phase === "terminal" && (
              <Phase key={`terminal-${state.evidenceIndex}`}>
                <div className="flex flex-col gap-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h2 className="stamp-type text-[19px] text-[var(--folder)]">
                      Altering exhibit {splitLabel(evidence.label, evidence.id).court}
                    </h2>
                    <button onClick={handleBack} className="btn" type="button">
                      Close terminal
                    </button>
                  </div>
                  <ForensicsTerminal
                    image={evidence.imageBase64}
                    onSubmit={handleSubmit}
                    onCancel={handleBack}
                  />
                </div>
              </Phase>
            )}

            {state.phase === "scanning" && (
              <Phase key={`scanning-${state.evidenceIndex}`}>
                <RedactionSweep evidence={evidence} editedUrl={state.editedDataUrl} />
              </Phase>
            )}

            {state.phase === "verdict" && state.score && (
              <Phase key={`verdict-${state.evidenceIndex}`}>
                <div className="flex flex-col gap-5">
                  <VerdictStamp
                    verdict={state.score.verdict}
                    score={state.score}
                    onNext={handleNext}
                    onRetry={handleRetry}
                    isLast={isLast}
                  />
                  <ScanReport score={state.score} evidenceId={evidence.id} />
                  {state.posterUrl && (
                    <PosterSheet posterUrl={state.posterUrl} caseId={evidence.id} />
                  )}
                </div>
              </Phase>
            )}

            {state.phase === "complete" && (
              <Phase key="complete">
                <CaseClosed posters={state.posters} onRestart={handleRestart} />
              </Phase>
            )}
          </AnimatePresence>
        </main>
      </div>

        <Colophon />
      </div>
    </>
  );
}

// ── Phase wrapper: one quiet transition, no per-section fade-ups ──
function Phase({ children }: { children: React.ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

// ── Letterhead ─────────────────────────────────────────────────
function Letterhead({ onRestart, cleared }: { onRestart: () => void; cleared: number }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--desk-edge)] bg-[var(--desk)]/72 backdrop-blur-[6px]">
      <div className="vice-kerb" />
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <button
          onClick={onRestart}
          type="button"
          className="flex items-baseline gap-3 text-left"
          aria-label="Leonida Police Department, Property and Evidence. Return to start."
        >
          <span
            className="stamp-type text-[22px] text-[var(--folder)] sm:text-[26px]"
            aria-hidden
          >
            LPD
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="field block text-[var(--on-desk-muted)]">
              Leonida Police Department
            </span>
            <span className="field block text-[var(--on-desk-faint)]">
              Property &amp; Evidence Division
            </span>
          </span>
        </button>

        <div className="ml-auto flex flex-wrap items-center gap-x-6 gap-y-1">
          <span className="flex items-baseline gap-2">
            <span className="field text-[var(--on-desk-faint)]">Case</span>
            <span className="ledger text-[15px] text-[var(--folder)]">06</span>
          </span>
          <span className="flex items-baseline gap-2">
            <span className="field text-[var(--on-desk-faint)]">Cleared</span>
            <span
              className={`ledger text-[15px] ${
                cleared === EVIDENCE.length ? "text-[var(--clear)]" : "text-[var(--on-desk)]"
              }`}
            >
              {cleared}/{EVIDENCE.length}
            </span>
          </span>
          <StationClock />
        </div>
      </div>
    </header>
  );
}

function StationClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () =>
      setT(new Date().toLocaleTimeString("en-GB", { hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="hidden items-baseline gap-2 sm:flex">
      <span className="field text-[var(--on-desk-faint)]">Logged</span>
      <span className="ledger text-[15px] text-[var(--on-desk-muted)]">
        {t || "--:--:--"}
      </span>
    </span>
  );
}

// ── Docket rail ────────────────────────────────────────────────
function DocketRail({
  index,
  phase,
  cleared,
  onJump,
}: {
  index: number;
  phase: GamePhase;
  cleared: number;
  onJump: (i: number) => void;
}) {
  const live = phase !== "landing" && phase !== "complete";

  return (
    <aside className="border-b border-[var(--desk-edge)] lg:sticky lg:top-[73px] lg:self-start lg:border-b-0 lg:pt-8">
      <p className="field px-3 pt-4 text-[var(--on-desk-faint)] lg:pt-0">
        Docket — exhibits filed
      </p>

      <div className="mt-2 flex gap-0 overflow-x-auto lg:block lg:overflow-visible">
        {EVIDENCE.map((ev, i) => {
          const done = cleared > i;
          const active = live && index === i;
          const { court, name } = splitLabel(ev.label, ev.id);
          return (
            <button
              key={ev.id}
              type="button"
              onClick={() => onJump(i)}
              className={`docket shrink-0 lg:w-full ${active ? "docket-active" : ""}`}
              aria-current={active ? "true" : undefined}
            >
              <span className="field w-[52px] shrink-0 text-[var(--on-desk-faint)]">
                {court}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block truncate text-[13px] ${
                    active ? "text-[var(--on-desk)]" : "text-[var(--on-desk-muted)]"
                  }`}
                >
                  {name}
                </span>
                <span className="mt-0.5 flex flex-wrap gap-x-2">
                  {ev.flags.map((f) => (
                    <span key={f} className="field text-[var(--stamp)]">
                      {f.replace(" DETECTED", "")}
                    </span>
                  ))}
                </span>
              </span>
              <span
                className="field shrink-0"
                style={{
                  color: done
                    ? "var(--clear)"
                    : active
                      ? "var(--folder)"
                      : "var(--on-desk-faint)",
                }}
              >
                {done ? "Clrd" : active ? "Open" : "Pend"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Chain of custody */}
      <div className="mt-5 hidden border border-[var(--desk-edge)] p-4 lg:block">
        <p className="field text-[var(--on-desk-faint)]">Chain of custody</p>
        <div className="mt-3 space-y-2">
          {[
            ["Received", "02:31"],
            ["Examiner", "Det. R. Ibarra"],
            ["Storage", "Rack 12 · Bay 4"],
          ].map(([k, v]) => (
            <div key={k} className="flex items-baseline gap-2">
              <span className="field text-[var(--on-desk-faint)]">{k}</span>
              <span className="rule" />
              <span className="text-[12px] text-[var(--on-desk-muted)]">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── Landing: the case file ─────────────────────────────────────
function CaseFile({
  onEnter,
  cleared,
  onRestart,
}: {
  onEnter: () => void;
  cleared: number;
  onRestart: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="folder folder-tab mt-6 pt-9 lg:mt-8"
    >
      <div className="grid grid-cols-1 gap-6 p-5 sm:p-7 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
        {/* Typed cover sheet */}
        <div className="pt-2">
          <p className="field text-[var(--folder-ink)]">Case file</p>
          <h1 className="stamp-type mt-2 text-[38px] leading-[0.88] text-[var(--desk)] sm:text-[54px]">
            Case 06
            <br />
            Evidence
            <br />
            Locker
          </h1>

          <div className="mt-6 max-w-[54ch] space-y-2.5">
            {[
              ["Subject", "Unidentified — one male"],
              ["Offence", "Armed robbery, corner store"],
              ["Exhibits", "Three surveillance stills"],
              ["Status", "Open — exhibits intact"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-baseline gap-3">
                <span className="field w-[76px] shrink-0 text-[var(--folder-ink)]">
                  {k}
                </span>
                <span className="rule" style={{ borderColor: "var(--folder-line)" }} />
                <span className="text-[13px] font-bold text-[var(--desk)]">{v}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[var(--folder-line)] pt-4">
            <p className="field text-[var(--folder-ink)]">Examiner note</p>
            <p className="hand mt-2 max-w-[50ch] text-[14px] leading-[1.7] text-[var(--desk)]">
              &ldquo;Each still carries a readable face and a plate. Alter the exhibits
              until forensics can&rsquo;t match either one, and this case falls apart
              on its own.&rdquo;
            </p>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <button onClick={onEnter} className="btn btn-solid" type="button">
              Open exhibit 06-A
            </button>
            {cleared > 0 && (
              <button onClick={onRestart} className="btn" type="button">
                Start over
              </button>
            )}
          </div>
        </div>

        {/* Scene photo, taped to the file */}
        <div className="relative">
          <div className="relative rotate-[1.4deg] border border-[var(--folder-deep)] bg-[var(--exhibit)] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.5)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/gta6-cover.jpg"
              alt="Scene photograph, Leonida, 02:14"
              className="block h-auto w-full"
            />
            <p className="pt-2 pb-0.5 text-center text-[10px] tracking-[0.14em] text-[#7d7a72] uppercase">
              Scene photo — Leonida, 02:14
            </p>
          </div>

          {/* Tape at two corners */}
          <span
            className="tape-band absolute -top-3 left-6 h-6 w-24 -rotate-[6deg] shadow-sm"
            aria-hidden
          />
          <span
            className="tape-band absolute -bottom-3 right-6 h-6 w-24 rotate-[5deg] shadow-sm"
            aria-hidden
          />
        </div>
      </div>

      {/* Procedure, typed into the file rather than posed as feature cards */}
      <div className="border-t border-[var(--folder-line)] bg-[var(--folder-lit)]/45 px-5 py-4 sm:px-7">
        <p className="field text-[var(--folder-ink)]">Procedure</p>
        <ol className="mt-2.5 space-y-1.5">
          {[
            "Mount the exhibit in the forensics terminal.",
            "Alter it — frame, mark, annotate or redact over the flagged zones.",
            "Submit. Forensics needs 70% of every flagged zone obscured.",
          ].map((step, i) => (
            <li key={step} className="flex gap-3 text-[13px] leading-[1.6] text-[var(--desk)]">
              <span className="ledger shrink-0 text-[var(--folder-ink)]">
                {i + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </motion.div>
  );
}

// ── Evidence: the mounted exhibit ──────────────────────────────
function ExhibitFolder({
  evidence,
  index,
  total,
  onOpen,
}: {
  evidence: (typeof EVIDENCE)[number];
  index: number;
  total: number;
  onOpen: () => void;
}) {
  const { court, name } = splitLabel(evidence.label, evidence.id);

  return (
    <div className="flex flex-col gap-5 pt-2 lg:pt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field text-[var(--on-desk-faint)]">
            Exhibit {court} — {index + 1} of {total}
          </p>
          <h2 className="stamp-type mt-2 text-[30px] text-[var(--folder)] sm:text-[40px]">
            {name}
          </h2>
          <p className="mt-2 max-w-[56ch] text-[13px] text-[var(--on-desk-muted)]">
            {evidence.subtitle}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="field text-[var(--on-desk-faint)]">Flags on this still</span>
          <span className="stamp stamp-red rotate-[-3deg] text-[13px]">
            {evidence.flags.length} flagged
          </span>
        </div>
      </div>

      <div className="folder folder-tab pt-9">
        <div className="p-4 sm:p-6">
          <div className="relative border border-[var(--folder-deep)] bg-[var(--exhibit)] p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={evidence.imageBase64}
              alt={evidence.label}
              className="block h-auto w-full"
            />

            {/* Flagged zones, marked on the still itself */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {evidence.flags.map((f) => (
                <span key={f} className="stamp stamp-red bg-[var(--desk)]/70 text-[11px] backdrop-blur-[2px]">
                  {f}
                </span>
              ))}
            </div>

            <span className="ledger absolute right-4 bottom-4 bg-[var(--desk)]/75 px-2 py-1 text-[11px] text-[var(--folder-lit)]">
              {evidence.id}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-[46ch] text-[12.5px] text-[var(--folder-ink)]">
              Open the forensics terminal to mount and alter this exhibit.
            </p>
            <button onClick={onOpen} className="btn btn-solid" type="button">
              Open forensics terminal
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className="h-[3px] transition-all"
            style={{
              width: i === index ? 34 : 18,
              background:
                i === index
                  ? "var(--folder)"
                  : i < index
                    ? "var(--folder-deep)"
                    : "var(--desk-edge)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Scanning: the redaction ────────────────────────────────────
function RedactionSweep({
  evidence,
  editedUrl,
}: {
  evidence: (typeof EVIDENCE)[number];
  editedUrl: string | null;
}) {
  const reduced = useReducedMotion();

  return (
    <div className="flex flex-col gap-5 pt-2 lg:pt-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="field text-[var(--on-desk-faint)]">Submitted for analysis</p>
          <h2 className="stamp-type mt-2 text-[30px] text-[var(--folder)] sm:text-[38px]">
            Running forensics
          </h2>
        </div>
        <span className="field text-[var(--on-desk-muted)]">
          Reading pixels <span className="caret">_</span>
        </span>
      </div>

      <div className="folder folder-tab pt-9">
        <div className="p-4 sm:p-6">
          <div className="relative overflow-hidden border border-[var(--folder-deep)] bg-[var(--exhibit)] p-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={editedUrl ?? evidence.imageBase64}
              alt="Exhibit submitted for analysis"
              className="block h-auto w-full"
            />

            {/* The tape bar wipes across, redacting as it passes */}
            <motion.div
              className="pointer-events-none absolute inset-y-0 w-[38%]"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(20,18,14,0.9), rgba(20,18,14,0.98))",
                mixBlendMode: "multiply",
              }}
              initial={reduced ? { left: "0%" } : { left: "-40%" }}
              animate={reduced ? { left: "0%" } : { left: "100%" }}
              transition={{ duration: 1.9, ease: "linear", repeat: reduced ? 0 : Infinity }}
            />

            {/* Redaction bars settle over the flagged zones */}
            {evidence.flags.map((_, i) => (
              <motion.span
                key={i}
                className="tape absolute left-[6%] h-[9%] w-[26%]"
                style={{ top: `${20 + i * 26}%` }}
                initial={{ clipPath: "inset(0 100% 0 0)" }}
                animate={{ clipPath: "inset(0 0% 0 0)" }}
                transition={{ duration: 0.7, delay: 0.6 + i * 0.28, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
              />
            ))}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {["Matching face", "Matching plate", "Checking layer integrity"].map(
              (label, i) => (
                <motion.div
                  key={label}
                  className="flex items-baseline gap-2"
                  initial={{ opacity: 0.35 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.5 + i * 0.45 }}
                >
                  <span className="field text-[var(--folder-ink)]">›</span>
                  <span className="text-[12.5px] text-[var(--desk)]">{label}</span>
                </motion.div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Poster sheet ───────────────────────────────────────────────
function PosterSheet({ posterUrl, caseId }: { posterUrl: string; caseId: string }) {
  return (
    <div className="border border-[var(--clear)] bg-[var(--desk-deep)]">
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-[var(--clear)] px-4 py-3">
        <span className="field text-[var(--clear)]">Dismissal notice issued</span>
        <span className="ledger text-[12px] text-[var(--on-desk-muted)]">
          1080 × 1350
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mx-auto max-w-[400px] border border-[var(--desk-edge)] bg-[var(--exhibit)] p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterUrl}
            alt={`Dismissal notice for exhibit ${caseId}`}
            className="block h-auto w-full"
          />
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <a
            href={posterUrl}
            download={`leonida-${caseId.toLowerCase()}-dismissal.png`}
            className="btn btn-clear flex-1"
          >
            Download notice
          </a>
          <button
            type="button"
            className="btn flex-1"
            onClick={async () => {
              try {
                const blob = await (await fetch(posterUrl)).blob();
                const file = new File([blob], `leonida-${caseId}.png`, {
                  type: "image/png",
                });
                if (navigator.canShare?.({ files: [file] })) {
                  await navigator.share({
                    files: [file],
                    title: `Leonida PD — ${caseId} dismissed`,
                    text: "Altered the exhibit until forensics lost the match. #BuiltWithImageEditor @unlayer",
                  });
                  return;
                }
              } catch {}
              try {
                await navigator.clipboard.writeText(window.location.href);
              } catch {}
            }}
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Complete ───────────────────────────────────────────────────
function CaseClosed({
  posters,
  onRestart,
}: {
  posters: string[];
  onRestart: () => void;
}) {
  const allDone = posters.length === EVIDENCE.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-7 pt-4 lg:pt-0"
    >
      <div className="flex flex-col items-start gap-4">
        <span
          className={`stamp text-[16px] sm:text-[19px] ${
            allDone ? "stamp-green" : "stamp-red"
          }`}
        >
          {allDone ? "Case dismissed" : "Case remains open"}
        </span>

        <h2 className="stamp-type max-w-[20ch] text-[40px] leading-[0.9] text-[var(--folder)] sm:text-[62px]">
          {allDone
            ? "Three exhibits, no matches."
            : `${posters.length} of ${EVIDENCE.length} exhibits altered.`}
        </h2>

        <p className="max-w-[58ch] text-[13.5px] leading-[1.75] text-[var(--on-desk-muted)]">
          {allDone
            ? "Forensics failed to match a single flagged region across the whole file. The dismissal notices are yours to keep."
            : "Some exhibits still read. Reopen a flagged exhibit and obscure the region forensics caught."}
        </p>
      </div>

      {posters.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {posters.map((url, i) => (
            <div key={i} className="border border-[var(--desk-edge)] bg-[var(--desk-deep)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Dismissal notice ${i + 1}`}
                className="block h-auto w-full border-b border-[var(--desk-edge)]"
              />
              <div className="p-2.5">
                <a
                  href={url}
                  download={`leonida-notice-${i + 1}.png`}
                  className="btn w-full"
                >
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[var(--desk-edge)] px-5 py-8">
          <p className="text-[13px] text-[var(--on-desk-muted)]">
            No dismissal notices yet. Alter an exhibit and submit it to forensics.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={onRestart} className="btn btn-solid" type="button">
          Reopen case 06
        </button>
        <a
          href="https://github.com/JUICEWRLD998/leonida"
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          Source on GitHub
        </a>
      </div>
    </motion.div>
  );
}

// ── Colophon ───────────────────────────────────────────────────
function Colophon() {
  return (
    <footer className="border-t border-[var(--desk-edge)]">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-baseline justify-between gap-x-6 gap-y-2 px-4 py-5 sm:px-6">
        <p className="field text-[var(--on-desk-faint)]">
          Built with React Image Editor · #BuiltWithImageEditor
        </p>
        <p className="field text-[var(--on-desk-faint)]">
          A work of fiction. Not affiliated with Rockstar Games.
        </p>
      </div>
    </footer>
  );
}
