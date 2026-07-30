import { formatCurrency, formatDisplayDate } from "@/lib/dates"
import type { DailyInsight } from "@/lib/insights"

type SpendBreakdownProps = {
  insight: DailyInsight
}

const labelize = (category: string) =>
  category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")

export const SpendBreakdown = ({ insight }: SpendBreakdownProps) => {
  const rows = insight.spendByCategory
  const total = rows.reduce((sum, row) => sum + row.amountCad, 0)

  return (
    <section
      aria-label="What ate today's allowance"
      className="rounded-2xl border border-border bg-background p-6"
    >
      <h2 className="text-lg font-semibold text-foreground">
        What ate today&apos;s allowance
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Non-essential spending on {formatDisplayDate(insight.allowance.date)} —
        cut the top category first if you need to recover.
      </p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No non-essential spending logged today.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {rows.map((row) => {
            const pct = total > 0 ? (row.amountCad / total) * 100 : 0
            return (
              <li key={row.category}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    {labelize(row.category)}
                  </span>
                  <span className="text-muted-foreground">
                    {formatCurrency(row.amountCad)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/70"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {insight.topSpendCategory ? (
        <p className="mt-4 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Tip: pause{" "}
          <span className="font-medium text-foreground">
            {labelize(insight.topSpendCategory.category)}
          </span>{" "}
          first — it&apos;s your biggest leak today.
        </p>
      ) : null}
    </section>
  )
}
