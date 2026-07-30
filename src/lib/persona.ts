/**
 * Assembles the UI view from the cohort file plus a live engine pass.
 * Projection window, cliff, safe-to-spend, and routes always come from
 * engine functions. The full Apr–Jun ledger on /math prefers the
 * analyze-precomputed persona_ledger (same formulas) so it matches
 * `npm run analyze` output; projectDays is the fallback if that array is empty.
 */
import cohortFile from "../../public/cohort.json"
import { addDays, dateOnly } from "./dates"
import {
  advanceAfter,
  anyCovers,
  bestPartial,
  billsInHours,
  billsInShifts,
  feedHealth,
  findNextCliff,
  latestShift,
  moneyStates,
  projectDays,
  safeToSpendToday,
  solveGap,
  type Cliff,
  type FeedHealth,
  type MoneyState,
  type SafeToSpend,
} from "./engine"
import { seed } from "./types"
import type { Advance, DayCell, GapOption, Money, Obligation, Shift } from "./types"

interface CohortStat {
  value: number
  computed_from: string
  method: string
}

interface CohortFile {
  meta: {
    generated_by: string
    generated_from: string[]
    window: string
    window_days: number
    today: string
    ignored_columns: string[]
    opening_balance_rule: string
  }
  cohort: Record<string, CohortStat>
  persona: {
    worker: Record<string, string | number | boolean>
    shifts: Shift[]
    obligations: Obligation[]
    advances: Advance[]
    net_hourly: Money
    mean_shift_net: Money
    mean_hours: number
    same_day_pay_rate: number
    monthly_income: Money
    monthly_obligations: Money
    advance_fee_median: Money
    advance_fees_total: Money
    negative_days: number
    grocery_monthly_mean?: Money
  }
  persona_ledger: DayCell[]
}

const cohort = cohortFile as unknown as CohortFile

export const WINDOW_START = "2026-04-01"
export const WINDOW_END = "2026-06-30"

export interface TillView {
  today: string
  worker: CohortFile["persona"]
  cohort: Record<string, CohortStat>
  meta: CohortFile["meta"]
  ledger: DayCell[]
  window: DayCell[]
  cliff: Cliff | null
  safe: SafeToSpend
  states: MoneyState[]
  latest: Shift | null
  feed: FeedHealth
  routes: GapOption[]
  covers: boolean
  partial: GapOption | null
  gap: Money
  gapInHours: number
  gapInShifts: number
  actualAdvance: Advance | null
  advanceFeeEstimate: Money
}

/** Everything both routes render, computed once from the engine. */
export function buildView(): TillView {
  const persona = cohort.persona
  const today = seed.meta.today

  const input = {
    shifts: persona.shifts,
    obligations: persona.obligations,
    opening: seed.meta.opening_balance_2026_04_01,
    start: WINDOW_START,
    end: WINDOW_END,
    today,
  }

  const ledger = cohort.persona_ledger.length > 0 ? cohort.persona_ledger : projectDays(input, 91)
  const window = projectDays(input)
  const safe = safeToSpendToday(window, persona.shifts, today)
  const cliff = findNextCliff(window, today)
  const gap = safe.shortfall

  const routes = solveGap({
    gap,
    daysUntilGap: safe.days_to_cliff,
    workOptions: seed.extra_work,
    limits: seed.limits,
    groceryPortion: persona.grocery_monthly_mean ?? 0,
    periodNet: persona.mean_shift_net * 4,
    observedFee: persona.advance_fee_median,
  })

  // Unconfirmed haze runs through the next cliff date (docs/numbers.md $208.91).
  const until = cliff?.date ?? addDays(dateOnly(today), safe.days_to_cliff)

  return {
    today,
    worker: persona,
    cohort: cohort.cohort,
    meta: cohort.meta,
    ledger,
    window,
    cliff,
    safe,
    states: moneyStates(persona.shifts, today, safe.balance_today, seed.hours_feed.last_sync, until),
    latest: latestShift(persona.shifts, today),
    feed: feedHealth(seed.hours_feed, persona.shifts, today, until),
    routes,
    covers: anyCovers(routes),
    partial: bestPartial(routes),
    gap,
    gapInHours: billsInHours(gap, persona.net_hourly),
    gapInShifts: billsInShifts(gap, persona.mean_shift_net),
    actualAdvance: advanceAfter(persona.advances, today),
    advanceFeeEstimate: persona.advance_fee_median,
  }
}
