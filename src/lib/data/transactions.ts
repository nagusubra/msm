import { readCsv, toNumber } from "./csv"

export type Transaction = {
  txnId: string
  workerId: string
  txnTs: string
  direction: "debit" | "credit" | string
  amountCad: number
  category: string
  merchantType: string
  channel: string
  isEssential: boolean
  runningBalanceCad: number
  notes: string
}

let transactionsCache: Transaction[] | null = null
let transactionsByWorker: Map<string, Transaction[]> | null = null

export const getTransactions = (): Transaction[] => {
  if (transactionsCache) {
    return transactionsCache
  }

  transactionsCache = readCsv("transactions.csv").map((row) => ({
    txnId: row.txn_id,
    workerId: row.worker_id,
    txnTs: row.txn_ts,
    direction: row.direction,
    amountCad: toNumber(row.amount_cad),
    category: row.category,
    merchantType: row.merchant_type,
    channel: row.channel,
    isEssential: row.is_essential === "1",
    runningBalanceCad: toNumber(row.running_balance_cad),
    notes: row.notes,
  }))

  return transactionsCache
}

const getTransactionsIndex = (): Map<string, Transaction[]> => {
  if (transactionsByWorker) {
    return transactionsByWorker
  }

  transactionsByWorker = new Map()
  for (const txn of getTransactions()) {
    const list = transactionsByWorker.get(txn.workerId) ?? []
    list.push(txn)
    transactionsByWorker.set(txn.workerId, list)
  }

  return transactionsByWorker
}

export const getTransactionsForWorker = (workerId: string): Transaction[] => {
  return getTransactionsIndex().get(workerId) ?? []
}
