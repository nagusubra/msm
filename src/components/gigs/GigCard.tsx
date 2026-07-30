import { categoryLabel, type CalgaryGig } from "@/data/calgaryGigs"
import { formatCurrency } from "@/lib/dates"
import { cn } from "@/lib/utils"

type GigCardProps = {
  gig: CalgaryGig
  style?: React.CSSProperties
  className?: string
  dragOffset?: number
  rotation?: number
}

const urgencyLabel = {
  same_day: "Same day",
  tomorrow: "Tomorrow",
  this_week: "This week",
}

export const GigCard = ({
  gig,
  style,
  className,
  dragOffset = 0,
  rotation = 0,
}: GigCardProps) => {
  const showAcceptHint = dragOffset > 60
  const showSkipHint = dragOffset < -60

  return (
    <article
      className={cn(
        "relative flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-lg",
        className
      )}
      style={{
        ...style,
        transform: `translateX(${dragOffset}px) rotate(${rotation}deg)`,
        transition: dragOffset === 0 ? "transform 0.2s ease" : undefined,
      }}
      aria-label={`${gig.title}, ${formatCurrency(gig.payoutCad)}`}
    >
      {showAcceptHint ? (
        <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-lg border-2 border-emerald-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-emerald-600">
          Accept
        </div>
      ) : null}
      {showSkipHint ? (
        <div className="pointer-events-none absolute right-4 top-4 z-10 rounded-lg border-2 border-rose-500 px-3 py-1 text-sm font-bold uppercase tracking-wide text-rose-600">
          Skip
        </div>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
            {categoryLabel(gig.category)}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {urgencyLabel[gig.urgency]}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {gig.platform}
          </span>
        </div>

        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {gig.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{gig.neighborhood}</p>
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {gig.description}
        </p>

        <dl className="mt-auto grid grid-cols-2 gap-3 rounded-xl bg-muted/50 p-4">
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Payout
            </dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {formatCurrency(gig.payoutCad)}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-muted-foreground">
              Duration
            </dt>
            <dd className="mt-1 text-xl font-semibold text-foreground">
              {gig.durationHours}h
            </dd>
          </div>
        </dl>

        <ul className="flex flex-wrap gap-2">
          {gig.requirements.map((req) => (
            <li
              key={req}
              className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground"
            >
              {req}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
