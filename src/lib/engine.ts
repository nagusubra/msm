/**
 * The engine. Pure: no React, no fetch, no fs, no system clock, no randomness.
 * Every figure the UI renders and every figure the scripts print comes from here,
 * so there is exactly one implementation of the math (docs/spec.md §16).
 *
 * The load-bearing decision: balance is DERIVED from earnings and obligations.
 * The dataset's own balance columns reconcile on 2.3% of week transitions and
 * 20.5% of transactions, so they are never read (scripts/reconcile.ts proves it).
 */
import { addDays, dateOnly, dayOfMonth, daysBetween, isOnOrBefore, longLabel } from "./dates"
import { atLeast, round2 } from "./types"
import type {
  Advance,
  Confidence,
  DayCell,
  GapOption,
  HoursFeed,
  Limits,
  Money,
  Obligation,
  Shift,
  WorkOption,
} from "./types"

/** Wages not paid same day land five days after the work date (spec §16.3). */
export const PAYOUT_LAG_DAYS = 5
/** A day is a cliff when its outflow is a quarter of the monthly obligation load. */
export const CLIFF_OUTFLOW_SHARE = 0.25
export const DEFAULT_HORIZON_DAYS = 21
export const NSF_FEE = 35
export const LATE_FEE = 25
/** Mid-point of the dataset's observed Boost bonus range (0.05 to 0.25). */
export const BOOST_BONUS = 0.15

export interface LedgerInput {
  shifts: Shift[]
  obligations: Obligation[]
  opening: Money
  start: string
  end: string
  today: string
}

export interface MoneyState {
  key: "banked" | "earned_unpaid" | "scheduled" | "unconfirmed"
  label: string
  amount: Money
  advanceable: boolean
  confidence: Confidence
}

export interface Cliff {
  date: string
  label: string
  outflow: Money
  obligations: Obligation[]
  projected_balance: Money
  shortfall: Money
  days_away: number
}

export interface SafeToSpend {
  safe: Money
  balance_today: Money
  today_earned: Money
  inflow_before_cliff: Money
  committed: Money
  next_cliff: Cliff | null
  days_to_cliff: number
  shortfall: Money
}

export interface FeedHealth {
  status: HoursFeed["status"]
  days_stale: number
  unconfirmed_shifts: number
  estimated_net: Money
  message: string
  escalation_target: string
  escalation_draft: string
}

// ---------------------------------------------------------------------------
// Rates
// ---------------------------------------------------------------------------

/** Σ net ÷ Σ hours over the shift rows. Never `typical_daily_net`, which is a
 *  profile field and does not reconcile with the shifts (spec §1, correction 1). */
export function netHourly(shifts: Shift[]): Money {
  const hours = shifts.reduce((sum, shift) => sum + shift.hours, 0)
  if (hours === 0) return 0
  return round2(shifts.reduce((sum, shift) => sum + shift.net, 0) / hours)
}

export function meanShiftNet(shifts: Shift[]): Money {
  if (shifts.length === 0) return 0
  return round2(shifts.reduce((sum, shift) => sum + shift.net, 0) / shifts.length)
}

export function meanShiftHours(shifts: Shift[]): number {
  if (shifts.length === 0) return 0
  return Math.round((shifts.reduce((sum, shift) => sum + shift.hours, 0) / shifts.length) * 10) / 10
}

export function sameDayPayRate(shifts: Shift[]): number {
  if (shifts.length === 0) return 0
  return shifts.filter((shift) => shift.paid_same_day).length / shifts.length
}

/** The date a shift's money actually reaches the account. */
export function landingDate(shift: Shift): string {
  return shift.paid_same_day ? shift.date : addDays(shift.date, PAYOUT_LAG_DAYS)
}

// ---------------------------------------------------------------------------
// Three money states
// ---------------------------------------------------------------------------

/**
 * Spec §16.2 sums every not-paid-same-day shift up to today into earnedUnpaid.
 * That double-counts wages already deposited, so we exclude any whose landing
 * date has passed: those dollars are in the account and belong to `banked`.
 * `banked` is the derived ledger balance, which is what "in your account" means.
 *
 * Unconfirmed hours are shifts after the hours-feed last sync through the next
 * cliff (docs/numbers.md: May 28 + May 31 = $208.91). They are not advanceable.
 * They must not be folded into "Scheduled ahead".
 */
export function moneyStates(
  shifts: Shift[],
  today: string,
  balanceToday: Money,
  lastSync: string,
  untilDate: string,
): MoneyState[] {
  const day = dateOnly(today)
  const sync = dateOnly(lastSync)
  const until = dateOnly(untilDate)

  const earnedUnpaid = shifts
    .filter((s) => isOnOrBefore(s.date, day) && !s.paid_same_day && s.confirmed && !isOnOrBefore(landingDate(s), day))
    .reduce((sum, s) => sum + s.net, 0)

  const unconfirmed = shifts
    .filter((s) => !s.confirmed && !isOnOrBefore(s.date, sync) && isOnOrBefore(s.date, until))
    .reduce((sum, s) => sum + s.net, 0)

  // Scoped to the projection horizon. Summing every future shift to the end of
  // the dataset would show her thousands of dollars of "money" that is three
  // weeks past the decision she is making tonight. Unconfirmed near-term hours
  // are peeled into their own haze bucket above.
  const horizonEnd = addDays(day, DEFAULT_HORIZON_DAYS)
  const scheduled = shifts
    .filter(
      (s) =>
        !isOnOrBefore(s.date, day) &&
        isOnOrBefore(s.date, horizonEnd) &&
        (s.confirmed || !isOnOrBefore(s.date, until)),
    )
    .reduce((sum, s) => sum + s.net, 0)

  return [
    {
      key: "banked",
      label: "In your account",
      amount: round2(Math.max(0, balanceToday)),
      advanceable: true,
      confidence: "confirmed",
    },
    {
      key: "earned_unpaid",
      label: "Earned, not paid yet",
      amount: round2(earnedUnpaid),
      advanceable: true,
      confidence: "confirmed",
    },
    {
      key: "unconfirmed",
      label: "Hours not confirmed",
      amount: round2(unconfirmed),
      advanceable: false,
      confidence: "stale",
    },
    {
      key: "scheduled",
      label: "Scheduled ahead",
      amount: round2(scheduled),
      advanceable: false,
      confidence: "estimated",
    },
  ].filter((state) => state.amount > 0) as MoneyState[]
}

// ---------------------------------------------------------------------------
// The derived ledger
// ---------------------------------------------------------------------------

export function monthlyObligationTotal(obligations: Obligation[]): Money {
  return round2(obligations.reduce((sum, o) => sum + o.amount, 0))
}

/**
 * One DayCell per day from start to end inclusive. balance carries forward:
 * balance = previous + inflow - outflow. The provided balance columns are never
 * read (spec §1, correction 2).
 */
export function deriveLedger(input: LedgerInput): DayCell[] {
  const { shifts, obligations, opening, start, end, today } = input
  const day = dateOnly(today)
  const cliffThreshold = round2(monthlyObligationTotal(obligations) * CLIFF_OUTFLOW_SHARE)

  const inflowByDate = new Map<string, number>()
  const unconfirmedByDate = new Map<string, number>()
  for (const shift of shifts) {
    const landing = landingDate(shift)
    inflowByDate.set(landing, (inflowByDate.get(landing) ?? 0) + shift.net)
    if (!shift.confirmed) {
      unconfirmedByDate.set(landing, (unconfirmedByDate.get(landing) ?? 0) + shift.net)
    }
  }

  const cells: DayCell[] = []
  let balance = opening
  let cursor = dateOnly(start)
  const last = dateOnly(end)

  while (isOnOrBefore(cursor, last)) {
    const dom = dayOfMonth(cursor)
    const due = obligations.filter((o) => o.due_day === dom)
    const outflow = round2(due.reduce((sum, o) => sum + o.amount, 0))
    const inflow = round2(inflowByDate.get(cursor) ?? 0)
    balance = round2(balance + inflow - outflow)

    const confidence: Confidence = (unconfirmedByDate.get(cursor) ?? 0) > 0
      ? "stale"
      : isOnOrBefore(cursor, day)
        ? "confirmed"
        : "estimated"

    cells.push({
      date: cursor,
      inflow,
      outflow,
      projected_balance: balance,
      confidence,
      is_cliff: outflow > 0 && atLeast(outflow, cliffThreshold),
      shortfall: round2(Math.max(0, -balance)),
      obligations: due,
    })
    cursor = addDays(cursor, 1)
  }

  return cells
}

export function balanceOn(days: DayCell[], date: string): Money {
  const target = dateOnly(date)
  const cell = days.find((d) => d.date === target)
  if (cell) return cell.projected_balance
  const earlier = days.filter((d) => isOnOrBefore(d.date, target))
  return earlier.length > 0 ? (earlier[earlier.length - 1]?.projected_balance ?? 0) : 0
}

/** The forward window Screen B renders: today through today + horizon. */
export function projectDays(input: LedgerInput, horizon: number = DEFAULT_HORIZON_DAYS): DayCell[] {
  const day = dateOnly(input.today)
  const end = addDays(day, horizon)
  return deriveLedger(input).filter((cell) => isOnOrBefore(day, cell.date) && isOnOrBefore(cell.date, end))
}

export function negativeDays(days: DayCell[]): DayCell[] {
  return days.filter((day) => day.projected_balance < 0)
}

export function findNextCliff(days: DayCell[], today: string): Cliff | null {
  const day = dateOnly(today)
  const cell = days.find((candidate) => candidate.is_cliff && !isOnOrBefore(candidate.date, day))
  if (!cell) return null
  return {
    date: cell.date,
    label: longLabel(cell.date),
    outflow: cell.outflow,
    obligations: cell.obligations,
    projected_balance: cell.projected_balance,
    shortfall: cell.shortfall,
    days_away: daysBetween(day, cell.date),
  }
}

/**
 * Safe to spend tonight without missing the next cliff.
 *
 * Spec §16.4 measures `committed` to the next inflow date. That reports over a
 * thousand dollars as spendable on a night when rent lands in five days, which
 * is the exact failure this product exists to prevent, so the horizon here is
 * the next cliff instead: safe is what survives it. Every input is returned so
 * /math can show the whole chain.
 */
export function safeToSpendToday(
  days: DayCell[],
  shifts: Shift[],
  today: string,
): SafeToSpend {
  const day = dateOnly(today)
  const balanceToday = balanceOn(days, day)
  const todayEarned = round2(shifts.filter((s) => s.date === day).reduce((sum, s) => sum + s.net, 0))
  const cliff = findNextCliff(days, day)

  if (!cliff) {
    return {
      safe: round2(Math.max(0, balanceToday)),
      balance_today: balanceToday,
      today_earned: todayEarned,
      inflow_before_cliff: 0,
      committed: 0,
      next_cliff: null,
      days_to_cliff: 0,
      shortfall: 0,
    }
  }

  const window = days.filter((d) => !isOnOrBefore(d.date, day) && isOnOrBefore(d.date, cliff.date))
  const inflowBeforeCliff = round2(window.reduce((sum, d) => sum + d.inflow, 0))
  const committed = round2(window.reduce((sum, d) => sum + d.outflow, 0))
  const balanceAtCliff = round2(balanceToday + inflowBeforeCliff - committed)

  return {
    safe: round2(Math.max(0, balanceAtCliff)),
    balance_today: balanceToday,
    today_earned: todayEarned,
    inflow_before_cliff: inflowBeforeCliff,
    committed,
    next_cliff: cliff,
    days_to_cliff: cliff.days_away,
    shortfall: round2(Math.max(0, -balanceAtCliff)),
  }
}

/** The most recent worked shift. Screen A reports the real one, not "today"
 *  — she has no shift on the demo date, and inventing one would be fabrication. */
export function latestShift(shifts: Shift[], today: string): Shift | null {
  const day = dateOnly(today)
  const past = shifts.filter((s) => isOnOrBefore(s.date, day)).sort((a, b) => (a.date < b.date ? -1 : 1))
  return past.length > 0 ? (past[past.length - 1] ?? null) : null
}

// ---------------------------------------------------------------------------
// Translating money into labour, which is the product's whole claim
// ---------------------------------------------------------------------------

export function billsInHours(amount: Money, hourly: Money): number {
  if (hourly <= 0) return 0
  return Math.round((amount / hourly) * 10) / 10
}

export function billsInShifts(amount: Money, shiftNet: Money): number {
  if (shiftNet <= 0) return 0
  return Math.round((amount / shiftNet) * 10) / 10
}

// ---------------------------------------------------------------------------
// The solver
// ---------------------------------------------------------------------------

export interface SolveGapInput {
  gap: Money
  daysUntilGap: number
  workOptions: WorkOption[]
  limits: Limits
  /** Monthly grocery spend, derived from her transactions. Boost pays a bonus on it. */
  groceryPortion: Money
  /** Net pay expected this pay period, for the 50% advance cap. */
  periodNet: Money
  /** Her observed median advance fee from the dataset. Never the $5 marketing figure. */
  observedFee: Money
}

function timingLabel(days: number): string {
  if (days <= 0) return "same day"
  if (days === 1) return "tomorrow"
  return `in ${days} days`
}

/**
 * Ranks every route across the gap. The two-dimensional filter is the product:
 * a route must deliver enough AND arrive before the money is due. A route that
 * fails only the timing test is returned with a reject reason rather than
 * dropped, because showing the rejection is the proof this is a solver and not
 * a job board (spec §16.6).
 *
 * Order: covering routes first, cheapest first, earliest arrival breaking ties;
 * then partials; then rejects last.
 */
export function solveGap(input: SolveGapInput): GapOption[] {
  const { gap, daysUntilGap, workOptions, limits, groceryPortion, periodNet, observedFee } = input
  const share = (cost: Money): number => (gap > 0 ? round2((cost / gap) * 100) / 100 : 0)
  const options: GapOption[] = []

  const rank = (source: WorkOption["source"]): number => (source === "employer_shift" ? 0 : 1)
  const work = [...workOptions].sort(
    (a, b) => rank(a.source) - rank(b.source) || a.payout_days - b.payout_days,
  )

  for (const option of work) {
    const arrivesInTime = option.payout_days <= daysUntilGap
    const delivers = atLeast(option.est_net, gap)
    const covers = delivers && arrivesInTime && !option.conflicts

    let rejectReason: GapOption["reject_reason"]
    if (option.conflicts) rejectReason = "shift conflict"
    else if (!arrivesInTime) rejectReason = "too late"

    options.push({
      kind: option.source,
      label: option.label,
      net_delivered: round2(option.est_net),
      cost: 0,
      cost_pct: 0,
      arrives_in_days: option.payout_days,
      covers,
      timing: timingLabel(option.payout_days),
      ...(rejectReason ? { reject_reason: rejectReason } : {}),
    })
  }

  const boostGain = round2(groceryPortion * BOOST_BONUS)
  if (boostGain > 0) {
    options.push({
      kind: "boost",
      label: "Groceries on a Boost card",
      net_delivered: boostGain,
      cost: round2(-boostGain),
      cost_pct: share(-boostGain),
      arrives_in_days: 0,
      covers: atLeast(boostGain, gap),
      timing: "same day",
    })
  }

  const advanceAmount = round2(
    Math.max(
      limits.min_request,
      Math.min(gap, limits.daily_max, round2(periodNet * limits.period_pct), limits.period_max),
    ),
  )
  options.push({
    kind: "advance",
    label: `Advance of ${formatMoney(advanceAmount)}`,
    net_delivered: advanceAmount,
    cost: round2(observedFee),
    cost_pct: share(observedFee),
    arrives_in_days: 0,
    covers: atLeast(advanceAmount, gap),
    timing: "tonight",
  })

  const doNothingCost = round2(NSF_FEE + LATE_FEE)
  options.push({
    kind: "nothing",
    label: "Do nothing",
    net_delivered: 0,
    cost: doNothingCost,
    cost_pct: share(doNothingCost),
    arrives_in_days: daysUntilGap,
    covers: false,
    timing: "—",
  })

  const rejected = (option: GapOption): boolean =>
    option.reject_reason !== undefined || option.kind === "nothing"

  return options.sort((a, b) => {
    if (rejected(a) !== rejected(b)) return rejected(a) ? 1 : -1
    if (a.covers !== b.covers) return a.covers ? -1 : 1
    if (a.cost_pct !== b.cost_pct) return a.cost_pct - b.cost_pct
    return a.arrives_in_days - b.arrives_in_days
  })
}

/** True when no route closes the gap. The honest-failure path is specified
 *  (spec §16.6): say so and show the best partial rather than faking a solution. */
export function bestPartial(options: GapOption[]): GapOption | null {
  const partials = options
    .filter((option) => !option.covers && option.kind !== "nothing" && option.reject_reason === undefined)
    .sort((a, b) => b.net_delivered - a.net_delivered)
  return partials[0] ?? null
}

export function anyCovers(options: GapOption[]): boolean {
  return options.some((option) => option.covers)
}

// ---------------------------------------------------------------------------
// Feed health
// ---------------------------------------------------------------------------

/**
 * The hours feed is stale in the dataset, so some worked hours are not
 * advanceable. Never show a bare $0: show the estimate, labelled. Escalation is
 * addressed to the employer, because a broken time export is only fixable there.
 */
export function feedHealth(
  feed: HoursFeed,
  shifts: Shift[],
  today: string,
  untilDate: string,
): FeedHealth {
  const day = dateOnly(today)
  const sync = dateOnly(feed.last_sync)
  const until = dateOnly(untilDate)
  // Same window as moneyStates: post-sync, through the next cliff.
  const unconfirmed = shifts.filter(
    (s) => !s.confirmed && !isOnOrBefore(s.date, sync) && isOnOrBefore(s.date, until),
  )
  const estimatedNet = round2(unconfirmed.reduce((sum, s) => sum + s.net, 0))
  const daysStale = daysBetween(sync, day)

  return {
    status: feed.status,
    days_stale: daysStale,
    unconfirmed_shifts: unconfirmed.length,
    estimated_net: estimatedNet,
    message:
      daysStale > 0
        ? `Your hours feed last updated ${daysStale} days ago, so these hours are estimated and cannot be advanced.`
        : "Your hours are up to date.",
    escalation_target: feed.escalation_target,
    escalation_draft: feed.draft,
  }
}

// ---------------------------------------------------------------------------
// Advance history, for the validation surface
// ---------------------------------------------------------------------------

export function feesPaid(advances: Advance[]): Money {
  return round2(advances.reduce((sum, advance) => sum + advance.fee, 0))
}

export function medianFee(advances: Advance[]): Money {
  if (advances.length === 0) return 0
  const fees = advances.map((advance) => advance.fee).sort((a, b) => a - b)
  const mid = Math.floor(fees.length / 2)
  return round2(fees.length % 2 === 0 ? ((fees[mid - 1] ?? 0) + (fees[mid] ?? 0)) / 2 : (fees[mid] ?? 0))
}

/** The advance she took on the evening after the projection date, if any. */
export function advanceAfter(advances: Advance[], today: string): Advance | null {
  const day = dateOnly(today)
  const later = advances
    .filter((advance) => !isOnOrBefore(dateOnly(advance.requested_at), day))
    .sort((a, b) => (a.requested_at < b.requested_at ? -1 : 1))
  return later[0] ?? null
}

// ---------------------------------------------------------------------------
// Formatting — the only place a number becomes a string
// ---------------------------------------------------------------------------

export function formatMoney(amount: Money, options?: { cents?: boolean; sign?: boolean }): string {
  const cents = options?.cents ?? true
  const magnitude = Math.abs(amount)
  const body = magnitude.toLocaleString("en-CA", {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0,
  })
  const sign = amount < 0 ? "-" : options?.sign ? "+" : ""
  return `${sign}$${body}`
}

export function formatPct(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`
}

export function formatHours(hours: number): string {
  return `${hours.toFixed(1)} hours`
}
