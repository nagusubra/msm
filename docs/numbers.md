# Canonical numbers

**Single source of truth for every figure in this repo.** README, UI copy, `/math`, the demo script, and screenshots all reconcile to this file. To change a figure: change it here first, then `grep -r "<old value>" --exclude-dir=node_modules .` and fix every survivor. The final judging pass is extended-thinking synthesis over the whole repo, so one stale number is a real cost.

Values are either **from `public/seed.json`** (given, never edited) or **derived** (must come out of `src/lib/engine.ts`, not be typed into a component).

## The clock

| Value | Figure | Source |
| --- | --- | --- |
| "Now" for the entire app | `2026-05-27T18:40` (Wed May 27 2026, 6:40 PM) | `meta.today` |
| Dataset window | 2026-04-01 → 2026-06-30 | `meta.dataset` |
| Opening balance for the derived ledger | $900.00 on 2026-04-01 | `meta.opening_balance_2026_04_01` |

Never `new Date()`. The demo must produce these same numbers on any future date.

## Persona W-0131

| Value | Figure |
| --- | --- |
| Calgary, event / venue staff, hourly | seed `worker` |
| Tenure | 3 months (the new-hire retention cohort) |
| Household / dependents | 3 / 2 |
| Income volatility | 0.50 (top band) |
| Net hourly | **$15.54** |
| Mean shift | 7.2 h, **$111.25** net |
| Same-day pay rate | **36%** of her shifts |
| Monthly income | **$1,965.41** |
| Monthly obligations | **$1,634.00** |
| Solvent by | **$331.41/mo** — and she still hits the wall every month. That is the thesis in two numbers. |

A 4-hour shift is worth **$62.15** (4 × $15.54, matching `extra_work.est_net`). It is **not** $98.40 — `typical_daily_net` is a profile field and is inconsistent with the shift rows. Derive hourly from the shifts.

### Obligations

| Bill | Amount | Due day | Autopay |
| --- | --- | --- | --- |
| Rent | $1,310.00 | 1st | no |
| Mobile phone | $41.00 | 14th | yes |
| Installment / loan | $134.00 | 21st | yes |
| Utilities | $149.00 | 25th | yes |

Rent is the only large bill, which is why there is exactly one cliff per month: **Apr 1, May 1, Jun 1**. Derived ledger from $900 opening: **11 negative days out of 91**, every one at a month boundary.

## The demo moment (Screens A–C and `/math`)

| Value | Figure | How |
| --- | --- | --- |
| Derived position, May 27 | **$1,016.34** | ledger: opening + earnings inflow − obligation outflow |
| Inflow May 28 – Jun 1 | **$235.27** | scheduled + earned-unpaid arriving in window |
| Rent due Jun 1 | **$1,310.00** | obligation |
| **Shortfall** | **$58.39** | 1,016.34 + 235.27 − 1,310.00 |
| Gap in shifts | **0.5** | 58.39 ÷ 111.25 |
| Gap in hours | **3.8** | 58.39 ÷ 15.54 |
| Saturday open 4 h shift | **$62.15**, payout same day, cost **$0** | `extra_work[0]` |
| Left over after that shift | **$3.76** | 62.15 − 58.39 |
| What she actually did, May 28 7:01 PM | **$55.92** advance, **$2.80** fee | `advances` A-00304 |
| Fee as share of the gap | **4.8%** | 2.80 ÷ 58.39 |
| Engine prediction error | **4%** | (58.39 − 55.92) ÷ 55.92 = 4.4% |

### Screen A, corrected to the data

The spec's Screen A copy ("You worked 7 hours today. $104 earned. $31 safe to spend") does not survive contact with the rows, so the engine renders what is true:

| Value | Figure | Why |
| --- | --- | --- |
| Shift on the demo date | **none** | `daily_earnings.csv` has no `2026-05-27` row for her. Her last shift is **May 25, 5.9 h, $59.60**, not paid same day. Inventing a shift would be fabrication. |
| Safe to spend tonight | **$0.00** | `max(0, balance + inflow before the cliff − the cliff)` = `max(0, −58.39)`. She holds $1,016.34 and none of it is hers to spend. That is a stronger line than $31, and it is derived. |
| Unconfirmed hours, not advanceable | **$208.91** | the two shifts worked after the feed's last sync (May 28 $137.38 + May 31 $71.53). `seed.hours_feed.estimated_unconfirmed_net` says $205.30; the derived figure supersedes it, consistent with deriving rather than trusting. |

`safeToSpendToday` measures `committed` to the next **cliff**, not to the next inflow as spec §16.4 writes it. Measuring to the next inflow reports over a thousand dollars as spendable on a night when rent lands in five days, which is the exact failure this product exists to prevent.

### Solver figures on the demo date

| Route | Delivers | Cost | Basis |
| --- | --- | --- | --- |
| Advance, estimated before the fact | $58.39 tonight | **$2.35 = 4.0% of the gap** | her observed median fee across her 8 advances (spec §16.6) |
| Advance, what she actually paid | $55.92 | **$2.80 = 4.8% of the gap** | `A-00304`, May 28 7:01 PM. Shown on `/math` beside the estimate |
| Groceries on a Boost card | **+$5.03**, a gain | −$5.03 | 15% of **$33.53**, her mean monthly grocery spend in `transactions.csv` |
| Do nothing | — | **$60.00** ($35 NSF + $25 late) | spec §16.6 |

Cohort fee context, computed: median fee across all 535 advances **$2.03**; for advances between $40 and $80, **$2.07**. Her personal median is **$2.35**.

### Ranked routes (Screen C)

Order is the solver's output over (amount, time-to-cash), not a hand-sorted list.

| Route | Delivers | Cost | Verdict |
| --- | --- | --- | --- |
| Open shift, Sat May 30 10–14 (4 h) | +$62.15 same day | $0 | covers |
| Event teardown, Fri May 29 night (4 h) | +$62.15 in 2 days | $0 | covers |
| Advance sized to the gap | $58.39 tonight | $2.35 = 4.0% of gap (her median fee) | covers |
| Groceries via Boost | +$5.03 | −$5.03 (a gain) | partial |
| Delivery, Thu May 28 evening | +$46.61 | $0 | partial |
| Warehouse casual, Fri May 29 AM (6 h) | +$93.22 in 7 days | $0 | **too late** |
| Open shift, Sun May 31 | +$124.29 | $0 | **shift conflict** |
| Do nothing | — | ~$60 NSF + late | no |

The greyed **too late** row is mandatory. It is the visible proof of the two-dimensional filter (amount _and_ time-to-cash) and it is worth more than the rows that pass. The conflict row stays visible with its reason; it is not silently dropped.

## Engine constants (spec §16)

Not decoration — these are the inputs that make the outputs reproducible.

| Constant | Value | Where |
| --- | --- | --- |
| Payout lag when not paid same day | **+5 days** from the work date | `projectDays` |
| Cliff threshold | `outflow >= 0.25 × monthlyObligationTotal` | `projectDays` |
| Projection horizon | **21 days** (Screen B) | `projectDays` |
| Boost gain | `−(groceryPortion × 0.15)`, renders as a gain | `solveGap` |
| Advance cap chain | `min(gap, 200, 0.5 × periodNet, 1000)`, floor **$20** | `solveGap` |
| Advance fee | dataset observed: median **$2.35**, range **$1.99–$5.49**. Hers on the night: **$2.80** | `solveGap` |
| Do-nothing cost | **$35 NSF + $25 late = $60**, `cost_pct ≈ 100%` | `solveGap` |
| Feed health | last sync **2026-05-25**, **2 days** stale, **2** unconfirmed shifts, **$205.30** estimated net, escalate to the **employer** payroll admin | `feedHealth` |
| Limits | daily max **$200**, period **50%** capped **$1,000**, min request **$20** | `seed.limits` |

## Cohort findings (README evidence table)

All from `cohort_stats` in `seed.json`; reproduced by `npm run analyze` / `reconcile` / `backtest`.

| # | Finding | Consequence |
| --- | --- | --- |
| 1 | All **535** advances requested between 5:00 PM and 11:59 PM. Zero outside. Peak 11 PM. | Post-shift surface, dark UI. |
| 2 | **85%** of monthly obligation dollars fall on the 1st or 15th. | Protect two dates, not thirty. |
| 3 | **99%** of advances are smaller than one shift's net pay; median **42%** of a shift. | Work outranks borrowing. |
| 4 | **60%** of shifts are not paid same day. | Three money states: banked, earned-unpaid, scheduled. |
| 5 | Advance this week → **29.5%** chance of another next week vs **12.5%** baseline (**2.35×**). **47.7%** land within 14 days of a prior. | The metric TILL moves. |
| 6 | Cohort fees, computed over all 535 rows: median **$2.03**, range **$0.00–$10.70** (91 rows are fee-free). **Her** fees are $1.99–$5.49, median $2.35. Either way, not the flat $5 marketing number. | Price cost as % of gap, using dataset fees. |
| 7 | Backtest: **38.7%** of advances (**207/535**) could have been covered by a same-day-paid shift within 48 h. **$530.83** of **$1,434.63** in fees — **37.0%** — was avoidable. Tighter: **123** of those 207 had the covering shift the very next day (**23.0%** of all advances, **$322.61** in fees). | The headline claim, computed not asserted. |
| 8 | Derived ledger: **93%** of workers hit at least one negative day; median **19** negative days per 91. | Near-universal, and timing-shaped. |
| 9 | **44%** of workers have a single bill exceeding two weeks of median income. | Some gaps cannot be closed. Say so honestly. |

Dataset scale: **220 workers, 12,204 shifts, 535 advances, 849 obligations, 31,726 transactions** (advances came from **128** distinct workers).

Figures the scripts corrected against the spec's estimates, computed values winning: reconcile rate **2.2%** not 2.3%; median absolute error **$803.82** not $803.81; backtest **38.7%** not 39% (the count, 207/535, is exact); repeat-advance **29.5% vs 12.5%** not 27.8% vs 11.4%; obligation concentration **85.2%** mean, **88.2%** median, **97.3%** of workers at 50% or more; fee median **$2.03** cohort-wide, and the $1.99–$5.49 range belongs to her, not the dataset.

## The data-integrity finding

| Column | Reconciles | Detail |
| --- | --- | --- |
| `weekly_cashflow_summary.ending_balance_cad` | **2.2%** (63 of 2,852 week-over-week transitions) | median absolute error **$803.82** |
| `transactions.running_balance_cad` | **20.5%** (6,471 of 31,506 comparable rows) | **34.1%** of credits (4,160 of 12,199) are followed by a balance _decrease_ |

`npm run reconcile` computes **2.2%**, not the 2.3% the spec estimated, and **$803.82**, not $803.81. The computed value wins everywhere: README, demo script, and UI all say 2.2%.

Both are noise. The ledger is derived from earnings and obligations; these two columns are ignored. Most teams will plot `ending_balance_cad` and their entire chart will be wrong. This belongs in the README with the percentages.
