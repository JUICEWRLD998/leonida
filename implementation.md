# LEONIDA-06: EVIDENCE LOCKER — Implementation Blueprint

> **Build with React Image Editor Challenge × GTA VI**
> Next.js build — single-page forensic terminal where you doctor police evidence to beat the system.
> One sentence: *Doctor police surveillance photos to make the case get thrown out before forensics catches you.*

**Stack:** Next.js 15 (App Router) + React 18 + `@unlayer/react-image-editor` + Framer Motion + CSS Modules + design tokens
**Deploy:** Vercel (zero-config for Next.js) + Public GitHub
**Deadline:** September 24, 2026 — 23:59 UTC
**Prize target:** 1st place — $500

---

## Table of Contents

1. [The Pick — Why This Wins](#1-the-pick--why-this-wins)
2. [Product Spec](#2-product-spec)
3. [Tech Stack & Architecture](#3-tech-stack--architecture)
4. [Design System — SIGNAL DECK: Leonida Terminal](#4-design-system--signal-deck-leonida-terminal)
5. [File Structure](#5-file-structure)
6. [React Image Editor — Next.js Integration](#6-react-image-editor--nextjs-integration)
7. [Forensics Scorer — How Judging Works](#7-forensics-scorer--how-judging-works)
8. [Game Flow & State Machine](#8-game-flow--state-machine)
9. [Implementation Phases](#9-implementation-phases)
10. [Component Specs](#10-component-specs)
11. [Data & Assets](#11-data--assets)
12. [Demo Script — 90 Seconds](#12-demo-script--90-seconds)
13. [Risk Register & Fallbacks](#13-risk-register--fallbacks)
14. [Deployment & Submission Checklist](#14-deployment--submission-checklist)
15. [NOT-BUILDING List](#15-not-building-list)
16. [Verification Commands](#16-verification-commands)
17. [Polish — Final 10%](#17-polish--final-10)

---

## 1. The Pick — Why This Wins

### The Problem With 80% of Entries

They will be poster generators: upload selfie → pick GTA font → add filter → export. Judges will see 30 of these in a row. The delta is "we added a font." That's not a product — it's a Canva template.

### The Inversion

Everyone else: **create** a cool GTA image.
We: **destroy** evidence to get away with a crime.

The React Image Editor isn't a decoration — it's the weapon. No edit = automatic BUSTED. Every tool is a tampering method.

### Why This Maxes the Rubric

| Criterion | How We Max It |
|---|---|
| **Creativity (25)** | Inversion — evidence tampering as gameplay. No prior entry does this. |
| **Visual Execution (25)** | Diegetic VCPD terminal: CRT scanlines, phosphor glow, evidence bags, star chimes. AAA, not template. |
| **Use of Editor (25)** | Editor IS the game mechanic. 8 tools = 8 tampering methods. `onSave` triggers scoring. `hasChanges()` is the gate. |
| **Overall Experience (25)** | Complete 60-second loop: tension (timer) → action (edit) → astonishment (forensic sweep) → reward (poster trophy). |

### Why Now — Three Convergences

1. GTA VI's Leonida/Vice City setting is confirmed and visually distinct (neon-noir, not LA rehash).
2. `react-image-editor` just shipped as a standalone component with vector layers you can score programmatically via `getImage()` / `onSave`.
3. Client-side pixel analysis (canvas `getImageData`) is now sufficient for deterministic forensics — no API keys, no latency, works offline.

### Trigger to Switch to Runner-Up

If after Phase 3 you cannot get `getImage()` / `onSave({dataUrl})` to return a taint-free dataUrl for pixel scoring (CORS-tainted canvas), pivot to **VICE SNAPMATIC 2.0** (social-media clout game — tolerates a dumber scorer). Decision point: end of Phase 3.

---

## 2. Product Spec

### Elevator Pitch

A Leonida Police Department forensic terminal. Three evidence photos land on your desk — a corner-store robbery, a getaway car, a motel meet. You have 45 seconds each to open the Image Forensics Terminal and make the incriminating detail undetectable. A live forensic AI scans your edit. Stars drop or you get WASTED.

### Core Loop

```
EVIDENCE IN (photo + red flags: FACE + PLATE DETECTED)
  → OPEN TERMINAL (editor)
    → TAMPER (crop / draw / blur / sticker / text)
      → SUBMIT (onSave → flatten → score)
        → FORENSIC SWEEP (scan bar + 3 checks)
          → DISMISSED (stars 5→0, cash +$12,500, poster reward)
          → or WASTED (red flash, case remains open)
            → NEXT EVIDENCE (reset → new photo)
```

### User Stories

- As a player, I see a surveillance photo with flagged regions so I know what to hide.
- As a player, I use familiar editor tools to obscure evidence — each tool has an obvious tampering purpose.
- As a player, I submit and watch a forensic scan read my pixels and tell me if I got away with it.
- As a player, I earn a shareable Wanted Poster (framed edited image) only if I win — the poster is the trophy.
- As a judge, I understand the game in 5 seconds and see the WOW in 20 seconds, with no explanation needed.

### Success Criteria

- [ ] A stranger understands the game without instructions in <10 seconds.
- [ ] The WOW (forensic sweep reading your edits) happens live in <20 seconds from clicking SUBMIT.
- [ ] All 3 evidence photos are bundled (no network) and score deterministically offline.
- [ ] Poster export works and is 1080×1350 (Instagram-ready).
- [ ] Deployed on Vercel, public GitHub, share image works.

---

## 3. Tech Stack & Architecture

### Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 (App Router)** | Required by brief. Vercel deploys Next with zero config. File-based routing, built-in Image optimization if needed later. |
| Language | TypeScript (strict) | Catches prop mismatches on editor callbacks early. |
| Editor | `@unlayer/react-image-editor` | Challenge requirement — load-bearing, not decoration. |
| Animation | **Framer Motion** | Only animation library. Terminal flicker, star drop, scan sweep, cash tick, evidence slide. |
| Styling | **CSS Modules + design tokens** | No Tailwind (per taste). Tokens for colors/spacing/type. Modules for scoping. |
| State | React `useState` + `useReducer` for game machine | No Redux/Zustand needed — single-page, no shared server state. |
| Canvas | Native `<canvas>` 2D context for scorer | Pixel diff via `getImageData`. No extra dep. |
| Deploy | Vercel | `vercel --prod` from Next.js. Preview deploys on push. |
| Repo | Public GitHub | Challenge requirement. Clean commits, README is judge artifact. |

### Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│  Next.js App Router (app/)                      │
│                                                 │
│  layout.tsx  →  html shell, fonts, metadata     │
│  page.tsx    →  Game shell (server component)   │
│       │                                         │
│       └─► EvidenceLocker (client)               │
│              │                                  │
│              ├── TerminalChrome (scanlines,     │
│              │     stars, timer, cash, header)  │
│              ├── EvidenceBag (photo + flags)    │
│              ├── ForensicsTerminal (client)     │
│              │     └── ReactImageEditor         │
│              │          (dynamic ssr:false)     │
│              ├── ForensicSweep (scan bar +     │
│              │     check results)               │
│              ├── VerdictScreen (WASTED /       │
│              │     DISMISSED + star anim)       │
│              └── PosterReward (canvas frame)    │
│                                                 │
│  lib/scorer.ts  →  pixel-diff engine            │
│  lib/evidence.ts →  bundled base64 + bboxes    │
│  lib/tokens.ts  →  design tokens               │
└─────────────────────────────────────────────────┘
```

### Key Architectural Decisions

1. **Editor is `dynamic(() => import(...), { ssr: false })`** — it touches `window`/`document`/canvas. Never render on server. Wrapper handles `onLoad` / `onError` / `onLoadError`.
2. **All evidence as base64 data URLs** — zero network on demo. No CORS taint. Canvas stays readable for `getImageData`. Never load external URLs in MVP.
3. **Scorer is pure function** — `(originalDataUrl, editedDataUrl, evidenceMeta) => ScoreResult`. No API calls. Deterministic. Testable. Works offline.
4. **Single page, no routing** — `app/page.tsx` is the entire game. No `/evidence/[id]` routes in MVP (adds complexity, no judge value).
5. **No backend, no DB, no auth** — all client-side. Leaderboard is localStorage stretch. Keeps deploy trivial and demo offline-proof.

---

## 4. Design System — SIGNAL DECK: Leonida Terminal

> Flat deep blue-black surfaces, ONE mint-teal accent (hue ~168), no glass, no violet. This is a police terminal, not a startup landing page.

### Tokens (`app/tokens.css` or `styles/tokens.css`)

```css
:root {
  /* Surfaces */
  --bg-0: #070B14;        /* page background — almost black navy */
  --bg-1: #0E1629;        /* card / terminal body */
  --bg-2: #162040;        /* raised panel / evidence bag */
  --bg-3: #1E2D5A;        /* hover / active */

  /* Accent — ONE hue */
  --accent: #14F0B8;      /* mint-teal, hue ~168 — success, DISMISSED, stars clearing */
  --accent-dim: #0FB58C;
  --accent-glow: rgba(20, 240, 184, 0.15);

  /* Semantic */
  --danger: #FF3B30;      /* WASTED, flagged, timer critical */
  --warning: #FFCC02;     /* wanted stars (filled), timer warning */
  --text-1: #E8EEF8;      /* primary text */
  --text-2: #8A9AB8;      /* secondary / labels */
  --text-3: #4A5A7A;      /* disabled / stamp */
  --border: #1E2D5A;
  --border-accent: rgba(20, 240, 184, 0.3);

  /* Type */
  --font-display: 'Anton', 'Bebas Neue', sans-serif;  /* headers, LEONIDA */
  --font-mono: 'JetBrains Mono', 'Geist Mono', monospace; /* terminal, evidence labels */
  --font-body: 'Inter', 'Geist Sans', sans-serif;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;

  /* CRT */
  --scanline: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(20, 240, 184, 0.03) 2px,
    rgba(20, 240, 184, 0.03) 3px
  );
}
```

### Visual Rules

- **No gradients on surfaces** — flat fills only. Glow via `box-shadow`, not gradient.
- **No glassmorphism** — no `backdrop-filter: blur`. Terminal is solid, opaque, heavy.
- **No violet/purple** — ever. If you see it, delete it.
- **One accent only** — mint-teal for success/active. Red for danger. Amber for stars. No other accent hues.
- **Typography hierarchy:** Display (Anton) for `LEONIDA-06` / `EVIDENCE LOCKER` / `WASTED` / `DISMISSED`. Mono for evidence labels, timer, forensic log. Body for descriptions.
- **CRT effect:** Subtle scanlines via `::after` pseudo with `repeating-linear-gradient`, plus faint flicker via Framer Motion `opacity: [1, 0.98, 1]` on a 150ms loop. Not overdone — judge should feel it, not notice it.
- **Evidence bag:** Slight rotation (`rotate(-0.5deg)`), drop shadow, chain-of-custody tag (small mint label with edit count).

### Reference Boards (for polish pass)

- GTA VI trailer: neon-noir, Vice City pink-teal at night — we use the teal, not the pink.
- Papers Please: document inspection, stamps, dehumanizing bureaucracy.
- Linear / Stripe Dashboard: flat, dense, precise — for terminal layout.

---

## 5. File Structure

```
unlayer/                          # Next.js project root
├── app/
│   ├── layout.tsx                # html shell, font loading (Anton, JetBrains Mono, Inter), metadata
│   ├── page.tsx                  # Game shell — server component, renders <EvidenceLocker />
│   ├── globals.css               # reset, tokens import, base styles
│   └── favicon.ico
├── components/
│   ├── EvidenceLocker.tsx        # ★ Main game orchestrator (client, useReducer state machine)
│   ├── TerminalChrome.tsx        # Header, wanted stars, timer, cash counter, scanline overlay
│   ├── EvidenceBag.tsx           # Photo display + red FLAG badges + chain-of-custody tag
│   ├── ForensicsTerminal.tsx     # ★ Editor wrapper (dynamic ssr:false, handles onSave/onError)
│   ├── ForensicSweep.tsx         # Scan bar animation + 3 check rows (FACE / PLATE / TAMPER)
│   ├── VerdictScreen.tsx         # WASTED (red) / DISMISSED (mint) + star drop + cash tick
│   ├── PosterReward.tsx          # Canvas-based poster generator (1080×1350 export)
│   └── ui/
│       ├── Button.tsx            # Terminal button (mint outline, press state)
│       ├── Badge.tsx             # FLAG / DISMISSED / CORRUPTED stamps
│       └── Timer.tsx             # 00:45 countdown, turns red at 00:10
├── lib/
│   ├── evidence.ts               # Evidence definitions: base64 + bboxes + flags
│   ├── scorer.ts                 # ★ Forensic scorer: pixel-diff engine
│   ├── poster.ts                 # Poster canvas composition
│   ├── tokens.ts                 # (optional) JS token export for Framer Motion
│   └── sound.ts                  # Web Audio chimes (optional stretch)
├── public/
│   ├── evidence/                 # Source JPGs (converted to base64 at build or inline in evidence.ts)
│   │   ├── evidence-01-store.jpg
│   │   ├── evidence-02-car.jpg
│   │   └── evidence-03-motel.jpg
│   └── sounds/                   # (stretch) star-chime.mp3, scan.mp3
├── styles/
│   ├── tokens.css                # Design tokens (imported in globals.css)
│   ├── terminal.module.css       # Terminal chrome styles
│   ├── evidence.module.css       # Evidence bag styles
│   └── verdict.module.css        # Verdict animation styles
├── implementation.md             # This file
├── package.json
├── tsconfig.json
├── next.config.mjs
└── README.md                     # Judge-facing artifact (criteria-mapped)
```

> **Note:** If evidence images are small (<200KB each), inline them as base64 directly in `lib/evidence.ts` to eliminate `public/` fetches entirely. Otherwise keep in `public/evidence/` and convert to dataUrl on load — but verify canvas is not tainted.

---

## 6. React Image Editor — Next.js Integration

### Why `ssr: false` Is Non-Negotiable

`@unlayer/react-image-editor` accesses `window`, `document`, and `<canvas>` on mount. Rendering it on the server throws `ReferenceError: window is not defined` and breaks the build. Always use `next/dynamic` with `ssr: false`.

### Installation

```bash
npm install @unlayer/react-image-editor framer-motion
# Fonts: next/font (built-in, no extra install)
```

### Wrapper Component — `components/ForensicsTerminal.tsx`

```tsx
"use client";

import dynamic from "next/dynamic";
import { useRef, useState, useCallback } from "react";

// ★ Critical: ssr:false — editor touches window/canvas
const ReactImageEditor = dynamic(
  () => import("@unlayer/react-image-editor").then((m) => m.ReactImageEditor),
  {
    ssr: false,
    loading: () => <div className="terminal-loading">INITIALIZING FORENSICS TERMINAL...</div>,
  }
);

type ForensicsTerminalProps = {
  image: string;              // base64 data URL — never external URL in MVP
  onSubmit: (dataUrl: string, blob: Blob) => void;
  onError?: (err: Error) => void;
};

export function ForensicsTerminal({ image, onSubmit, onError }: ForensicsTerminalProps) {
  const editorRef = useRef<{ editor: any }>(null);
  const [ready, setReady] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = useCallback(
    ({ dataUrl, blob }: { dataUrl: string; blob: Blob }) => {
      onSubmit(dataUrl, blob);
    },
    [onSubmit]
  );

  return (
    <div className="forensics-terminal">
      <ReactImageEditor
        ref={editorRef}
        image={image}
        minHeight={520}
        // wrapperStyle / style to fill terminal chrome
        style={{ borderRadius: "10px", overflow: "hidden" }}
        wrapperStyle={{ background: "#0E1629", border: "1px solid #1E2D5A" }}
        options={{
          // theme: "light" — then override via CSS Modules to hit Leonida palette
          // Verify exact theming token in node_modules after install
          features: {
            imageEditor: {
              // All 8 tools enabled — each is a tampering method
              tools: {
                filter: true,   // blur / pixelate / brightness → degrade recognition
                crop: true,     // reframe to hide plate
                resize: true,   // scale evidence
                draw: true,     // sharpie redact face
                text: true,     // forge timestamp / redact label
                shapes: true,   // cover with shapes
                stickers: true, // evidence tags / coffee stain / classified stamp
                frame: true,    // poster reward border (also tamper: frame crops)
                corners: true,  // rounding as redaction
              },
            },
          },
        }}
        onLoad={(editor) => {
          setReady(true);
          // editor is the raw instance — store if needed for getImage() / hasChanges()
        }}
        onSave={handleSave}
        onLoadError={() => onError?.(new Error("Evidence image failed to load"))}
        onError={(err) => onError?.(err)}
      />

      {/* Guard: hasChanges check before submit */}
      {/* Call editorRef.current?.editor.hasChanges() before allowing forensic run */}
      {/* Call editorRef.current?.editor.getImage() for programmatic capture (poster) */}
      {/* Call editorRef.current?.editor.reset(nextImage) on level progression */}
    </div>
  );
}
```

### Props & API Reference (from real docs)

| Prop / Method | Type | Usage in LEONIDA-06 |
|---|---|---|
| `image` | `string` (URL or base64) | Evidence photo. Use base64 only in MVP. Prop change → `reset()` to latest (rapid changes serialized). |
| `options.features.imageEditor.tools` | `Record<Tool, boolean \| {enabled, icon}>` | Enable all 8 tools. Custom icons via `tools.stickers.icon` (FontAwesome name, image URL, or inline SVG). **UNVERIFIED** — confirm after install by reading `dist/index.d.ts`. Fallback: default stickers + `text` tool. |
| `options.theme` | `string` | `"light"` then override via CSS. Exact token name **UNVERIFIED** — grep `theme` in `dist/`. |
| `minHeight` | `number` | `520` — fills terminal without scrolling. |
| `style` / `wrapperStyle` | `CSSProperties` | Terminal chrome: blue-black bg, border, radius. |
| `onLoad(editor)` | `(editor) => void` | Set `ready=true`, show "SYSTEM ONLINE" indicator. |
| `onSave({dataUrl, blob})` | `({dataUrl, blob}) => void` | **Scoring trigger.** Capture `dataUrl`, flatten layers, run scorer. |
| `onLoadError()` | `() => void` | Evidence image failed — show "EVIDENCE CORRUPTED" retry. |
| `onError(Error)` | `(Error) => void` | Wrapper/embed failed — show "TERMINAL OFFLINE" + retry. |
| `ref.editor.getImage()` | `() => string` (dataUrl) | Programmatic capture for poster reward without re-opening editor. |
| `ref.editor.hasChanges()` | `() => boolean` | Guard: if false on submit, show "NO TAMPERING DETECTED — BUSTED" and block forensic run. |
| `ref.editor.reset(imageUrl?)` | `(url?) => void` | Level progression — clears undo/redo + chat, loads next evidence. |
| `ref.editor.updateOptions(partial)` | `(opts) => void` | Theme/locale changes without remount. |
| `ref.editor.destroy()` | `() => void` | Auto-called on unmount. |

### 2-Minute Verification After `npm install`

```bash
# 1. Confirm prop types
cat node_modules/@unlayer/react-image-editor/dist/index.d.ts | head -n 120

# 2. Confirm tools config shape
grep -r "tools" node_modules/@unlayer/react-image-editor/dist/ --include="*.d.ts" | head

# 3. Confirm theme prop
grep -r "theme" node_modules/@unlayer/react-image-editor/dist/ --include="*.d.ts" | head

# 4. Run dev and check no SSR error
npm run dev
# Open http://localhost:3000 — editor should mount without "window is not defined"
```

---

## 7. Forensics Scorer — How Judging Works

### Design Principles

- **Deterministic** — same edit always yields same score. No randomness, no LLM latency.
- **Pixel-based** — reads the actual edited pixels you produced, not a heuristic guess.
- **Offline** — pure canvas `getImageData`, no API calls. Works on stage with no WiFi.
- **Explainable** — shows which zones passed/failed so the judge trusts it.

### Ground Truth — Per Evidence (`lib/evidence.ts`)

Each evidence photo has hidden bounding boxes for incriminating regions. These are never shown to the player before scoring — they're the forensic AI's "knowledge."

```ts
// lib/evidence.ts
export type BoundingBox = { x: number; y: number; w: number; h: number }; // 0-1000 normalized

export type Evidence = {
  id: string;
  label: string;           // "CASE 06-A — CORNER STORE — 02:14 AM"
  description: string;     // "Suspect face + plate visible. Hide both."
  imageBase64: string;     // bundled data URL
  originalDataUrl: string; // same as imageBase64 — used for diff baseline
  flags: string[];         // ["FACE DETECTED", "PLATE LEON 06 DETECTED"]
  regions: {
    face: BoundingBox;     // normalized 0-1000 → mapped to actual canvas size
    plate: BoundingBox;
  };
  difficulty: 1 | 2 | 3;
};

export const EVIDENCE: Evidence[] = [
  {
    id: "06-A",
    label: "CASE 06-A — CORNER STORE — 02:14 AM",
    description: "Suspect at register. Face + plate visible in window reflection.",
    imageBase64: "data:image/jpeg;base64,...", // inline or imported
    originalDataUrl: "data:image/jpeg;base64,...",
    flags: ["FACE DETECTED", "PLATE LEON 06 DETECTED"],
    regions: {
      face:  { x: 320, y: 180, w: 140, h: 180 },
      plate: { x: 620, y: 740, w: 200, h: 80 },
    },
    difficulty: 1,
  },
  // ... 06-B (getaway car), 06-C (motel ledger)
];
```

> **How to get bboxes:** Open each evidence photo in any image editor, note pixel coords of face/plate, convert to 0-1000 normalized (`x_norm = x_px / img_width * 1000`). Store normalized so scorer works at any canvas size.

### Scoring Algorithm (`lib/scorer.ts`)

```ts
// lib/scorer.ts
export type RegionScore = {
  region: "face" | "plate";
  obscuredPercent: number;  // 0-100 — % of region pixels that changed significantly
  passed: boolean;          // obscuredPercent >= 70
};

export type ScoreResult = {
  regions: RegionScore[];
  tamperScore: number;      // 0-100 — overall edit coverage
  verdict: "DISMISSED" | "BUSTED";
  editCount: number;        // from hasChanges / pixel diff magnitude
};

/**
 * Compare original vs edited image within each incriminating bbox.
 * A pixel is "obscured" if its edited value differs from original by > threshold
 * (covers: draw scribble, blur, crop-cut, sticker overlay, filter shift).
 * Crop is handled implicitly — if region is cropped out, that region scores 100%.
 */
export async function scoreForensics(
  originalDataUrl: string,
  editedDataUrl: string,
  evidence: Evidence
): Promise<ScoreResult> {
  // 1. Load both images into offscreen canvases at same dimensions
  // 2. For each region (face, plate):
  //    a. Map normalized bbox → actual canvas rect
  //    b. If edited canvas is smaller (crop removed region) → 100% obscured
  //    c. Else: getImageData for that rect on both canvases
  //    d. Count pixels where |edited - original| > 30 (per channel, any channel)
  //    e. obscuredPercent = changedPixels / totalPixels * 100
  // 3. tamperScore = average of region obscuredPercents
  // 4. verdict = DISMISSED if ALL regions passed (>=70%), else BUSTED
}

function pixelsDiff(
  original: ImageData,
  edited: ImageData,
  threshold = 30
): number {
  let changed = 0;
  for (let i = 0; i < original.data.length; i += 4) {
    const dr = Math.abs(original.data[i] - edited.data[i]);
    const dg = Math.abs(original.data[i + 1] - edited.data[i + 1]);
    const db = Math.abs(original.data[i + 2] - edited.data[i + 2]);
    if (dr > threshold || dg > threshold || db > threshold) changed++;
  }
  return changed;
}
```

### Thresholds

| Check | Pass If | Verdict |
|---|---|---|
| FACE region | `obscuredPercent >= 70%` | Both must pass for DISMISSED |
| PLATE region | `obscuredPercent >= 70%` | If either fails → BUSTED |
| TAMPER SCORE | `average >= 70%` | Display only — not gating, but shown as `TAMPER SCORE: 94%` |

> Tune threshold to 60-75% after playtesting. Too low = 1px edit wins (feels fake). Too high = perfect redact still fails (feels unfair). Target: scribble + blur OR crop should pass; doing nothing should always fail.

### Edge Cases

- **Cropped out:** If edited image dimensions are smaller and bbox is outside bounds → 100% obscured (crop is valid tampering).
- **No changes:** `hasChanges() === false` → skip scorer, immediate BUSTED with message "NO TAMPERING DETECTED."
- **Filter-only edit:** Brightness/contrast shifts change pixels globally — scorer counts them. A strong filter alone can pass if it shifts region pixels enough. This is correct — overexposure is real evidence tampering.
- **Canvas taint:** Should never happen with base64. If `getImageData` throws `SecurityError`, show "FORENSICS OFFLINE — EVIDENCE CORRUPTED" and offer retry.

---

## 8. Game Flow & State Machine

### States

```
IDLE          → Landing: terminal boots, evidence bag 06-A slides in, stars 5/5
  │
  ├─► EDITING → Forensics Terminal open, timer 00:45 ticks, editor active
  │      │
  │      ├─► SUBMITTING → onSave fired, flattening layers, forensic sweep starts
  │      │       │
  │      │       ├─► DISMISSED → mint flash, stars 5→0, cash tick, poster reward
  │      │       │       │
  │      │       │       └─► NEXT_EVIDENCE (if more) or COMPLETE
  │      │       │
  │      │       └─► BUSTED → red flash, WASTED, stars stay, retry or next
  │      │
  │      └─► TIMEOUT → 00:00, auto-submit whatever exists (or BUSTED if no changes)
  │
  └─► COMPLETE → All 3 dismissed, final poster gallery, share CTA
```

### State Reducer Sketch

```ts
type GameState =
  | { status: "IDLE"; evidenceIndex: number }
  | { status: "EDITING"; evidenceIndex: number; timeLeft: number }
  | { status: "SUBMITTING"; evidenceIndex: number; editedDataUrl: string }
  | { status: "DISMISSED"; evidenceIndex: number; score: ScoreResult; posterUrl: string }
  | { status: "BUSTED"; evidenceIndex: number; score: ScoreResult }
  | { status: "COMPLETE"; totalCash: number; posters: string[] };

type GameAction =
  | { type: "OPEN_TERMINAL" }
  | { type: "TICK" }
  | { type: "SUBMIT"; editedDataUrl: string; blob: Blob }
  | { type: "SCORE_RESULT"; score: ScoreResult; posterUrl?: string }
  | { type: "NEXT_EVIDENCE" }
  | { type: "RETRY" }
  | { type: "TIMEOUT" };
```

### Timer

- 45 seconds per evidence. Counts down in `Timer.tsx`, turns amber at 00:15, red + pulse at 00:10.
- At 00:00 → dispatch `TIMEOUT` → auto-submit if `hasChanges()` else BUSTED.
- Timer pauses during `SUBMITTING` / `DISMISSED` / `BUSTED` (no tick in those states).

---

## 9. Implementation Phases

### Phase 0 — Scaffold & Deploy (Day 1 — 3 hours)

**Goal:** Public GitHub + live Vercel URL. Everything else builds on this.

**Steps:**

1. Create Next.js project:
   ```bash
   npx create-next-app@latest unlayer --typescript --eslint --app --src-dir=false --import-alias="@/*"
   cd unlayer
   npm install @unlayer/react-image-editor framer-motion
   ```
2. Configure `next.config.mjs` — no special config needed for editor (it's client-only via dynamic).
3. Set up `app/layout.tsx`:
   - `next/font/google` — `Anton` (display), `JetBrains_Mono` (terminal), `Inter` (body)
   - `<html>` + `<body>` with `globals.css`
   - Metadata: title `LEONIDA-06: EVIDENCE LOCKER`, description, OG image placeholder
4. Set up `app/globals.css` + `styles/tokens.css` — import tokens, reset, base.
5. Set up `app/page.tsx` — minimal shell that renders `<EvidenceLocker />` placeholder ("TERMINAL BOOTING...").
6. Git init, first commit, push to **public** GitHub repo.
7. Deploy to Vercel:
   ```bash
   vercel --prod
   # or connect GitHub repo in Vercel dashboard → auto-deploy on push
   ```
8. Verify: live URL loads, no build errors.

**Done when:** `https://<your-app>.vercel.app` is live and shows "TERMINAL BOOTING..." with correct fonts and bg color `#070B14`.

**Commits:**
- `chore: scaffold Next.js 15 + editor + tokens + Vercel deploy`

---

### Phase 1 — Terminal Shell & Evidence Display (Day 2 — 4 hours)

**Goal:** Looks like a GTA police terminal. No editor yet. Judge should already feel the vibe from a screenshot.

**Build:**

1. **`components/TerminalChrome.tsx`**
   - Header bar: `LEONIDA POLICE DEPT.` + `EVIDENCE LOCKER` + `CASE LEONIDA-06` + badge icon
   - Wanted stars: 5 stars, filled amber (`#FFCC02`) or empty (`#1E2D5A` with border). Framer Motion: `whileHover` scale, `animate` pulse on 5 stars.
   - Cash counter: `$0` → `$12,500` tick animation (Framer Motion `useSpring` on number).
   - Timer slot: renders `<Timer />` when in EDITING state.
   - CRT overlay: `::after` with `repeating-linear-gradient` scanlines + subtle flicker (`motion.div` with `opacity: [1, 0.97, 1]` loop).
   - Border: `1px solid var(--border)` + `box-shadow: 0 0 40px var(--accent-glow)` when DISMISSED.

2. **`components/EvidenceBag.tsx`**
   - Props: `evidence: Evidence`, `status: GameState["status"]`
   - Photo: `<img src={evidence.imageBase64} />` with `object-fit: cover`, evidence bag border, slight rotation.
   - Red FLAG badges: absolute positioned, `background: var(--danger)`, mono font, e.g. `● FACE DETECTED`, `● PLATE LEON 06 DETECTED`
   - Chain-of-custody tag: small mint label at bottom — `EVIDENCE 06-A • CHAIN OF CUSTODY: INTACT` + edit count when available.
   - Slide-in animation: `initial: { x: 40, opacity: 0 }` → `animate: { x: 0, opacity: 1 }` with spring.

3. **`components/ui/Timer.tsx`**
   - Props: `seconds: number` (45 → 0)
   - Display: `00:45` mono, large. Color: `var(--text-1)` normally, `var(--warning)` at ≤15, `var(--danger)` + pulse at ≤10.
   - Framer Motion pulse at critical: `animate: { scale: [1, 1.05, 1] }` with `repeat: Infinity`.

4. **`lib/evidence.ts`**
   - Define `EVIDENCE` array with 3 entries. For now use placeholder base64 (small colored rects or temp CCTV-style images). Replace with real photos in Phase 2.
   - Include bboxes (estimate for now, refine after real photos).

5. **`components/EvidenceLocker.tsx` (shell)**
   - `useReducer` with game state machine (IDLE → EDITING → SUBMITTING → DISMISSED/BUSTED → NEXT).
   - Renders `TerminalChrome` + `EvidenceBag` + placeholder "OPEN FORENSICS TERMINAL" button.
   - Timer `useEffect` with `setInterval(1000)` only when `status === "EDITING"`.

**Done when:** Page shows a complete terminal with evidence photo, flags, stars, timer placeholder, and correct SIGNAL DECK palette. Screenshot is already portfolio-worthy.

**Commits:**
- `feat: terminal chrome — header, stars, timer, CRT scanlines`
- `feat: evidence bag + evidence data + game state shell`

---

### Phase 2 — Editor Integration (Day 3–4 — 6 hours) ★ CRITICAL PATH

**Goal:** Editor opens inside terminal, edits persist, `onSave` returns dataUrl. This is the 60% milestone.

**Build:**

1. **`components/ForensicsTerminal.tsx`** (as spec'd in Section 6)
   - `dynamic` import with `ssr: false`
   - Props: `image`, `onSubmit`, `onError`
   - `useRef` for editor instance, `hasChanges` guard
   - Loading state: "INITIALIZING FORENSICS TERMINAL..." with terminal typing animation
   - Error states: "TERMINAL OFFLINE — RETRY" button that calls `reset()`
   - Wrap in `motion.div` with `initial: { scale: 0.96, opacity: 0 }` → `animate: { scale: 1, opacity: 1 }`

2. **Wire into `EvidenceLocker.tsx`:**
   - `IDLE` → click "OPEN FORENSICS TERMINAL" → dispatch `OPEN_TERMINAL` → status `EDITING` → render `ForensicsTerminal` with `EVIDENCE[evidenceIndex].imageBase64`
   - `ForensicsTerminal.onSubmit` → dispatch `SUBMIT` → status `SUBMITTING`
   - Timer integration: pass `hasChanges` ref so timeout can check before auto-submit

3. **Real Evidence Photos:**
   - Source 3 CCTV-style photos: corner store interior, car rear with plate, motel desk with ledger. Options:
     - Generate via image generation (prompt: "CCTV surveillance still, grainy, timestamp 02:14 AM, Florida corner store...") — fastest.
     - Or use stock photos with added grain/timestamp overlay via canvas.
   - Convert to base64: `node -e "console.log('data:image/jpeg;base64,'+require('fs').readFileSync('public/evidence/01.jpg','base64'))"` → paste into `evidence.ts` or keep as imports.
   - Update bboxes to match actual face/plate positions in each photo (measure in any image editor, normalize to 0-1000).

4. **Verify Editor Theming:**
   - After `npm install`, read `node_modules/@unlayer/react-image-editor/dist/index.d.ts` to confirm `theme` / `tools` prop shapes.
   - Confirm editor renders without SSR error: `npm run build && npm run start` → no `window is not defined`.
   - Confirm `onSave` fires and returns `{dataUrl, blob}` with correct shape — log to console.

**Done when (60% MILESTONE — MUST RUN END-TO-END):**
- [ ] Click OPEN → editor mounts inside terminal without error
- [ ] Draw / crop / filter / sticker all work
- [ ] Click SAVE → `onSave` fires → `dataUrl` logged to console → status transitions to SUBMITTING
- [ ] `hasChanges()` returns false before edits, true after
- [ ] `reset(nextImage)` loads next evidence and clears undo stack
- [ ] `npm run build` passes with no SSR errors

**Commits:**
- `feat: forensics terminal — editor embedded (ssr:false) + onSave wired`
- `feat: real evidence photos + bbox calibration`

---

### Phase 3 — Forensics Scorer (Day 5 — 4 hours) ★ SCORING HEART

**Goal:** Deterministic pixel-diff scorer that reads your edits and returns DISMISSED/BUSTED. Instant, offline, trustworthy.

**Build:**

1. **`lib/scorer.ts`** (as spec'd in Section 7)
   - `scoreForensics(originalDataUrl, editedDataUrl, evidence) => Promise<ScoreResult>`
   - Offscreen canvas approach: `new Image()` → `canvas.getContext("2d")` → `drawImage` → `getImageData`
   - Handle crop: if edited dimensions < original and bbox outside edited bounds → 100% obscured
   - Pixel diff threshold: 30 per channel (tune after playtesting)
   - Verdict: DISMISSED if all regions ≥70%, else BUSTED
   - **Must be async** (image loading is async)

2. **`components/ForensicSweep.tsx`**
   - Props: `score: ScoreResult | null`, `scanning: boolean`
   - Scanning state: horizontal scan bar sweeps left→right over evidence image (Framer Motion `x: ["0%", "100%"]` with `duration: 1.2`)
   - Results: 3 rows that resolve sequentially with stagger (0.3s apart):
     ```
     FACE RECOGNITION ........ FAILED ✓  (mint)  or  MATCHED ✗ (red)
     PLATE OCR ................ FAILED ✓  or  MATCHED ✗
     TAMPER SCORE ............. 94% — CASE DISMISSED  or  31% — INSUFFICIENT
     ```
   - Each row: `motion.div` with `initial: { opacity: 0, x: -10 }` → `animate: { opacity: 1, x: 0 }` + typewriter sound (optional)
   - Dot-matrix printer sound on reveal (stretch)

3. **Wire into `EvidenceLocker.tsx`:**
   - `SUBMITTING` → `useEffect` calls `scoreForensics(original, editedDataUrl, evidence)` → dispatch `SCORE_RESULT` → `DISMISSED` or `BUSTED`
   - Show `ForensicSweep` with `scanning=true` for 1.5s before revealing results (builds tension)
   - Store `score` in state for verdict screen

4. **Playtest & Tune:**
   - Test: no edits → BUSTED (0% obscured)
   - Test: scribble over face + crop plate → DISMISSED
   - Test: blur only → depends on strength, should need significant blur to pass
   - Test: filter brightness max → may pass if threshold is 30 (global shift counts)
   - Adjust threshold (30) and pass mark (70%) until "obvious redact passes, no-op fails, subtle filter is borderline"

**Done when:**
- [ ] No edits → BUSTED with 0-5% scores
- [ ] Full redact (draw + crop) → DISMISSED with 85%+ scores
- [ ] Scan animation plays for 1.5s before results
- [ ] Results show per-region with correct ✓/✗ and colors

**Commits:**
- `feat: forensic scorer — pixel-diff engine + verdict logic`
- `feat: forensic sweep animation + result display`

---

### Phase 4 — Verdict & Poster Reward (Day 6 — 3 hours)

**Goal:** WASTED/DISMISSED screens with star animation + poster trophy. Demo loop is now complete.

**Build:**

1. **`components/VerdictScreen.tsx`**
   - Props: `verdict: "DISMISSED" | "BUSTED"`, `score: ScoreResult`, `onNext: () => void`, `onRetry: () => void`
   - **DISMISSED:**
     - Full-screen mint flash: `motion.div` with `background: var(--accent)` flash then fade
     - Large `DISMISSED` in Anton, mint, with stamp texture
     - Stars: 5→0 animation — each star `motion.div` with `animate: { scale: [1, 1.4, 0], opacity: [1, 1, 0] }` staggered 0.1s, with chime sound
     - Cash: `motion` number tick `$0 → $12,500` via `useSpring`
     - Button: `GENERATE POSTER` (mint) + `NEXT CASE →` 
   - **BUSTED:**
     - Red flash + `WASTED` in GTA font (red, large, slight glow)
     - Stars stay 5/5, shake animation: `x: [0, -4, 4, -4, 0]`
     - Button: `RETRY` + `NEXT CASE ANYWAY →` (let judge proceed even after fail)
   - Evidence bag gets stamp overlay: `DISMISSED` (mint, rotated) or `FLAGGED` (red)

2. **`components/PosterReward.tsx` + `lib/poster.ts`**
   - Props: `editedDataUrl: string`, `evidence: Evidence`, `verdict: "DISMISSED"`
   - Canvas composition (1080×1350):
     ```
     ┌─────────────────────┐
     │  LEONIDA POLICE     │  ← header bar, Anton, small
     │  NOT WANTED         │  ← large, mint, stamped
     │                     │
     │  [edited image]     │  ← centered, with frame/border
     │                     │
     │  CASE 06-A          │  ← mono, evidence label
     │  DISMISSED          │  ← mint stamp
     │  TAMPER: 94%        │  ← score
     │                     │
     │  leonida-06.app     │  ← footer, small
     └─────────────────────┘
     ```
   - Generate via offscreen canvas: `createElement("canvas")` → `width=1080, height=1350` → draw edited image + text + stamps → `toDataURL("image/png")`
   - Export: `Download` button (`<a download="leonida-06-poster.png" href={posterDataUrl}>`) + `Share` button (Web Share API or copy link)
   - Share image is the poster itself — perfect for `#BuiltWithImageEditor` tweet

3. **Complete state in `EvidenceLocker.tsx`:**
   - `DISMISSED` → show `VerdictScreen` + `PosterReward` (poster generates on mount via `useEffect`)
   - `NEXT_EVIDENCE` → increment `evidenceIndex`, `reset()` editor, back to `IDLE` with next bag
   - After 3rd evidence dismissed → `COMPLETE` → gallery of 3 posters + final share CTA

**Done when:**
- [ ] DISMISSED shows mint flash, star drop, cash tick, poster
- [ ] BUSTED shows red WASTED, stars shake, retry works
- [ ] Poster is 1080×1350 PNG, downloads correctly
- [ ] Full loop works: evidence 1 → edit → dismissed → next → evidence 2 → ... → complete

**Commits:**
- `feat: verdict screens — WASTED/DISMISSED + star + cash animations`
- `feat: poster reward — canvas generator + download + share`

---

### Phase 5 — Polish & First-Run (Day 7 — 2 hours)

**Goal:** Feels AAA, not prototype. First-time judge knows what to do without asking.

**Build:**

1. **First-run overlay:**
   - On first `EDITING` entry, show 5-second tooltip: arrow pointing to editor toolbar → `"CROP the plate. REDACT the face. BLUR the rest."` → auto-dismiss or click to dismiss. Store `hasSeenTutorial` in localStorage.

2. **Copy pass:**
   - All-caps terminal labels, mono for evidence metadata, no AI-isms ("delve", "leverage", "cutting-edge" — delete on sight).
   - Evidence labels read like real police logs: `EVIDENCE 06-A • CORNER STORE • 02:14 AM • FLAG: FACE + PLATE`

3. **Responsive:**
   - Desktop: terminal centered, max-width 960px, evidence + editor side-by-side or stacked
   - Mobile: stacked, editor full-width, touch-friendly toolbar (editor handles this, but verify)
   - `min-width: 320px`, no horizontal scroll

4. **Accessibility:**
   - `aria-label` on editor wrapper, buttons have visible focus rings (`outline: 2px solid var(--accent)`)
   - `prefers-reduced-motion` — disable scanline flicker and star pulse if set

5. **Sound (stretch, muted by default):**
   - Star chime (GTA-style), scan sweep hum, dot-matrix tick, cash register. Web Audio with mute toggle.

**Done when:** A stranger can play without instructions and the page looks intentional at every breakpoint.

**Commits:**
- `polish: first-run tutorial + copy pass + responsive + a11y`

---

### Phase 6 — Resilience & Offline (Day 8 — 2 hours)

**Goal:** Demo cannot fail on stage. Works with no WiFi. Has a backup video.

**Build:**

1. **Offline proof:**
   - All evidence base64 bundled — no fetch on load. Verify: open DevTools → Network → Offline → reload → game still works.
   - Editor CDN: `@unlayer/react-image-editor` bundles editor code, but verify it doesn't fetch external assets at runtime. If it does, note in README.

2. **`hasChanges` guard:**
   - If player clicks SUBMIT without edits → show inline warning: `"NO TAMPERING DETECTED — YOU'LL GET BUSTED. MAKE AN EDIT FIRST."` + shake the submit button. Don't run scorer.

3. **Error boundaries:**
   - Wrap `ForensicsTerminal` in error boundary that shows "TERMINAL OFFLINE — RETRY" with `reset()` button.
   - Wrap scorer in try/catch — `SecurityError` → "FORENSICS OFFLINE — EVIDENCE CORRUPTED — RETRY"

4. **Recorded backup:**
   - Screen-record a perfect 60-second run (evidence → edit → dismissed → poster) as MP4.
   - Keep on desktop + upload as unlisted YouTube or include in repo as `demo.mp4` reference.
   - Also keep a local `npm run build && npm run start` on laptop as offline fallback.

5. **Vercel preview check:**
   - Test on phone (real device), incognito, slow 3G throttle — all must work.

**Done when:** Game works offline, errors are handled with retry, backup video exists.

**Commits:**
- `fix: offline resilience — hasChanges guard + error boundaries + offline verify`

---

### Phase 7 — Deploy Freeze & Submission (Day 9 — 2 hours)

**Goal:** Frozen, polished, submitted. No code after 18:00 UTC.

**Steps:**

1. **Final `npm run build` check:**
   ```bash
   npm run build    # must pass with no errors
   npm run start    # smoke test production build
   # Open http://localhost:3000 → full loop works
   ```

2. **README.md — Judge Artifact:**
   - Must be criteria-mapped (see Section 14). This is what AI graders and tired judges read first.
   - Include: problem → insight → architecture → editor usage → demo GIF/video → live URL → GitHub → how it maps to each judging criterion.

3. **Vercel production deploy:**
   ```bash
   vercel --prod
   # Verify live URL: full loop, poster download, mobile, no console errors
   ```

4. **Submission:**
   - Form: http://forms.gle/QxJSXeASJXJrW51y9
   - Public GitHub repo URL
   - Deployed URL (Vercel)
   - Share on X/Twitter with `#BuiltWithImageEditor` + poster image + live URL

5. **Freeze:** No more code pushes after submission. Only fix if deploy is broken.

**Commits:**
- `docs: README — criteria-mapped judge artifact + demo GIF`
- `chore: production deploy freeze`

---

## 10. Component Specs

### EvidenceLocker (main orchestrator)

```tsx
// components/EvidenceLocker.tsx
"use client";

import { useReducer, useEffect, useRef, useState } from "react";
import { EVIDENCE } from "@/lib/evidence";
import { scoreForensics, type ScoreResult } from "@/lib/scorer";
// ... imports

export function EvidenceLocker() {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const editorRef = useRef<{ editor: any }>(null);

  // Timer effect — only when EDITING
  useEffect(() => {
    if (state.status !== "EDITING") return;
    const id = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(id);
  }, [state.status]);

  // Scorer effect — when SUBMITTING
  useEffect(() => {
    if (state.status !== "SUBMITTING") return;
    const evidence = EVIDENCE[state.evidenceIndex];
    scoreForensics(evidence.originalDataUrl, state.editedDataUrl, evidence)
      .then((score) => {
        if (score.verdict === "DISMISSED") {
          // generate poster dataUrl here
          dispatch({ type: "SCORE_RESULT", score, posterUrl });
        } else {
          dispatch({ type: "SCORE_RESULT", score });
        }
      });
  }, [state.status]);

  // Render branches on state.status
}
```

### TerminalChrome

```tsx
type TerminalChromeProps = {
  wantedLevel: number;    // 0-5
  cash: number;
  timeLeft?: number;      // only in EDITING
  caseLabel: string;
  children: React.ReactNode;
};
```

### EvidenceBag

```tsx
type EvidenceBagProps = {
  evidence: Evidence;
  stamp?: "DISMISSED" | "FLAGGED" | null;
  editCount?: number;
};
```

### ForensicsTerminal

See Section 6 for full spec.

### ForensicSweep

```tsx
type ForensicSweepProps = {
  scanning: boolean;
  score: ScoreResult | null;
  evidence: Evidence;
};
```

### VerdictScreen

```tsx
type VerdictScreenProps = {
  verdict: "DISMISSED" | "BUSTED";
  score: ScoreResult;
  onNext: () => void;
  onRetry: () => void;
};
```

### PosterReward

```tsx
type PosterRewardProps = {
  editedDataUrl: string;
  evidence: Evidence;
  score: ScoreResult;
};
```

---

## 11. Data & Assets

### Evidence Photos — Sourcing

**Option A (recommended, fastest):** Generate 3 images via image generation:

1. `06-A CORNER STORE:` "CCTV surveillance still, grainy low-light, Florida corner store interior at 2:14 AM, person at register facing camera, timestamp overlay 02:14:33 09/14/2026, license plate visible through window, security camera perspective, photorealistic"
2. `06-B GETAWAY CAR:` "CCTV still, rear view of dark sedan at night, license plate LEON 06 clearly visible, motel parking lot, grainy surveillance quality, timestamp 02:47 AM"
3. `06-C MOTEL LEDGER:` "Overhead surveillance still, motel front desk, open ledger with handwritten names, person's hands visible, timestamp 03:12 AM, grainy CCTV"

**Option B:** Stock photos + canvas grain/timestamp overlay.

**Processing each photo:**
1. Resize to ~800×600 (keeps base64 <150KB each, total <500KB)
2. Add subtle grain + timestamp text via canvas or image editor
3. Convert to base64 and inline in `evidence.ts`
4. Measure face/plate bboxes, normalize to 0-1000

### Font Loading (`app/layout.tsx`)

```tsx
import { Anton, JetBrains_Mono, Inter } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
```

### Sound Assets (stretch)

- `star-chime.mp3` — GTA star collect (short, ~0.5s)
- `scan.mp3` — forensic sweep hum
- `cash.mp3` — register tick
- All muted by default, toggle in header. Use Web Audio `new Audio()` — no library needed.

---

## 12. Demo Script — 90 Seconds

| Time | Beat | What Judge Sees | What Presenter Does/Says |
|---|---|---|---|
| 0:00–0:08 | **BEFORE** | VCPD terminal: `CASE LEONIDA-06 • 3 ITEMS PENDING` + 5 amber stars pulsing + `$0` + evidence bag slides in. Photo: Lucia at store, face + plate clear. Red stamps: `FACE DETECTED` `PLATE LEON 06 DETECTED`. Timer `00:45` ticks. Siren chirp. | "Three evidence photos. Forensics reviews them in 45 seconds. If they match a face or plate, you're done." |
| 0:08–0:12 | **OPEN** | Click `OPEN FORENSICS TERMINAL` → editor opens inside terminal chrome. Toolbar visible: Crop, Draw, Filter, Stickers, etc. | "I have to break the evidence." |
| 0:12–0:28 | **EDIT (live, <20s)** | 1. **Crop** — drag to cut plate out of frame. 2. **Draw** — black scribble over face (2 strokes). 3. **Filter** — drag Blur + Exposure to blow out detail. 4. **Sticker** — slap `EVIDENCE CORRUPTED` stamp. | Perform edits briskly. Say tool names aloud: "Crop the plate. Redact the face. Blow the exposure." |
| 0:28–0:32 | **SUBMIT** | Click `SAVE & SUBMIT TO FORENSICS` → `onSave` fires. Terminal prints `FLATTENING LAYERS... ANALYZING...` with typing animation. | "Submit to forensics." |
| 0:32–0:50 | **SWEEP (astonishment)** | Scan bar sweeps left→right over edited image. Three checks resolve with typewriter + stagger: `FACE RECOGNITION ........ FAILED ✓` (mint) → `PLATE OCR ................ FAILED ✓` → `TAMPER SCORE ............. 94% — CASE DISMISSED` | Silence. Let the machine talk. |
| 0:50–1:00 | **VERDICT** | Mint flash. Stars 5→0 with chime (each star pops). `WANTED LEVEL CLEARED` in mint. Cash `$0 → $12,500` ticks. Evidence bag gets `DISMISSED` stamp. | "Wanted level cleared." |
| 1:00–1:20 | **REWARD** | Click `GENERATE POSTER` → edited image framed as Vice City poster: `LEONIDA-06 • NOT WANTED` + `DISMISSED` stamp + score. Download + Share buttons. | "The poster is the trophy for beating the system. Three cases. Try to beat the forensics." |
| 1:20–1:30 | **CLOSE** | Final frame: live URL + QR + `#BuiltWithImageEditor` + GitHub. | "LEONIDA-06. Doctor the evidence. Beat the system. Link in the repo." |

**Where astonishment lands:** At 0:38 when the machine reads the pixels you just vandalized and agrees you got away with it. Not a filter demo — you vs. the system, live.

**Backup if live edit fails:** Play the pre-recorded MP4 (same 60s run, perfect edits) — "Here's a clean run while I reload the terminal."

---

## 13. Risk Register & Fallbacks

| # | Risk | Likelihood | Impact | Trigger | Fallback | Owner |
|---|---|---|---|---|---|---|
| R1 | Canvas tainted → `getImageData` throws `SecurityError` | Low (base64 = no taint) | HIGH — scorer dead | `SecurityError` on `getImageData` | All evidence as base64 data URLs from day 1. Never load external URL in MVP. Catch + show "FORENSICS OFFLINE — RETRY" | You |
| R2 | Editor fails to load (CDN/network) | Low | HIGH — no game | `onError` / `onLoadError` fires | "TERMINAL OFFLINE — RETRY" with `reset()` button. Auto-retry on next mount. Recorded video backup plays. | You |
| R3 | Scorer feels fake (1px edit passes) | Medium | HIGH — WOW collapses | Playtest: tiny edit yields DISMISSED | Require BOTH regions ≥70% obscured. Tune threshold (30) + pass mark (70%) after playtesting. Show bbox overlay in debug (`?debug=1`). | You |
| R4 | Custom sticker icons don't override | Medium | LOW — cosmetic | `tools.stickers.icon` URL ignored | Fallback to default stickers + use `text` tool with GTA presets ("REDACTED", "CLASSIFIED"). Same gameplay. | You |
| R5 | No WiFi on stage | Medium | HIGH — deploy unreachable | Vercel URL won't load | All assets bundled, works offline after first load. Keep local `npm run build && npm run start` on laptop + MP4 on desktop. | You |
| R6 | Next.js SSR error (`window is not defined`) | Medium if forgotten | HIGH — build fails | `npm run build` throws on editor import | Editor is `dynamic(..., { ssr: false })` + `"use client"` on wrapper. Verify with `npm run build` in Phase 2. | You |
| R7 | Evidence base64 too large → slow load | Low | MEDIUM — first paint slow | Lighthouse / bundle size >1MB | Resize evidence to 800×600, compress to ~100KB each. Total evidence budget: <400KB base64. | You |

---

## 14. Deployment & Submission Checklist

### GitHub

- [ ] Repo is **public** at `github.com/<you>/leonida-06` (or chosen name)
- [ ] `README.md` is criteria-mapped (see below)
- [ ] Source code is complete and pushed (not just `dist`)
- [ ] License: MIT (matches editor)
- [ ] No secrets in repo (no API keys — there are none, but check)

### README — Judge Artifact Structure

```markdown
# LEONIDA-06: EVIDENCE LOCKER

> Doctor police surveillance photos to make the case get thrown out before forensics catches you.

[Live Demo](https://leonida-06.vercel.app) · [Video (60s)](https://...) · #BuiltWithImageEditor

![Terminal screenshot](public/screenshot-terminal.png)
![Poster reward](public/screenshot-poster.png)

## The Insight
Every GTA challenge entry lets you *make* a cool image. This one makes you *destroy* evidence to get away with a crime. The image editor is the weapon.

## How It Works
- **Evidence in** — 3 surveillance photos with flagged face + plate regions
- **Tamper** — React Image Editor as VCPD Forensics Terminal (crop/draw/filter/sticker/text/shapes/frame)
- **Forensics** — deterministic pixel-diff scorer reads your edited pixels vs hidden bboxes
- **Verdict** — DISMISSED (stars 5→0) or WASTED, poster trophy on win

## Architecture
Next.js 15 (App Router) + react-image-editor (ssr:false) + Framer Motion + CSS Modules
Scorer: offscreen canvas getImageData, no API calls, works offline.

## React Image Editor Usage (load-bearing)
| API | Role |
|---|---|
| image (base64) | Evidence photo per level |
| onSave({dataUrl}) | Scoring trigger — captures edited pixels |
| hasChanges() | Guard — no edits = instant BUSTED |
| getImage() | Poster generation without re-opening editor |
| reset(url) | Level progression |
| tools (all 8) | Each is a tampering method |

## Judging Criteria → Shipped Features
| Criterion | Feature | Evidence |
|---|---|---|
| Creativity | Evidence tampering inversion | No prior entry does destroy-not-create |
| Visual Execution | VCPD terminal, CRT, stamp, star chime | Screenshot above |
| Use of Editor | Editor IS the game mechanic | No edit = lose, every tool has purpose |
| Overall Experience | 60s loop: tension → edit → sweep → reward | Video above |

## Run Locally
npm install && npm run dev  # http://localhost:3000
npm run build && npm run start  # production smoke test

## Deploy
Vercel — zero config for Next.js. `vercel --prod`
```

### Vercel

- [ ] Connected to GitHub repo (auto-deploy on push)
- [ ] Production deploy succeeds: `vercel --prod` → live URL
- [ ] Live URL tested: full loop, poster download, mobile, incognito, slow 3G
- [ ] No console errors on live URL

### Submission

- [ ] Form: http://forms.gle/QxJSXeASJXJrW51y9
  - Public GitHub URL
  - Deployed URL (Vercel)
  - Contact / X handle
- [ ] Share on X/Twitter:
  - Poster image (1080×1350)
  - Live URL
  - `#BuiltWithImageEditor` hashtag
  - Tag `@unlayer`
- [ ] Submitted before **September 24, 2026 — 23:59 UTC** (submit by 12:00 UTC to be safe)

---

## 15. NOT-BUILDING List

Explicitly out of scope for MVP. Saying no is how you ship.

| Not Building | Why | When (if ever) |
|---|---|---|
| User uploads (file input → base64) | CORS/moderation risk, not needed for demo. Bundled evidence is deterministic. | Stretch after Phase 4, only if 60% milestone is solid |
| Auth / database / multiplayer | No judge value, adds deploy complexity | Never for this challenge |
| Real LLM vision API in scorer | Unreliable on stage, costs money, adds latency | Never — deterministic scorer is the point |
| Map / 3D / car configurator | Scope kill, not related to evidence tampering | Never |
| Admin panel / evidence CMS | No judge value | Never |
| Custom backend | All client-side, offline-proof is stronger | Never |
| `/evidence/[id]` routing | Single-page is simpler, no SEO need | Only if adding deep-link sharing |
| AI Assistant (`features.ai` + `projectId`) | Paid, unverified, not load-bearing | Stretch only if free key available |
| Leaderboard (beyond localStorage) | Needs backend | Stretch: localStorage only |

---

## 16. Verification Commands

Run these at each phase gate. Do not skip.

```bash
# Phase 0 — scaffold
npx create-next-app@latest unlayer --typescript --eslint --app --src-dir=false --import-alias="@/*"
npm install @unlayer/react-image-editor framer-motion
npm run dev          # http://localhost:3000 — should show terminal shell
npm run build        # must pass, no SSR errors
vercel --prod        # live URL

# Phase 2 — editor integration (after install)
cat node_modules/@unlayer/react-image-editor/dist/index.d.ts | head -n 150
grep -r "tools" node_modules/@unlayer/react-image-editor/dist/ --include="*.d.ts" | head
grep -r "theme" node_modules/@unlayer/react-image-editor/dist/ --include="*.d.ts" | head
npm run build        # verify no "window is not defined"
npm run start        # smoke test prod build

# Phase 3 — scorer
npm run build && npm run start
# Manual playtest:
# 1. No edits → submit → BUSTED (0%)
# 2. Scribble + crop → submit → DISMISSED (85%+)
# 3. Offline: DevTools → Network → Offline → reload → still works

# Phase 7 — freeze
npm run build        # final build must pass
npm run start        # final smoke test — full loop, poster download, mobile
# Test live Vercel URL on phone + incognito + slow 3G
```

---

## 17. Polish — Final 10%

These convert near-wins into wins. Do not skip.

- [ ] **Visual coherence:** One accent (mint-teal), flat blue-black, no violet, no glass. Every screen looks like Leonida PD.
- [ ] **Copy:** All-caps terminal type (Anton), mono for evidence labels, typewriter reveal on forensic log. Zero AI-isms.
- [ ] **First-run:** 5-second overlay with arrow → "Crop the plate. Redact the face." Auto-dismiss, localStorage flag.
- [ ] **"They thought of that" detail:** Evidence bag chain-of-custody tag shows edit count (`TAMPER COUNT: 4 EDITS` from `hasChanges` / pixel diff).
- [ ] **Poster share card:** 1080×1350, perfect for Instagram. Judge will screenshot it.
- [ ] **README:** Criteria-mapped, self-contained, with screenshots + live URL + architecture. AI graders read this first.
- [ ] **Demo resilience:** Offline mode proven, recorded MP4 on desktop, local `npm run start` as fallback.
- [ ] **No failing button:** Every CTA does something. No dead "COMING SOON" or silent no-op.
- [ ] **Performance:** Lighthouse >90, evidence total <400KB base64, no layout shift on editor mount.
- [ ] **One unforgettable sentence:** If judge remembers one thing at 11pm, it's "the one where you vandalize evidence and the machine says you got away with it."

---

## Appendix — Quick Reference

### Design Tokens (copy-paste)

See Section 4 for full token CSS. Key values: `--bg-0: #070B14`, `--accent: #14F0B8`, `--danger: #FF3B30`, `--warning: #FFCC02`.

### Evidence Bbox Normalization

```
x_norm = (x_px / image_width) * 1000
y_norm = (y_px / image_height) * 1000
w_norm = (w_px / image_width) * 1000
h_norm = (h_px / image_height) * 1000
```

Store 0-1000, map to actual canvas size at score time: `x_actual = (x_norm / 1000) * canvas.width`.

### Next.js Dynamic Import Pattern (memorize)

```tsx
const ReactImageEditor = dynamic(
  () => import("@unlayer/react-image-editor").then((m) => m.ReactImageEditor),
  { ssr: false, loading: () => <div>INITIALIZING...</div> }
);
```

### Submission Links

- Challenge form: http://forms.gle/QxJSXeASJXJrW51y9
- Hashtag: `#BuiltWithImageEditor`
- GitHub: https://github.com/unlayer/react-image-editor
- Docs: https://docs.unlayer.com/builder/latest/images/image-editor
- FAQ: https://unlayer.notion.site/Build-With-Image-Editor-Challenge-FAQ-3cf0ceb4c8e180309d91cd730811ebd1
- Unlayer X: @unlayer

---

*Built for 1st place. No hedging, no poster-generator fallback, no generic template. One idea, fully committed.*

*Mustapha Fadhlullah — independent security researcher*
