/**
 * Dataset loader. The only place in the repo that touches the filesystem.
 * src/lib stays pure; the CSVs are read here at build time and never in the
 * browser (spec §14).
 */
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { bool, num, parseCsv, str, type CsvRow } from "../src/lib/csv"
import type { Advance, Obligation, ObligationCategory, Shift, ShiftType } from "../src/lib/types"

const DATA_DIR = join(process.cwd(), "public", "data_seed_extracted_from")

export const FILES = {
  earnings: "daily_earnings.csv",
  advances: "earned_wage_advances.csv",
  obligations: "recurring_obligations.csv",
  transactions: "transactions.csv",
  weekly: "weekly_cashflow_summary.csv",
  workers: "workers.csv",
} as const

export function table(file: (typeof FILES)[keyof typeof FILES]): CsvRow[] {
  return parseCsv(readFileSync(join(DATA_DIR, file), "utf8"))
}

export interface EarningRow {
  worker_id: string
  work_date: string
  shift_type: ShiftType
  hours: number
  net: number
  paid_same_day: boolean
}

export interface AdvanceRow {
  id: string
  worker_id: string
  requested_at: string
  amount: number
  fee: number
  status: string
  repayment_source: string
  reason: string
}

export interface ObligationRow {
  worker_id: string
  name: string
  category: string
  amount: number
  due_day: number
  autopay: boolean
  essential: boolean
}

export interface TransactionRow {
  worker_id: string
  ts: string
  direction: "credit" | "debit"
  amount: number
  running_balance: number
}

export interface WeeklyRow {
  worker_id: string
  week_start: string
  income: number
  expense: number
  net_cashflow: number
  ending_balance: number
}

export function earnings(): EarningRow[] {
  return table(FILES.earnings).map((row) => ({
    worker_id: str(row, "worker_id"),
    work_date: str(row, "work_date"),
    shift_type: str(row, "shift_type") as ShiftType,
    hours: num(row, "hours_worked"),
    net: num(row, "net_pay_cad"),
    paid_same_day: bool(row, "paid_same_day"),
  }))
}

export function advances(): AdvanceRow[] {
  return table(FILES.advances).map((row) => ({
    id: str(row, "advance_id"),
    worker_id: str(row, "worker_id"),
    requested_at: str(row, "requested_at"),
    amount: num(row, "amount_cad"),
    fee: num(row, "fee_cad"),
    status: str(row, "status"),
    repayment_source: str(row, "repayment_source"),
    reason: str(row, "reason_code"),
  }))
}

export function obligations(): ObligationRow[] {
  return table(FILES.obligations).map((row) => ({
    worker_id: str(row, "worker_id"),
    name: str(row, "name"),
    category: str(row, "category"),
    amount: num(row, "amount_cad"),
    due_day: num(row, "due_day_of_month"),
    autopay: bool(row, "autopay"),
    essential: bool(row, "essential"),
  }))
}

export function transactions(): TransactionRow[] {
  return table(FILES.transactions).map((row) => ({
    worker_id: str(row, "worker_id"),
    ts: str(row, "txn_ts"),
    direction: str(row, "direction") === "credit" ? "credit" : "debit",
    amount: num(row, "amount_cad"),
    running_balance: num(row, "running_balance_cad"),
  }))
}

export function weekly(): WeeklyRow[] {
  return table(FILES.weekly).map((row) => ({
    worker_id: str(row, "worker_id"),
    week_start: str(row, "week_start"),
    income: num(row, "income_cad"),
    expense: num(row, "expense_cad"),
    net_cashflow: num(row, "net_cashflow_cad"),
    ending_balance: num(row, "ending_balance_cad"),
  }))
}

/** Group any worker-scoped table by worker_id, in file order. */
export function byWorker<T extends { worker_id: string }>(rows: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const row of rows) {
    const list = grouped.get(row.worker_id)
    if (list) list.push(row)
    else grouped.set(row.worker_id, [row])
  }
  return grouped
}

/** CSV rows -> the engine's Shift shape. `confirmed` is not a dataset column:
 *  the hours feed is the authority, so a shift worked after the last sync is
 *  unconfirmed (that is the stale-feed condition the product surfaces). */
export function toShifts(rows: EarningRow[], lastSync: string): Shift[] {
  return rows.map((row) => ({
    date: row.work_date,
    shift: row.shift_type,
    hours: row.hours,
    net: row.net,
    paid_same_day: row.paid_same_day,
    confirmed: row.work_date <= lastSync.slice(0, 10),
  }))
}

export function toObligations(rows: ObligationRow[]): Obligation[] {
  return rows.map((row) => ({
    name: row.name,
    category: row.category as ObligationCategory,
    amount: row.amount,
    due_day: row.due_day,
    autopay: row.autopay,
    essential: row.essential,
  }))
}

export function toAdvances(rows: AdvanceRow[]): Advance[] {
  return rows.map((row) => ({
    id: row.id,
    requested_at: row.requested_at,
    amount: row.amount,
    fee: row.fee,
    status: row.status as Advance["status"],
    repayment_source: row.repayment_source as Advance["repayment_source"],
    reason: row.reason,
  }))
}
