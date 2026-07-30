import { readCsv, toNumber } from "./csv"

export type DailyEarning = {
  earningsId: string
  workerId: string
  workDate: string
  employerId: string
  shiftType: string
  hoursWorked: number
  grossPayCad: number
  tipsCad: number
  deductionsCad: number
  netPayCad: number
  paidSameDay: boolean
  payMethod: string
}

let earningsCache: DailyEarning[] | null = null
let earningsByWorker: Map<string, DailyEarning[]> | null = null

export const getDailyEarnings = (): DailyEarning[] => {
  if (earningsCache) {
    return earningsCache
  }

  earningsCache = readCsv("daily_earnings.csv").map((row) => ({
    earningsId: row.earnings_id,
    workerId: row.worker_id,
    workDate: row.work_date,
    employerId: row.employer_id,
    shiftType: row.shift_type,
    hoursWorked: toNumber(row.hours_worked),
    grossPayCad: toNumber(row.gross_pay_cad),
    tipsCad: toNumber(row.tips_cad),
    deductionsCad: toNumber(row.deductions_cad),
    netPayCad: toNumber(row.net_pay_cad),
    paidSameDay: row.paid_same_day === "1",
    payMethod: row.pay_method,
  }))

  return earningsCache
}

const getEarningsIndex = (): Map<string, DailyEarning[]> => {
  if (earningsByWorker) {
    return earningsByWorker
  }

  earningsByWorker = new Map()
  for (const earning of getDailyEarnings()) {
    const list = earningsByWorker.get(earning.workerId) ?? []
    list.push(earning)
    earningsByWorker.set(earning.workerId, list)
  }

  return earningsByWorker
}

export const getEarningsForWorker = (workerId: string): DailyEarning[] => {
  return getEarningsIndex().get(workerId) ?? []
}
