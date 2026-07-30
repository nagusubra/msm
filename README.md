# TILL

**Every tool in this category answers one question: how much can I take today. None answer the one that matters: what is the cheapest way through the next two weeks.**

TILL projects a shift worker's cash position forward to the next cliff, prices every route across the gap, and ranks working above borrowing, because in this dataset working is almost always cheaper.

Two routes: `/` is the loop (cliff detected, gap priced, route chosen) and `/math` is the verification surface where every intermediate value is listed.

```bash
npm install
npm run dev        # the app
npm test           # 45 tests, run against the real CSV rows
npm run analyze    # cohort engine over 220 workers and 12,204 shifts -> public/cohort.json
npm run reconcile  # the data-integrity proof
npm run backtest   # the avoidable-fee claim, replayed over all 535 advances
```

## Evidence

Everything below is computed from the provided dataset by the three scripts above. No figure in this repo is asserted.

| # | Finding | Consequence |
| --- | --- | --- |
| 1 | **All 535 advances were requested between 5:00 PM and 11:59 PM. Zero outside.** Peak hour 11 PM, 86 requests. | Nobody is budgeting. They are deciding after a shift. The product is a post-shift surface, and it is dark. |
| 2 | **85.2% of monthly obligation dollars fall on the 1st or the 15th** (median worker 88.2%; 97.3% of workers at 50% or more). | There are not thirty risk days in a month. There are two. |
| 3 | **99.6% of advances are smaller than one shift's net pay. The median advance is 42% of a shift.** | The gap is almost always a few hours of work. |
| 4 | **60.1% of shifts are not paid same day.** | A bank balance is not her money. Three states: banked, earned but unpaid, scheduled. |
| 5 | **An advance this week raises the chance of another next week to 29.5%, against a 12.5% baseline. 2.35x.** 47.7% of advances land within 14 days of a prior one. | This ratio is the metric TILL exists to move. |
| 6 | Cohort fees: median **$2.03**, range **$0.00 to $10.70**. Her own eight advances: $1.99 to $5.49, median $2.35. | Price the cost as a share of the gap, using observed fees, never the flat $5 marketing number. |
| 7 | **Backtest over all 535 advances: 38.7% (207) could have been covered by a single same-day-paid shift within 48 hours. $530.83 of $1,434.63 in fees, 37.0%, was avoidable.** Tighter: 123 of those 207 had the covering shift the very next day. | The claim the product rests on, computed and falsifiable. |
| 8 | Derived ledger over the cohort: negative days are near-universal and they cluster at month boundaries. | The problem is shaped like timing, not like income. |
| 9 | A substantial minority of workers carry a single bill larger than two weeks of their median income. | Some gaps cannot be closed by working. The product says so instead of pretending. |

`npm run analyze` prints every one of these with the method it used, and writes them to `public/cohort.json` with a `computed_from` and a `method` field per figure.

## The data-integrity finding

**Both provided balance columns fail reconciliation, so this repo derives the ledger instead of reading it.** From `npm run reconcile` (`scripts/reconcile.ts`):

```
weekly_cashflow_summary.ending_balance_cad
  prev_ending + net_cashflow == ending       2.2%  (63 of 2,852 week-over-week transitions)
  median absolute error                      $803.82

transactions.running_balance_cad
  prev_running +/- amount == running         20.5%  (6,471 of 31,506 comparable rows)
  credits followed by a DECREASE             34.1%  (4,160 of 12,199 credits)
```

A third of all credits are followed by the balance going **down**. These columns are noise. Every balance in this app is derived from `daily_earnings` in and `recurring_obligations` out, with wages landing on the work date when `paid_same_day` is set and five days later when it is not. Both columns are named in `public/cohort.json` under `meta.ignored_columns` and are read nowhere else.

The script doubles as a regression test on the input: it checks six computed figures against tolerance bands and exits non-zero if the dataset drifts.

## Three things every budget app gets wrong for a daily earner

**It treats the bank balance as her money.** 60.1% of shifts are not paid same day, so on any given evening a large share of what she has already earned sits in a state no balance field describes. On the demo evening she holds $1,016.34 and $0.00 of it is safe to spend. An app showing one number is not simplifying her situation, it is misreporting it.

**It reports backward instead of forward.** Pie charts describe a month that already happened, but 85.2% of the obligation dollars land on two days, and those days are ahead of her. TILL projects the ledger forward 21 days and marks the day the money runs out.

**It has no concept of what closing a gap costs.** Budget apps stop at the diagnosis, which leaves her to price her own options at 6:40 PM with nothing to compare against. TILL prices every route as a share of the gap and ranks them.

## Why work beats borrowing, with proof

99.6% of advances in this dataset are smaller than one shift's net pay, and the median advance is 42% of a shift. At 6:40 PM on May 27 2026 the engine computed a **$58.39** shortfall against $1,310.00 of rent due June 1, from ledger math alone. That is **3.8 hours** of work at her $15.54 net hourly rate, or half of her $111.25 mean shift. Her employer had a 4-hour shift open on Saturday worth **$62.15**, paid same day, costing **$0**, which closes the gap with $3.76 left over. Replayed across the whole dataset, 37.0% of the fees workers actually paid were avoidable the same way.

## The validation: the engine predicted her real behaviour

The single result worth pointing at. On May 27 the engine computed a **$58.39** shortfall with no knowledge of her advance history. **The next evening at 7:01 PM she requested $55.92 and paid a $2.80 fee.** The prediction was within **4.4%**.

Our solver had quoted a **$2.35** fee for the same gap before the fact, her own observed median. Both figures sit side by side on `/math`, the estimate and the outcome.

## What this is not

One budgeting prompt, roughly 25 teams. Expect spend-category pie charts, savings-goal trackers, a chat over the transactions table, a streak app, a bill calendar. Those are money-in and money-out with a skin, and several of them will be quietly broken, because the obvious move is to plot `ending_balance_cad`, which reconciles 2.2% of the time.

TILL differs on three axes:

1. **It optimizes rather than reports.** `solveGap` is a constrained ranking over amount **and** time-to-cash. The visible proof is the greyed row: casual warehouse work delivers $93.22 at zero cost and is still rejected, because it arrives in 7 days against a 5-day deadline. A reporting tool has nothing to reject.
2. **It treats working as a financial instrument.** Picking up the employer's own open shift is priced in the same table as an advance, in the same units, and it wins.
3. **It is validated against outcomes.** The backtest replays 535 real advances, and the engine's forward prediction was checked against what the worker actually did the next evening.

## Real versus seeded, explicitly

Real rows from the provided dataset: the worker profile, all four obligations, all 53 shifts in the Apr–Jun window from `daily_earnings.csv` (the UI seed extract carries 13 of them), all 8 advances, and every cohort figure above. The derived ledger, the projection, the shortfall, and the fee estimate are computed from those rows.

Seeded, and labelled as such: the five extra-work options. The dataset contains no open-shift or gig table, so those rows carry honest `payout_days` values and stand in for what would be a payroll and scheduling integration in production. The two-dimensional filter they exercise is real, and it is what rejects the 7-day option.

## Design, and why it is dark

100% of the observed advance sessions in this dataset happen between 5 PM and midnight, peaking at 11 PM. The interface is dark because that is when it is used. Evidence, not taste.

Colour is semantic rather than decorative: amber is money that is confirmed and available, haze is money that is estimated, stale, or not advanceable, and rust marks a cliff day and a shortfall and nothing else. Money is set in a monospace face with tabular figures, because proportional digits in a money column misalign. There is one animation: the balance line draws left to right and stops hard at the cliff.

## Sponsor alignment

- **Steering volume onto fee-free rails is better business than the advance fee.** The fee is a couple of dollars; filling the employer's own open Saturday shift delivers $62.15 to the worker at zero cost and delivers a covered shift to the buyer. It is the only route in the table that pays both sides, and it is the one route only a provider holding payroll and time-and-attendance data together can rank.
- **It answers the HR buyer's churn objection with a measurement.** The objection is that employees who start borrowing keep borrowing. In this dataset that is 29.5% against a 12.5% baseline, a 2.35x lift, and 47.7% of advances land within 14 days of a prior one. That ratio is what TILL is built to move, and the persona is a three-month-tenure new hire, which is the retention cohort the product is sold on.
- **Reducing repeat use is a defensible position as the category is scrutinised.** The public critique of earned wage access is not the single advance, it is repeat use and the cost to the frequent user. A provider that can show with a reproducible backtest that 37.0% of the fees in its own data were avoidable is arguing on the same axis as the critique.

## Prompt mapping

The prompt: go beyond the typical budget feature of money in and money out, and imagine what a worker who earns daily would actually find valuable.

| Prompt phrase | Feature | Evidence |
| --- | --- | --- |
| beyond money in and money out | `solveGap` prices and ranks routes across a gap instead of reporting spend | Finding 7 |
| a worker who earns daily | three money states, with unconfirmed hours labelled not advanceable | Finding 4 |
| day-to-day earnings | a daily derived ledger, and safe-to-spend recomputed from it | Finding 8 |
| would actually find valuable | the gap expressed in hours of work, with the employer's shift ranked above the advance | Findings 3 and 7 |
| managing | forward projection to the next cliff rather than backward categories | Findings 1 and 2 |

## Engineering

- `src/lib/engine.ts` is pure: no React, no fetch, no filesystem, no randomness, and **no system clock**. "Now" is data (`seed.meta.today`), so the demo produces identical numbers on any future date and the tests cannot rot.
- The UI, the tests, and all three scripts call the same engine. There is one implementation of the ledger.
- 45 tests run against the real CSV rows and assert the canonical figures: $1,016.34 on May 27, $235.27 of inflow before the cliff, a $58.39 shortfall, 11 negative days out of 91, exactly one cliff per month, the employer shift ranked above the advance, and the 7-day option marked too late.
- Strict TypeScript with `noUncheckedIndexedAccess`. No `any` at a module boundary. Every figure in the UI arrives as a prop from an engine call, so there are no money literals in JSX, and a repo hook blocks them from being added.
- `docs/numbers.md` is the single source of truth for every figure, and it records each place a computed value corrected an estimate.

## Learning and ambition

- We found mid-build that both provided balance columns fail reconciliation, so we threw out the plotting approach entirely and wrote a derivation engine. That finding became the strongest part of the submission.
- We built a backtest harness rather than asserting the value claim, which meant designing a falsifiable test over 535 historical advances and accepting whatever it returned. It returned 38.7%, not the 39% we expected, and we kept the computed number.
- The hardest call was scope. We cut four finished-looking screens to ship one complete loop.
- Several inherited figures did not survive contact with the CSVs: the reconcile rate, the repeat-advance rates, a fee range that turned out to be the persona's rather than the cohort's, and a Screen A headline describing a shift she never worked. Each is corrected in `docs/numbers.md` with the computed value and the reason.
