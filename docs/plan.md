# Build plan

Order matters: the engine is the product, so it lands first and everything else reads from it. Each step ends green on `npm run check` and gets one commit (see AGENTS.md).

## Status

| Step | State |
| --- | --- |
| 0. Repo + agent setup, tokens, docs, tooling | done |
| 1. `types.ts` + `engine.ts` + 3 tests | done |
| 2. `scripts/reconcile.ts` — the integrity proof | done |
| 3. Screens A / B / C | done |
| 4. `scripts/backtest.ts` + `/math` | done |
| 5. README, screenshots, deploy | in progress |

## Step 1 — engine + tests (`commit: engine + tests`)

`src/lib/types.ts` — a typed reader over `seed.json`. Raw JSON in, `Seed` out, `any` nowhere. Money parsed to integer cents at this boundary.

`src/lib/engine.ts`, pure, no React:

- `deriveLedger(seed): DayRow[]` — one row per day Apr 1 → Jun 30: inflow, outflow, balance, `negative`. Ignores every provided balance column.
- `projectDays(seed, now, horizonDays): DayRow[]` — the 21-day forward window Screen B renders.
- `findNextCliff(days): Cliff | null` — first day where balance < 0, with the obligation that caused it.
- `moneyStates(seed, now): { banked, earnedUnpaid, scheduled }` — the three-state bar, with `advanceable: boolean` per state (unconfirmed hours are not advanceable; the feed is 2 days stale).
- `safeToSpend(seed, now): Cents` — banked minus committed outflow before the next inflow.
- `solveGap(seed, now, gap): Route[]` — the core. Scores every `extra_work` row, the Boost option, an advance sized to the gap, and do-nothing. Two-dimensional filter: `covers = est_net >= gap` **and** `arrivesBy = now + payout_days <= dueDate`. A row failing only the time test is returned with `verdict: "too_late"` and a stated reason — never dropped. Cost is dollars and cost-as-share-of-gap. Sort: covers-and-free first, then covers-with-cost by cost, then partial, then rejected.
- `gapInHours` / `gapInShifts` — translation to labour, which is the product's whole claim.
- `formatMoney(cents): string` — the only place cents become dollars.

Tests (`src/lib/__tests__/`), minimum three, one file each for `projectDays`, `solveGap`, `safeToSpend`. Assert the canonical values from `docs/numbers.md`: shortfall `5839`, 3.8 hours, the Saturday shift ranked above the advance, the warehouse row present with `verdict: "too_late"`.

## Step 2 — reconcile (`commit: reconcile finding`)

`scripts/reconcile.ts` prints the week-transition reconcile rate, the median absolute error, the transaction reconcile rate, and the credit-followed-by-decrease rate. Exits non-zero if a rate drifts outside tolerance, so it doubles as a regression test on the input.

## Step 3 — screens (`commit: screens`)

One page, three sections, 390px frame. Presentational components only; every figure arrives as a prop from an engine call made in `page.tsx`.

- **A — Tonight**: hours worked, earned, in-account, safe-to-spend, three-state stacked bar with the haze "not advanceable" label.
- **B — The cliff**: 21-day step chart, hand-authored SVG, one rust day (June 1), draw-on-load stopping hard at the cliff, tap for the detail card.
- **C — Close the gap**: the ranked route table including the greyed reject.

## Step 4 — backtest + `/math` (`commit: backtest`)

`scripts/backtest.ts` replays all 535 advances: was there a same-day-paid shift inside the payout window whose net pay covered the amount? Prints 39% / 37% with the dollar figures.

`/math` lists every intermediate value in the chain from opening balance to the $58.39 shortfall, then the validation line: engine-predicted **$58.39** beside her actual **$55.92** advance the next evening, 4% error, computed with no knowledge of her advance history. This is screenshot 5 and it is the one that wins technical execution.

## Step 5 — README, screenshots, deploy (`commit: README + polish`)

README sections: thesis, the evidence table, **the data-integrity finding with percentages**, "What this is not" (pool differentiation), how to reproduce (`analyze` / `reconcile` / `backtest`), the dark-UI justification, learning & ambition.

Five screenshots in this order: cliff chart hero → ranked solver with the greyed row in frame → Screen A three-state bar → cliff detail card → `/math` prediction vs actual. Then deploy and put the hosted URL in the submission.

## Input state (resolved)

The six raw CSVs are in `public/data_seed_extracted_from/`: `daily_earnings.csv` (12,204 rows), `earned_wage_advances.csv` (535), `recurring_obligations.csv` (849), `transactions.csv` (31,726), `weekly_cashflow_summary.csv` (3,072), `workers.csv` (220). So `analyze.ts`, `reconcile.ts`, and `backtest.ts` genuinely compute their figures over the real dataset rather than re-printing constants, which is what earns the 25% technical-execution weight. `seed.json` stays the persona extract the UI reads.

The spec mentions seven tables; there are six, and none of them contains open employer shifts. So `extra_work` in `seed.json` is seeded, not sourced — the README must say that explicitly (spec §18.10: judges do not penalize labelled seed data, they penalize mock screens pretending to be live).

If a script's real output disagrees with a spec figure, the real output wins and `docs/numbers.md` gets corrected — never the reverse. Report any such correction rather than quietly rounding into agreement.

## Definition of done

- [ ] Repo public before deadline
- [ ] Every on-screen number traces to an engine function, zero literals in JSX
- [ ] `npm run check` green; 3+ tests
- [ ] `npm run reconcile` prints 2.3% and 34.1%
- [ ] `npm run backtest` prints 39% and 37%
- [ ] `/math` shows $58.39 predicted next to $55.92 actual
- [ ] Solver shows a greyed reject with a stated reason
- [ ] Employer shift ranks above the advance
- [ ] 5 screenshots per `docs/spec.md` §9
- [ ] Deployed, hosted URL in the submission
- [ ] Demo script rehearsed out loud twice
