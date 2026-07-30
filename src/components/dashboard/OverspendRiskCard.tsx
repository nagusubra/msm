import { OverspendRiskChart } from "@/components/dashboard/OverspendRiskChart"
import type { OverspendRisk, RiskTimelinePoint } from "@/lib/riskScore"
import { cn } from "@/lib/utils"

type OverspendRiskCardProps = {
  risk: OverspendRisk
  timeline: RiskTimelinePoint[]
}

const levelStyles = {
  low: {
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    ring: "stroke-emerald-500",
    track: "stroke-emerald-500/20",
  },
  moderate: {
    badge: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
    ring: "stroke-amber-500",
    track: "stroke-amber-500/20",
  },
  high: {
    badge: "bg-orange-500/15 text-orange-800 dark:text-orange-300",
    ring: "stroke-orange-500",
    track: "stroke-orange-500/20",
  },
  critical: {
    badge: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
    ring: "stroke-rose-500",
    track: "stroke-rose-500/20",
  },
}

export const OverspendRiskCard = ({ risk, timeline }: OverspendRiskCardProps) => {
  const styles = levelStyles[risk.level]
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (risk.score / 100) * circumference

  return (
    <section
      aria-label="Overspend risk prediction"
      className="rounded-2xl border border-border bg-muted/30 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Prediction · from your history
          </p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            Likelihood of going over today
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{risk.summary}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-medium",
            styles.badge
          )}
        >
          {risk.label}
        </span>
      </div>

      <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <div className="relative h-36 w-36 shrink-0" aria-hidden="true">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="10"
              className={styles.track}
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              className={styles.ring}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-semibold text-foreground">{risk.score}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>

        <div className="w-full">
          <p className="text-sm font-medium text-foreground">What&apos;s driving this</p>
          {risk.drivers.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Not enough pressure signals for today.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {risk.drivers.map((driver) => (
                <li
                  key={driver}
                  className="rounded-lg bg-background px-3 py-2 text-sm text-muted-foreground"
                >
                  {driver}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Based on {risk.sampleDays} prior workdays
            {risk.weekdaySampleDays > 0
              ? ` · ${Math.round(risk.weekdayOverRate * 100)}% over on this weekday historically`
              : ""}
            {risk.historicalOverRate > 0
              ? ` · overall over rate ${Math.round(risk.historicalOverRate * 100)}%`
              : ""}
            .
          </p>
        </div>
      </div>

      <div className="mt-8 border-t border-border pt-6">
        <h3 className="text-sm font-semibold text-foreground">
          Overspend risk over recent workdays
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Track how pressure built up, then see today&apos;s predicted chance of
          crossing the limit.
        </p>
        <div className="mt-4 rounded-xl border border-border bg-background p-3 sm:p-4">
          <OverspendRiskChart points={timeline} predictedScore={risk.score} />
        </div>
      </div>
    </section>
  )
}
