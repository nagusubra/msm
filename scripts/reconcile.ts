/**
 * scripts/reconcile.ts — the data-integrity proof (spec §5.2, correction 2 in §1).
 *
 * The dataset ships two balance columns. Neither one reconciles with its own
 * inputs, so neither is usable as truth:
 *
 *   weekly_cashflow_summary.ending_balance_cad  vs  prev_ending + net_cashflow
 *   transactions.running_balance_cad            vs  prev_running +/- amount
 *
 * Every figure below is computed from the CSVs at run time. Nothing is
 * hardcoded except the tolerance bands, which make this script double as a
 * regression test on the input: if the dataset is swapped and the failure rates
 * move, it exits 1 instead of quietly printing new numbers into the README.
 *
 * Run: npm run reconcile
 */
import { median, pct } from "../src/lib/csv"
import { round2 } from "../src/lib/types"
import { byWorker, transactions, weekly, type TransactionRow, type WeeklyRow } from "./load"

/** Cent tolerance: these columns are 2dp, so anything under half a cent is float drift. */
const CENT = 0.005

interface RateResult {
  /** Rows/transitions that could be compared at all (i.e. had a predecessor). */
  comparable: number
  /** How many of those satisfied the identity. */
  reconciled: number
  ratePct: number
}

/** A tolerance band, so a swapped dataset fails loudly instead of silently. */
interface Band {
  label: string
  value: number
  lo: number
  hi: number
  unit: "pct" | "count" | "cad"
}

/**
 * weekly_cashflow_summary: does each week's ending balance equal the previous
 * week's ending balance plus this week's net cashflow?
 */
export function weeklyReconciliation(rows: WeeklyRow[]): RateResult & { medianAbsError: number } {
  let comparable = 0
  let reconciled = 0
  const errors: number[] = []

  for (const workerRows of byWorker(rows).values()) {
    const ordered = [...workerRows].sort((a, b) => a.week_start.localeCompare(b.week_start))
    for (let i = 1; i < ordered.length; i += 1) {
      const prev = ordered[i - 1]
      const current = ordered[i]
      if (!prev || !current) continue
      comparable += 1
      const expected = round2(prev.ending_balance + current.net_cashflow)
      const error = Math.abs(round2(current.ending_balance - expected))
      errors.push(error)
      if (error <= CENT) reconciled += 1
    }
  }

  return {
    comparable,
    reconciled,
    ratePct: pct(reconciled, comparable),
    medianAbsError: round2(median(errors)),
  }
}

/**
 * transactions: walking each worker's ledger in timestamp order, does the
 * running balance move by exactly the transaction amount (credit adds, debit
 * subtracts)?
 */
export function transactionReconciliation(rows: TransactionRow[]): RateResult {
  let comparable = 0
  let reconciled = 0

  for (const workerRows of byWorker(rows).values()) {
    const ordered = orderByTimestamp(workerRows)
    for (let i = 1; i < ordered.length; i += 1) {
      const prev = ordered[i - 1]
      const current = ordered[i]
      if (!prev || !current) continue
      comparable += 1
      const signed = current.direction === "credit" ? current.amount : -current.amount
      const expected = round2(prev.running_balance + signed)
      if (Math.abs(round2(current.running_balance - expected)) <= CENT) reconciled += 1
    }
  }

  return { comparable, reconciled, ratePct: pct(reconciled, comparable) }
}

/**
 * The sanity check that needs no arithmetic at all: money coming in cannot make
 * the balance smaller. Share of credits whose printed running balance is *below*
 * the balance printed on the row before it.
 */
export function creditsFollowedByDecrease(
  rows: TransactionRow[],
): { credits: number; decreased: number; ratePct: number } {
  let credits = 0
  let decreased = 0

  for (const workerRows of byWorker(rows).values()) {
    const ordered = orderByTimestamp(workerRows)
    for (let i = 1; i < ordered.length; i += 1) {
      const prev = ordered[i - 1]
      const current = ordered[i]
      if (!prev || !current || current.direction !== "credit") continue
      credits += 1
      if (current.running_balance < prev.running_balance - CENT) decreased += 1
    }
  }

  return { credits, decreased, ratePct: pct(decreased, credits) }
}

/** Timestamp order, file order as the tie-break (same-minute rows are common). */
function orderByTimestamp(rows: TransactionRow[]): TransactionRow[] {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => a.row.ts.localeCompare(b.row.ts) || a.index - b.index)
    .map((entry) => entry.row)
}

function fmt(value: number, unit: Band["unit"]): string {
  if (unit === "pct") return `${value.toFixed(1)}%`
  if (unit === "cad") return `$${value.toFixed(2)}`
  return value.toLocaleString("en-CA")
}

function main(): void {
  const weeklyResult = weeklyReconciliation(weekly())
  const txnRows = transactions()
  const txnResult = transactionReconciliation(txnRows)
  const creditResult = creditsFollowedByDecrease(txnRows)

  const lines: [string, string][] = [
    ["weekly_cashflow_summary.ending_balance_cad", ""],
    [
      "  prev_ending + net_cashflow == ending",
      `${fmt(weeklyResult.ratePct, "pct")}  (${fmt(weeklyResult.reconciled, "count")} of ${fmt(weeklyResult.comparable, "count")} week-over-week transitions)`,
    ],
    ["  median absolute error", fmt(weeklyResult.medianAbsError, "cad")],
    ["", ""],
    ["transactions.running_balance_cad", ""],
    [
      "  prev_running +/- amount == running",
      `${fmt(txnResult.ratePct, "pct")}  (${fmt(txnResult.reconciled, "count")} of ${fmt(txnResult.comparable, "count")} comparable rows)`,
    ],
    [
      "  credits followed by a DECREASE",
      `${fmt(creditResult.ratePct, "pct")}  (${fmt(creditResult.decreased, "count")} of ${fmt(creditResult.credits, "count")} credits)`,
    ],
  ]

  const width = Math.max(...lines.map(([label]) => label.length))
  const rule = "-".repeat(width + 46)

  process.stdout.write("\n")
  process.stdout.write("TILL — data-integrity proof  (spec §5.2)\n")
  process.stdout.write("Both provided balance columns, checked against their own inputs.\n")
  process.stdout.write(`${rule}\n`)
  for (const [label, value] of lines) {
    process.stdout.write(value === "" ? `${label}\n` : `${label.padEnd(width)}   ${value}\n`)
  }
  process.stdout.write(`${rule}\n`)
  process.stdout.write(
    "Therefore: the ledger is DERIVED from daily_earnings and recurring_obligations.\n" +
      "ending_balance_cad and running_balance_cad are ignored everywhere in this repo.\n",
  )

  const bands: Band[] = [
    { label: "weekly transitions counted", value: weeklyResult.comparable, lo: 2800, hi: 2900, unit: "count" },
    { label: "weekly reconcile rate", value: weeklyResult.ratePct, lo: 1.5, hi: 3.5, unit: "pct" },
    { label: "weekly median abs error", value: weeklyResult.medianAbsError, lo: 700, hi: 900, unit: "cad" },
    { label: "transaction rows counted", value: txnResult.comparable, lo: 31_000, hi: 32_000, unit: "count" },
    { label: "transaction reconcile rate", value: txnResult.ratePct, lo: 18, hi: 23, unit: "pct" },
    { label: "credits followed by decrease", value: creditResult.ratePct, lo: 31, hi: 37, unit: "pct" },
  ]

  const failures = bands.filter((band) => band.value < band.lo || band.value > band.hi)
  if (failures.length > 0) {
    process.stdout.write("\nFAIL — input drifted outside the stated tolerance bands:\n")
    for (const band of failures) {
      process.stdout.write(
        `  ${band.label}: ${fmt(band.value, band.unit)} outside ${fmt(band.lo, band.unit)}..${fmt(band.hi, band.unit)}\n`,
      )
    }
    process.stdout.write("Fix the input or update docs/numbers.md and the bands together.\n\n")
    process.exit(1)
  }

  process.stdout.write("\nOK — all 6 figures inside their tolerance bands.\n\n")
}

main()
