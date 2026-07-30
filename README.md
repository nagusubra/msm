# ChaChing

**Beyond money in / money out — a same-day cash-flow tool for daily earners, and a dual revenue engine for workers *and* Zayzoon.**

The hackathon asked what someone who gets paid by the day would actually find valuable. Research and industry data point to the same answer: **timing**, not monthly totals.

ChaChing surfaces **cash timing gaps** (rent Friday, pay Saturday), scores **overspend risk**, then closes the shortfall with **same-day jobs** and/or **earned-wage advances** — with friend accountability on both slips and wins. That loop creates value on both sides:

| Who | What they gain |
| --- | --- |
| **The worker** | Extra income from gap-matched gigs (and surplus → Vault) instead of payday loans or silent shame |
| **Zayzoon** | **Placement commissions** on jobs ChaChing fills — plus advance fees when users choose early wage access |

Budgeting alone does not grow income. ChaChing turns a shortfall into **work**, and that work into a **shared business model**.

---

## Why this is useful (grounded in the real problem)

Daily and gig earners don’t fail because they can’t read a pie chart. They fail because **fixed bills and variable pay don’t share a calendar**.

- **The “timing tax”** — Surveys of renters using payment-flexibility tools find ~**31%** sometimes, rarely, or never have enough cash when rent is due — *not because they lack earnings*, but because pay and rent dates misalign ([HousingWire / Flex](https://www.housingwire.com/articles/rent-timing-tax-workers/)).
- **Income that moves** — The Federal Reserve’s SHED work finds about **one in three** wage earners has income that varies month to month — brutal when rent is a fixed lump sum.
- **Same-day cash is a need, not a nicety** — PYMNTS research finds **~54% of gig workers** (and **~65% of tipped workers**) say they need same-day access to funds; side work is often used for **rent, groceries, and utilities**, not luxuries ([PYMNTS](https://www.pymnts.com/payroll/2026/welcome-to-the-transactional-economy/)).
- **The wrong bridge is expensive** — Typical payday-loan economics can cost ~**$520 to borrow $375**; overdraft/NSF fees hit vulnerable households hardest. ChaChing steers people toward **earn** or transparent **earned-wage access** instead.
- **Partners want more than advances** — Industry analyses (e.g. Everest on EWA) show employers moving EWA into **holistic financial wellness** — education, savings, planning — not payday alone. ChaChing matches that shift: gap insight → gig or advance → Vault → accountability.

**What a daily earner actually values:** *Can I make it through today — and if not, how do I earn or unlock wages I already worked before tonight?* That is the prompt. That is ChaChing.

---

## Unique value proposition

1. **Timing, not totals** — Enough for the month can still mean short on Friday. We name the dollar gap and *why*.
2. **Close with income, not only cuts** — Same-day Calgary gigs matched to the shortfall — valuable when side work is how people cover essentials.
3. **Dual-sided revenue** — Workers get a new earn stream; **Zayzoon earns commission** when those jobs convert — partner upside beyond advance fees alone.
4. **Safer than the default alternatives** — Transparent advance fee *or* $0-fee gig path, vs. payday/overdraft spirals.
5. **Accountability that celebrates recovery** — Friends hear about advances *and* completed gigs.

Judges scoring **Innovation** and **Problem–Solution Fit**: this is day-rate survival infrastructure + partner monetization — not a prettier ledger.

---

## Why this exists (problem → solution)

| What budgeting apps do | What daily earners (and partners) need |
| --- | --- |
| Monthly totals & leftover charts | A yes / tight / stop decision *today* |
| “You’re over budget” after the fact | Likelihood of blowing past allowance *before* it happens |
| Cut spending advice | Concrete **jobs** (and transparent advances) to cover the shortfall the same day |
| Silent personal shame | Peer accountability on breaches *and* wins |
| No upside for wage-access partners | **Zayzoon commission** on placed gigs — revenue beyond advance fees |

**ChaChing is built around timing, not totals — and around earning more, not only spending less.**

---

## Product walkthrough

### 1. Spot the gap — timing, not totals

Rent and bills hit before pay lands. ChaChing names the shortfall, explains *why*, and offers two recovery paths: **gig** (worker earns · Zayzoon placement) or **Zayzoon advance**.

![ChaChing main screen — $312 timing gap with gig vs Zayzoon actions](./front%20end%20mockups/Chaching%20Main%20Screenshot.png)

### 2. Close it with a gig slate (worker earns · Zayzoon commissions)

Stack nearby shifts until the gap hits $0. The worker gets paid; **Zayzoon takes a placement commission** on jobs filled through ChaChing. Anything beyond the shortfall can flow into a **ChaChing Vault** (4.50% APY).

![Gig slate — stack Calgary shifts to close a $312 gap, then Vault extras](./front%20end%20mockups/Chaching-3.png)

### 3. Or advance wages you’ve already earned

Pull the shortfall via **Zayzoon** (fee transparent up front), repaid from the next deposit — with social accountability wired in. Gig and advance sit side by side so users (and the partner) can compare.

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

| Prompt need | ChaChing answer | Why it’s credible |
| --- | --- | --- |
| Day-to-day earnings reality | Safe allowance from week-to-date pay − prorated essentials ÷ days left | Matches variable daily pay vs fixed bills |
| Beyond in/out ledgers | Overspend **risk score** + history→prediction timeline | Anticipates pressure before the “timing tax” hits |
| Valuable *today* | Same-day **job opportunities** that pay the exact gap | Aligns with gig workers’ need for same-day cash / side income for essentials |
| Real personal pain | Timing mismatch (bills before pay) + peer recovery signals | Same failure mode documented for renters and irregular-pay workers |
| **Beyond a budgeting tool** | **Dual revenue:** worker payouts + **Zayzoon gig-placement commissions** | Earn path + partner economics, not another monthly report |
| Stretch ambition | Advance + Vault + SMS + marketplace commission model | Matches industry move from EWA-alone → holistic wellness |

---

## Innovation highlights

- **Timing-aware cash gap** — “You earn enough this month; you’re still short Friday” (the documented timing tax)  
- **Explainable overspend risk** — weighted heuristic with readable drivers — not a black box  
- **Income-first recovery** — gig stack matched to the shortfall, not only “spend less”  
- **Partner flywheel** — Zayzoon monetizes **job placement commissions** when ChaChing converts a gap into work (plus advance fees)  
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

**Alex** works day-to-day in Calgary. Rent hits Friday; pay lands Saturday. ChaChing shows a **$312 gap** — not because he’s broke this month, but because **timing** failed him (the same “timing tax” millions of renters and irregular-pay workers pay every cycle).

He can stack gigs until the gap closes (he gets paid; **Zayzoon earns a placement commission**), or pull wages he’s already earned with Zayzoon for a small fee — instead of payday loans or overdrafts. Jamie, his accountability friend, gets a text either way — and another when Alex finishes a gig and closes the gap.

Less silent overspending. More income for the worker. A real revenue stream for Zayzoon. That’s what “beyond budgeting” looks like.

---

## Submission description (paste into the hackathon portal)

**ChaChing** answers the daily-earner prompt: not another money-in / money-out chart, but a tool for the **cash timing gap** — when rent or bills hit before pay lands. It predicts overspend risk, then closes shortfalls with **same-day job opportunities** or **Zayzoon earned-wage advances**, plus friend accountability on slips and wins. Workers gain an **extra income stream** from gap-matched gigs; **Zayzoon gains placement commissions** on those jobs (and advance fees when users choose early access). Grounded in the real “timing tax” problem facing irregular-pay workers — useful today, and a dual-sided business beyond a ledger.

---

## Judging checklist (how to evaluate us)

| Criterion | Weight | Where to look |
| --- | --- | --- |
| **Innovation & originality** | 25% | Dual revenue (worker gigs + Zayzoon commissions) · timing gap · Vault · two-sided accountability |
| **Technical execution** | 25% | CSV→allowance/risk pipeline, risk drivers, live gig→allowance sync |
| **Functional completeness** | 20% | Run `npm run dev` — overspend → gigs → allowance updates |
| **Problem–solution fit** | 20% | Evidence-backed timing pain + same-day earn/advance paths daily workers actually need |
| **UX & design** | 5% | Screenshots above + `front end mockups/index.html` |
| **Learning & ambition** | 5% | Holistic loop (insight → earn or EWA → Vault → SMS) + partner economics |

**Screenshots for submission upload (same five as above):**

1. `front end mockups/Chaching Main Screenshot.png`  
2. `front end mockups/Chaching-3.png`  
3. `front end mockups/Chaching-5.png`  
4. `front end mockups/Chaching-4.png`  
5. `front end mockups/imessage-accountability.png`  

---

## License

Private hackathon submission — all rights reserved by the team.
