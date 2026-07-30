import { computeAllowance } from "./allowance"
import { getEarningsForWorker } from "./data/earnings"
import { getWorkerById } from "./data/workers"
import { parseDate } from "./dates"

export type RiskLevel = "low" | "moderate" | "high" | "critical"

export type OverspendRisk = {
  score: number
  level: RiskLevel
  label: string
  summary: string
  drivers: string[]
  historicalOverRate: number
  weekdayOverRate: number
  sampleDays: number
  weekdaySampleDays: number
  avgNonEssentialSpend: number
}

export type RiskTimelinePoint = {
  date: string
  label: string
  score: number
  kind: "history" | "prediction"
  status: "on_track" | "close" | "over"
}

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value))

const shortDayLabel = (dateStr: string): string => {
  const date = parseDate(dateStr)
  return date.toLocaleDateString("en-CA", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

const observedRiskFromDay = (
  status: "on_track" | "close" | "over",
  spent: number,
  allowance: number
): number => {
  if (status === "over") {
    if (allowance <= 0) return 96
    const overage = spent / Math.max(allowance, 1)
    return Math.round(clamp(78 + overage * 12, 78, 100))
  }
  if (status === "close") {
    return Math.round(clamp(allowance > 0 ? (spent / allowance) * 100 : 72, 62, 84))
  }
  if (allowance <= 0) return 28
  return Math.round(clamp((spent / allowance) * 100, 8, 55))
}

/**
 * Recent workday risk trail ending in today's prediction score.
 * History points use observed overspend pressure; the final point is the model prediction.
 */
export const buildOverspendRiskTimeline = (
  workerId: string,
  dateStr: string,
  lookback = 12
): RiskTimelinePoint[] => {
  const prediction = computeOverspendRisk(workerId, dateStr)
  if (!prediction) return []

  const historyDates = [
    ...new Set(getEarningsForWorker(workerId).map((e) => e.workDate)),
  ]
    .filter((d) => d < dateStr)
    .sort()
    .slice(-lookback)

  const historyPoints: RiskTimelinePoint[] = historyDates.map((d) => {
    const result = computeAllowance(workerId, d)
    const status = result?.status ?? "on_track"
    const score = observedRiskFromDay(
      status,
      result?.spentTodayNonEssential ?? 0,
      result?.safeDailyAllowance ?? 0
    )

    return {
      date: d,
      label: shortDayLabel(d),
      score,
      kind: "history",
      status,
    }
  })

  const todayResult = computeAllowance(workerId, dateStr)

  return [
    ...historyPoints,
    {
      date: dateStr,
      label: "Today",
      score: prediction.score,
      kind: "prediction",
      status: todayResult?.status ?? "on_track",
    },
  ]
}

const levelFromScore = (score: number): RiskLevel => {
  if (score >= 75) return "critical"
  if (score >= 55) return "high"
  if (score >= 35) return "moderate"
  return "low"
}

const labelFromLevel = (level: RiskLevel): string => {
  if (level === "critical") return "Very likely to overspend"
  if (level === "high") return "Likely to overspend"
  if (level === "moderate") return "Watch closely"
  return "Lower risk today"
}

export const computeOverspendRisk = (
  workerId: string,
  dateStr: string
): OverspendRisk | null => {
  const worker = getWorkerById(workerId)
  const today = computeAllowance(workerId, dateStr)
  if (!worker || !today) return null

  const weekday = parseDate(dateStr).getUTCDay()
  const historyDates = [
    ...new Set(getEarningsForWorker(workerId).map((e) => e.workDate)),
  ]
    .filter((d) => d < dateStr)
    .sort()

  let overCount = 0
  let weekdayOver = 0
  let weekdayTotal = 0
  let spendSum = 0
  let spendDays = 0

  for (const d of historyDates) {
    const result = computeAllowance(workerId, d)
    if (!result) continue

    if (result.status === "over") overCount++

    const isSameWeekday = parseDate(d).getUTCDay() === weekday
    if (isSameWeekday) {
      weekdayTotal++
      if (result.status === "over") weekdayOver++
    }

    if (result.spentTodayNonEssential > 0) {
      spendSum += result.spentTodayNonEssential
      spendDays++
    }
  }

  const sampleDays = historyDates.length
  const historicalOverRate = sampleDays > 0 ? overCount / sampleDays : 0
  const weekdayOverRate = weekdayTotal > 0 ? weekdayOver / weekdayTotal : historicalOverRate
  const avgNonEssentialSpend = spendDays > 0 ? spendSum / spendDays : 0

  const recentDates = historyDates.slice(-14)
  let recentOver = 0
  for (const d of recentDates) {
    const result = computeAllowance(workerId, d)
    if (result?.status === "over") recentOver++
  }
  const recentOverRate =
    recentDates.length > 0 ? recentOver / recentDates.length : historicalOverRate

  const drivers: string[] = []
  let score = 0

  // Historical base risk
  const histPoints = historicalOverRate * 34
  score += histPoints
  if (historicalOverRate >= 0.25) {
    drivers.push(
      `Went over on ${Math.round(historicalOverRate * 100)}% of prior workdays`
    )
  }

  // Same weekday pattern
  const weekdayPoints = weekdayOverRate * 18
  score += weekdayPoints
  if (weekdayTotal >= 3 && weekdayOverRate >= 0.3) {
    drivers.push(
      `Same weekday historically over ${Math.round(weekdayOverRate * 100)}% of the time`
    )
  }

  // Recent momentum
  const recentPoints = recentOverRate * 16
  score += recentPoints
  if (recentDates.length >= 5 && recentOverRate >= 0.35) {
    drivers.push(
      `Recent streak: over on ${recentOver} of last ${recentDates.length} workdays`
    )
  }

  // Weak earning day vs typical
  const incomeRatio =
    worker.typicalDailyNetCad > 0
      ? today.todayIncome / worker.typicalDailyNetCad
      : 1
  if (today.todayIncome === 0) {
    score += 12
    drivers.push("No earnings logged today — thinner buffer")
  } else if (incomeRatio < 0.85) {
    const points = clamp((0.85 - incomeRatio) * 40, 0, 12)
    score += points
    drivers.push("Today's pay is below your typical day")
  }

  // Allowance thin vs usual non-essential habit
  if (avgNonEssentialSpend > 0) {
    if (today.safeDailyAllowance <= 0) {
      score += 14
      drivers.push("Safe allowance is already $0 after essentials")
    } else if (avgNonEssentialSpend > today.safeDailyAllowance) {
      const gapRatio = avgNonEssentialSpend / today.safeDailyAllowance
      score += clamp((gapRatio - 1) * 12, 4, 14)
      drivers.push(
        `Usual non-essential spend (~$${avgNonEssentialSpend.toFixed(0)}) exceeds today's allowance`
      )
    }
  }

  // Already burning today's allowance
  if (today.safeDailyAllowance > 0) {
    const usage = today.spentTodayNonEssential / today.safeDailyAllowance
    if (usage >= 1) {
      score += 12
      drivers.push("Already over today's allowance")
    } else if (usage >= 0.6) {
      score += usage * 10
      drivers.push("Already used most of today's allowance")
    }
  } else if (today.spentTodayNonEssential > 0) {
    score += 12
    drivers.push("Spending with no remaining safe allowance")
  }

  // Income volatility personality
  score += worker.incomeVolatility * 8
  if (worker.incomeVolatility >= 0.4) {
    drivers.push("High day-to-day income volatility")
  }

  // Early-week bill pressure
  if (today.daysRemainingInWeek >= 5 && today.safeDailyAllowance < 25) {
    score += 6
    drivers.push("Early-week essentials are squeezing pocket money")
  }

  const finalScore = Math.round(clamp(score))

  // If already over, floor the score so the prediction matches reality
  const adjustedScore =
    today.status === "over" ? Math.max(finalScore, 82) : finalScore
  const adjustedLevel = levelFromScore(adjustedScore)

  const summary =
    today.status === "over"
      ? "History and today's spend both say this day already tipped over — friends would notice."
      : adjustedLevel === "critical" || adjustedLevel === "high"
        ? "Based on your past earnings and spend patterns, today looks like a blow-through day."
        : adjustedLevel === "moderate"
          ? "Your history says tonight could tip over if spending continues unchecked."
          : "Historical patterns suggest you can stay inside allowance if you keep it steady."

  return {
    score: adjustedScore,
    level: adjustedLevel,
    label: labelFromLevel(adjustedLevel),
    summary,
    drivers: drivers.slice(0, 4),
    historicalOverRate,
    weekdayOverRate,
    sampleDays,
    weekdaySampleDays: weekdayTotal,
    avgNonEssentialSpend,
  }
}
