# ChaChing

**Budgeting for people who get paid by the day — not the month.**

Typical apps show money in / money out. ChaChing answers the question a daily earner actually asks: *“Can I spend today — and if not, how do I close the gap before tonight?”*

It surfaces **timing gaps** (rent Friday, pay Saturday), scores **overspend risk** from real earning history, then offers same-day paths to recover: stack Calgary gigs, pull already-earned wages via **Zayzoon**, and keep a friend in the loop when you slip *or* when you bounce back.

---

## Why this exists (problem → solution)

| What budgeting apps do | What daily earners need |
| --- | --- |
| Monthly totals & leftover charts | A yes / tight / stop decision *today* |
| “You’re over budget” after the fact | Likelihood of blowing past allowance *before* it happens |
| Cut spending advice | Concrete ways to **earn or advance** the shortfall the same day |
| Silent personal shame | Peer accountability on both breaches *and* wins |

**ChaChing is built around timing, not totals.** You can earn enough for the month and still be short on Friday. That’s the pain we solve.

---

## Product walkthrough

### 1. Spot the gap — timing, not totals

Rent and bills hit before pay lands. ChaChing names the shortfall, explains *why*, and offers two recovery paths: **gig** ($0 fee) or **Zayzoon advance**.

![ChaChing main screen — $312 timing gap with gig vs Zayzoon actions](./front%20end%20mockups/Chaching%20Main%20Screenshot.png)

### 2. Close it with a gig slate

Stack nearby shifts until the gap hits $0. Anything beyond the shortfall can flow into a **ChaChing Vault** (4.50% APY) instead of checking — close the gap, then save.

![Gig slate — stack Calgary shifts to close a $312 gap, then Vault extras](./front%20end%20mockups/Chaching-3.png)

### 3. Or advance wages you’ve already earned

Pull the shortfall via **Zayzoon** (fee transparent up front), repaid from the next deposit — with social accountability wired in.

![Zayzoon early wage access and social accountability entry point](./front%20end%20mockups/Chaching-5.png)

### 4. Pick who has your back

Opt-in friend by phone. They only get texts you’ve approved — advances, gap closed, Vault deposits. They can reply STOP anytime.

![Add accountability friend — consent-first SMS opt-in](./front%20end%20mockups/Chaching-4.png)

### 5. Real accountability texts (not just in-app toasts)

Friends hear both sides of the story: early pay when you’re short, and praise when you finish a gig and close the gap.

![iMessage accountability thread — advance notice and gig win](./front%20end%20mockups/imessage-accountability.png)

> Interactive HTML prototypes live in [`front end mockups/`](./front%20end%20mockups/) (`index.html`, `imessage-accountability.html`). Open them in a browser for the clickable phone flow.

---

## Working app demo (Next.js)

The shipped app runs the **core daily loop** on synthetic Alberta worker data:

1. Open `/` → demo persona **Alex** (Calgary landscaper, `W-0069`) on a day he’s over allowance  
2. See **safe daily allowance**, **decision hero** (yes / tight / stop), and **overspend risk** with drivers  
3. Friends get simulated accountability toasts on breach  
4. Tap into **`/gigs`** → swipe Accept / Skip Calgary gigs  
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
| Valuable *today* | Same-day **gig deck** targeted to the dollar gap |
| Real personal pain | Timing mismatch (bills before pay) + peer pressure that celebrates recovery |
| Stretch ambition | Zayzoon path, Vault surplus, SMS accountability (high-fidelity mockups + app loop) |

---

## Innovation highlights

- **Timing-aware cash gap** — “You earn enough this month; you’re still short Friday”  
- **Explainable overspend risk** — weighted heuristic (history %, weekday pattern, streak, income vs typical, burn rate, volatility, bill pressure) with readable drivers — not a black box  
- **Close-the-gap actions** — gig stack *or* earned-wage advance, compared side by side  
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
| Browse & accept Calgary gigs | ✅ |
| Gig income updates allowance | ✅ |
| Zayzoon + Vault + real SMS UX | ✅ in interactive mockups (vision + demo path) |

---

## Team story (30-second pitch)

**Alex** works day-to-day in Calgary. Rent hits Friday; pay lands Saturday. ChaChing shows a **$312 gap** — not because he’s broke this month, but because **timing** failed him.

He can stack gigs until the gap closes (extras → Vault), or pull wages he’s already earned with Zayzoon for a small fee. Jamie, his accountability friend, gets a text either way — and another when Alex finishes a gig and closes the gap.

Less silent overspending. More peer-backed momentum toward better money decisions.

---

## Judging checklist (how to evaluate us)

| Criterion | Weight | Where to look |
| --- | --- | --- |
| **Innovation & originality** | 25% | Timing gap + dual recovery paths + two-sided accountability + Vault |
| **Technical execution** | 25% | CSV→allowance/risk pipeline, risk drivers, live gig→allowance sync |
| **Functional completeness** | 20% | Run `npm run dev` — overspend → gigs → allowance updates |
| **Problem–solution fit** | 20% | Daily earner “can I spend *today*?” — not monthly leftover charts |
| **UX & design** | 5% | Screenshots above + `front end mockups/index.html` |
| **Learning & ambition** | 5% | Wage-advance + Vault + SMS layer on top of a working data loop |

**Screenshots for submission upload (same five as above):**

1. `front end mockups/Chaching Main Screenshot.png`  
2. `front end mockups/Chaching-3.png`  
3. `front end mockups/Chaching-5.png`  
4. `front end mockups/Chaching-4.png`  
5. `front end mockups/imessage-accountability.png`  

---

## License

Private hackathon submission — all rights reserved by the team.
