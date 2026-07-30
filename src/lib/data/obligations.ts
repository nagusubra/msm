import { readCsv, toNumber } from "./csv"

export type Obligation = {
  obligationId: string
  workerId: string
  name: string
  category: string
  amountCad: number
  frequency: "monthly" | "biweekly" | string
  dueDayOfMonth: number
  autopay: boolean
  essential: boolean
}

let obligationsCache: Obligation[] | null = null
let obligationsByWorker: Map<string, Obligation[]> | null = null

export const getObligations = (): Obligation[] => {
  if (obligationsCache) {
    return obligationsCache
  }

  obligationsCache = readCsv("recurring_obligations.csv").map((row) => ({
    obligationId: row.obligation_id,
    workerId: row.worker_id,
    name: row.name,
    category: row.category,
    amountCad: toNumber(row.amount_cad),
    frequency: row.frequency,
    dueDayOfMonth: toNumber(row.due_day_of_month),
    autopay: row.autopay === "1",
    essential: row.essential === "1",
  }))

  return obligationsCache
}

const getObligationsIndex = (): Map<string, Obligation[]> => {
  if (obligationsByWorker) {
    return obligationsByWorker
  }

  obligationsByWorker = new Map()
  for (const obligation of getObligations()) {
    const list = obligationsByWorker.get(obligation.workerId) ?? []
    list.push(obligation)
    obligationsByWorker.set(obligation.workerId, list)
  }

  return obligationsByWorker
}

export const getObligationsForWorker = (workerId: string): Obligation[] => {
  return getObligationsIndex().get(workerId) ?? []
}
