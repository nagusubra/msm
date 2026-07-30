import { readCsv, toNumber } from "./csv"

export type Worker = {
  workerId: string
  city: string
  province: string
  occupation: string
  payType: string
  typicalDailyNetCad: number
  incomeVolatility: number
  tipShare: number
  householdSize: number
  dependents: number
  hasBankAccount: boolean
  usesPrepaidCard: boolean
  primaryEmployerId: string
  tenureMonths: number
  hasSideGig: boolean
  commuteMode: string
  rentBurdenBand: string
}

let workersCache: Worker[] | null = null

export const getWorkers = (): Worker[] => {
  if (workersCache) {
    return workersCache
  }

  workersCache = readCsv("workers.csv").map((row) => ({
    workerId: row.worker_id,
    city: row.city,
    province: row.province,
    occupation: row.occupation,
    payType: row.pay_type,
    typicalDailyNetCad: toNumber(row.typical_daily_net_cad),
    incomeVolatility: toNumber(row.income_volatility),
    tipShare: toNumber(row.tip_share),
    householdSize: toNumber(row.household_size),
    dependents: toNumber(row.dependents),
    hasBankAccount: row.has_bank_account === "1",
    usesPrepaidCard: row.uses_prepaid_card === "1",
    primaryEmployerId: row.primary_employer_id,
    tenureMonths: toNumber(row.tenure_months),
    hasSideGig: row.has_side_gig === "1",
    commuteMode: row.commute_mode,
    rentBurdenBand: row.rent_burden_band,
  }))

  return workersCache
}

export const getWorkerById = (workerId: string): Worker | undefined => {
  return getWorkers().find((worker) => worker.workerId === workerId)
}

export const getWorkerLabel = (worker: Worker): string => {
  return `${worker.workerId} — ${worker.occupation}, ${worker.city}`
}
