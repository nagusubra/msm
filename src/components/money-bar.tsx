import type { MoneyState } from "@/lib/engine"
import { formatMoney } from "@/lib/engine"
import { cn } from "@/lib/utils"

/** Diagonal hatch drawn from currentColor, so the non-advanceable segments stay
 *  distinguishable in a greyscale screenshot rather than relying on hue alone. */
const HATCH = "repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 5px)"

const micro = { fontSize: "var(--type-micro)" } as const
const small = { fontSize: "var(--type-small)" } as const

function stateWord(state: MoneyState): string {
  if (state.advanceable) return "Advanceable"
  return state.confidence === "stale" ? "Not advanceable, hours unconfirmed" : "Not advanceable, estimated"
}

export function MoneyBar({ states }: { states: MoneyState[] }): React.ReactElement {
  const shown = states.filter((state) => state.amount > 0)

  if (shown.length === 0) {
    return (
      <p className="text-bone-dim" style={small}>
        No balance and no earned hours yet, so there is nothing to break down.
      </p>
    )
  }

  const pendingWeight = shown.reduce((sum, state) => (state.advanceable ? sum : sum + state.amount), 0)
  const confirmedWeight = shown.reduce((sum, state) => (state.advanceable ? sum + state.amount : sum), 0)

  return (
    <div role="img" aria-label="Breakdown of money by state">
      <div
        className="flex h-3.5 gap-0.5 overflow-hidden"
        style={{ borderRadius: "var(--radius-card)" }}
        aria-hidden="true"
      >
        {shown.map((state) => (
          <div
            key={state.key}
            className={cn("min-w-2", state.advanceable ? "bg-amber" : "bg-haze/35 text-haze")}
            style={{
              flexGrow: state.amount,
              flexBasis: 0,
              ...(state.advanceable ? {} : { backgroundImage: HATCH }),
            }}
          />
        ))}
      </div>

      {pendingWeight > 0 ? (
        <div className="mt-1.5 flex gap-0.5" aria-hidden="true">
          <div style={{ flexGrow: confirmedWeight, flexBasis: 0 }} />
          <div
            className="min-w-2 border-t border-haze pt-1 text-right whitespace-nowrap text-haze uppercase"
            style={{ flexGrow: pendingWeight, flexBasis: 0, letterSpacing: "0.12em", ...micro }}
          >
            Not advanceable
          </div>
        </div>
      ) : null}

      <ul className="mt-4 flex flex-col gap-2.5">
        {shown.map((state) => (
          <li key={state.key} className="flex items-baseline gap-2.5">
            <span
              className={cn(
                "mt-1 size-2.5 shrink-0 self-start rounded-sm",
                state.advanceable ? "bg-amber" : "bg-haze/35 text-haze",
              )}
              style={state.advanceable ? undefined : { backgroundImage: HATCH }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1">
              <span className="block text-bone" style={small}>
                {state.label}
              </span>
              <span
                className={cn("block uppercase", state.advanceable ? "text-bone-dim" : "text-haze")}
                style={{ letterSpacing: "0.12em", ...micro }}
              >
                {stateWord(state)}
              </span>
            </span>
            <span
              className={cn("money shrink-0 text-right", state.advanceable ? "text-amber" : "text-haze")}
              style={small}
            >
              {formatMoney(state.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
