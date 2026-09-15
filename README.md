# LEONIDA-06 — EVIDENCE LOCKER

**Alter the exhibits until forensics can't match them, and get the case thrown out.**

Built for the **#BuiltWithImageEditor** challenge. A GTA VI–inspired game where the
React Image Editor isn't decoration — it's the weapon.

---

## What this actually is

Most entries built with an image editor ask you to **make** something: a poster, a
meme, a cover. This one asks you to **destroy** something. You're a clerk in the
Leonida Police Department property room, and three exhibits are about to send
someone away. Your job is to make sure they don't survive forensic analysis.

Each exhibit carries a flagged face and a flagged plate. Forensics re-reads those
two regions on whatever you submit. If both still read, you're caught.

- Obscure **70% of every flagged region** and the case gets thrown out.
- Submit the exhibit untouched and you're caught immediately.
- Every edit is permanent — you submit once, then live with it.

## The loop

```
  collect              tamper               submit            verdict
┌───────────┐      ┌──────────────┐     ┌───────────┐     ┌───────────┐
│  exhibit  │  →   │  forensics   │  →  │  forensic │  →  │ DISMISSED │
│  folder   │      │  terminal    │     │   sweep   │     │  / BUSTED │
│ face+plate│      │ (the editor) │     │  reads    │     │  + poster │
│  flagged  │      │  8 tools     │     │  pixels   │     │           │
└───────────┘      └──────────────┘     └───────────┘     └───────────┘
```

Win and you get a **dismissal notice** — a 1080×1350 poster stamped `DISMISSED`,
generated from your own altered exhibit.

## How forensics actually decides

No API, no model, no randomness. `lib/scorer.ts` compares the pixels you submitted
against the exhibit as filed, inside each flagged region, and counts a pixel as
obscured when any channel moves by more than 30.

Cropping is handled honestly. The submitted frame is placed inside the original
frame preserving aspect, and whatever your edit no longer covers is recorded as
**removed** — so cropping a region out of frame counts as obscuring it, while a
plain resize earns no free pass. That distinction is the difference between a
scorer a judge can trust and one that can be gamed by zooming.

The scoring logic is pure functions over plain arrays, so it's tested without a
browser: run `node --experimental-strip-types scorer.test.mjs` for 18 checks
covering region mapping, frame placement, the diff threshold, and crop handling.

## The React Image Editor is load-bearing

Remove it and there is no game. What it drives:

| Editor API | Role in the game |
|---|---|
| `image` (data URL) | The exhibit loaded for tampering |
| `onSave({ dataUrl, blob })` | The submit trigger — this is what gets scored |
| `hasChanges()` | Polled live; the terminal reads "Altered" or "Unchanged" |
| `onLoadError` / `onError` | Distinguishes a dead exhibit from a dead terminal |
| `reset()` / remount | Moving between exhibits, and recovering a failed mount |

Every tool the editor exposes is a tampering method. Lose one and you lose an
option.

## The design

The subject is paperwork fraud, so the interface is a property room rather than a
glowing terminal — manila folders, typed exhibit tags, chain-of-custody forms,
redaction tape, rubber stamps. Courier Prime carries what should look *typed*;
Archivo carries what should be *read*; Archivo Black is the stamp, used large and
rarely. Neon appears as signage only, never as chrome.

Two deliberate constraints: colour pairs were held to WCAG AA (verified
numerically, not by eye), and every animation respects `prefers-reduced-motion`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build && npm run start   # production smoke test
node --experimental-strip-types scorer.test.mjs   # scoring logic
```

## Stack

Next.js 16 (App Router) · React 19 · `@unlayer/react-image-editor` (client-only,
`ssr: false`) · Framer Motion · Tailwind v4 with a CSS custom-property token layer.

## Known limits

Stated plainly, because they affect what you'll see:

- **The editor loads its runtime from `cdn.unlayer.com`.** It needs network access
  on first load. True offline operation requires an encrypted licence we don't have,
  so "works with no WiFi" is not a claim this build earns.
- **The exhibits are drawn SVG stills, not photographs.** They're built to read as
  degraded CCTV — grain, interference bands, lens falloff, a sync tear — and they
  score deterministically, but they are illustrations.
- **`gta-pic.jpg` is unused.** `gta6-cover.jpg` (Key art © Rockstar Games) sits
  behind the interface at low opacity. A work of fan fiction, not affiliated with
  Rockstar Games.
