import { formatCurrency, formatDisplayDate } from "@/lib/dates"
import type { DailyInsight } from "@/lib/insights"

type BillPressureProps = {
  insight: DailyInsight
}

export const BillPressure = ({ insight }: BillPressureProps) => {
  const bills = insight.upcomingBills

  return (
    <section
      aria-label="Bills landing this week"
      className="rounded-2xl border border-border bg-background p-6"
    >
      <h2 className="text-lg font-semibold text-foreground">
        Bills landing this week
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Why today&apos;s allowance feels tight — essentials still due before{" "}
        {insight.allowance.weekEnd}.
      </p>

      {bills.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No named bill due dates left this week. Your weekly essential burden is
          still {formatCurrency(insight.allowance.weeklyEssentialBurden)}.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border">
          {bills.map((bill) => (
            <li
              key={`${bill.name}-${bill.dueDate}`}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="font-medium text-foreground">{bill.name}</p>
                <p className="text-xs text-muted-foreground">
                  Due {formatDisplayDate(bill.dueDate)}
                  {bill.daysUntil === 0
                    ? " · today"
                    : bill.daysUntil === 1
                      ? " · tomorrow"
                      : ` · in ${bill.daysUntil} days`}
                  {bill.essential ? " · essential" : ""}
                </p>
              </div>
              <p className="font-semibold text-foreground">
                {formatCurrency(bill.amountCad)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {insight.essentialDueThisWeekCad > 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Essentials still due this week:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(insight.essentialDueThisWeekCad)}
          </span>
        </p>
      ) : null}
    </section>
  )
}
