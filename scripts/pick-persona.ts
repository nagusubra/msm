import { writeFileSync } from "fs"
import { getWorkers } from "../src/lib/data/workers"
import { getEarningsForWorker } from "../src/lib/data/earnings"
import { computeAllowance } from "../src/lib/allowance"
import { getObligationsForWorker } from "../src/lib/data/obligations"
import { getTransactionsForWorker } from "../src/lib/data/transactions"

type Score = {
  id: string
  occ: string
  city: string
  pay: string
  volatility: number
  rent: string
  sideGig: boolean
  dependents: number
  days: number
  over: number
  close: number
  overRate: number
  pressureRate: number
  avgOverage: number
  typical: number
  advancePressure: number
}

const workers = getWorkers()
const scores: Score[] = []

for (const w of workers) {
  const earnings = getEarningsForWorker(w.workerId)
  const dates = [...new Set(earnings.map((e) => e.workDate))].sort()
  let over = 0
  let close = 0
  let days = 0
  let totalSpentOver = 0

  for (const d of dates) {
    const r = computeAllowance(w.workerId, d)
    if (!r) continue
    days++
    if (r.status === "over") {
      over++
      totalSpentOver += Math.max(0, r.spentTodayNonEssential - r.safeDailyAllowance)
    } else if (r.status === "close") {
      close++
    }
  }

  const overRate = days ? over / days : 0
  const pressureRate = days ? (over + close) / days : 0

  scores.push({
    id: w.workerId,
    occ: w.occupation,
    city: w.city,
    pay: w.payType,
    volatility: w.incomeVolatility,
    rent: w.rentBurdenBand,
    sideGig: w.hasSideGig,
    dependents: w.dependents,
    days,
    over,
    close,
    overRate: Number(overRate.toFixed(3)),
    pressureRate: Number(pressureRate.toFixed(3)),
    avgOverage: over ? Number((totalSpentOver / over).toFixed(2)) : 0,
    typical: w.typicalDailyNetCad,
    advancePressure: 0,
  })
}

scores.sort(
  (a, b) =>
    b.overRate - a.overRate ||
    b.pressureRate - a.pressureRate ||
    b.avgOverage - a.avgOverage
)

const calgaryFit = scores.filter((s) => s.city === "Calgary" && s.overRate >= 0.15)

// Prefer Calgary (gigs page), volatile/daily/gig pay, high rent, dependents
const rankedFit = [...scores]
  .filter((s) => s.days >= 20)
  .map((s) => {
    let fit = s.overRate * 100 + s.pressureRate * 30 + Math.min(s.avgOverage / 10, 20)
    if (s.city === "Calgary") fit += 25
    if (s.pay === "daily" || s.pay === "gig") fit += 15
    if (s.rent === "severe" || s.rent === "high") fit += 10
    if (s.volatility >= 0.35) fit += 10
    if (s.dependents > 0) fit += 5
    if (s.sideGig) fit += 5
    return { ...s, fit: Number(fit.toFixed(2)) }
  })
  .sort((a, b) => b.fit - a.fit)

const top = rankedFit[0]
const sampleDates = getEarningsForWorker(top.id)
  .map((e) => e.workDate)
  .filter((d, i, arr) => arr.indexOf(d) === i)
  .slice(-5)

const samples = sampleDates.map((d) => {
  const r = computeAllowance(top.id, d)!
  return {
    date: d,
    income: r.todayIncome,
    allowance: Number(r.safeDailyAllowance.toFixed(2)),
    spent: r.spentTodayNonEssential,
    status: r.status,
    shortfall: Number(
      Math.max(0, r.spentTodayNonEssential - r.safeDailyAllowance).toFixed(2)
    ),
  }
})

const obligations = getObligationsForWorker(top.id)
const recentTxns = getTransactionsForWorker(top.id)
  .filter((t) => t.direction === "debit" && !t.isEssential)
  .slice(-8)
  .map((t) => ({
    date: t.txnTs.slice(0, 10),
    cat: t.category,
    amt: t.amountCad,
  }))

const out = {
  top15OverRate: scores.slice(0, 15),
  calgaryHighOver: calgaryFit.slice(0, 10),
  bestFit: top,
  top5Fit: rankedFit.slice(0, 5),
  samples,
  obligations: obligations.map((o) => ({
    name: o.name,
    amount: o.amountCad,
    freq: o.frequency,
    essential: o.essential,
    due: o.dueDayOfMonth,
  })),
  recentNonEssential: recentTxns,
}

writeFileSync("scripts/persona-pick.json", JSON.stringify(out, null, 2))
console.log("Wrote scripts/persona-pick.json")
console.log("BEST:", top.id, top.occ, top.city, "overRate", top.overRate, "fit", top.fit)
