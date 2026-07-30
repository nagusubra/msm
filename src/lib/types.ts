/**
 * Typed boundary for every input this app reads. Raw JSON is coerced here and
 * nowhere else; the rest of the codebase never touches an untyped shape.
 * Interfaces follow docs/spec.md §15 exactly.
 */
import rawSeed from "../../public/seed.json"

export type Money = number // CAD, 2dp
export type Confidence = "confirmed" | "estimated" | "stale"
export type ShiftType = "day" | "evening" | "night" | "split"

export interface Shift {
  date: string // YYYY-MM-DD
  shift: ShiftType
  hours: number
  net: Money
  paid_same_day: boolean
  confirmed: boolean // payroll feed has confirmed these hours
}

export type ObligationCategory =
  | "housing"
  | "phone"
  | "utilities"
  | "childcare"
  | "debt_payment"
  | "entertainment"
  | "transport"
  | "insurance"
  | "other"

export interface Obligation {
  name: string
  category: ObligationCategory
  amount: Money
  due_day: number // day of month
  autopay: boolean
  essential: boolean
}

export interface Advance {
  id: string
  requested_at: string // ISO
  amount: Money
  fee: Money
  status: "repaid" | "outstanding" | "cancelled"
  repayment_source: "next_payroll" | "same_day_earnings" | "manual"
  reason: string
}

export interface WorkOption {
  source: "employer_shift" | "gig"
  label: string
  hours: number
  est_net: Money
  payout_days: number // 0 = same day
  conflicts: boolean // clashes with a scheduled shift
}

export interface DayCell {
  date: string
  inflow: Money
  outflow: Money
  projected_balance: Money
  confidence: Confidence
  is_cliff: boolean
  shortfall: Money // max(0, -projected_balance)
  obligations: Obligation[] // what fell due that day, for the cliff detail card
}

export type GapOptionKind = "employer_shift" | "gig" | "boost" | "advance" | "nothing"
export type RejectReason = "too late" | "shift conflict" | "over daily cap"

export interface GapOption {
  kind: GapOptionKind
  label: string
  net_delivered: Money
  cost: Money // negative for Boost (a gain)
  cost_pct: number // cost / gap
  arrives_in_days: number
  covers: boolean
  reject_reason?: RejectReason
  /** Human sentence for the delivers column, e.g. "same day" / "in 2 days". */
  timing: string
}

export interface Limits {
  daily_max: Money
  period_pct: number
  period_max: Money
  min_request: Money
  observed_fee_range: [Money, Money]
  observed_fee_median: Money
  boost_bonus_range: [number, number]
  gas_card_bonus: number
}

export interface HoursFeed {
  last_sync: string
  status: Confidence | "ok"
  days_stale: number
  unconfirmed_shifts: number
  estimated_unconfirmed_net: Money
  escalation_target: string
  draft: string
}

export interface Worker {
  id: string
  city: string
  occupation: string
  pay_type: string
  typical_daily_net: Money
  net_hourly: Money
  income_volatility: number
  household_size: number
  dependents: number
  tenure_months: number
  commute: string
  rent_burden: string
  has_bank_account: boolean
  uses_prepaid_card: boolean
  has_side_gig: boolean
  monthly_income: Money
  monthly_obligations: Money
  same_day_pay_rate: number
}

export interface SeedMeta {
  dataset: string
  worker_id: string
  today: string
  opening_balance_2026_04_01: Money
  derivation_note: string
  validation: {
    engine_predicted_shortfall: Money
    worker_actual_advance_next_evening: Money
    actual_advance_fee: Money
    actual_advance_reason: string
    actual_advance_at: string
  }
}

export interface CohortStats {
  workers: number
  shifts: number
  advances: number
  obligations: number
  transactions: number
  advances_in_evening_window_pct: number
  oblig_dollars_on_1st_or_15th_pct: number
  advances_under_one_shift_pct: number
  median_advance_as_share_of_shift: number
  shifts_not_paid_same_day_pct: number
  repeat_next_week_pct: number
  baseline_next_week_pct: number
  advances_within_14d_of_prior_pct: number
  median_implied_apr_pct: number
  backtest_avoidable_advances_pct: number
  backtest_avoidable_fees_pct: number
  workers_with_derived_negative_day_pct: number
  median_negative_days_per_worker: number
  balance_col_reconcile_pct: number
  credits_followed_by_balance_drop_pct: number
}

export interface Seed {
  meta: SeedMeta
  worker: Worker
  obligations: Obligation[]
  shifts: Shift[]
  advances: Advance[]
  limits: Limits
  hours_feed: HoursFeed
  extra_work: WorkOption[]
  circle: { name: string; state: string }[]
  unlock_code: string
  cohort_stats: CohortStats
}

/** The one coercion point. Imported, never fetched — no runtime network calls. */
export const seed: Seed = rawSeed as unknown as Seed

/**
 * Money stays a plain number per spec §15, so every accumulation lands here.
 * Without it, chained float addition renders $58.390000000000004 on screen.
 */
export function round2(value: number): Money {
  // A half-cent like 2.345 is stored as 2.34499999..., so a bare Math.round
  // truncates it to 2.34 and her median fee stops matching the dataset. The
  // nudge is applied after scaling, where the representation error actually is.
  const scaled = value * 100
  return Math.round(scaled + (scaled < 0 ? -1e-9 : 1e-9)) / 100
}

/** Money comparison at cent tolerance, so 58.39 >= 58.39 never fails on drift. */
export function atLeast(a: Money, b: Money): boolean {
  return a - b > -0.005
}
