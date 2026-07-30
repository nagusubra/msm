import { getEarningsForWorker } from "./data/earnings"
import { getObligationsForWorker } from "./data/obligations"
import { getTransactionsForWorker } from "./data/transactions"
import { getWorkerById } from "./data/workers"
import {
  daysBetweenInclusive,
  getWeekEnd,
  getWeekStart,
} from "./dates"

export type AllowanceStatus = "on_track" | "close" | "over"

export type AllowanceResult = {
  workerId: string
  date: string
  weekStart: string
  weekEnd: string
  todayIncome: number
  incomeSoFarThisWeek: number
  weeklyEssentialBurden: number
  remainingSafeBudget: number
  daysRemainingInWeek: number
  safeDailyAllowance: number
  spentTodayNonEssential: number
  usageRatio: number
  status: AllowanceStatus
  workerLabel: string
  occupation: string
  city: string
}

const prorateWeekly = (amountCad: number, frequency: string): number => {
  if (frequency === "monthly") {
    return (amountCad * 12) / 52
  }
  if (frequency === "biweekly") {
    return amountCad / 2
  }
  return amountCad
}

const resolveStatus = (usageRatio: number, safeDailyAllowance: number): AllowanceStatus => {
  if (safeDailyAllowance <= 0) {
    return usageRatio > 1 ? "over" : "close"
  }
  if (usageRatio > 1) return "over"
  if (usageRatio >= 0.8) return "close"
  return "on_track"
}

export const computeAllowance = (
  workerId: string,
  dateStr: string
): AllowanceResult | null => {
  const worker = getWorkerById(workerId)
  if (!worker) {
    return null
  }

  const weekStart = getWeekStart(dateStr)
  const weekEnd = getWeekEnd(weekStart)
  const earnings = getEarningsForWorker(workerId)

  const incomeSoFarThisWeek = earnings
    .filter((e) => e.workDate >= weekStart && e.workDate <= dateStr)
    .reduce((sum, e) => sum + e.netPayCad, 0)

  const todayIncome = earnings
    .filter((e) => e.workDate === dateStr)
    .reduce((sum, e) => sum + e.netPayCad, 0)

  const weeklyEssentialBurden = getObligationsForWorker(workerId)
    .filter((o) => o.essential)
    .reduce((sum, o) => sum + prorateWeekly(o.amountCad, o.frequency), 0)

  const remainingSafeBudget = Math.max(0, incomeSoFarThisWeek - weeklyEssentialBurden)
  const daysRemainingInWeek = daysBetweenInclusive(dateStr, weekEnd)
  const safeDailyAllowance =
    daysRemainingInWeek > 0 ? remainingSafeBudget / daysRemainingInWeek : 0

  const spentTodayNonEssential = getTransactionsForWorker(workerId)
    .filter((txn) => {
      const txnDate = txn.txnTs.slice(0, 10)
      return (
        txnDate === dateStr &&
        txn.direction === "debit" &&
        !txn.isEssential
      )
    })
    .reduce((sum, txn) => sum + txn.amountCad, 0)

  const usageRatio =
    safeDailyAllowance > 0
      ? spentTodayNonEssential / safeDailyAllowance
      : spentTodayNonEssential > 0
        ? Infinity
        : 0

  return {
    workerId,
    date: dateStr,
    weekStart,
    weekEnd,
    todayIncome,
    incomeSoFarThisWeek,
    weeklyEssentialBurden,
    remainingSafeBudget,
    daysRemainingInWeek,
    safeDailyAllowance,
    spentTodayNonEssential,
    usageRatio: Number.isFinite(usageRatio) ? usageRatio : 999,
    status: resolveStatus(usageRatio, safeDailyAllowance),
    workerLabel: `${worker.workerId} — ${worker.occupation}, ${worker.city}`,
    occupation: worker.occupation,
    city: worker.city,
  }
}
