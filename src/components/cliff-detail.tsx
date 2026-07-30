import { formatHours, formatMoney } from "@/lib/engine"
import type { Cliff } from "@/lib/engine"

export interface CliffDetailProps {
  cliff: Cliff
  gapInHours: number
  gapInShifts: number
}

export function CliffDetail({ cliff, gapInHours, gapInShifts }: CliffDetailProps): React.ReactElement {
  const covered = cliff.shortfall <= 0
  const dayWord = cliff.days_away === 1 ? "day" : "days"

  return (
    <div
      className={
        covered
          ? "rounded-[var(--radius-card)] border border-edge bg-raise p-4"
          : "rounded-[var(--radius-card)] border border-rust/40 bg-raise p-4"
      }
    >
      <p
        className="uppercase tracking-[0.12em] text-bone-dim"
        style={{ fontSize: "var(--type-micro)" }}
      >
        The cliff
      </p>

      <p className="mt-2 font-display leading-snug text-bone" style={{ fontSize: "var(--type-h2)" }}>
        <span className="money">{formatMoney(cliff.outflow, { cents: false })}</span> due {cliff.label}
      </p>
      <p className="mt-1 leading-snug text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
        {cliff.days_away} {dayWord} from tonight.
      </p>

      {covered ? (
        <p className="mt-3 leading-snug text-bone" style={{ fontSize: "var(--type-body)" }}>
          You cover this one. Your projected balance holds at{" "}
          <span className="money text-amber">{formatMoney(cliff.projected_balance)}</span> after it clears.
        </p>
      ) : (
        <>
          <p
            className="mt-3 font-display leading-snug text-bone"
            style={{ fontSize: "var(--type-h2)" }}
          >
            You are <span className="money text-rust">{formatMoney(cliff.shortfall)}</span> short.
          </p>
          <p className="mt-2 leading-snug text-bone" style={{ fontSize: "var(--type-body)" }}>
            That is <span className="text-bone">{formatHours(gapInHours)}</span> of work.
          </p>
          <p className="mt-1 leading-snug text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
            <span>{gapInShifts.toFixed(1)}</span> of an average shift at your net hourly rate.
          </p>
        </>
      )}

      {cliff.obligations.length > 0 ? (
        <ul className="mt-4 border-t border-edge pt-3">
          {cliff.obligations.map((obligation) => (
            <li key={obligation.name} className="flex items-baseline justify-between gap-3 py-1">
              <span className="text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
                {obligation.name}
              </span>
              <span className="money text-right text-bone" style={{ fontSize: "var(--type-small)" }}>
                {formatMoney(obligation.amount)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-t border-edge pt-3 text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
          No named bill landed on this day. The outflow comes from the obligation schedule.
        </p>
      )}

      <p className="mt-3 text-bone-dim" style={{ fontSize: "var(--type-micro)" }}>
        Derived from your shifts and your obligations, not read from a balance field.
      </p>
    </div>
  )
}
