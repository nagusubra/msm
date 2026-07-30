"use client"

import type { Cliff } from "@/lib/engine"
import { formatHours, formatMoney, formatPct } from "@/lib/engine"
import type { GapOption } from "@/lib/types"
import { round2 } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface RouteTableProps {
  routes: GapOption[]
  gap: number
  cliff: Cliff
  gapInHours: number
  covers: boolean
  partial: GapOption | null
  selected: string | null
  onSelect: (label: string) => void
}

type Verdict = "covers" | "partial" | "rejected"

const SOURCE_TAG: Record<GapOption["kind"], string> = {
  employer_shift: "Employer shift",
  gig: "Gig",
  boost: "Boost card",
  advance: "Advance",
  nothing: "No action",
}

function daysWord(days: number): string {
  if (days <= 0) return "today"
  return `${days} ${days === 1 ? "day" : "days"}`
}

/** "nothing" carries no reject_reason but is never a route she can take. */
function verdictOf(option: GapOption): Verdict {
  if (option.reject_reason !== undefined || option.kind === "nothing") return "rejected"
  return option.covers ? "covers" : "partial"
}

function isLive(option: GapOption): boolean {
  return option.reject_reason === undefined && option.kind !== "nothing"
}

function verdictLabel(option: GapOption): string {
  if (option.reject_reason === "too late") return "Too late"
  if (option.reject_reason === "shift conflict") return "Conflict"
  if (option.reject_reason === "over daily cap") return "Over cap"
  if (option.kind === "nothing") return "No action"
  if (option.covers) return "Covers"
  return "Partial"
}

/** The whole sentence is assembled from the option's own fields and the cliff. */
function reasonFor(option: GapOption, cliff: Cliff, gap: number): string | null {
  if (option.reject_reason === "too late") {
    return `Pays ${option.timing}, and you need it in ${daysWord(cliff.days_away)}.`
  }
  if (option.reject_reason === "shift conflict") {
    return "Clashes with a shift you already work, so those hours are not free."
  }
  if (option.reject_reason === "over daily cap") {
    return "Sits over your daily advance cap, so it cannot land in full."
  }
  if (option.kind === "nothing") {
    return `No money moves, and missing the payment costs ${formatMoney(option.cost)} in fees.`
  }
  if (!option.covers) {
    const short = round2(gap - option.net_delivered)
    return `Covers ${formatMoney(option.net_delivered)} of ${formatMoney(gap)}, so ${formatMoney(short)} stays short.`
  }
  return null
}

function CostLine({ option, dim }: { option: GapOption; dim: boolean }): React.ReactElement {
  if (option.cost === 0) {
    return <span className={dim ? "text-haze" : "text-bone-dim"}>Free</span>
  }
  if (option.cost < 0) {
    return (
      <span className={dim ? "text-haze" : "text-bone-dim"}>
        <span className="money">{formatMoney(-option.cost)}</span> back
      </span>
    )
  }
  return (
    <span className={dim ? "text-haze" : "text-bone-dim"}>
      Costs <span className="money">{formatMoney(option.cost)}</span>
      {option.cost_pct > 0 ? <>, {formatPct(option.cost_pct)} of the gap</> : null}
    </span>
  )
}

interface RouteRowProps {
  option: GapOption
  cliff: Cliff
  gap: number
  isWinner: boolean
  isSelected: boolean
  onSelect: (label: string) => void
}

function RouteRow({ option, cliff, gap, isWinner, isSelected, onSelect }: RouteRowProps): React.ReactElement {
  const verdict = verdictOf(option)
  const live = isLive(option)
  const reason = reasonFor(option, cliff, gap)
  const badge = verdictLabel(option)

  const body = (
    <div className="grid grid-cols-[1fr_auto] items-start gap-3">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span
            className={cn(
              "font-display uppercase tracking-wide",
              live ? "text-bone" : "text-haze",
            )}
            style={{ fontSize: isWinner ? "var(--type-h2)" : "var(--type-body)" }}
          >
            {option.label}
          </span>
          <span
            className={cn("uppercase tracking-widest", live ? "text-bone-dim" : "text-haze")}
            style={{ fontSize: "var(--type-micro)" }}
          >
            {SOURCE_TAG[option.kind]}
          </span>
        </div>

        <div
          className={cn("mt-1.5 flex flex-wrap items-baseline gap-x-2", live ? "text-bone-dim" : "text-haze")}
          style={{ fontSize: "var(--type-small)" }}
        >
          {option.net_delivered === 0 ? (
            <span className={live ? "text-bone-dim" : "text-haze"}>Nothing lands</span>
          ) : (
            <span>
              <span
                className={cn(
                  "money",
                  !live ? "text-haze" : option.kind === "advance" ? "text-amber" : "text-bone",
                )}
                style={{ fontSize: isWinner ? "var(--type-body)" : "var(--type-small)" }}
              >
                {formatMoney(option.net_delivered, { sign: true })}
              </span>{" "}
              {option.timing}
            </span>
          )}
          <span aria-hidden="true" className={live ? "text-edge" : "text-haze"}>
            /
          </span>
          <CostLine option={option} dim={!live} />
        </div>

        {reason ? (
          <p className="mt-2 leading-snug text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
            {reason}
          </p>
        ) : null}

        {isWinner ? (
          <p className="mt-2.5 uppercase tracking-widest text-bone-dim" style={{ fontSize: "var(--type-micro)" }}>
            {isSelected ? "Selected" : "Best route tonight"}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col items-end gap-1">
        <span
          className={cn(
            "rounded border px-1.5 py-0.5 uppercase tracking-widest",
            verdict === "covers" && isWinner && "border-bone text-bone",
            verdict === "covers" && !isWinner && "border-edge text-bone-dim",
            verdict === "partial" && "border-edge text-bone-dim",
            verdict === "rejected" && "border-haze/50 text-haze",
          )}
          style={{ fontSize: "var(--type-micro)" }}
        >
          {badge}
        </span>
      </div>
    </div>
  )

  if (!live) {
    return (
      <li
        className="rounded-[var(--radius-card)] border border-dashed border-edge/70 bg-slate/80 px-3.5 py-3.5"
        style={{ fontSize: "var(--type-body)" }}
      >
        {body}
      </li>
    )
  }

  return (
    <li>
      <button
        type="button"
        aria-pressed={isSelected}
        aria-label={`${option.label}, ${badge}`}
        onClick={() => onSelect(option.label)}
        className={cn(
          "w-full rounded-[var(--radius-card)] border text-left",
          isWinner ? "border-bone/40 bg-raise px-4 py-5" : "border-edge bg-raise/70 px-3.5 py-3.5",
          isSelected && "border-bone",
          isSelected && "border-l-4 border-l-bone",
        )}
      >
        {body}
      </button>
    </li>
  )
}

export function RouteTable({
  routes,
  gap,
  cliff,
  gapInHours,
  covers,
  partial,
  selected,
  onSelect,
}: RouteTableProps): React.ReactElement {
  const winnerLabel = covers ? (routes.find((route) => route.covers)?.label ?? null) : null
  const liveRoutes = routes.filter((route) => isLive(route))
  const rejectedRoutes = routes.filter((route) => !isLive(route))

  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-2">
        <p className="uppercase tracking-widest text-bone-dim" style={{ fontSize: "var(--type-micro)" }}>
          Close the gap
        </p>

        {gap <= 0 ? (
          <p className="text-bone" style={{ fontSize: "var(--type-body)" }}>
            You are not short for {cliff.label}. There is no gap to close tonight.
          </p>
        ) : (
          <>
            <h2
              className="font-display uppercase leading-none tracking-tight text-bone"
              style={{ fontSize: "var(--type-hero)" }}
            >
              {formatHours(gapInHours)}
            </h2>
            <p className="leading-snug text-bone-dim" style={{ fontSize: "var(--type-body)" }}>
              That is the work that closes it. You are{" "}
              <span className="money text-rust">{formatMoney(gap)}</span> short for {cliff.label},{" "}
              {daysWord(cliff.days_away)} from now.
            </p>
          </>
        )}
      </header>

      {!covers && gap > 0 ? (
        <div className="rounded-[var(--radius-card)] border border-edge bg-raise px-3.5 py-3.5">
          <p className="text-bone" style={{ fontSize: "var(--type-body)" }}>
            Nothing here closes the gap by {cliff.label}.
          </p>
          {partial ? (
            <p className="mt-1.5 leading-snug text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
              Best partial: {partial.label} delivers{" "}
              <span className="money text-bone">{formatMoney(partial.net_delivered)}</span> {partial.timing}. You would
              still be <span className="money text-rust">{formatMoney(round2(gap - partial.net_delivered))}</span> short.
            </p>
          ) : (
            <p className="mt-1.5 leading-snug text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
              There is no partial route either. The gap stays open, so the next move is to cut what is due.
            </p>
          )}
        </div>
      ) : null}

      {routes.length === 0 ? (
        <p className="text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
          No routes to price yet. Open shifts, gigs, and advances appear here once your employer feed reports them.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-2.5">
            {liveRoutes.map((route) => (
              <RouteRow
                key={route.label}
                option={route}
                cliff={cliff}
                gap={gap}
                isWinner={route.label === winnerLabel}
                isSelected={route.label === selected}
                onSelect={onSelect}
              />
            ))}
          </ul>

          {rejectedRoutes.length > 0 ? (
            <div className="flex flex-col gap-2.5 border-t border-edge pt-4">
              <p className="uppercase tracking-widest text-haze" style={{ fontSize: "var(--type-micro)" }}>
                Does not cover
              </p>
              <ul className="flex flex-col gap-2.5">
                {rejectedRoutes.map((route) => (
                  <RouteRow
                    key={route.label}
                    option={route}
                    cliff={cliff}
                    gap={gap}
                    isWinner={false}
                    isSelected={false}
                    onSelect={onSelect}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}

      <p className="border-t border-edge pt-3 leading-snug text-haze" style={{ fontSize: "var(--type-small)" }}>
        A route only counts if it is big enough to close the gap and it arrives before the money is due. Missing either
        test greys it out.
      </p>
    </section>
  )
}
