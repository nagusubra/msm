import { computeAllowance, type AllowanceResult } from "./allowance"
import { getEarningsForWorker } from "./data/earnings"
import { getObligationsForWorker } from "./data/obligations"
import { getTransactionsForWorker } from "./data/transactions"
import { getWorkerById, type Worker } from "./data/workers"
import { daysBetweenInclusive, getWeekEnd, getWeekStart, parseDate } from "./dates"
import { FEATURED_PERSONA } from "./persona"
import { computeOverspendRisk, type OverspendRisk, type RiskTimelinePoint, buildOverspendRiskTimeline } from "./riskScore"

export type SpendCategory = {
  category: string
  amountCad: number
}

export type UpcomingBill = {
  name: string
  category: string
  amountCad: number
  dueDate: string
  daysUntil: number
  essential: boolean
}

export type DecisionKind = "yes" | "tight" | "no"

export type DailyInsight = {
  allowance: AllowanceResult
  worker: Worker
  displayName: string
  remainingAllowance: number
  shortfallCad: number
  decision: DecisionKind
  decisionTitle: string
  decisionDetail: string
  typicalDailyNetCad: number
  todayVsTypicalRatio: number
  spendByCategory: SpendCategory[]
  topSpendCategory: SpendCategory | null
  upcomingBills: UpcomingBill[]
  essentialDueThisWeekCad: number
  pressureStreak: {
    window: number
    overOrClose: number
    over: number
  }
  suggestedGigHours: number
  suggestedGigPayout: number
  overspendRisk: OverspendRisk
  riskTimeline: RiskTimelinePoint[]
}

const AVG_GIG_HOURLY_CAD = 22

const decisionFrom = (
  remaining: number,
  shortfall: number,
  status: AllowanceResult["status"]
): Pick<DailyInsight, "decision" | "decisionTitle" | "decisionDetail"> => {
  if (shortfall > 0 || status === "over") {
    return {
      decision: "no",
      decisionTitle: "Hold off on extra spending",
      decisionDetail:
        shortfall > 0
          ? `You're already $${shortfall.toFixed(0)} over today's safe pocket money.`
          : "Today's non-essential spend has used up your safe allowance.",
    }
  }

  if (status === "close" || remaining < 15) {
    return {
      decision: "tight",
      decisionTitle: "Spend carefully tonight",
      decisionDetail:
        remaining > 0
          ? `Only ${remaining.toFixed(0)} CAD of safe pocket money left today.`
          : "Your safe daily allowance is nearly gone.",
    }
  }

  return {
    decision: "yes",
    decisionTitle: "You're clear to spend a little",
    decisionDetail: `About ${remaining.toFixed(0)} CAD of safe pocket money remains today.`,
  }
}

const dueDateForMonth = (year: number, monthIndex: number, dueDay: number): string => {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate()
  const day = Math.min(dueDay, lastDay)
  const date = new Date(Date.UTC(year, monthIndex, day))
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const upcomingBillsForWeek = (
  workerId: string,
  dateStr: string
): UpcomingBill[] => {
  const weekStart = getWeekStart(dateStr)
  const weekEnd = getWeekEnd(weekStart)
  const start = parseDate(weekStart)
  const obligations = getObligationsForWorker(workerId)
  const bills: UpcomingBill[] = []

  for (const o of obligations) {
    if (o.frequency !== "monthly" && o.frequency !== "biweekly") continue

    if (o.frequency === "monthly") {
      const candidates = [
        dueDateForMonth(start.getUTCFullYear(), start.getUTCMonth(), o.dueDayOfMonth),
        dueDateForMonth(
          start.getUTCMonth() === 11 ? start.getUTCFullYear() + 1 : start.getUTCFullYear(),
          (start.getUTCMonth() + 1) % 12,
          o.dueDayOfMonth
        ),
      ]

      for (const dueDate of candidates) {
        if (dueDate < weekStart || dueDate > weekEnd) continue
        bills.push({
          name: o.name,
          category: o.category,
          amountCad: o.amountCad,
          dueDate,
          daysUntil: daysBetweenInclusive(dateStr, dueDate) - 1,
          essential: o.essential,
        })
      }
    }

    if (o.frequency === "biweekly") {
      // Approximate: treat due_day_of_month as one anchor in the current month
      const dueDate = dueDateForMonth(
        start.getUTCFullYear(),
        start.getUTCMonth(),
        o.dueDayOfMonth
      )
      if (dueDate >= weekStart && dueDate <= weekEnd) {
        bills.push({
          name: o.name,
          category: o.category,
          amountCad: o.amountCad,
          dueDate,
          daysUntil: daysBetweenInclusive(dateStr, dueDate) - 1,
          essential: o.essential,
        })
      }
    }
  }

  return bills
    .filter((b) => b.dueDate >= dateStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate) || b.amountCad - a.amountCad)
}

const spendBreakdown = (workerId: string, dateStr: string): SpendCategory[] => {
  const map = new Map<string, number>()
  for (const txn of getTransactionsForWorker(workerId)) {
    if (!txn.txnTs.startsWith(dateStr)) continue
    if (txn.direction !== "debit" || txn.isEssential) continue
    map.set(txn.category, (map.get(txn.category) ?? 0) + txn.amountCad)
  }

  return [...map.entries()]
    .map(([category, amountCad]) => ({ category, amountCad }))
    .sort((a, b) => b.amountCad - a.amountCad)
}

const pressureStreak = (workerId: string, dateStr: string) => {
  const workDates = [
    ...new Set(getEarningsForWorker(workerId).map((e) => e.workDate)),
  ]
    .filter((d) => d <= dateStr)
    .sort()
    .slice(-7)

  let over = 0
  let overOrClose = 0
  for (const d of workDates) {
    const r = computeAllowance(workerId, d)
    if (!r) continue
    if (r.status === "over") {
      over++
      overOrClose++
    } else if (r.status === "close") {
      overOrClose++
    }
  }

  return {
    window: workDates.length,
    overOrClose,
    over,
  }
}

export const computeDailyInsight = (
  workerId: string,
  dateStr: string
): DailyInsight | null => {
  const worker = getWorkerById(workerId)
  const allowance = computeAllowance(workerId, dateStr)
  if (!worker || !allowance) return null

  const remainingAllowance = Math.max(
    0,
    allowance.safeDailyAllowance - allowance.spentTodayNonEssential
  )
  const shortfallCad = Math.max(
    0,
    allowance.spentTodayNonEssential - allowance.safeDailyAllowance
  )
  const decision = decisionFrom(remainingAllowance, shortfallCad, allowance.status)
  const spendByCategory = spendBreakdown(workerId, dateStr)
  const upcomingBills = upcomingBillsForWeek(workerId, dateStr)
  const essentialDueThisWeekCad = upcomingBills
    .filter((b) => b.essential)
    .reduce((sum, b) => sum + b.amountCad, 0)

  const need = shortfallCad > 0 ? shortfallCad : Math.max(0, 40 - remainingAllowance)
  const suggestedGigHours =
    shortfallCad > 0 || allowance.status !== "on_track"
      ? Math.max(1, Math.ceil((need || 25) / AVG_GIG_HOURLY_CAD))
      : 0

  const todayVsTypicalRatio =
    worker.typicalDailyNetCad > 0
      ? allowance.todayIncome / worker.typicalDailyNetCad
      : 1

  const overspendRisk = computeOverspendRisk(workerId, dateStr)
  if (!overspendRisk) return null

  const riskTimeline = buildOverspendRiskTimeline(workerId, dateStr)

  return {
    allowance,
    worker,
    displayName: FEATURED_PERSONA.displayName,
    remainingAllowance,
    shortfallCad,
    ...decision,
    typicalDailyNetCad: worker.typicalDailyNetCad,
    todayVsTypicalRatio,
    spendByCategory,
    topSpendCategory: spendByCategory[0] ?? null,
    upcomingBills,
    essentialDueThisWeekCad,
    pressureStreak: pressureStreak(workerId, dateStr),
    suggestedGigHours,
    suggestedGigPayout: suggestedGigHours * AVG_GIG_HOURLY_CAD,
    overspendRisk,
    riskTimeline,
  }
}
