# Exhibit stills

Drop three images here and run:

```bash
node tools/ingest-evidence.mjs
```

Name them so the order is unambiguous — they map to the three exhibits in
filename order:

| File | Exhibit |
|---|---|
| `01-*.jpg` | 06-A Corner store |
| `02-*.jpg` | 06-B Getaway car |
| `03-*.jpg` | 06-C Motel ledger |

`.jpg`, `.png` and `.webp` are all read. Ideal is 8:5 and at least 1200px
wide; other ratios work but will crop, which moves where the scoring zones
land.

Any image dropped here must be one you have the right to publish — this repo
is public.

The tool reads the real pixel dimensions and prints the factors needed to
author the face/plate scoring zones for each still. Committing the images
alone is not enough: `lib/evidence.ts` has to point at them and the zones
have to be calibrated, or scoring will read the wrong pixels.
