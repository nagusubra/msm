import { writeFileSync } from "fs"
import { computeAllowance } from "../src/lib/allowance"
import { getEarningsForWorker } from "../src/lib/data/earnings"
import { getTransactionsForWorker } from "../src/lib/data/transactions"
import { getWorkerById } from "../src/lib/data/workers"

const id = "W-0069"
const w = getWorkerById(id)!
const dates = [
  ...new Set(getEarningsForWorker(id).map((e) => e.workDate)),
].sort()

const overDays = []
for (const d of dates) {
  const r = computeAllowance(id, d)
  if (!r || r.status !== "over" || r.todayIncome <= 0) continue
  overDays.push({
    date: d,
    income: r.todayIncome,
    allow: Number(r.safeDailyAllowance.toFixed(2)),
    spent: Number(r.spentTodayNonEssential.toFixed(2)),
    shortfall: Number(
      Math.max(0, r.spentTodayNonEssential - r.safeDailyAllowance).toFixed(2)
    ),
    weekIncome: Number(r.incomeSoFarThisWeek.toFixed(2)),
  })
}

const best = overDays[overDays.length - 1]
const dayTxns = getTransactionsForWorker(id).filter((t) =>
  t.txnTs.startsWith(best.date)
)

writeFileSync(
  "scripts/persona-day.json",
  JSON.stringify({ worker: w, best, overDays: overDays.slice(-8), dayTxns }, null, 2)
)
console.log("best", best)
