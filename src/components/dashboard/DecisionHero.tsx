import { formatCurrency, formatDisplayDate } from "@/lib/dates"
import type { DailyInsight } from "@/lib/insights"
import { cn } from "@/lib/utils"

type DecisionHeroProps = {
  insight: DailyInsight
}

const decisionStyles = {
  yes: {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    panel: "border-emerald-500/30 bg-emerald-500/5",
    label: "Green light",
  },
  tight: {
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    panel: "border-amber-500/30 bg-amber-500/5",
    label: "Tight today",
  },
  no: {
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    panel: "border-rose-500/30 bg-rose-500/5",
    label: "Stop spending",
  },
}

export const DecisionHero = ({ insight }: DecisionHeroProps) => {
  const style = decisionStyles[insight.decision]
  const pocket =
    insight.shortfallCad > 0
      ? -insight.shortfallCad
      : insight.remainingAllowance

  return (
    <section
      aria-label="Today's spending decision"
      className={cn(
        "rounded-2xl border p-6 sm:p-8",
        style.panel
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {formatDisplayDate(insight.allowance.date)} · for {insight.displayName}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {insight.decisionTitle}
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            {insight.decisionDetail}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            style.badge
          )}
        >
          {style.label}
        </span>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-background/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {pocket < 0 ? "Shortfall today" : "Safe pocket money left"}
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(Math.abs(pocket))}
          </p>
        </div>
        <div className="rounded-xl bg-background/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Earned today
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {formatCurrency(insight.allowance.todayIncome)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Typical day {formatCurrency(insight.typicalDailyNetCad)}
            {insight.allowance.todayIncome > 0
              ? ` · ${Math.round(insight.todayVsTypicalRatio * 100)}% of typical`
              : " · no shift logged"}
          </p>
        </div>
        <div className="rounded-xl bg-background/80 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pressure streak
          </p>
          <p className="mt-2 text-3xl font-semibold text-foreground">
            {insight.pressureStreak.overOrClose}/{insight.pressureStreak.window}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            recent workdays tight or over
            {insight.pressureStreak.over > 0
              ? ` (${insight.pressureStreak.over} over)`
              : ""}
          </p>
        </div>
      </div>
    </section>
  )
}
