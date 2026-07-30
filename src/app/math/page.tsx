import type { Metadata } from "next"
import Link from "next/link"
import { PhoneFrame } from "@/components/phone-frame"
import { formatMoney, formatPct } from "@/lib/engine"
import { buildView } from "@/lib/persona"
import { shortLabel } from "@/lib/dates"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: "The math",
  description: "Every intermediate value behind the projection, for verification.",
}

/**
 * The verification surface. Density is the point: a reader should be able to
 * check the whole chain from the opening balance to the shortfall, then see the
 * engine's prediction sitting next to what the worker actually did.
 */
function Row({
  label,
  value,
  note,
  tone = "bone",
}: {
  label: string
  value: string
  note?: string
  tone?: "bone" | "amber" | "rust" | "haze"
}) {
  const toneClass =
    tone === "amber" ? "text-amber" : tone === "rust" ? "text-rust" : tone === "haze" ? "text-haze" : "text-bone"
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-edge py-2.5">
      <span className="text-[length:var(--type-small)] leading-snug text-bone-dim">
        {label}
        {note ? <span className="mt-0.5 block text-[length:var(--type-micro)] text-haze">{note}</span> : null}
      </span>
      <span className={cn("money shrink-0 text-right", toneClass)}>{value}</span>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-card)] border border-edge bg-raise px-3.5 py-3">
      <h2 className="mb-1 font-display text-[length:var(--type-body)] tracking-wide text-bone uppercase">{title}</h2>
      <div>{children}</div>
    </section>
  )
}

export default function MathPage() {
  const view = buildView()
  const { safe, cliff, gap, gapInHours, gapInShifts, worker, cohort, meta, actualAdvance } = view

  const predictionError =
    actualAdvance && actualAdvance.amount > 0 ? Math.abs(gap - actualAdvance.amount) / actualAdvance.amount : 0

  const statusTime = (() => {
    const parts = view.today.slice(11, 16).split(":")
    const hour = Number(parts[0])
    const minute = parts[1] ?? "00"
    if (!Number.isFinite(hour)) return ""
    const suffix = hour < 12 ? "AM" : "PM"
    const twelve = hour % 12 === 0 ? 12 : hour % 12
    return `${twelve}:${minute} ${suffix}`
  })()

  const stat = (key: string): { value: number; method: string } => {
    const entry = cohort[key]
    return { value: entry?.value ?? 0, method: entry?.method ?? "" }
  }

  return (
    <PhoneFrame statusTime={statusTime}>
      <main className="flex flex-col gap-6 px-4 pt-2 pb-8">
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-[length:var(--type-micro)] tracking-[0.12em] text-bone-dim uppercase">Verification</p>
            <h1 className="font-display text-[length:var(--type-hero)] leading-none text-bone">The math</h1>
            <p className="mt-1 text-[length:var(--type-small)] leading-snug text-bone-dim">
              Every value, in compute order. {meta.generated_by}. Window {meta.window}.
            </p>
          </div>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-edge px-3 py-1.5 text-[length:var(--type-micro)] tracking-wide text-bone-dim uppercase"
          >
            Back
          </Link>
        </header>

        <Section title="Her rates, from the shift rows">
          <Row label="Shifts in the window" value={String(worker.shifts.length)} />
          <Row
            label="Net hourly"
            value={formatMoney(worker.net_hourly)}
            note="sum of net pay divided by sum of hours, not the profile field"
          />
          <Row label="Mean shift net" value={formatMoney(worker.mean_shift_net)} note={`${worker.mean_hours} hours`} />
          <Row label="Paid same day" value={formatPct(worker.same_day_pay_rate, 0)} />
          <Row label="Monthly income" value={formatMoney(worker.monthly_income)} />
          <Row label="Monthly obligations" value={formatMoney(worker.monthly_obligations)} />
          <Row
            label="Solvent by"
            value={formatMoney(worker.monthly_income - worker.monthly_obligations)}
            note="and she still hits the wall every month, because the timing is wrong"
          />
        </Section>

        <Section title="The derived ledger">
          <Row label="Opening balance, Apr 1" value={formatMoney(view.ledger[0]?.projected_balance ?? 0)} note={meta.opening_balance_rule} />
          <Row label="Days derived" value={String(view.ledger.length)} />
          <Row label="Negative days" value={String(worker.negative_days)} note="every one at a month boundary" />
          <Row label="Ignored columns" value={String(meta.ignored_columns.length)} note={meta.ignored_columns.join(", ")} />
        </Section>

        <Section title="The projection on the demo evening">
          <Row label="Position today" value={formatMoney(safe.balance_today)} note="derived, never read from a balance field" />
          <Row
            label={`Inflow before ${cliff ? shortLabel(cliff.date) : "the cliff"}`}
            value={formatMoney(safe.inflow_before_cliff)}
            note="wages landing same day, or five days after the shift"
          />
          <Row label="Committed" value={formatMoney(safe.committed)} note={cliff?.obligations.map((o) => o.name).join(", ")} />
          <Row label="Balance at the cliff" value={formatMoney(safe.balance_today + safe.inflow_before_cliff - safe.committed)} tone="rust" />
          <Row label="Shortfall" value={formatMoney(gap)} tone="rust" />
          <Row label="Safe to spend tonight" value={formatMoney(safe.safe)} note="never negative" tone="haze" />
          <Row label="In hours of work" value={`${gapInHours.toFixed(1)} h`} />
          <Row label="In shifts" value={gapInShifts.toFixed(1)} />
        </Section>

        <Section title="The engine predicted her behaviour">
          <Row label="Engine shortfall, computed May 27" value={formatMoney(gap)} note="from ledger math alone, with no knowledge of her advance history" />
          <Row
            label={`What she actually requested${actualAdvance ? `, ${shortLabel(actualAdvance.requested_at)}` : ""}`}
            value={actualAdvance ? formatMoney(actualAdvance.amount) : "no advance"}
            note={actualAdvance ? `${actualAdvance.requested_at.slice(11, 16)}, reason: ${actualAdvance.reason}` : undefined}
          />
          <Row label="Fee she paid" value={actualAdvance ? formatMoney(actualAdvance.fee) : formatMoney(0)} />
          <Row label="Prediction error" value={formatPct(predictionError)} />
          <Row label="Fee our solver quoted instead" value={formatMoney(view.advanceFeeEstimate)} note="her observed median fee, used before the fact" />
        </Section>

        <Section title="The cohort, computed over the full dataset">
          <Row label="Workers" value={stat("workers").value.toLocaleString("en-CA")} />
          <Row label="Shifts" value={stat("shifts").value.toLocaleString("en-CA")} />
          <Row label="Advances" value={stat("advances").value.toLocaleString("en-CA")} />
          <Row label="Transactions" value={stat("transactions").value.toLocaleString("en-CA")} />
          <Row
            label="Advances in the evening window"
            value={formatPct(stat("advances_in_evening_window_pct").value / 100, 0)}
            note={stat("advances_in_evening_window_pct").method}
          />
          <Row
            label="Obligation dollars on the 1st or 15th"
            value={formatPct(stat("oblig_dollars_on_1st_or_15th_mean_pct").value / 100, 0)}
            note={stat("oblig_dollars_on_1st_or_15th_mean_pct").method}
          />
          <Row
            label="Shifts not paid same day"
            value={formatPct(stat("shifts_not_paid_same_day_pct").value / 100, 0)}
            note={stat("shifts_not_paid_same_day_pct").method}
          />
          <Row
            label="Advances under one shift's net"
            value={formatPct(stat("advances_under_one_mean_shift_pct").value / 100, 0)}
            note={stat("advances_under_one_mean_shift_pct").method}
          />
        </Section>

        <footer className="rounded-[var(--radius-card)] border border-edge bg-raise px-3.5 py-3 text-[length:var(--type-small)] leading-snug text-bone-dim">
          Reproduce: <span className="money text-bone">npm run analyze</span>,{" "}
          <span className="money text-bone">npm run reconcile</span>,{" "}
          <span className="money text-bone">npm run backtest</span>, <span className="money text-bone">npm test</span>.
        </footer>
      </main>
    </PhoneFrame>
  )
}
