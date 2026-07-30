# ChaChing

**Not just a budget tracker — a same-day earnings engine for daily workers *and* a new revenue channel for Zayzoon.**

Typical apps show money in / money out. ChaChing answers what a daily earner actually needs: *“Can I spend today — and if not, how do I earn my way closed before tonight?”*

It surfaces **timing gaps** (rent Friday, pay Saturday), scores **overspend risk**, then routes people into **real job opportunities** and/or **earned-wage advances**. That loop creates value on both sides:

| Who | Additional revenue stream |
| --- | --- |
| **The worker** | Stacked gigs and shifts that close today’s cash gap (and extras → Vault) |
| **Zayzoon** | Placement **commission on jobs** ChaChing fills for users — plus advance fees when they choose early wage access |

Budgeting alone doesn’t grow anyone’s income. ChaChing goes beyond the prompt: it turns a shortfall into **work**, and turns that work into a **shared business model**.

---

## Unique value proposition (why we’re not “another budgeting tool”)

1. **Timing, not totals** — You can earn enough this month and still be short on Friday. We name the gap and why it exists.
2. **Close the gap with income, not only cuts** — Same-day Calgary gigs matched to the dollar shortfall.
3. **Dual-sided revenue** — Workers get a new earn stream; **Zayzoon earns commission** when those job opportunities convert — so the partner wins when the user works, not only when they take an advance.
4. **Accountability that celebrates recovery** — Friends hear about advances *and* completed gigs.

That dual stream is the innovation judges should score: ChaChing is infrastructure for **day-rate survival + partner monetization**, not a prettier ledger.

---

## Why this exists (problem → solution)

| What budgeting apps do | What daily earners (and partners) need |
| --- | --- |
| Monthly totals & leftover charts | A yes / tight / stop decision *today* |
| “You’re over budget” after the fact | Likelihood of blowing past allowance *before* it happens |
| Cut spending advice | Concrete **jobs** to cover the shortfall the same day |
| Silent personal shame | Peer accountability on breaches *and* wins |
| No upside for wage-access partners | **Zayzoon commission** on placed gigs — revenue beyond advance fees |

**ChaChing is built around timing, not totals — and around earning more, not only spending less.**

---

## Product walkthrough

### 1. Spot the gap — timing, not totals

Rent and bills hit before pay lands. ChaChing names the shortfall, explains *why*, and offers two recovery paths: **gig** (earn + Zayzoon placement) or **Zayzoon advance**.

![ChaChing main screen — $312 timing gap with gig vs Zayzoon actions](./front%20end%20mockups/Chaching%20Main%20Screenshot.png)

### 2. Close it with a gig slate (worker earns · Zayzoon commissions)

Stack nearby shifts until the gap hits $0. The worker gets paid for the work; **Zayzoon takes a placement commission** on jobs filled through ChaChing. Anything beyond the shortfall can flow into a **ChaChing Vault** (4.50% APY).

![Gig slate — stack Calgary shifts to close a $312 gap, then Vault extras](./front%20end%20mockups/Chaching-3.png)

### 3. Or advance wages you’ve already earned

Pull the shortfall via **Zayzoon** (fee transparent up front), repaid from the next deposit — with social accountability wired in. Gig path and advance path sit side by side so users (and the partner) can compare.

![Zayzoon early wage access and social accountability entry point](./front%20end%20mockups/Chaching-5.png)

### 4. Pick who has your back

Opt-in friend by phone. They only get texts you’ve approved — advances, gap closed, Vault deposits. They can reply STOP anytime.

![Add accountability friend — consent-first SMS opt-in](./front%20end%20mockups/Chaching-4.png)

### 5. Real accountability texts (not just in-app toasts)

Friends hear both sides: early pay when you’re short, and praise when you finish a gig and close the gap.

![iMessage accountability thread — advance notice and gig win](./front%20end%20mockups/imessage-accountability.png)

> Interactive HTML prototypes live in [`front end mockups/`](./front%20end%20mockups/) (`index.html`, `imessage-accountability.html`). Open them in a browser for the clickable phone flow.

---

## Working app demo (Next.js)

The shipped app runs the **core daily loop** on synthetic Alberta worker data:

1. Open `/` → demo persona **Alex** (Calgary landscaper, `W-0069`) on a day he’s over allowance  
2. See **safe daily allowance**, **decision hero** (yes / tight / stop), and **overspend risk** with drivers  
3. Friends get simulated accountability toasts on breach  
4. Tap into **`/gigs`** → swipe Accept / Skip Calgary gigs (worker income path)  
5. Accepted payouts fold back into week earnings and rebuild allowance  

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Optional query params: `?worker=W-0069&date=2026-05-28` (defaults already set for the over-allowance story).

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## How it maps to the hackathon prompt

> *Build something beyond money in / money out — what would a worker who earns daily actually find valuable?*

| Prompt need | ChaChing answer |
| --- | --- |
| Day-to-day earnings reality | Safe allowance from week-to-date pay − prorated essentials ÷ days left |
| Beyond in/out ledgers | Overspend **risk score** + history→prediction timeline |
| Valuable *today* | Same-day **job opportunities** that pay the exact gap |
| Real personal pain | Timing mismatch (bills before pay) + peer pressure that celebrates recovery |
| **Beyond a budgeting tool** | **Dual revenue:** worker payouts + **Zayzoon gig-placement commissions** |
| Stretch ambition | Advance path, Vault surplus, SMS accountability, partner economics |

---

## Innovation highlights

- **Timing-aware cash gap** — “You earn enough this month; you’re still short Friday”  
- **Explainable overspend risk** — weighted heuristic with readable drivers — not a black box  
- **Income-first recovery** — gig stack matched to the shortfall, not only “spend less”  
- **Partner flywheel** — Zayzoon monetizes **job placement commissions** when ChaChing converts a gap into work (plus advance fees when users choose early wage access)  
- **Social accountability that cuts both ways** — notify on advance / breach *and* on gig completed / Vault deposit  
- **Vault after gap** — surplus gig pay → high-interest vault, not lifestyle creep  

---

## Technical execution

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4

**Data-backed, not hardcoded UI**

- Typed CSV loaders over synthetic Alberta daily-earner datasets (`data/`) — workers, daily earnings, transactions, recurring obligations  
- Persona mining scripts (`scripts/pick-persona.ts`, `pick-demo-day.ts`) score real CSV workers to pick a believable Calgary demo story  
- Core math: `src/lib/allowance.ts`, `src/lib/riskScore.ts`, `src/lib/insights.ts`  

**App architecture**

```
src/app/           → / dashboard, /gigs swipe deck, /api/health
src/components/    → decision hero, risk chart, allowance pulse, gigs, toasts
src/lib/           → allowance, risk, insights, CSV data access, persona
data/              → synthetic worker & cashflow CSVs
front end mockups/ → interactive HTML/CSS phone prototype + screenshots
```

**Clever bits**

- Custom SVG risk timeline (no chart library)  
- Gig accepts persist in `localStorage` and sync across tabs via `chaching-gigs-updated` so the dashboard allowance updates live  
- Mockups and app share the same Alex / $312 Calgary narrative for a coherent pitch  

---

## Functional completeness — core loop

| Step | Status |
| --- | --- |
| Load worker day from dataset | ✅ |
| Compute safe daily allowance + status | ✅ |
| Show spend / bill pressure / risk | ✅ |
| Accountability feedback on overspend | ✅ |
| Browse & accept Calgary gigs (worker revenue) | ✅ |
| Gig income updates allowance | ✅ |
| Zayzoon advance + Vault + SMS UX | ✅ in interactive mockups |
| Dual-sided model (worker earn + Zayzoon commission) | ✅ called out in product story, README, and UI copy |

---

## Team story (30-second pitch)

**Alex** works day-to-day in Calgary. Rent hits Friday; pay lands Saturday. ChaChing shows a **$312 gap** — not because he’s broke this month, but because **timing** failed him.

He can stack gigs until the gap closes (he gets paid; **Zayzoon earns a placement commission** on those jobs), or pull wages he’s already earned with Zayzoon for a small fee. Jamie, his accountability friend, gets a text either way — and another when Alex finishes a gig and closes the gap.

Less silent overspending. More income for the worker. A real revenue stream for Zayzoon. That’s beyond budgeting.

---

## Submission description (paste into the hackathon portal)

**ChaChing** goes beyond money-in / money-out. For daily earners it surfaces timing gaps, predicts overspend risk, and closes shortfalls with same-day job opportunities or Zayzoon earned-wage advances — plus friend accountability on slips and wins. Workers gain an **extra income stream** from gigs matched to their gap; **Zayzoon gains commission** on jobs placed through ChaChing, so the product creates value for both sides instead of stopping at a ledger.

---

## Judging checklist (how to evaluate us)

| Criterion | Weight | Where to look |
| --- | --- | --- |
| **Innovation & originality** | 25% | Dual revenue (worker gigs + Zayzoon commissions) · timing gap · Vault · two-sided accountability |
| **Technical execution** | 25% | CSV→allowance/risk pipeline, risk drivers, live gig→allowance sync |
| **Functional completeness** | 20% | Run `npm run dev` — overspend → gigs → allowance updates |
| **Problem–solution fit** | 20% | Daily earner needs *income today*, not a monthly leftover chart — and a partner model that scales it |
| **UX & design** | 5% | Screenshots above + `front end mockups/index.html` |
| **Learning & ambition** | 5% | Wage-advance + job marketplace economics + Vault + SMS on a working data loop |

**Screenshots for submission upload (same five as above):**

1. `front end mockups/Chaching Main Screenshot.png`  
2. `front end mockups/Chaching-3.png`  
3. `front end mockups/Chaching-5.png`  
4. `front end mockups/Chaching-4.png`  
5. `front end mockups/imessage-accountability.png`  

---

## License

Private hackathon submission — all rights reserved by the team.
