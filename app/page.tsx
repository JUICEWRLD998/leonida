"use client";

import { useState, useCallback } from "react";
import { EVIDENCE } from "@/lib/evidence";
import { scoreForensics, type ScoreResult } from "@/lib/scorer";
import { generatePoster } from "@/lib/poster";
import { ForensicsTerminal } from "@/components/ForensicsTerminal";
import { ForensicSweep } from "@/components/ForensicSweep";
import { VerdictScreen } from "@/components/VerdictScreen";

// ── State ──────────────────────────────────────────────────────────
type GamePhase = "landing" | "evidence" | "terminal" | "scanning" | "verdict" | "complete";

type GameState = {
  evidenceIndex: number;
  phase: GamePhase;
  editedDataUrl: string | null;
  score: ScoreResult | null;
  posterUrl: string | null;
  posters: string[];
};

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

  const handleEnter = useCallback(() => setState((s) => ({ ...s, phase: "evidence" })), []);
  const handleOpenTerminal = useCallback(
    () => setState((s) => ({ ...s, phase: "terminal", score: null, posterUrl: null })),
    []
  );
  const handleBack = useCallback(() => setState((s) => ({ ...s, phase: "evidence" })), []);

  const handleSubmit = useCallback(
    async (dataUrl: string) => {
      setState((s) => ({ ...s, phase: "scanning", editedDataUrl: dataUrl }));
      await new Promise((r) => setTimeout(r, 1200));
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

  const handleRetry = useCallback(() => setState((s) => ({ ...s, phase: "terminal", score: null })), []);
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
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      {/* ═══ NAV ═══ */}
      <nav className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[56px] max-w-[1120px] items-center justify-between gap-4 px-5 sm:px-8">
          <button onClick={handleRestart} className="flex items-center gap-3 text-left">
            <div className="grid h-8 w-8 place-items-center rounded-[9px] bg-[var(--accent)] text-[11px] font-bold tracking-widest text-[var(--on-accent)] shadow-[0_2px_0_rgba(232,72,20,0.12)]">
              L
            </div>
            <div className="leading-none">
              <p className="text-[13px] font-semibold tracking-[-0.35px] text-[var(--ink)]">Leonida</p>
              <p className="micro text-[var(--muted)]">Evidence Locker</p>
            </div>
          </button>

          {/* Center — progress pills (desktop) */}
          <div className="hidden items-center gap-2 sm:flex">
            {EVIDENCE.map((ev, i) => {
              const done = state.posters.length > i;
              const active = state.evidenceIndex === i && state.phase !== "landing" && state.phase !== "complete";
              return (
                <div
                  key={ev.id}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    done
                      ? "border-[var(--success-line)] bg-[var(--success-soft)] text-[var(--success)]"
                      : active
                        ? "border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)]"
                        : "border-[var(--line)] bg-transparent text-[var(--faint)]"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${done ? "bg-[var(--success)]" : active ? "bg-[var(--accent)] animate-[pulse-dot_1.2s_ease-in-out_infinite]" : "bg-[var(--line-strong)]"}`}
                  />
                  <span className="hidden text-[11px] font-medium tracking-[-0.15px] lg:inline">{ev.id}</span>
                  <span className="text-[11px] font-medium lg:hidden">{i + 1}</span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 font-mono text-[10px] tracking-widest text-[var(--muted)] sm:inline">
              CASE LEONIDA
            </span>
            <span className="rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-semibold tracking-[-0.2px] text-[var(--paper)]">
              {state.posters.length} / {EVIDENCE.length} dismissed
            </span>
          </div>
        </div>
      </nav>

      {/* ═══ MAIN ═══ */}
      <main className="mx-auto flex w-full max-w-[1120px] flex-1 flex-col px-5 py-6 sm:px-8 sm:py-8">
        {state.phase === "landing" && <Landing onEnter={handleEnter} posters={state.posters.length} />}
        {state.phase === "evidence" && (
          <EvidenceView evidence={evidence} index={state.evidenceIndex} total={EVIDENCE.length} onOpen={handleOpenTerminal} />
        )}
        {state.phase === "terminal" && (
          <div className="flex flex-col gap-4">
            <button onClick={handleBack} className="self-start rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--muted)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]">
              ← Back to evidence
            </button>
            <ForensicsTerminal image={evidence.imageBase64} onSubmit={handleSubmit} />
          </div>
        )}
        {state.phase === "scanning" && (
          <div className="flex flex-col gap-5">
            <EvidencePreview evidence={evidence} editedUrl={state.editedDataUrl} />
            <ForensicSweep scanning score={null} />
          </div>
        )}
        {state.phase === "verdict" && state.score && (
          <div className="flex flex-col gap-5">
            <EvidencePreview evidence={evidence} editedUrl={state.editedDataUrl} />
            <ForensicSweep scanning={false} score={state.score} />
            <VerdictScreen verdict={state.score.verdict} score={state.score} onNext={handleNext} onRetry={handleRetry} isLast={isLast} />
            {state.posterUrl && <PosterCard posterUrl={state.posterUrl} caseLabel={evidence.id} />}
          </div>
        )}
        {state.phase === "complete" && <Complete posters={state.posters} onRestart={handleRestart} />}
      </main>

      <footer className="border-t border-[var(--line)] py-5 text-center">
        <p className="micro tracking-[0.5px] text-[var(--faint)]">Leonida Police Dept. — Forensics Division — Built with React Image Editor</p>
        <p className="micro mt-1 text-[7px] tracking-[0.4px] text-[var(--faint)] opacity-60">GTA VI inspired — not affiliated with Rockstar Games — #BuiltWithImageEditor</p>
      </footer>
    </div>
  );
}

// ── Landing ────────────────────────────────────────────────────
function Landing({ onEnter, posters }: { onEnter: () => void; posters: number }) {
  return (
    <div className="flex flex-1 flex-col gap-8">
      {/* Hero — real GTA VI cover */}
      <div className="relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-raised)]">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/gta6-cover.jpg" alt="Grand Theft Auto VI — Leonida" className="h-[360px] w-full object-cover object-top sm:h-[460px]" />
          {/* Warm gradient so text stays legible */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a14] via-[#0c0a14]/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0c0a14]/70 via-transparent to-transparent" />

          {/* Eyebrow */}
          <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 backdrop-blur-md sm:left-7 sm:top-6">
            <span className="h-2 w-2 animate-[pulse-dot_1.4s_ease-in-out_infinite] rounded-full bg-[var(--danger)] shadow-[0_0_8px_var(--danger)]" />
            <span className="micro text-white/90">Case Leonida — 3 items pending</span>
          </div>

          {/* Title lockup */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
            <p className="micro tracking-[0.3em] text-white/60">Vice City — Leonida — 02:14 AM</p>
            <h1 className="gta-stencil mt-2 text-[56px] text-white sm:text-[84px]" style={{ textShadow: "0 2px 32px rgba(0,0,0,0.9), 0 0 48px rgba(255,107,53,0.25)" }}>
              LEONIDA
            </h1>
            <p className="gta-stencil -mt-1 text-[22px] tracking-[0.22em] text-white/90 sm:text-[28px]">EVIDENCE LOCKER</p>
            <p className="mt-3 max-w-[520px] text-[13px] leading-[1.7] tracking-[-0.15px] text-white/65">
              Three surveillance photos. Two incriminating details each. Doctor the evidence before forensics closes the case — crop, redact, blur, and deceive.
            </p>
          </div>

          {/* Rockstar credit — tiny, honest */}
          <span className="micro absolute bottom-3 right-4 hidden text-[7px] text-white/35 sm:inline">Cover: Rockstar Games — GTA VI</span>
        </div>

        {/* CTA bar under image */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] bg-[var(--paper-soft)] px-6 py-4 sm:px-7">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { k: "Built with", v: "React Image Editor" },
              { k: "Mode", v: "Forensic evasion" },
              { k: "Time", v: "~3 min" },
            ].map((s) => (
              <span key={s.k} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1">
                <span className="micro text-[var(--faint)]">{s.k}</span>
                <span className="text-xs font-medium tracking-[-0.15px] text-[var(--ink)]">{s.v}</span>
              </span>
            ))}
          </div>
          <button
            onClick={onEnter}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-semibold tracking-[-0.2px] text-[var(--on-accent)] shadow-[0_2px_0_rgba(232,72,20,0.14)] transition-all hover:translate-y-[-1px] hover:bg-[var(--accent-hover)] hover:shadow-[0_5px_16px_rgba(255,107,53,0.22)] active:translate-y-0"
          >
            Enter evidence locker
            <span aria-hidden>→</span>
          </button>
        </div>
      </div>

      {/* How it works — 3 editorial cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            n: "01",
            title: "Evidence in",
            desc: "A CCTV still with flagged face + plate. You know exactly what to hide.",
            tone: "peach" as const,
          },
          {
            n: "02",
            title: "Tamper",
            desc: "Crop, draw, filter, sticker — the editor is the weapon. No edit = busted.",
            tone: "blue" as const,
          },
          {
            n: "03",
            title: "Beat forensics",
            desc: "Deterministic pixel scan. 70% obscured in every flagged zone = dismissed.",
            tone: "green" as const,
          },
        ].map((s) => (
          <div key={s.n} className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 transition-colors hover:border-[var(--line-strong)]">
            <div className={`absolute left-0 top-0 h-1 w-full ${s.tone === "peach" ? "bg-[#f2bc95]" : s.tone === "blue" ? "bg-[#b8d4da]" : "bg-[#c8d8b8]"}`} />
            <span className="micro text-[var(--faint)]">{s.n}</span>
            <h3 className="mt-2 text-[17px] font-semibold tracking-[-0.4px] text-[var(--ink)]">{s.title}</h3>
            <p className="mt-1.5 text-[13px] leading-[1.65] tracking-[-0.15px] text-[var(--muted)]">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Tool chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {["Crop", "Draw", "Filter", "Sticker", "Text", "Shapes", "Frame", "Corners"].map((t) => (
          <span key={t} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-medium tracking-[-0.15px] text-[var(--muted)]">
            {t}
          </span>
        ))}
      </div>

      {posters > 0 && (
        <p className="text-center text-sm font-medium text-[var(--success)]">
          {posters} / 3 dismissed — continue where you left off or play again from the nav.
        </p>
      )}
    </div>
  );
}

// ── Evidence ───────────────────────────────────────────────────
function EvidenceView({
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
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="micro text-[var(--faint)]">
            Evidence {index + 1} / {total} — Chain of custody: intact
          </p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-[-0.6px] text-[var(--ink)]">{evidence.label}</h2>
          <p className="mt-1 text-sm leading-[1.6] tracking-[-0.15px] text-[var(--muted)]">{evidence.subtitle}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--danger-line)] bg-[var(--danger-soft)] px-3 py-1.5 text-xs font-semibold tracking-[-0.15px] text-[var(--danger)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--danger)]" />
          {evidence.flags.length} flags
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-[#0e1629]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={evidence.imageBase64} alt={evidence.label} className="h-full w-full object-cover" />
          {/* Subtle scanline */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.035]"
            style={{
              background: "repeating-linear-gradient(0deg, transparent, transparent 2px, #14F0B8 2px, #14F0B8 3px)",
            }}
          />
          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {evidence.flags.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-[var(--danger)] px-2.5 py-1 text-[10px] font-bold tracking-widest text-white shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {f}
              </span>
            ))}
          </div>
          <div className="absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[10px] tracking-widest text-white/80 backdrop-blur">
            {evidence.id} — REC 02:14:33
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[var(--paper-soft)] px-4 py-3 sm:px-5">
          <span className="micro text-[var(--faint)]">Open the terminal to tamper with this evidence</span>
          <button onClick={onOpen} className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold tracking-[-0.2px] text-[var(--on-accent)] shadow-[0_2px_0_rgba(232,72,20,0.12)] transition-all hover:translate-y-[-1px] hover:bg-[var(--accent-hover)] active:translate-y-0">
            Open forensics terminal →
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-1.5">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-[var(--accent)]" : i < index ? "w-5 bg-[var(--accent)]/35" : "w-5 bg-[var(--line)]"}`} />
        ))}
      </div>
    </div>
  );
}

function EvidencePreview({ evidence, editedUrl }: { evidence: (typeof EVIDENCE)[number]; editedUrl: string | null }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0e1629]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={editedUrl ?? evidence.imageBase64} alt="Edited evidence" className="h-full w-full object-cover" />
      </div>
      <div className="border-t border-[var(--line)] bg-[var(--paper-soft)] px-4 py-2.5">
        <span className="micro text-[var(--faint)]">{editedUrl ? "Edited — submitted to forensics" : evidence.id} — awaiting verdict</span>
      </div>
    </div>
  );
}

function PosterCard({ posterUrl, caseLabel }: { posterUrl: string; caseLabel: string }) {
  return (
    <div className="rounded-2xl border border-[var(--success-line)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold tracking-[-0.3px] text-[var(--ink)]">Poster — {caseLabel}</h3>
        <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 text-[10px] font-bold tracking-widest text-[var(--success)]">1080 × 1350</span>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--paper)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={posterUrl} alt={`Poster for ${caseLabel}`} className="mx-auto max-h-[520px] w-auto object-contain" />
      </div>
      <div className="mt-3 flex gap-2">
        <a href={posterUrl} download={`leonida-${caseLabel.toLowerCase()}-poster.png`} className="flex flex-1 items-center justify-center rounded-full bg-[var(--accent)] py-3 text-center text-sm font-semibold tracking-[-0.2px] text-[var(--on-accent)] transition-colors hover:bg-[var(--accent-hover)]">
          Download poster
        </a>
        <button
          onClick={async () => {
            try {
              const blob = await (await fetch(posterUrl)).blob();
              const file = new File([blob], `leonida-${caseLabel}.png`, { type: "image/png" });
              if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                  files: [file],
                  title: `LEONIDA — ${caseLabel} dismissed`,
                  text: "Doctor the evidence. Beat the system. #BuiltWithImageEditor @unlayer",
                });
                return;
              }
            } catch {}
            try {
              await navigator.clipboard.writeText(window.location.href);
            } catch {}
          }}
          className="flex-1 rounded-full border border-[var(--line)] bg-[var(--surface)] py-3 text-center text-sm font-semibold tracking-[-0.2px] text-[var(--ink)] transition-colors hover:border-[var(--line-strong)]"
        >
          Share
        </button>
      </div>
      <p className="micro mt-2 text-center text-[var(--faint)]">Share with #BuiltWithImageEditor + @unlayer</p>
    </div>
  );
}

function Complete({ posters, onRestart }: { posters: string[]; onRestart: () => void }) {
  const allDone = posters.length === EVIDENCE.length;
  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-8 text-center">
      <div className={`rounded-full px-4 py-2 text-xs font-semibold tracking-[-0.2px] ${allDone ? "bg-[var(--success)] text-[#042a1e]" : "bg-[var(--warning)] text-[#1a1300]"}`}>
        {allDone ? "★ All cases dismissed — wanted level cleared ★" : `Case file closed — ${posters.length} / ${EVIDENCE.length} dismissed`}
      </div>
      <h2 className="display text-[32px] text-[var(--ink)] sm:text-[40px]">{allDone ? "You got away with it." : "Case file closed."}</h2>
      <p className="max-w-md text-sm leading-[1.65] tracking-[-0.15px] text-[var(--muted)]">
        {allDone ? "Forensics failed on every piece of evidence. The posters are yours." : "Some evidence still matched. Retry the busted cases or take what you earned."}
      </p>
      {posters.length > 0 ? (
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {posters.map((url, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`Poster ${i + 1}`} className="h-auto w-full object-contain" />
              <div className="border-t border-[var(--line)] p-2.5">
                <a href={url} download={`leonida-poster-${i + 1}.png`} className="block rounded-full bg-[var(--accent)] py-2.5 text-center text-sm font-semibold tracking-[-0.2px] text-[var(--on-accent)] hover:bg-[var(--accent-hover)]">
                  Download
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[var(--faint)]">No posters yet — dismiss at least one case.</p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={onRestart} className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold tracking-[-0.2px] text-[var(--ink)] hover:border-[var(--line-strong)]">
          Play again
        </button>
        <a href="https://github.com/JUICEWRLD998/leonida" target="_blank" rel="noopener noreferrer" className="rounded-full bg-[var(--surface)] px-6 py-3 text-sm font-semibold tracking-[-0.2px] text-[var(--ink)] ring-1 ring-[var(--line)] hover:bg-[var(--surface-raised)]">
          View on GitHub →
        </a>
      </div>
    </div>
  );
}
