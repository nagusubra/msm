---
name: ship-submission
description: "The submission checklist: the five screenshots in shooting order, README required sections, deploy, and the 90-second demo script. Fire when the work turns to screenshots, README, deploying, the demo, or submitting."
---

# Ship the submission

Two gates: an AI screen picks the top 8, humans decide placements. Optimize the AI gate first. It runs six passes — repo structure, code quality, innovation, visual UX, **pool comparison**, and a final extended-thinking synthesis. This checklist targets each one.

## 1. Hard requirements (a miss here is a fail, not a deduction)

- [ ] **Repo public** before the deadline.
- [ ] Project name, description, repo URL, hosted URL submitted.
- [ ] Up to 5 screenshots attached.

## 2. README sections, in this order

The README is read by the repo-structure and pool-comparison passes, so it does specific work:

1. **Thesis** — the two-sentence version from `AGENTS.md`. Timing, not amount.
2. **The evidence table** — all nine findings from `docs/numbers.md`, with the reproduce commands.
3. **The data-integrity finding, with percentages** — `ending_balance_cad` reconciles on 2.3% of 2,852 week transitions, median absolute error $803.81; `running_balance_cad` on 20.5% of 31,506 rows; 34.1% of credits are followed by a balance decrease. Therefore the ledger is derived and both columns are ignored. This is the single highest-value code-quality signal in the repo. Do not bury it.
4. **"What this is not"** — the pool-comparison pass needs something to latch onto. With one budgeting prompt and ~25 teams, expect spend-category pie charts, savings-goal trackers, an AI chat over transactions, a streak app, a bill calendar. TILL differs on three axes: it optimizes rather than reports (`solveGap` is a constrained ranking over amount and time-to-cash), it treats working as a financial instrument priced against an advance, and it is validated against outcomes by a backtest on 535 real advances.
5. **Reproduce** — `npm run analyze`, `npm run reconcile`, `npm run backtest`, `npm test`, with the expected output of each.
6. **Design justification** — dark because 100% of observed sessions are 5 PM to midnight. Evidence, not taste.
7. **Learning & ambition**, three honest bullets: both provided balance columns fail reconciliation, so the plotting approach was thrown out for a derivation engine; the value claim was built as a falsifiable backtest over 535 historical advances rather than asserted; the hardest call was scope, cutting four finished-looking screens to ship one complete loop.
8. **Prompt mapping** — the table from `docs/spec.md` §11, tying each prompt phrase to a feature and a finding.

## 3. The five screenshots, in shooting order

1. **The cliff chart** with June 1 below zero and `-$58.39` labelled on the edge. Hero.
2. **Screen C, the ranked solver**, with the greyed "too late" row visible in frame. Non-negotiable: that row is the proof of the two-dimensional filter.
3. **Screen A**, safe-to-spend, with the three-state money bar and the haze "not advanceable" label.
4. **The cliff detail** card: "$1,310 due June 1. You're $58.39 short. That's 3.8 hours of work."
5. **The `/math` route**, engine-predicted $58.39 beside her actual $55.92 advance.

Number 5 wins technical execution. Do not skip it. Shoot at 390px width, dark, no browser chrome, no cursor.

## 4. Deploy

`npm run build` locally first and read the output. Deploy to Vercel. Open the hosted URL and confirm the numbers match `docs/numbers.md` in production, because a build-time data path that works in dev and 404s in prod is the classic way to lose the hosted-URL point.

## 5. The 90-second script

Full text in `docs/spec.md` §10. The beats, in order: evening-only advances → 85% on two dates → 99% under one shift → your balance columns don't reconcile → meet worker 131 → the $58.39 shortfall is 3.8 hours → the greyed row is why this is a solver → we predicted her real $55.92 advance within 4% → 39% of advances and 37% of fees were avoidable. Then stop. Rehearse out loud twice.

## 6. Final gate

Run the `audit-numbers` skill before submitting. The last judging pass is a synthesis over the whole repo; one contradiction between the README and a screenshot costs more than any single feature adds.
