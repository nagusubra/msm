import { writeFileSync } from "fs"
import { computeAllowance } from "../src/lib/allowance"
import { getEarningsForWorker } from "../src/lib/data/earnings"

const id = "W-0069"
const dates = [
  ...new Set(getEarningsForWorker(id).map((e) => e.workDate)),
].sort()
const rows = []

for (const d of dates) {
  const r = computeAllowance(id, d)
  if (!r) continue
  if (
    r.status === "over" &&
    r.safeDailyAllowance > 15 &&
    r.todayIncome > 0 &&
    r.spentTodayNonEssential > r.safeDailyAllowance
  ) {
    rows.push({
      d,
      income: r.todayIncome,
      allow: +r.safeDailyAllowance.toFixed(2),
      spent: +r.spentTodayNonEssential.toFixed(2),
      shortfall: +(r.spentTodayNonEssential - r.safeDailyAllowance).toFixed(2),
      daysLeft: r.daysRemainingInWeek,
      weekInc: +r.incomeSoFarThisWeek.toFixed(2),
    })
  }
}

writeFileSync("scripts/over-with-allowance.json", JSON.stringify(rows, null, 2))
console.log("count", rows.length)
console.log(rows.slice(-8))
