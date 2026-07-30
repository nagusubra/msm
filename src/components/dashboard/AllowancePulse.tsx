"use client"

import { useMemo, useSyncExternalStore } from "react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/dates"
import { getGigIncomeFor } from "@/lib/gigStorage"
import type { DailyInsight } from "@/lib/insights"
import { cn } from "@/lib/utils"

type AllowancePulseProps = {
  insight: DailyInsight
}

const STORAGE_KEY = "chaching-accepted-gigs"

const subscribe = (onStoreChange: () => void) => {
  const handle = () => onStoreChange()
  window.addEventListener("storage", handle)
  window.addEventListener("chaching-gigs-updated", handle)
  return () => {
    window.removeEventListener("storage", handle)
    window.removeEventListener("chaching-gigs-updated", handle)
  }
}

const getSnapshot = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

const getServerSnapshot = () => ""

export const AllowancePulse = ({ insight }: AllowancePulseProps) => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const gigIncome = useMemo(() => {
    void snapshot
    return getGigIncomeFor(insight.allowance.workerId, insight.allowance.date)
  }, [snapshot, insight.allowance.workerId, insight.allowance.date])

  const weekIncome = insight.allowance.incomeSoFarThisWeek + gigIncome
  const remainingBudget = Math.max(
    0,
    weekIncome - insight.allowance.weeklyEssentialBurden
  )
  const safeDaily =
    insight.allowance.daysRemainingInWeek > 0
      ? remainingBudget / insight.allowance.daysRemainingInWeek
      : 0
  const spent = insight.allowance.spentTodayNonEssential
  const usage =
    safeDaily > 0 ? Math.min(100, (spent / safeDaily) * 100) : spent > 0 ? 100 : 0

  const barClass =
    usage > 100 || spent > safeDaily
      ? "bg-rose-500"
      : usage >= 80
        ? "bg-amber-500"
        : "bg-emerald-500"

  return (
    <section
      aria-label="Safe daily allowance"
      className="rounded-2xl border border-border bg-muted/30 p-6"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Safe daily allowance
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            What&apos;s left after this week&apos;s essential bills are covered by
            earnings so far
            {gigIncome > 0
              ? ` (includes ${formatCurrency(gigIncome)} from gigs)`
              : ""}
            .
          </p>
        </div>
        <p className="text-3xl font-semibold text-foreground">
          {formatCurrency(safeDaily)}
        </p>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex justify-between text-sm">
          <span className="text-muted-foreground">
            Non-essential spent {formatCurrency(spent)}
          </span>
          <span className="font-medium text-foreground">{Math.round(usage)}%</span>
        </div>
        <div
          className="h-3 overflow-hidden rounded-full bg-border"
          role="progressbar"
          aria-valuenow={Math.round(usage)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Percent of safe daily allowance used"
        >
          <div
            className={cn("h-full rounded-full transition-all", barClass)}
            style={{ width: `${Math.min(100, usage)}%` }}
          />
        </div>
      </div>

      <dl className="mt-6 grid gap-3 sm:grid-cols-3">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Week earnings so far
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {formatCurrency(weekIncome)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Weekly essentials
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {formatCurrency(insight.allowance.weeklyEssentialBurden)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            Days left in week
          </dt>
          <dd className="mt-1 font-semibold text-foreground">
            {insight.allowance.daysRemainingInWeek}
          </dd>
        </div>
      </dl>

      {(insight.decision !== "yes" || gigIncome > 0) && (
        <div className="mt-6">
          <Button
            href={`/gigs?worker=${encodeURIComponent(insight.allowance.workerId)}&date=${encodeURIComponent(insight.allowance.date)}`}
            aria-label="Find Calgary gig work"
          >
            Find gig work
          </Button>
        </div>
      )}
    </section>
  )
}
