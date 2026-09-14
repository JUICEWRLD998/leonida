"use client";

import { useState, useCallback, useEffect } from "react";
import { EVIDENCE } from "@/lib/evidence";
import { scoreForensics, type ScoreResult } from "@/lib/scorer";
import { generatePoster } from "@/lib/poster";
import { leonidaCoverDataUrl } from "@/lib/cover";
import { ForensicsTerminal } from "@/components/ForensicsTerminal";
import { ForensicSweep } from "@/components/ForensicSweep";
import { VerdictScreen } from "@/components/VerdictScreen";

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
  const coverUrl = leonidaCoverDataUrl();

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

  const handleEnter = useCallback(() => {
    setState((s) => ({ ...s, phase: "evidence" }));
  }, []);

  const handleOpenTerminal = useCallback(() => {
    setState((s) => ({ ...s, phase: "terminal", score: null, posterUrl: null }));
  }, []);

  const handleBackToEvidence = useCallback(() => {
    setState((s) => ({ ...s, phase: "evidence" }));
  }, []);

  const handleSubmit = useCallback(
    async (dataUrl: string, _blob: Blob) => {
      setState((s) => ({ ...s, phase: "scanning", editedDataUrl: dataUrl }));

      // Let the scanning animation show for a beat, then score
      await new Promise((r) => setTimeout(r, 1300));

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
        } catch {
          // poster is bonus — don't fail the verdict if it errors
        }
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

  const handleNextEvidence = useCallback(() => {
    if (isLast) {
      setState((s) => ({ ...s, phase: "complete" }));
    } else {
      setState((s) => ({
        ...s,
        evidenceIndex: s.evidenceIndex + 1,
        phase: "evidence",
        editedDataUrl: null,
        score: null,
        posterUrl: null,
      }));
    }
  }, [isLast]);

  const handleRetry = useCallback(() => {
    setState((s) => ({ ...s, phase: "terminal", score: null }));
  }, []);

  const handleRestart = useCallback(() => {
    setState({
      evidenceIndex: 0,
      phase: "landing",
      editedDataUrl: null,
      score: null,
      posterUrl: null,
      posters: [],
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ── Header ── */}
      <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg-1)]/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[1024px] items-center justify-between px-4 sm:px-6">
          <button
            onClick={handleRestart}
            className="flex items-center gap-3 text-left"
          >
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
          </button>

          <div className="hidden items-center gap-1 sm:flex">
            {[0, 1, 2, 3, 4].map((i) => {
              const filled = state.phase !== "complete" && i < 5 - state.posters.length;
              return (
                <span
                  key={i}
                  className="text-sm leading-none transition-colors"
                  style={{
                    color: filled ? "var(--warning)" : "var(--bg-3)",
                    filter: filled ? "drop-shadow(0 0 4px var(--warning))" : undefined,
                    opacity: filled ? 1 : 0.35,
                  }}
                  aria-hidden
                >
                  ★
                </span>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded bg-[var(--bg-2)] px-2 py-1 font-mono text-xs text-[var(--text-2)]">
              CASE LEONIDA
            </span>
            <span className="rounded bg-[var(--accent)]/10 px-2 py-1 font-mono text-xs font-bold text-[var(--accent)]">
              {state.posters.length} / {EVIDENCE.length} DISMISSED
            </span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto flex w-full max-w-[1024px] flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
        {state.phase === "landing" && (
          <LandingCover coverUrl={coverUrl} onEnter={handleEnter} />
        )}

        {state.phase === "evidence" && (
          <EvidenceView
            evidence={evidence}
            index={state.evidenceIndex}
            total={EVIDENCE.length}
            onOpenTerminal={handleOpenTerminal}
          />
        )}

        {state.phase === "terminal" && (
          <div className="flex flex-col gap-4">
            <button
              onClick={handleBackToEvidence}
              className="self-start font-mono text-xs tracking-widest text-[var(--text-2)] hover:text-[var(--text-1)]"
            >
              ← BACK TO EVIDENCE
            </button>
            <ForensicsTerminal
              image={evidence.imageBase64}
              onSubmit={handleSubmit}
              onError={() => {}}
            />
          </div>
        )}

        {state.phase === "scanning" && (
          <div className="flex flex-col gap-4">
            <EvidencePreview
              evidence={evidence}
              editedDataUrl={state.editedDataUrl}
            />
            <ForensicSweep scanning score={null} />
          </div>
        )}

        {state.phase === "verdict" && state.score && (
          <div className="flex flex-col gap-6">
            <EvidencePreview
              evidence={evidence}
              editedDataUrl={state.editedDataUrl}
            />
            <ForensicSweep scanning={false} score={state.score} />
            <VerdictScreen
              verdict={state.score.verdict}
              score={state.score}
              onNext={handleNextEvidence}
              onRetry={handleRetry}
              isLast={isLast}
            />
            {state.posterUrl && (
              <PosterCard
                posterUrl={state.posterUrl}
                caseLabel={evidence.id}
              />
            )}
          </div>
        )}

        {state.phase === "complete" && (
          <CompleteView posters={state.posters} onRestart={handleRestart} />
        )}
      </main>

      <footer className="border-t border-[var(--border)] py-4 text-center">
        <p className="font-mono text-[10px] tracking-widest text-[var(--text-3)]">
          LEONIDA POLICE DEPT. — FORENSICS DIVISION — BUILD WITH REACT IMAGE EDITOR
        </p>
        <p className="mt-1 font-mono text-[9px] tracking-widest text-[var(--text-3)]/60">
          GTA VI INSPIRED — NOT AFFILIATED WITH ROCKSTAR GAMES — #BuiltWithImageEditor
        </p>
      </footer>
    </div>
  );
}

/* ── Landing — cover hero ── */
function LandingCover({
  coverUrl,
  onEnter,
}: {
  coverUrl: string;
  onEnter: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Cover */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--border)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt="Leonida sunset — Vice City horizon"
          className="h-[340px] w-full object-cover sm:h-[420px]"
        />
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-0)] via-[var(--bg-0)]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--bg-0)]/60 via-transparent to-[var(--bg-0)]/30" />

        {/* Title on cover */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <p className="font-mono text-xs tracking-[0.35em] text-[var(--accent)]">
            VICE CITY — LEONIDA — 02:14 AM
          </p>
          <h1
            className="mt-2 text-5xl font-black tracking-tighter text-white sm:text-7xl"
            style={{
              fontFamily: "var(--font-display)",
              textShadow: "0 2px 24px rgba(0,0,0,0.8), 0 0 40px rgba(20,240,184,0.15)",
            }}
          >
            LEONIDA
          </h1>
          <p
            className="text-xl font-black tracking-[0.25em] text-white/90 sm:text-2xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            EVIDENCE LOCKER
          </p>
          <p className="mt-3 max-w-lg font-mono text-xs leading-relaxed text-white/70 sm:text-sm">
            Three surveillance photos. Two incriminating details each. Doctor the
            evidence before forensics clears the case — crop, redact, blur, and
            deceive.
          </p>
        </div>

        {/* Top badge */}
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[var(--danger)] shadow-[0_0_6px_var(--danger)]" />
          <span className="font-mono text-xs tracking-widest text-white/90">
            CASE LEONIDA — 3 ITEMS PENDING
          </span>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-col items-center gap-3 py-2">
        <button
          onClick={onEnter}
          className="group relative overflow-hidden rounded-xl bg-[var(--accent)] px-10 py-4 font-mono text-sm font-bold tracking-widest text-[var(--bg-0)] shadow-[0_0_24px_var(--accent-glow)] transition-all hover:bg-[var(--accent-dim)] hover:shadow-[0_0_32px_rgba(20,240,184,0.3)] active:scale-[0.98]"
        >
          ENTER EVIDENCE LOCKER →
        </button>
        <span className="font-mono text-[10px] tracking-widest text-[var(--text-3)]">
          BUILT WITH REACT IMAGE EDITOR — EVERY TOOL IS A TAMPERING METHOD
        </span>
      </div>

      {/* How it works */}
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            step: "01",
            title: "EVIDENCE IN",
            desc: "Surveillance photo with flagged face + plate. You know what to hide.",
          },
          {
            step: "02",
            title: "TAMPER",
            desc: "Crop, draw, filter, sticker — the editor is the weapon. No edit = BUSTED.",
          },
          {
            step: "03",
            title: "BEAT FORENSICS",
            desc: "Deterministic pixel scan reads your edit. 70% obscured = DISMISSED.",
          },
        ].map((s) => (
          <div
            key={s.step}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-1)] p-4"
          >
            <span className="font-mono text-xs font-bold tracking-widest text-[var(--accent)]">
              {s.step}
            </span>
            <h3
              className="mt-1 text-sm font-bold tracking-tight text-[var(--text-1)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {s.title}
            </h3>
            <p className="mt-1 font-mono text-xs leading-relaxed text-[var(--text-2)]">
              {s.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Tools */}
      <div className="flex flex-wrap justify-center gap-2">
        {["CROP", "DRAW", "FILTER", "STICKER", "TEXT", "SHAPES", "FRAME", "CORNERS"].map(
          (t) => (
            <span
              key={t}
              className="rounded-full border border-[var(--border)] bg-[var(--bg-1)] px-3 py-1 font-mono text-[10px] tracking-widest text-[var(--text-3)]"
            >
              {t}
            </span>
          )
        )}
      </div>
    </div>
  );
}

function EvidenceView({
  evidence,
  index,
  total,
  onOpenTerminal,
}: {
  evidence: (typeof EVIDENCE)[number];
  index: number;
  total: number;
  onOpenTerminal: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-lg font-bold tracking-tight text-[var(--text-1)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {evidence.label}
          </h2>
          <p className="font-mono text-xs text-[var(--text-2)]">
            {evidence.subtitle} — {index + 1} / {total}
          </p>
        </div>
        <span className="rounded-full bg-[var(--danger)]/10 px-3 py-1 font-mono text-xs font-bold text-[var(--danger)] border border-[var(--danger)]/20">
          ● {evidence.flags.length} FLAGS
        </span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-1)]">
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-[0.04]"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(20,240,184,1) 2px, rgba(20,240,184,1) 3px)",
          }}
        />

        <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg-2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={evidence.imageBase64}
            alt={evidence.label}
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
            {evidence.flags.map((f) => (
              <span
                key={f}
                className="rounded bg-[var(--danger)] px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-white shadow-lg"
              >
                ● {f}
              </span>
            ))}
          </div>
          <div className="absolute bottom-3 right-3 z-10 rounded bg-black/60 px-2 py-1 font-mono text-[10px] tracking-widest text-white/80 backdrop-blur">
            {evidence.id} — CHAIN: INTACT
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border)] bg-[var(--bg-1)] px-4 py-3">
          <span className="font-mono text-xs text-[var(--text-2)]">
            OPEN THE TERMINAL TO TAMPER WITH THIS EVIDENCE
          </span>
          <button
            onClick={onOpenTerminal}
            className="rounded-lg bg-[var(--accent)] px-5 py-2.5 font-mono text-xs font-bold tracking-widest text-[var(--bg-0)] shadow-[0_0_16px_var(--accent-glow)] transition hover:bg-[var(--accent-dim)]"
          >
            OPEN FORENSICS TERMINAL →
          </button>
        </div>
      </div>

      <div className="flex justify-center gap-2">
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-8 bg-[var(--accent)]" : i < index ? "w-6 bg-[var(--accent)]/40" : "w-6 bg-[var(--bg-2)]"}`}
          />
        ))}
      </div>
    </div>
  );
}

function EvidencePreview({
  evidence,
  editedDataUrl,
}: {
  evidence: (typeof EVIDENCE)[number];
  editedDataUrl: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-1)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[var(--bg-2)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={editedDataUrl ?? evidence.imageBase64}
          alt="Edited evidence"
          className="h-full w-full object-cover"
        />
        <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 font-mono text-[10px] tracking-widest text-white/80 backdrop-blur">
          {editedDataUrl ? "EDITED — SUBMITTED TO FORENSICS" : evidence.id}
        </div>
      </div>
    </div>
  );
}

function PosterCard({
  posterUrl,
  caseLabel,
}: {
  posterUrl: string;
  caseLabel: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--accent)]/20 bg-[var(--bg-1)] p-4">
      <div className="flex items-center justify-between">
        <h3
          className="text-sm font-bold tracking-tight text-[var(--text-1)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          POSTER — {caseLabel}
        </h3>
        <span className="rounded bg-[var(--accent)]/15 px-2 py-1 font-mono text-[10px] font-bold tracking-widest text-[var(--accent)]">
          1080 × 1350
        </span>
      </div>
      <div className="mt-3 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-0)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={posterUrl}
          alt={`Poster for ${caseLabel}`}
          className="mx-auto max-h-[520px] w-auto object-contain"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <a
          href={posterUrl}
          download={`leonida-${caseLabel.toLowerCase()}-poster.png`}
          className="flex-1 rounded-lg bg-[var(--accent)] py-2.5 text-center font-mono text-xs font-bold tracking-widest text-[var(--bg-0)] hover:bg-[var(--accent-dim)]"
        >
          DOWNLOAD POSTER
        </a>
        <button
          onClick={async () => {
            const blob = await (await fetch(posterUrl)).blob();
            const file = new File([blob], `leonida-${caseLabel}.png`, {
              type: "image/png",
            });
            if (navigator.canShare?.({ files: [file] })) {
              await navigator.share({
                files: [file],
                title: `LEONIDA — ${caseLabel} DISMISSED`,
                text: "Doctor the evidence. Beat the system. #BuiltWithImageEditor @unlayer",
              });
            } else if (navigator.clipboard) {
              // Fallback: copy data URL hint
              await navigator.clipboard.writeText(window.location.href);
            }
          }}
          className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] py-2.5 text-center font-mono text-xs font-bold tracking-widest text-[var(--text-1)] hover:bg-[var(--bg-3)]"
        >
          SHARE
        </button>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] tracking-widest text-[var(--text-3)]">
        Share with #BuiltWithImageEditor + @unlayer
      </p>
    </div>
  );
}

function CompleteView({
  posters,
  onRestart,
}: {
  posters: string[];
  onRestart: () => void;
}) {
  const allDismissed = posters.length === EVIDENCE.length;

  return (
    <div className="flex flex-1 flex-col items-center gap-6 py-6 text-center">
      <div
        className={`rounded-full px-4 py-1.5 font-mono text-xs font-bold tracking-widest ${allDismissed ? "bg-[var(--accent)] text-[var(--bg-0)]" : "bg-[var(--warning)] text-[var(--bg-0)]"}`}
      >
        {allDismissed ? "★ ALL CASES DISMISSED — WANTED LEVEL CLEARED ★" : `CASE FILE CLOSED — ${posters.length} / ${EVIDENCE.length} DISMISSED`}
      </div>

      <h2
        className="text-3xl font-black tracking-tight text-[var(--text-1)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {allDismissed ? "YOU GOT AWAY WITH IT" : "CASE FILE CLOSED"}
      </h2>

      <p className="max-w-md font-mono text-xs leading-relaxed text-[var(--text-2)]">
        {allDismissed
          ? "Forensics failed on every piece of evidence. The posters are yours."
          : "Some evidence still matched. Retry the busted cases or take what you earned."}
      </p>

      {posters.length > 0 ? (
        <div className="grid w-full gap-4 sm:grid-cols-3">
          {posters.map((url, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-1)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Poster ${i + 1}`}
                className="h-auto w-full object-contain"
              />
              <div className="border-t border-[var(--border)] p-2">
                <a
                  href={url}
                  download={`leonida-poster-${i + 1}.png`}
                  className="block rounded bg-[var(--accent)] py-2 text-center font-mono text-xs font-bold tracking-widest text-[var(--bg-0)] hover:bg-[var(--accent-dim)]"
                >
                  DOWNLOAD
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="font-mono text-xs text-[var(--text-3)]">
          No posters yet — dismiss at least one case.
        </p>
      )}

      <div className="flex gap-3">
        <button
          onClick={onRestart}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-1)] px-6 py-2.5 font-mono text-xs font-bold tracking-widest text-[var(--text-1)] hover:bg-[var(--bg-2)]"
        >
          PLAY AGAIN
        </button>
        <a
          href="https://github.com/JUICEWRLD998/leonida"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-[var(--bg-2)] px-6 py-2.5 font-mono text-xs font-bold tracking-widest text-[var(--text-1)] hover:bg-[var(--bg-3)]"
        >
          VIEW ON GITHUB →
        </a>
      </div>
    </div>
  );
}
