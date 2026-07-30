import type { FeedHealth, MoneyState, SafeToSpend } from "@/lib/engine"
import { formatHours, formatMoney, landingDate } from "@/lib/engine"
import type { Shift } from "@/lib/types"
import { dateOnly, isOnOrBefore, shortLabel, weekdayLabel } from "@/lib/dates"
import { cn } from "@/lib/utils"
import { MoneyBar } from "@/components/money-bar"

export interface TonightProps {
  today: string
  latest: Shift | null
  safe: SafeToSpend
  states: MoneyState[]
  feed: FeedHealth
  gapInHours: number
}

const hero = { fontSize: "var(--type-hero)" } as const
const body = { fontSize: "var(--type-body)" } as const
const small = { fontSize: "var(--type-small)" } as const
const micro = { fontSize: "var(--type-micro)", letterSpacing: "0.12em" } as const

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`
}

function dueLabel(name: string, days: number): string {
  if (days <= 0) return `${name} is due today`
  if (days === 1) return `${name} is due tomorrow`
  return `${name} is due in ${plural(days, "day")}`
}

function FieldLabel({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="text-bone-dim uppercase" style={micro}>
      {children}
    </p>
  )
}

export function Tonight({ today, latest, safe, states, feed, gapInHours }: TonightProps): React.ReactElement {
  const day = dateOnly(today)
  const cliff = safe.next_cliff
  const primary = cliff?.obligations[0]
  const obligationName = primary ? primary.name : "Your next bill"
  const landed = latest ? isOnOrBefore(landingDate(latest), day) : false
  const feedClean = feed.days_stale <= 0 && feed.unconfirmed_shifts === 0
  const safeTone = safe.safe > 0 ? "text-amber" : safe.shortfall > 0 ? "text-bone" : "text-bone-dim"

  return (
    <section className="flex flex-col gap-4" aria-labelledby="safe-spend-heading">
      {/* Last shift chip row */}
      <div className="rounded-[var(--radius-card)] border border-edge bg-raise px-3.5 py-3">
        <div className="flex items-center justify-between gap-2">
          <FieldLabel>Last shift</FieldLabel>
          <span className="text-bone-dim" style={micro}>
            {weekdayLabel(day)}
          </span>
        </div>
        {latest ? (
          <div className="mt-2 flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="leading-snug text-bone" style={body}>
                {latest.date === day
                  ? `${formatHours(latest.hours)} today`
                  : `${formatHours(latest.hours)} · ${weekdayLabel(latest.date)}`}
              </p>
              <p className={cn("mt-0.5 leading-snug", landed ? "text-bone-dim" : "text-haze")} style={small}>
                {latest.paid_same_day
                  ? "Paid same day"
                  : landed
                    ? `Landed ${shortLabel(landingDate(latest))}`
                    : `Lands ${shortLabel(landingDate(latest))}`}
              </p>
            </div>
            <span className={cn("money shrink-0", landed ? "text-amber" : "text-haze")} style={body}>
              {formatMoney(latest.net)}
            </span>
          </div>
        ) : (
          <p className="mt-2 text-bone-dim" style={small}>
            No worked shift on record.
          </p>
        )}
      </div>

      {/* Hero safe-to-spend */}
      <div
        className="flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-edge bg-raise p-4"
        style={
          safe.shortfall > 0
            ? { boxShadow: "inset 3px 0 0 0 var(--cliff-rust)" }
            : undefined
        }
      >
        <h2 id="safe-spend-heading" className="text-bone-dim uppercase" style={micro}>
          Safe to spend
        </h2>
        <p className="font-display leading-none tracking-tight" style={hero}>
          <span className={cn("money", safeTone)}>{formatMoney(safe.safe)}</span>
        </p>

        {cliff ? (
          safe.shortfall > 0 ? (
            <div className="flex flex-col gap-1">
              <p className="leading-snug text-bone" style={body}>
                {dueLabel(obligationName, safe.days_to_cliff)}. You are{" "}
                <span className="money text-rust">{formatMoney(safe.shortfall)}</span> short.
              </p>
              <p className="leading-snug text-bone-dim" style={small}>
                {formatHours(gapInHours)} of work closes it.
              </p>
            </div>
          ) : (
            <p className="leading-snug text-bone" style={body}>
              {dueLabel(obligationName, safe.days_to_cliff)}.{" "}
              <span className="money text-bone">{formatMoney(safe.committed)}</span> already committed.
            </p>
          )
        ) : (
          <p className="leading-snug text-bone" style={body}>
            No large bill in the next three weeks.
          </p>
        )}

        <div className="mt-1 grid grid-cols-3 gap-2 border-t border-edge pt-3">
          <div>
            <p className="text-bone-dim uppercase" style={micro}>
              Banked
            </p>
            <p className="money mt-1 text-amber" style={small}>
              {formatMoney(safe.balance_today)}
            </p>
          </div>
          <div>
            <p className="text-bone-dim uppercase" style={micro}>
              Inbound
            </p>
            <p className="money mt-1 text-haze" style={small}>
              {formatMoney(safe.inflow_before_cliff)}
            </p>
          </div>
          <div>
            <p className="text-bone-dim uppercase" style={micro}>
              Due
            </p>
            <p className="money mt-1 text-bone" style={small}>
              {formatMoney(safe.committed)}
            </p>
          </div>
        </div>
      </div>

      {/* Money states */}
      <div className="rounded-[var(--radius-card)] border border-edge bg-raise px-3.5 py-3.5">
        <FieldLabel>Where it sits</FieldLabel>
        <div className="mt-3">
          <MoneyBar states={states} />
        </div>
      </div>

      {/* Feed health */}
      <div className="rounded-[var(--radius-card)] border border-edge bg-raise/70 px-3.5 py-3">
        <FieldLabel>Hours feed</FieldLabel>
        {feedClean ? (
          <p className="mt-2 leading-snug text-bone-dim" style={small}>
            Confirmed up to today.
          </p>
        ) : (
          <div className="mt-2 flex flex-col gap-1">
            {feed.unconfirmed_shifts === 0 ? (
              <p className="leading-snug text-haze" style={small}>
                Last sync {plural(feed.days_stale, "day")} ago. No earned hours missing yet.
              </p>
            ) : (
              <p className="leading-snug text-haze" style={small}>
                Sync stale {plural(feed.days_stale, "day")}.{" "}
                <span className="money text-haze">{formatMoney(feed.estimated_net)}</span> ·{" "}
                {plural(feed.unconfirmed_shifts, "shift")} not advanceable.
              </p>
            )}
            <p className="leading-snug text-haze" style={small}>
              {feed.escalation_target.replace(/_/g, " ")} can confirm.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
