---
name: audit-numbers
description: "Verify that every figure in the repo reconciles — UI, /math, README, demo script, tests, screenshots — against docs/numbers.md. Fire when a number looks wrong, when a figure changes, and once before submission. The final judging pass is extended-thinking synthesis and it will catch what this misses."
---

# Audit the numbers

One stale figure reads as sloppiness across the whole repo, and the judging pipeline's last pass is an extended-thinking synthesis specifically good at catching internal contradictions. This procedure is cheap. Run it.

## 1. Establish the source of truth

`docs/numbers.md`. Every figure is either **given** (from `public/seed.json`) or **derived** (must come out of `src/lib/engine.ts`). Nothing is a third thing.

## 2. Sweep for literals

```bash
grep -rnE '\$[0-9]' src/app src/components
grep -rnE '[^a-zA-Z0-9_.]([0-9]{1,3}(,[0-9]{3})*\.[0-9]{2})' src/app src/components
```

Both should be empty apart from comments. Any hit is a rule-1 violation: the figure must arrive as a prop from an engine call.

## 3. Reconcile the arithmetic chain

Check each link by hand, then confirm the engine produces it:

- `1016.34 + 235.27 − 1310.00 = −58.39` (position + window inflow − rent)
- `58.39 ÷ 15.54 = 3.757 → 3.8 hours`
- `58.39 ÷ 111.25 = 0.525 → 0.5 shifts`
- `4 × 15.54 = 62.15` (the Saturday shift; not $98.40 — `typical_daily_net` is inconsistent with the shift rows)
- `62.15 − 58.39 = 3.76` left over
- `2.80 ÷ 58.39 = 4.8%` fee as share of gap
- `(58.39 − 55.92) ÷ 55.92 = 4.4% → "within 4%"`
- `207 ÷ 535 = 38.7% → 39%`
- `530.83 ÷ 1434.63 = 37.0% → 37%`
- `1965.41 − 1634.00 = 331.41` solvent by ~$331

## 4. Cross-surface check

The same figure must read identically in all six places it can appear: the UI, `/math`, `README.md`, `docs/numbers.md`, the tests, and the demo script. For every figure you changed:

```bash
grep -rn "<old value>" --exclude-dir=node_modules --exclude-dir=.next .
```

Any survivor is a bug. Rounding must be consistent too: `$58.39` in the engine and "$58 short" in Screen A copy is fine (the spec specifies it), but `$58.40` anywhere is not.

## 5. Scripts must compute, not assert

Run them and read the output:

```bash
npm run reconcile   # expect 2.3% weeks, 20.5% txns, 34.1% credits-followed-by-drop
npm run backtest    # expect 39% of advances, 37% of fees
```

If a script re-prints a constant from `seed.json` rather than computing it, that must be stated in its own output and in the README. A number presented as computed that isn't is the single worst finding a code-quality pass could make here. See `docs/plan.md` § Open input gap.

## 6. Report

State what you checked, what reconciled, and every mismatch with `file:line`. If everything reconciles, say so plainly with the count of surfaces checked.
