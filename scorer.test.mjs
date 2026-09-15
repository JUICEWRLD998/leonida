import {
  mapRegion,
  placeFrame,
  fullyUncovered,
  countObscured,
  tamperScoreOf,
} from "./lib/scorer.ts";

let failures = 0;
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? "  ok  " : "  FAIL"}  ${name}` +
      (ok ? "" : `\n          expected ${JSON.stringify(expected)}\n          actual   ${JSON.stringify(actual)}`)
  );
};

console.log("── mapRegion: authored 800×500 → canvas ──");
check("identity at 800×500", mapRegion({ x: 360, y: 165, w: 80, h: 95 }, 800, 500), { x: 360, y: 165, w: 80, h: 95 });
check("halved to 400×250", mapRegion({ x: 360, y: 165, w: 80, h: 95 }, 400, 250), { x: 180, y: 83, w: 40, h: 48 });

console.log("\n── placeFrame: contains the edit inside the source frame ──");
check("same size is identity", placeFrame(800, 500, 800, 500), { x: 0, y: 0, w: 800, h: 500 });
// Same aspect, half size: still covers exactly, no margin.
check("same aspect fills exactly", placeFrame(400, 250, 800, 500), { x: 0, y: 0, w: 800, h: 500 });
// Wide crop: keeps full width, so top and bottom bands are left uncovered.
check("wide crop letterboxes vertically", placeFrame(800, 250, 800, 500), { x: 0, y: 125, w: 800, h: 250 });
// Tall crop: keeps full height, banded on the left and right.
check("tall crop letterboxes horizontally", placeFrame(400, 500, 800, 500), { x: 200, y: 0, w: 400, h: 500 });

console.log("\n── fullyUncovered: a region the crop removed entirely ──");
const wideCover = placeFrame(800, 250, 800, 500); // kept band is y 125..375
check(
  "region in the removed top band is uncovered",
  fullyUncovered({ x: 360, y: 40, w: 80, h: 60 }, wideCover),
  true
);
check(
  "region in the removed bottom band is uncovered",
  fullyUncovered({ x: 360, y: 420, w: 80, h: 50 }, wideCover),
  true
);
check(
  "region inside the kept band is still covered",
  fullyUncovered({ x: 360, y: 165, w: 80, h: 95 }, wideCover),
  false
);

const fullFrame = placeFrame(800, 500, 800, 500);
check("nothing is uncovered when the frame is intact", fullyUncovered({ x: 0, y: 0, w: 800, h: 500 }, fullFrame), false);

console.log("\n── countObscured: threshold, and the strip marker ──");
const px = (r, g, b, a = 255) => [r, g, b, a];
check("identical pixels score 0", countObscured([...px(100, 100, 100), ...px(50, 50, 50)], [...px(100, 100, 100), ...px(50, 50, 50)]), 0);
check("a shift of exactly 30 is not obscured", countObscured([...px(100, 0, 0)], [...px(130, 0, 0)]), 0);
check("a shift of 31 is obscured", countObscured([...px(100, 0, 0)], [...px(131, 0, 0)]), 1);
// A large real change is obscured regardless of direction.
check("a large painted-over change is obscured", countObscured([...px(100, 100, 100)], [...px(1, 2, 4)]), 1);
// The strip marker counts as obscured even against an identical original.
check("strip marker counts as obscured", countObscured([...px(1, 2, 3)], [...px(1, 2, 3)]), 1);

console.log("\n── tamperScoreOf ──");
check("averages the regions", tamperScoreOf([{ obscuredPercent: 100, passed: true }, { obscuredPercent: 50, passed: false }]), 75);

// ── The regression this change exists for ──
// The old code stretched a cropped frame to fill the canvas, so every pixel
// differed and BOTH regions scored ~100% — a crop was an automatic pass, and
// "no edit" could not be distinguished from "cropped". Contain placement means
// a same-aspect frame maps exactly (no free pass) while an aspect-changing
// crop leaves real bands, which is the crop credit the spec asks for.
console.log("\n── regression: cropping must not be a free pass ──");
check(
  "a same-aspect crop leaves NO uncovered area",
  fullyUncovered(mapRegion({ x: 360, y: 165, w: 80, h: 95 }, 800, 500), placeFrame(400, 250, 800, 500)),
  false
);
check(
  "an aspect-changing crop DOES leave uncovered area",
  fullyUncovered(mapRegion({ x: 360, y: 40, w: 80, h: 60 }, 800, 500), placeFrame(800, 250, 800, 500)),
  true
);

console.log("\n── positive control ──");
// The two outcomes above differ, so the detector is discriminating rather than
// always returning one answer.
const a = fullyUncovered({ x: 360, y: 40, w: 80, h: 60 }, wideCover);
const b = fullyUncovered({ x: 360, y: 165, w: 80, h: 95 }, wideCover);
console.log(`  ${a !== b ? "ok  " : "FAIL"}  detector discriminates (${a} vs ${b})`);

console.log(failures === 0 ? "\nRESULT: PASS" : `\nRESULT: FAIL (${failures})`);
process.exitCode = failures === 0 ? 0 : 1;
