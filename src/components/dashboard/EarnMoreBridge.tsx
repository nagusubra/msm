import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/dates"
import type { DailyInsight } from "@/lib/insights"

type EarnMoreBridgeProps = {
  insight: DailyInsight
}

export const EarnMoreBridge = ({ insight }: EarnMoreBridgeProps) => {
  const gigsHref = `/gigs?worker=${encodeURIComponent(insight.allowance.workerId)}&date=${encodeURIComponent(insight.allowance.date)}`
  const needsHelp = insight.decision !== "yes" || insight.shortfallCad > 0

  if (!needsHelp) {
    return (
      <section className="rounded-2xl border border-border bg-muted/20 p-6">
        <h2 className="text-lg font-semibold text-foreground">
          You&apos;re covered for today
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          No shortfall right now. If a surprise expense hits, GigWork is one
          tap away.
        </p>
        <div className="mt-4">
          <Button href={gigsHref} variant="secondary" aria-label="Browse GigWork shifts">
            Browse GigWork
          </Button>
        </div>
      </section>
    )
  }

  const target =
    insight.shortfallCad > 0
      ? insight.shortfallCad
      : Math.max(25, insight.suggestedGigPayout)

  return (
    <section
      aria-label="Get back on track with GigWork"
      className="rounded-2xl border border-border bg-foreground p-6 text-background"
    >
      <h2 className="text-lg font-semibold">Get back on track tonight</h2>
      <p className="mt-2 text-sm text-background/80">
        {insight.shortfallCad > 0
          ? `You need about ${formatCurrency(target)} more to erase today's overspend.`
          : `A short gig block (~${formatCurrency(target)}) would rebuild breathing room.`}{" "}
        Roughly {insight.suggestedGigHours} hour
        {insight.suggestedGigHours === 1 ? "" : "s"} of Calgary GigWork at ~$22/hr.
      </p>

      <dl className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-background/10 p-4">
          <dt className="text-xs uppercase tracking-wide text-background/70">
            Target to recover
          </dt>
          <dd className="mt-1 text-2xl font-semibold">{formatCurrency(target)}</dd>
        </div>
        <div className="rounded-xl bg-background/10 p-4">
          <dt className="text-xs uppercase tracking-wide text-background/70">
            Suggested GigWork time
          </dt>
          <dd className="mt-1 text-2xl font-semibold">
            {insight.suggestedGigHours}h
          </dd>
        </div>
      </dl>

      <div className="mt-6">
        <Button
          href={gigsHref}
          variant="secondary"
          className="bg-background text-foreground hover:bg-background/90"
          aria-label="Open GigWork"
        >
          Open GigWork
        </Button>
      </div>
    </section>
  )
}
