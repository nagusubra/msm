---
name: engine-conventions
description: "The load-bearing rules for writing or changing TILL's math: purity, frozen clock, round2 money discipline, derived ledger, the two-dimensional solver filter, and how to test against canonical numbers. Fire before touching src/lib or scripts."
---

# Engine conventions

The deep source is root `AGENTS.md` plus `.cursor/rules/engine.mdc`. This is the invocable checklist of the rules that cause actual problems when broken. If this and `AGENTS.md` disagree, `AGENTS.md` wins. User instructions win over both.

## Before writing a line

1. Open `docs/numbers.md`. Find the value your change affects. If it is not there, add it there first — the doc is the spec, the engine is its implementation.
2. Read `public/seed.json` for the actual field names. Do not guess at shape; `types.ts` is the only place raw JSON is touched.
3. Ask what test would fail if you got it wrong, and write that test.

## The five rules that matter

1. **Purity.** `src/lib` imports nothing but other `src/lib` modules and TypeScript types. No react, no fetch, no fs, no randomness. The reason is concrete: `scripts/reconcile.ts` and `scripts/backtest.ts` must run the same math the UI shows, and a judge must be able to see that they do. Two implementations of the ledger is the worst possible outcome for this repo.

2. **Frozen clock.** Every function that depends on "now" takes `now: string` (ISO, `2026-05-27T18:40`). No `new Date()`, no `Date.now()`. Two reasons: the demo must be reproducible in any month, and tests must not rot.

3. **Integer cents.** `type Cents = number & { readonly __brand: "Cents" }`. Parse dollars → cents once, in `types.ts`. All arithmetic on integers. `formatMoney(cents)` at the render edge is the only conversion back. Rounding rule: round at the parse boundary, never mid-computation, so `1016.34 + 235.27 - 1310.00` lands on exactly `-5839` cents.

4. **Derived ledger.** Balance for day _d_ = opening balance + all earnings arriving on or before _d_ − all obligations due on or before _d_. Earnings "arrive" on the shift date when `paid_same_day`, otherwise on the payout date. The provided `ending_balance_cad` / `running_balance_cad` columns reconcile at 2.3% and 20.5% and are not read anywhere in this codebase.

5. **The solver is two-dimensional.** `solveGap` filters on amount **and** time-to-cash:
   - `covers` = `est_net >= gap`
   - `inTime` = `now + payout_days <= dueDate`
   A route that covers but arrives late is returned with `verdict: "too_late"` and a human reason string — **never filtered out of the array**. That greyed row is the visible proof this is a solver and not a job board, and the spec calls it mandatory. Routes with `conflicts: true` are excluded with their own reason. Cost is expressed both in dollars and as a share of the gap (the advance is $2.80 = 4.8%), because share-of-gap is the honest comparison, not APR theatre.

## Sort order

Free-and-covers, by soonest arrival → covers-with-cost, by cost ascending → partial → rejected (`too_late`, `conflicts`, `do_nothing`). The Saturday employer shift must land above the advance. If it doesn't, the sort is wrong, not the data.

## Testing

Minimum three test files: `projectDays`, `solveGap`, `safeToSpend`. Assert canonical values from `docs/numbers.md`, not "whatever the function returns today":

- shortfall === `5839` cents
- `gapInHours` rounds to `3.8`, `gapInShifts` to `0.5`
- `solveGap(...)[0].source === "employer_shift"` and its cost is `0`
- the warehouse row is present with `verdict === "too_late"`
- ledger has 11 negative days across Apr 1 – Jun 30, all at month boundaries

Never delete or weaken an assertion to go green. Never `expect(x).toBeCloseTo` a money value — cents are exact.

## Verify before done

```bash
npm test        # read the output
npm run typecheck
```

Paste the relevant line into your reply. If a script's number changed, run the script and paste the printed percentage.
