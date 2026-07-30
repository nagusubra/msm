/**
 * The backtest (spec §5.3) — the falsifiable test the product claim rests on.
 *
 * Replays every real advance in `earned_wage_advances.csv` and asks one
 * question: could this worker have covered the amount by working a shift that
 * pays same day, soon enough to matter, instead of paying the fee?
 *
 * The rule is stated in the output so the claim is auditable from the printed
 * text alone. It is deliberately conservative:
 *
 *   - `work_date` in `daily_earnings.csv` is a date, not a timestamp, so "48
 *     hours after the request" is read as the TWO CALENDAR DAYS AFTER the
 *     request date (request date + 1 and + 2). The request date itself is
 *     excluded: 100% of requests land between 5 PM and midnight, so a same-day
 *     shift's pay had already arrived (or not) before the worker asked, and
 *     counting it would credit the engine with money that was already on the
 *     table.
 *   - the shift must have `paid_same_day = 1`. A shift paid on the +5 day lag
 *     cannot close a gap that was urgent enough to borrow against.
 *   - the shift's `net_pay_cad` must cover the full advance amount on its own.
 *     No stacking two shifts, no partial credit.
 *
 * Nothing is tuned to hit a target. The printed rule is exactly the rule the
 * code runs, and the printed numbers are whatever that rule yields.
 */
import { median, pct } from "../src/lib/csv"
import { addDays, dateOnly } from "../src/lib/dates"
import { atLeast, round2, type Money } from "../src/lib/types"
import { advances, byWorker, earnings, type AdvanceRow, type EarningRow } from "./load"

/** Work dates counted as reachable: request date + 1 .. request date + WINDOW_DAYS. */
const WINDOW_DAYS = 2
/** The tighter check: request date + 1 only. */
const TIGHT_WINDOW_DAYS = 1

interface Replay {
  advance: AdvanceRow
  /** Days after the request date of the earliest covering shift, or null. */
  covered_in_days: number | null
}

/** worker_id -> work_date -> largest same-day-paid net earned on that date. */
function sameDayPayByWorkerDate(rows: EarningRow[]): Map<string, Map<string, Money>> {
  const index = new Map<string, Map<string, Money>>()
  for (const row of rows) {
    if (!row.paid_same_day) continue
    let dates = index.get(row.worker_id)
    if (!dates) {
      dates = new Map<string, Money>()
      index.set(row.worker_id, dates)
    }
    const best = dates.get(row.work_date)
    if (best === undefined || row.net > best) dates.set(row.work_date, row.net)
  }
  return index
}

/**
 * Earliest offset in 1..windowDays at which this worker worked a same-day-paid
 * shift whose net pay covers `amount`, or null if none did.
 */
export function coveredInDays(
  index: Map<string, Map<string, Money>>,
  advance: AdvanceRow,
  windowDays: number,
): number | null {
  const dates = index.get(advance.worker_id)
  if (!dates) return null
  const requestDate = dateOnly(advance.requested_at)
  for (let offset = 1; offset <= windowDays; offset += 1) {
    const net = dates.get(addDays(requestDate, offset))
    if (net !== undefined && atLeast(net, advance.amount)) return offset
  }
  return null
}

export function replayAll(rows: AdvanceRow[], earned: EarningRow[], windowDays: number): Replay[] {
  const index = sameDayPayByWorkerDate(earned)
  return rows.map((advance) => ({ advance, covered_in_days: coveredInDays(index, advance, windowDays) }))
}

function sumFees(replays: Replay[]): Money {
  return replays.reduce<Money>((total, replay) => round2(total + replay.advance.fee), 0)
}

function money(value: Money): string {
  return `$${value.toFixed(2)}`
}

function main(): void {
  const allAdvances = advances()
  const allEarnings = earnings()
  const replays = replayAll(allAdvances, allEarnings, WINDOW_DAYS)

  const avoidable = replays.filter((replay) => replay.covered_in_days !== null)
  const tight = avoidable.filter((replay) => (replay.covered_in_days ?? Infinity) <= TIGHT_WINDOW_DAYS)

  const totalFees = sumFees(replays)
  const avoidableFees = sumFees(avoidable)
  const tightFees = sumFees(tight)
  const medianFee = round2(median(allAdvances.map((advance) => advance.fee)))

  const workersWithAdvances = byWorker(allAdvances).size

  console.log("TILL — backtest (spec §5.3): were these advances avoidable by working?")
  console.log("")
  console.log("RULE (exactly what the code below ran):")
  console.log(
    `  An advance is AVOIDABLE if the same worker has a shift in daily_earnings.csv with` +
      ` paid_same_day = 1, whose work_date is one of the ${WINDOW_DAYS} calendar days AFTER the` +
      ` advance's requested_at date (request date + 1 or + 2 — the request date itself is` +
      ` excluded because 100% of requests are logged 5 PM–midnight, after that day's shift),` +
      ` and whose net_pay_cad on its own is >= the full advance amount_cad. One shift, no` +
      ` stacking, no partial credit.`,
  )
  console.log("")
  console.log(`Advances replayed:            ${replays.length} (${workersWithAdvances} workers)`)
  console.log(
    `Avoidable within 48 h:        ${avoidable.length}/${replays.length} = ${pct(avoidable.length, replays.length).toFixed(1)}%`,
  )
  console.log(
    `Avoidable fees:               ${money(avoidableFees)} of ${money(totalFees)} = ${pct(avoidableFees, totalFees).toFixed(1)}% of all fees paid`,
  )
  console.log(`Total fees in the dataset:    ${money(totalFees)}`)
  console.log(`Median fee:                   ${money(medianFee)}`)
  console.log("")
  console.log(`Tighter check — of the ${avoidable.length} avoidable, how many had the covering shift within 24 h`)
  console.log(`(work_date = request date + 1, the next calendar day):`)
  console.log(
    `  ${tight.length}/${avoidable.length} = ${pct(tight.length, avoidable.length).toFixed(1)}% of avoidable` +
      ` (${pct(tight.length, replays.length).toFixed(1)}% of all ${replays.length} advances),` +
      ` ${money(tightFees)} in fees = ${pct(tightFees, totalFees).toFixed(1)}% of all fees`,
  )
}

main()
