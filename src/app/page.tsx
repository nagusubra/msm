"use client"

import { useState } from "react"
import Link from "next/link"
import { CliffChart } from "@/components/cliff-chart"
import { CliffDetail } from "@/components/cliff-detail"
import { PhoneFrame } from "@/components/phone-frame"
import { RouteTable } from "@/components/route-table"
import { Tonight } from "@/components/tonight"
import { formatHours, formatMoney } from "@/lib/engine"
import { buildView } from "@/lib/persona"
import { cn } from "@/lib/utils"

/**
 * Native-feeling three-screen loop: Tonight → Cliff → Routes.
 * Shell owns chrome (tabs, sticky CTA). Screens stay presentational.
 * Every figure from buildView() / the engine.
 */
const view = buildView()

const STEPS = [
  { short: "Tonight", title: "Tonight" },
  { short: "Cliff", title: "The cliff" },
  { short: "Routes", title: "Close the gap" },
] as const
type Step = 0 | 1 | 2

function statusClock(timestamp: string): string {
  const parts = timestamp.slice(11, 16).split(":")
  const hour = Number(parts[0])
  const minute = parts[1] ?? "00"
  if (!Number.isFinite(hour)) return ""
  const suffix = hour < 12 ? "AM" : "PM"
  const twelve = hour % 12 === 0 ? 12 : hour % 12
  return `${twelve}:${minute} ${suffix}`
}

export default function Home() {
  const [step, setStep] = useState<Step>(0)
  const [back, setBack] = useState(false)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null)

  const { cliff, safe, states, latest, feed, routes, covers, partial, gap, gapInHours, gapInShifts } = view

  const handleGo = (next: Step) => {
    setBack(next < step)
    setStep(next)
  }

  const shownDay = selectedDay ?? cliff?.date ?? null
  const detailDay = view.window.find((day) => day.date === shownDay) ?? null
  const onCliffDay = cliff !== null && shownDay === cliff.date

  const cta =
    step === 0 && cliff
      ? {
          label: "See the cliff",
          detail: formatMoney(-cliff.shortfall),
          detailTone: "rust" as const,
          action: () => handleGo(1),
        }
      : step === 1 && cliff
        ? {
            label: "Close the gap",
            detail: formatHours(gapInHours),
            detailTone: "bone" as const,
            action: () => handleGo(2),
          }
        : null

  return (
    <PhoneFrame statusTime={statusClock(view.today)}>
      <div className="flex min-h-full flex-col">
        {/* App header */}
        <div className="sticky top-0 z-10 border-b border-edge/80 bg-slate/95 px-4 pt-1 pb-3 backdrop-blur-md sm:bg-raise/95">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="font-display text-[length:var(--type-h2)] tracking-wide text-bone uppercase">TILL</p>
              <p className="text-[length:var(--type-micro)] tracking-[0.12em] text-bone-dim uppercase">
                {STEPS[step].title}
              </p>
            </div>
            <Link
              href="/math"
              className="rounded-full border border-edge px-3 py-1.5 text-[length:var(--type-micro)] tracking-wide text-bone-dim uppercase"
            >
              Math
            </Link>
          </div>

          {/* Segmented control */}
          <div
            className="grid grid-cols-3 gap-1 rounded-[var(--radius-card)] bg-slate p-1"
            role="tablist"
            aria-label="Screens"
          >
            {STEPS.map((item, index) => {
              const active = index === step
              return (
                <button
                  key={item.short}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => handleGo(index as Step)}
                  className={cn(
                    "rounded-[calc(var(--radius-card)-2px)] py-2 text-center text-[length:var(--type-micro)] tracking-[0.12em] uppercase",
                    active ? "bg-raise text-bone shadow-sm" : "text-bone-dim",
                  )}
                >
                  {item.short}
                </button>
              )
            })}
          </div>
        </div>

        {/* Screen body */}
        <main
          key={step}
          className={cn("flex-1 px-4 pt-4 pb-4", back ? "step-back" : "step-forward")}
          role="tabpanel"
        >
          {step === 0 ? (
            <Tonight
              today={view.today}
              latest={latest}
              safe={safe}
              states={states}
              feed={feed}
              gapInHours={gapInHours}
            />
          ) : null}

          {step === 1 ? (
            <section className="flex flex-col gap-4">
              <header className="flex flex-col gap-1">
                <p className="text-[length:var(--type-micro)] tracking-[0.12em] text-bone-dim uppercase">
                  Next 21 days
                </p>
                <h2 className="font-display text-[length:var(--type-h2)] leading-snug text-bone">
                  {cliff ? `Runs out on ${cliff.label}` : "No cliff in the next 21 days"}
                </h2>
              </header>

              <div className="overflow-hidden rounded-[var(--radius-card)] border border-edge bg-raise p-2">
                <CliffChart
                  days={view.window}
                  cliffDate={cliff?.date ?? null}
                  selected={selectedDay}
                  onSelect={setSelectedDay}
                />
              </div>

              {cliff && onCliffDay ? (
                <CliffDetail cliff={cliff} gapInHours={gapInHours} gapInShifts={gapInShifts} />
              ) : null}

              {detailDay && !onCliffDay ? (
                <p className="rounded-[var(--radius-card)] border border-edge bg-raise/60 px-3.5 py-3 text-[length:var(--type-small)] leading-snug text-bone-dim">
                  <span className="money text-bone">{formatMoney(detailDay.projected_balance)}</span> projected.
                  Tap the rust day for the shortfall.
                </p>
              ) : null}
            </section>
          ) : null}

          {step === 2 && cliff ? (
            <RouteTable
              routes={routes}
              gap={gap}
              cliff={cliff}
              gapInHours={gapInHours}
              covers={covers}
              partial={partial}
              selected={selectedRoute}
              onSelect={setSelectedRoute}
            />
          ) : null}
        </main>

        {/* Sticky primary CTA */}
        {cta ? (
          <div className="sticky bottom-0 z-10 border-t border-edge bg-slate/95 px-4 pt-3 pb-2 backdrop-blur-md sm:bg-raise/95">
            <button
              type="button"
              onClick={cta.action}
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-card)] bg-bone px-4 py-4 text-left active:opacity-90"
            >
              <span className="font-display text-[length:var(--type-body)] tracking-wide text-slate uppercase">
                {cta.label}
              </span>
              <span
                className={cn(
                  "money text-[length:var(--type-body)]",
                  cta.detailTone === "rust" ? "text-rust" : "text-slate",
                )}
              >
                {cta.detail}
              </span>
            </button>
            <p className="mt-2 text-center text-[length:var(--type-micro)] text-bone-dim">
              Derived ledger. Balance columns are never read.
            </p>
          </div>
        ) : step === 2 ? (
          <div className="border-t border-edge px-4 pt-3 pb-2">
            <p className="text-center text-[length:var(--type-micro)] leading-snug text-bone-dim">
              Derived ledger. Balance columns are never read.
            </p>
          </div>
        ) : null}
      </div>
    </PhoneFrame>
  )
}
