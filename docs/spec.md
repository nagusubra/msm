# TILL — Build Spec v2 (rubric-aligned)

Paste this whole file into Cursor. `seed.json` goes in `/public`. Build in the order given.

---

## 0. What the judging actually rewards

Two gates. AI screening picks the top 8, humans decide placements. Weights differ, so optimize for the AI gate first.

| Criterion | AI screen | Human final | How this spec earns it |
|---|---|---|---|
| Innovation & Originality | 25% | 25% | Section 3. A gap-cost solver, not a dashboard. Plus §4 explicitly differentiates against the pool. |
| Technical Execution | **25%** | 25% | Section 5. Cohort engine over 12,204 shifts, a data-integrity finding, and a backtest harness. **This was the weak point in v1 and is now the strongest part.** |
| Functional Completeness | 20% | 20% | Section 7. **Three screens, one loop, finished.** Rubric explicitly penalizes spreading thin. |
| Problem-Solution Fit | 20% | 15% | Section 2. Prompt-aware, so §11 maps every feature back to the prompt sentence. |
| UX & Design | 5% | 10% | Section 8 + the five specified screenshots. Screenshots feed the visual pass directly. |
| Learning & Ambition | 5% | — | Section 12. |
| Demo & Communication | — | 5% | Section 10. |

**The AI runs six passes:** repo structure, code quality, innovation, visual UX, **pool comparison**, final synthesis (Opus, extended thinking). Consequences baked into this spec:

- Repo structure and code quality are separately scored, so §6 specifies layout, tests, and typed boundaries.
- Pool comparison means ~25 teams got the same prompt. Most will ship a spend chart. §4 names that explicitly so the comparison pass has something to latch onto.
- Extended-thinking synthesis rewards internal consistency. **Every number must reconcile.** v1 had two that did not. Both are fixed below.

**Submission mechanics:** public GitHub repo before deadline, project name, description, repo URL, up to 5 screenshots, hosted URL. Repo public is a hard fail if missed.

---

## 1. Corrections from v1 (do not reintroduce these)

**Error 1, fixed.** A 4-hour shift is worth **$62.15**, not $98.40. The persona's net hourly rate is $15.54, computed as total net pay over total hours. `typical_daily_net_cad` in `workers.csv` is a profile field and is **not** consistent with the shift-level rows. Derive hourly from the shifts.

**Error 2, and this became the best feature in the build.** The provided balance columns do not reconcile:

- `weekly_cashflow_summary.ending_balance_cad`: only **2.3%** of 2,852 week-over-week transitions satisfy `prev_balance + net_cashflow = ending_balance`. Median absolute error **$803.81**.
- `transactions.running_balance_cad`: only **20.5%** of 31,506 rows reconcile, and **34.1% of credits are followed by a balance decrease**.

So both are noise. **Derive the ledger from the earnings and obligations tables and ignore those two columns.** Most teams will plot `ending_balance_cad` and their entire chart will be wrong. Put this in the README with the percentages. It is the single highest-value code-quality signal available tonight.

**Persona changed.** v1 used W-0159, but her obligations ($2,673/mo) exceed her income (~$1,930/mo), so she is structurally insolvent and every day of the projection is negative. That is a real finding but a confusing demo, because the product's thesis is *timing*, not insolvency. New persona below is solvent and tight, so the gaps are purely timing gaps.

---

## 2. Thesis

> Every tool in this category answers one question: how much can I take today. None answer the one that matters: what is the cheapest way through the next two weeks.
>
> TILL projects a shift worker's cash position forward to the next cliff, prices every route across the gap, and ranks working above borrowing because in this dataset working is almost always cheaper.

---

## 3. Verified evidence

All computed from the dataset. Reproduce with `npm run analyze`. Put this table in the README.

| # | Finding | Consequence |
|---|---|---|
| 1 | **All 535 advances requested between 5:00 PM and 11:59 PM. Zero outside.** Peak 11 PM. | Post-shift surface, dark UI. Entry is an evening push. |
| 2 | **85% of monthly obligation dollars fall on the 1st or 15th** (median 88%, 97% of workers ≥50%). | Protect two dates, not thirty. |
| 3 | **99% of advances are smaller than one shift's net pay. Median 42% of a shift.** | Work outranks borrowing. |
| 4 | **60% of shifts are not paid same day.** | Three money states: banked, earned-unpaid, scheduled. |
| 5 | **Advance this week → 27.8% chance of another next week vs 11.4% baseline (2.4x).** 48% land within 14 days of a prior. | The metric TILL moves. |
| 6 | Median implied APR **421%**. Observed fees $1.99–$5.49, median $2.35 (not the flat $5 marketing number). | Cost as % of gap. Use dataset fees. |
| 7 | **Backtest: 39% of advances (207/535) could have been covered by a same-day-paid shift within 48 hours. $530.83 of $1,434.63 in fees, 37%, was avoidable.** | The product's headline claim, computed not asserted. |
| 8 | Derived ledger: **93% of workers hit at least one negative day; median 19 negative days per 91.** | The problem is near-universal, and timing-shaped. |
| 9 | 44% of workers have a single bill exceeding two weeks of median income. | Some gaps cannot be closed. Say so honestly. |

---

## 4. Pool differentiation (for the comparison pass)

State this in the README under "What this is not."

With one budgeting prompt and ~25 teams, expect: spend-category pie charts, a savings-goal tracker, an AI chat over transactions, a streak app, a bill calendar. All of those are money-in/money-out with a skin.

TILL is different on three axes:

1. **It optimizes rather than reports.** `solveGap` is a constrained ranking over amount **and** time-to-cash, not a visualization.
2. **It treats working as a financial instrument.** Picking up a shift is priced alongside an advance, and usually wins.
3. **It is validated against outcomes.** The backtest quantifies avoidable fees on real historical advances. Nobody else will have a validation harness.

---

## 5. Technical execution plan (25% — build this properly)

Four things that make this engineering rather than a mockup.

**5.1 Cohort engine, not a single mock.** `lib/engine.ts` runs over the full dataset, not just the persona. `scripts/analyze.ts` loads all seven CSVs, runs the ledger over all 220 workers and 12,204 shifts, and writes `public/cohort.json`. The UI reads the persona from it. Committing the script means the judge can see the numbers were computed.

**5.2 The data-integrity finding.** `scripts/reconcile.ts` proves the balance columns fail and prints the percentages. This is a test that documents a real defect in the input. Reference it in the README.

**5.3 The backtest harness.** `scripts/backtest.ts` replays all 535 advances and asks: was there a same-day-paid shift within the payout window whose net pay covered this amount? Output: 39% of advances, 37% of fees. This is the claim the whole product rests on, so it must be reproducible.

**5.4 Engine-predicts-behaviour validation.** The single best technical moment in the demo. On May 27 the engine computes a **$58.39** shortfall against June 1 rent, from ledger math alone, with no knowledge of her advance history. **The next evening she requested $55.92.** A 4% error. The engine independently predicted the worker's real behaviour. Surface this on the `/math` route and say it out loud.

Also: strict TypeScript, no `any` at module boundaries, pure functions with no React imports in `lib/`, and Vitest on `projectDays`, `solveGap`, `safeToSpend`.

```
/app/page.tsx            single page, three sections
/app/math/page.tsx       every intermediate value, for verification
/lib/engine.ts           pure. no React, no fetch.
/lib/types.ts
/lib/__tests__/          3 tests minimum
/scripts/analyze.ts      CSV -> cohort.json
/scripts/reconcile.ts    the integrity proof
/scripts/backtest.ts     the 39% / 37% claim
/public/seed.json
README.md
```

Commit in meaningful steps: `engine + tests`, then `reconcile finding`, then `screens`, then `backtest`. A single squashed commit reads badly to a repo-structure pass.

---

## 6. Persona: W-0131 (verified)

Calgary. **Event / venue staff**, hourly. **3 months tenure** (new hire, which is exactly the retention cohort ZayZoon sells on). Household of 3, 2 dependents, transit, high rent burden. **Income volatility 0.50**, the top band. Net hourly **$15.54**, mean shift 7.2 hours, mean net per shift **$111.25**. Only **36%** of her shifts pay same day.

Income **$1,965/mo** against obligations **$1,634/mo**. She is solvent by $331 and still hits the wall every month. That is the thesis in two numbers.

| Bill | Amount | Due |
|---|---|---|
| Rent | $1,310.00 | 1st |
| Mobile phone | $41.00 | 14th |
| Installment / loan | $134.00 | 21st |
| Utilities | $149.00 | 25th |

Derived ledger, opening $900 on Apr 1: **11 negative days out of 91, every one of them at a month boundary.** Cliff days: Apr 1, May 1, Jun 1. Exactly one per month, because her only large bill is rent.

**Her 8 real advances**, all evening (5:27 PM to 10:03 PM), fees $1.99 to $5.49, totalling $23.14. Reasons: rent_gap ×2, bill_due ×2, emergency, groceries, childcare, other. In `seed.json`. Do not invent any.

### The demo moment

**Today is Wednesday May 27 2026, 6:40 PM.** She just finished a shift.

| Value | Amount |
|---|---|
| Derived position | $1,016.34 |
| Inflow May 28 – Jun 1 | $235.27 |
| Rent due Jun 1 | $1,310.00 |
| **Shortfall** | **$58.39** |
| In shifts | 0.5 |
| In hours | **3.8** |
| Saturday's open 4-hour shift | **$62.15**, arrives same day, cost $0 |
| What she actually did, May 28 7:01 PM | **$55.92** advance, **$2.80** fee |

3.8 hours of work covers it with $3.76 left over. She paid $2.80 instead. Every number above is computed.

---

## 7. Scope: three screens, one loop, finished

The rubric rewards a complete core loop over many unfinished pieces. **The loop is: cliff detected → gap priced → route chosen.** Build only that.

**Screen A — Tonight.** The evening push plus safe-to-spend.

> **You worked 7 hours today.**
> $104 earned. $0 in your account yet.
>
> **$31 safe to spend tonight.**
> Rent is in 5 days and you're $58 short.

Three money states as a stacked bar. Unconfirmed hours in haze, labelled "not advanceable" (feed is 2 days stale in the seed).

**Screen B — The cliff.** 21-day step chart of derived balance. One rust day: June 1. Tap it:

> **$1,310 due June 1. You're $58.39 short.**
> That's 3.8 hours of work.

**Screen C — Close the gap.** The ranked solver. Target render:

| Route | Delivers | Cost | |
|---|---|---|---|
| Open shift, Sat 10–2 (4h) | +$62.15 same day | $0 | covers |
| Event teardown, Fri night (4h) | +$62.15 in 2 days | $0 | covers |
| Groceries via Boost | +$9 | −$9 gain | partial |
| Advance $60 | $60 tonight | $2.80 = 4.8% of gap | covers |
| Warehouse casual, Fri (6h) | +$93.22 in 7 days | $0 | **too late** |
| Do nothing | | ~$60 in NSF + late | no |

The greyed reject row is mandatory. It is the visible proof of the two-dimensional filter, and it is worth more than the green rows.

**Cut list, in order:** payback preview, buddy-code limit, feed-health escalation, evening push. All four are in v1 and all four are optional. Do **not** ship five half-screens. If the limit and circle survive, the rules are: always a self-override, buddy sees no amount or category or reason, invited by the worker not pulled from the employer roster, and the default social frame is a positive streak.

---

## 8. Design

Justified risk, and say the justification in the README: **this app is dark because 100% of observed sessions happen between 5 PM and midnight.** Evidence, not taste.

Avoid the three generated-design tells: cream + serif + terracotta, near-black + acid green, broadsheet hairlines.

```css
--clock-slate:  #12161C;  /* base */
--clock-raise:  #1B222B;  /* card */
--punch-bone:   #E8E4DA;  /* text */
--wage-amber:   #E0A244;  /* confirmed money */
--pending-haze: #6E7C8C;  /* estimated, stale, not advanceable */
--cliff-rust:   #C2503A;  /* cliff days and shortfalls ONLY */
```

Amber versus haze is semantic, not decorative. Rust appears on one day per month.

Type: condensed grotesk display (Archivo Condensed or Oswald), Inter body at 15px, **JetBrains Mono with tabular figures for all money**. Proportional figures in a money column is a tell.

```css
.money { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
```

Signature: the cliff drawn as an actual edge. The balance line draws left to right on load and stops hard at June 1, with the shortfall labelled on the drop. One orchestrated moment, `prefers-reduced-motion` respected. Everything else stays quiet.

390px phone frame on desktop.

---

## 9. The five screenshots

These feed the visual pass directly, so shoot them deliberately in this order.

1. **The cliff chart** with June 1 dropping below zero, `-$58.39` labelled on the edge. Hero.
2. **Screen C, the ranked solver**, with the greyed "too late" row visible in frame.
3. **Screen A**, safe-to-spend, with the three-state money bar and the haze "not advanceable" label.
4. **The cliff detail**, "$1,310 due June 1. You're $58.39 short. That's 3.8 hours of work."
5. **The `/math` route**, showing the engine-predicted $58.39 next to her actual $55.92 advance.

Number 5 is the one that wins technical execution. Do not skip it.

---

## 10. Demo script, 90 seconds

> "I ran your dataset before writing a line of UI. Three things.
>
> All 535 advances were requested between 5 PM and midnight. Not one outside. Nobody is budgeting, they're panicking after shift.
>
> 85% of the bill money lands on the 1st or the 15th. There aren't 30 risk days a month, there are two.
>
> And 99% of advances are smaller than one shift's pay. Median is 42% of a shift. The gap is almost always a few hours of work.
>
> Also, your balance columns don't reconcile. 2.3% of weeks. A third of credits are followed by a balance drop. So we derive the ledger from earnings and obligations instead of reading it.
>
> This is worker 131. Calgary, event staff, three months in, two kids. Solvent by $331 a month and she still hits the wall every month, because rent is $1,310 on the 1st and she's paid every second Friday.
>
> It's 6:40 PM on May 27. Our engine says she's $58.39 short for rent. Three point eight hours of work. Her employer has a four-hour shift open Saturday, $62.15, arrives same day, costs nothing. This row is greyed out, warehouse work Friday, because it pays in seven days and rent is due in five. Filtering on time-to-cash is what makes this a solver and not a job board.
>
> Here's the part I'd point at. The engine computed $58.39 from ledger math with no knowledge of her advance history. The next evening she borrowed $55.92 and paid $2.80. We predicted her within 4%.
>
> We ran that backtest across all 535 advances. 39% of them could have been covered by a shift that pays same day within 48 hours. 37% of the fees in your dataset were avoidable."

Then stop.

---

## 11. Prompt mapping (Problem-Solution Fit, 20%, prompt-aware)

The prompt: *"go beyond the typical budget feature of money in / money out. Imagine what a worker who earns daily would actually find valuable when managing their day-to-day earnings."*

| Prompt phrase | Feature | Evidence |
|---|---|---|
| beyond money in / money out | `solveGap` prices routes across a gap instead of reporting spend | Finding 7 |
| a worker who earns daily | three money states, 60% of shifts unpaid same day | Finding 4 |
| day-to-day earnings | daily derived ledger, safe-to-spend recomputed per shift | Finding 8 |
| would actually find valuable | 3.8 hours beats a $2.80 fee, and 37% of real fees were avoidable | Findings 3, 7 |
| managing | forward projection to the next cliff, not backward categories | Findings 1, 2 |

---

## 12. Learning & Ambition (5%)

README section, three honest bullets:

- Discovered mid-build that both provided balance columns fail reconciliation, so we threw out the plotting approach and wrote a derivation engine instead.
- Built a backtest harness rather than asserting the value claim, which meant designing a falsifiable test on 535 historical advances.
- The hardest call was scope: we cut four finished-looking screens to ship one complete loop.

---

## 13. Definition of done

- [ ] Repo **public** before deadline
- [ ] Every on-screen number traced to an engine function, zero literals in JSX
- [ ] `npm test` passes, 3 tests minimum
- [ ] `scripts/reconcile.ts` prints 2.3% and 34.1%
- [ ] `scripts/backtest.ts` prints 39% and 37%
- [ ] `/math` shows $58.39 predicted next to $55.92 actual
- [ ] Solver shows a greyed reject with a stated reason
- [ ] Employer shift ranks above the advance
- [ ] 5 screenshots shot per §9
- [ ] Deployed, hosted URL in the submission
- [ ] Script rehearsed out loud twice

---

## 14. Stack and hard constraints

- Next.js App Router, TypeScript (strict), Tailwind. Two routes only: `/` and `/math`.
- **No database, no auth, no API keys, no network calls at runtime.** Read `seed.json` from `/public`. Everything else derived by pure functions.
- **No `localStorage` or `sessionStorage`.** React state only (`useState`, `useReducer`).
- No `<form>` tags. Use `onClick` / `onChange` handlers.
- Mobile-first, rendered in a 390px phone frame on desktop.
- CSV parsing happens in `scripts/` at build time, never in the browser.
- Deploy to Vercel. Hosted URL in the submission.
- **Zero hardcoded figures in JSX.** Every number comes from the engine. The code-quality pass will look for this.

---

## 15. Types (`lib/types.ts`)

```ts
type Money = number;                                  // CAD, 2dp
type Confidence = 'confirmed' | 'estimated' | 'stale';

interface Shift {
  date: string;                                       // YYYY-MM-DD
  shift: 'day' | 'evening' | 'night' | 'split';
  hours: number;
  net: Money;
  paid_same_day: boolean;
  confirmed: boolean;                                 // payroll feed has confirmed these hours
}

interface Obligation {
  name: string;
  category: 'housing' | 'phone' | 'utilities' | 'childcare' | 'debt_payment' | 'entertainment';
  amount: Money;
  due_day: number;                                    // day of month
  autopay: boolean;
  essential: boolean;
}

interface Advance {
  id: string;
  requested_at: string;                               // ISO
  amount: Money;
  fee: Money;
  status: 'repaid' | 'outstanding' | 'cancelled';
  repayment_source: 'next_payroll' | 'same_day_earnings' | 'manual';
  reason: string;
}

interface WorkOption {
  source: 'employer_shift' | 'gig';
  label: string;
  hours: number;
  est_net: Money;
  payout_days: number;                                // 0 = same day
  conflicts: boolean;                                 // clashes with a scheduled shift
}

interface DayCell {
  date: string;
  inflow: Money;
  outflow: Money;
  projected_balance: Money;
  confidence: Confidence;
  is_cliff: boolean;
  shortfall: Money;                                   // max(0, -projected_balance)
}

interface GapOption {
  kind: 'employer_shift' | 'gig' | 'boost' | 'advance' | 'nothing';
  label: string;
  net_delivered: Money;
  cost: Money;                                        // negative for Boost (a gain)
  cost_pct: number;                                   // cost / gap
  arrives_in_days: number;
  covers: boolean;
  reject_reason?: 'too late' | 'shift conflict' | 'over daily cap';
}
```

---

## 16. Engine (`lib/engine.ts`) — exact formulas

Pure functions. No React imports, no fetch, no side effects. Write these before any UI.

### 16.1 `netHourly(shifts)`

```
netHourly = sum(shift.net) / sum(shift.hours)
```

For W-0131 this is **$15.54**. Do **not** use `typical_daily_net` for hourly math; it is a profile field and does not reconcile with the shift rows. This is correction 1 from §1.

### 16.2 `moneyStates(shifts, today)`

```
banked       = Σ net where paid_same_day && date <= today
earnedUnpaid = Σ net where !paid_same_day && date <= today && confirmed
scheduled    = Σ net where date > today
unconfirmed  = Σ net where date <= today && !confirmed
```

`unconfirmed` renders separately in haze and is excluded from anything advanceable.

### 16.3 `projectDays(shifts, obligations, advances, opening, today, horizon = 21)`

Per day:

```
inflow  = Σ shift.net landing that day
          (paid_same_day ? work_date : work_date + 5 days)
outflow = Σ obligation.amount where obligation.due_day == dayOfMonth
        + Σ advance repayments scheduled that day
balance = previousBalance + inflow - outflow
```

`opening` comes from `seed.meta.opening_balance_2026_04_01` ($900). **Never read `ending_balance_cad` or `running_balance_cad`** — see §1, correction 2.

```
is_cliff   = outflow >= 0.25 * monthlyObligationTotal
confidence = depends on unconfirmed hours ? 'stale'
           : date > today            ? 'estimated'
           :                           'confirmed'
```

For W-0131 expect exactly one cliff per month (the 1st) and 11 negative days across 91.

### 16.4 `safeToSpendToday(shifts, obligations, today, balance)`

```
todayEarned = Σ net for shifts on today
committed   = Σ outflows between today and the next inflow date
safe        = max(0, banked + todayEarned - committed)
```

Returns `{ safe, todayEarned, committed, nextCliff, daysToCliff, shortfall }`.

**This value is also the daily limit** if you build §7's cut feature. Derived, never a constant. Do not hardcode $100.

### 16.5 `billsInHours(obligation, netHourly)` and `billsInShifts(obligation, meanShiftNet)`

```
hours  = obligation.amount / netHourly
shifts = obligation.amount / meanShiftNet
```

The gap of $58.39 is **3.8 hours** at $15.54. Prefer hours over shifts when the number is below one shift; it reads as more achievable and it is the honest unit.

### 16.6 `solveGap(gap, daysUntilGap, workOptions, limits, groceryPortion)`

Returns `GapOption[]` sorted by `cost_pct` ascending, rejects last.

**The two-dimensional filter is the core of the product:**

```
covers = net_delivered >= gap
      && arrives_in_days <= daysUntilGap
      && !conflicts
```

Generate in this ranking order:

1. **Employer open shifts** — `cost = 0`. Always first when they cover. Rationale for the README: ZayZoon's paying customer is the employer, so filling the employer's own open shift is the only route that helps both sides, and it is the one option only ZayZoon can offer because they already hold payroll *and* time-and-attendance data.
2. **Gig options** — `cost = 0`, subject to the payout filter. The warehouse option pays in 7 days against a 5-day deadline, so it renders greyed with `reject_reason: 'too late'`. **Mandatory in the demo.**
3. **Boost** — `cost = -(groceryPortion * 0.15)`, so `cost_pct` is negative. Label as a gain.
4. **Advance** — `amount = min(gap, 200, 0.5 * periodNet, 1000)`, floor $20. Use the dataset's observed fee (median $2.35, range $1.99–$5.49), **not** the $5 marketing figure. Show `cost_pct = fee / gap`, which is 4.8% for her.
5. **Do nothing** — `cost = 35 (NSF) + 25 (late)`, `cost_pct ≈ 100%`.

**Honest empty state.** If nothing covers the gap (44% of workers have a bill exceeding two weeks of income), say so and show the best partial:

> "Nothing here closes $412 by Monday. Best partial: Saturday's shift covers $98. You'd still be $314 short."

Do not fake a solution. Judges reward the honest failure path.

### 16.7 `feedHealth(hoursFeed, today)`

Seed has a deliberately stale feed: last sync May 25, 2 days stale, 2 unconfirmed shifts, $205.30 estimated.

Returns `{ status, daysStale, estimatedNet, message, escalationDraft }`.

Never show a bare $0. Show the estimate, labelled, marked not advanceable. Escalation is addressed to the **employer**, not to ZayZoon, because ZayZoon's own support replies confirm that a broken time export is only fixable on the employer's side.

### 16.8 `paybackPreview(advances, nextPayDate, projectedGross)`

```
pending    = Σ (amount + fee) where status == 'outstanding'
netCheque  = projectedGross - pending
committed  = Σ obligations due within 8 days after payday
leftOver   = netCheque - committed
feesToDate = Σ fee across the period
feesAnnual = feesToDate * (365 / periodDays)
repeatRisk = advanceInLast7Days ? { rate: 27.8, baseline: 11.4 } : null
```

Addresses the most common real complaint about EWA, which is not the advance but the paybacks landing merged on one cheque.

### 16.9 Tests (`lib/__tests__/`, Vitest, 3 minimum)

1. `projectDays` flags exactly one cliff in June for W-0131, on the 1st.
2. `solveGap` ranks the employer shift above the advance, and marks the 7-day warehouse option `too late` against a 5-day deadline.
3. `safeToSpendToday` returns 0 rather than a negative number when committed exceeds available.

---

## 17. Build order and timeboxes (90 minutes)

| Time | Task |
|---|---|
| 0:00–0:06 | `README.md` thesis + evidence table (§3). Copy `seed.json` to `/public`. |
| 0:06–0:14 | `scripts/reconcile.ts`. Get the 2.3% / 34.1% output. Commit it. |
| 0:14–0:32 | `lib/types.ts`, `lib/engine.ts`: `projectDays`, `safeToSpendToday`, `solveGap`. 3 tests. Commit. |
| 0:32–0:50 | Screens A and B. The cliff chart with the drawn edge. |
| 0:50–1:05 | Screen C, the solver table with the visible reject row. |
| 1:05–1:13 | `scripts/backtest.ts` (39% / 37%) and `/math` route. |
| 1:13–1:20 | Deploy to Vercel. Shoot the 5 screenshots per §9. |
| 1:20–1:30 | Finish the README (§18). Rehearse the script out loud, twice. |

If behind at 1:05, ship `/math` and skip the backtest script by hardcoding its output in the README with the query shown. `/math` matters more.

---

## 18. README structure (the AI reads this first)

Write in exactly this order:

1. **One-line thesis** (§2).
2. **Evidence table**, all 9 findings mapped to consequences (§3).
3. **The data-integrity finding**, with percentages: `ending_balance_cad` reconciles on 2.3% of 2,852 weekly transitions, median error $803.81; `running_balance_cad` on 20.5% of 31,506 rows, with 34.1% of credits followed by a balance decrease. State that the ledger is therefore derived. Link `scripts/reconcile.ts`.
4. **Three things every budget app gets wrong for a daily earner:** it treats the bank balance as their money and ignores earned-but-unpaid wages; it reports backward instead of forward; it has no concept of what closing a gap costs.
5. **Why work beats borrowing, with proof:** 99% of advances are smaller than one shift, median 42%.
6. **The validation:** engine computed $58.39 on May 27 from ledger math alone; she borrowed $55.92 the next evening. 4% error.
7. **The backtest:** 39% of 535 advances coverable by a same-day-paid shift within 48h; $530.83 of $1,434.63 in fees (37%) avoidable. Link `scripts/backtest.ts`.
8. **The metric this moves:** 27.8% vs 11.4% baseline.
9. **What this is not** (§4, pool differentiation).
10. **Real vs seeded, explicitly.** Worker profile, obligations, shifts and all 8 advances are real rows from the provided dataset. Gig options are seeded with honest `payout_days` fields and would be a partner integration in production. Judges do not penalize labelled seed data; they penalize mock screens pretending to be live.
11. **`/math` route**, linked, described as the verification surface.
12. **Sponsor alignment**, three bullets: it steers volume onto Boost and fee-free rails, which is margin rather than the transaction fee; it answers the HR buyer's stated churn objection that employees who start borrowing must keep borrowing; and a provider able to show it reduces repeat-use stacking has a defensible position given 12 states with EWA frameworks and a federal bill that cleared committee on July 1 2026.
13. **Learning & Ambition** (§12).
14. **Run instructions:** `npm i && npm run dev`, `npm test`, `npm run analyze`.
