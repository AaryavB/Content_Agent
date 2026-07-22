import {
  lintSlop,
  scrubHardTokens,
  describeViolations,
} from "../convex/lib/slopFilter.ts";

const bad = `In today's fast-paced world, we need to leverage AI — it's not just a tool, it's a game-changer.

The result?

Huge wins.

Big shift.

New era.

Thoughts?`;

const violations = lintSlop(bad);
console.log("bad violations:", violations.length);
console.log(describeViolations(violations));
console.log("scrubbed trailing CTA removed:", !scrubHardTokens(bad).includes("Thoughts?"));
console.log("scrubbed em dash removed:", !scrubHardTokens(bad).includes("—"));

const good =
  "Most founders overcomplicate their first hire. I waited six months and hired someone who could run ops while I sold. That one decision freed 15 hours a week.";
console.log("good violations:", lintSlop(good).length);
