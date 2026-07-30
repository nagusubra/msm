"use client"

import { useId } from "react"
import { formatMoney } from "@/lib/engine"
import { shortLabel } from "@/lib/dates"
import type { Confidence, DayCell } from "@/lib/types"
import { cn } from "@/lib/utils"

export interface CliffChartProps {
  days: DayCell[]
  cliffDate: string | null
  selected: string | null
  onSelect: (date: string | null) => void
}

/* viewBox space. The chart is drawn in these units and scaled by the frame, so
   nothing here is a device pixel and the 390px frame never overflows. */
const VB_W = 320
const VB_H = 190
const PLOT_TOP = 26
const PLOT_BOTTOM = 166
const PLOT_H = PLOT_BOTTOM - PLOT_TOP
const LINE_W = 2
const DROP_W = 4.5

interface Point {
  index: number
  date: string
  balance: number
  shortfall: number
  confidence: Confidence
  isCliff: boolean
  x0: number
  x1: number
  y: number
}

interface Segment {
  d: string
  cls: string
}

/** Amber is confirmed, haze is estimated or stale, rust is a cliff day only. */
function strokeFor(point: Point): string {
  if (point.isCliff) return "stroke-rust"
  return point.confidence === "confirmed" ? "stroke-amber" : "stroke-haze"
}

function fillFor(point: Point): string {
  if (point.isCliff) return "fill-rust"
  return point.confidence === "confirmed" ? "fill-amber" : "fill-haze"
}

function line(x1: number, y1: number, x2: number, y2: number): string {
  return `M${x1.toFixed(2)},${y1.toFixed(2)}L${x2.toFixed(2)},${y2.toFixed(2)}`
}

/** Manhattan length: every segment of a step chart is axis-aligned. */
function stepLength(points: Point[]): number {
  let total = 0
  let previous: Point | null = null
  for (const point of points) {
    total += point.x1 - point.x0
    if (previous) total += Math.abs(point.y - previous.y)
    previous = point
  }
  return total
}

export function CliffChart({ days, cliffDate, selected, onSelect }: CliffChartProps): React.ReactElement {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "")

  if (days.length === 0) {
    return (
      <div className="rounded-[var(--radius-card)] border border-edge bg-raise p-4">
        <p className="text-bone-dim" style={{ fontSize: "var(--type-small)" }}>
          No days to project yet. The chart appears once the ledger has a window to run.
        </p>
      </div>
    )
  }

  const step = VB_W / days.length
  const balances = days.map((day) => day.projected_balance)
  const maxBalance = Math.max(...balances, 0)
  const minBalance = Math.min(...balances, 0)
  /* Linear scale, never a broken axis: the domain is padded below zero so the
     region under the line has room to read. The drop itself carries the drama. */
  const domainMin = -Math.max(Math.abs(minBalance) * 2.2, maxBalance * 0.15, 1)
  // Zero always sits strictly inside the plot, even on an all-negative series,
  // because the zero line is the only reference mark the chart has.
  const domainMax = Math.max(maxBalance * 1.06, Math.abs(domainMin) * 0.15)
  const span = domainMax - domainMin

  const yFor = (value: number): number => PLOT_TOP + ((domainMax - value) / span) * PLOT_H

  const points: Point[] = days.map((day, index) => ({
    index,
    date: day.date,
    balance: day.projected_balance,
    shortfall: day.shortfall,
    confidence: day.confidence,
    isCliff: day.is_cliff,
    x0: index * step,
    x1: (index + 1) * step,
    y: yFor(day.projected_balance),
  }))

  const first = points[0] as Point
  const last = points[points.length - 1] as Point

  const cliffIndex = cliffDate
    ? points.findIndex((point) => point.date === cliffDate)
    : points.findIndex((point) => point.isCliff)
  const cliff = cliffIndex >= 0 ? (points[cliffIndex] as Point) : null
  const beforeCliff = cliff && cliffIndex > 0 ? (points[cliffIndex - 1] as Point) : null
  const hasDrop = cliff !== null && beforeCliff !== null

  // The line splits into the approach, the drop, and the recovery, because the
  // three parts are timed separately: the draw has to stop hard at the edge.
  const approach = hasDrop ? points.slice(0, cliffIndex) : points
  const recovery = hasDrop && cliff ? points.slice(cliffIndex) : []

  const buildSegments = (group: Point[]): Segment[] => {
    const segments: Segment[] = []
    let previous: Point | null = null
    for (const point of group) {
      if (previous) segments.push({ d: line(point.x0, previous.y, point.x0, point.y), cls: strokeFor(point) })
      segments.push({ d: line(point.x0, point.y, point.x1, point.y), cls: strokeFor(point) })
      previous = point
    }
    return segments
  }

  const buildPath = (group: Point[]): string => {
    const head = group[0]
    if (!head) return ""
    let d = `M${head.x0.toFixed(2)},${head.y.toFixed(2)}`
    let previous: Point | null = null
    for (const point of group) {
      if (previous) d += `L${point.x0.toFixed(2)},${point.y.toFixed(2)}`
      d += `L${point.x1.toFixed(2)},${point.y.toFixed(2)}`
      previous = point
    }
    return d
  }

  const approachSegments = buildSegments(approach)
  const recoverySegments = buildSegments(recovery)
  const approachPath = buildPath(approach)
  const recoveryPath = buildPath(recovery)
  const approachLength = Math.max(stepLength(approach), 1)
  const recoveryLength = Math.max(stepLength(recovery), 1)

  const zeroY = yFor(0)
  const zeroVisible = zeroY > PLOT_TOP && zeroY < PLOT_BOTTOM

  const activeDate = selected ?? cliffDate
  const active = activeDate ? (points.find((point) => point.date === activeDate) ?? null) : null

  const tap = (date: string): void => {
    onSelect(selected === date ? null : date)
  }

  /* Sparse ticks only: the ends, the cliff, and one mid point that does not
     collide with it. Everything else is noise at this width. */
  const tickSet = new Set<number>([0, last.index])
  if (cliff) tickSet.add(cliff.index)
  const mid = Math.round((last.index - 0) / 2)
  if (!cliff || Math.abs(mid - cliff.index) > 3) tickSet.add(mid)
  const ticks = [...tickSet].sort((a, b) => a - b).map((index) => points[index] as Point)

  const dropLabel = cliff ? (cliff.shortfall > 0 ? formatMoney(-cliff.shortfall) : formatMoney(cliff.balance)) : ""
  const dropLabelLeft = cliff !== null && cliff.x1 > VB_W * 0.62

  const summary = cliff
    ? `Balance runs from ${formatMoney(first.balance)} and drops to ${formatMoney(cliff.balance)} on ${shortLabel(cliff.date)}, a shortfall of ${formatMoney(cliff.shortfall)}, then recovers to ${formatMoney(last.balance)} by ${shortLabel(last.date)}.`
    : `Balance runs from ${formatMoney(first.balance)} on ${shortLabel(first.date)} to ${formatMoney(last.balance)} on ${shortLabel(last.date)} and never falls below zero.`

  const topPct = (PLOT_TOP / VB_H) * 100
  const bottomPct = ((VB_H - PLOT_BOTTOM) / VB_H) * 100

  return (
    <div className="relative">
      <style>{`
        @keyframes till-draw-${uid} { to { stroke-dashoffset: 0; } }
        @keyframes till-mark-${uid} { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          .till-draw-${uid} { animation: none !important; stroke-dashoffset: 0 !important; }
          .till-mark-${uid} { animation: none !important; opacity: 1 !important; }
        }
      `}</style>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="xMidYMid meet"
        className="block h-auto w-full"
        role="img"
        aria-label={summary}
      >
        <defs>
          {/* The line draws by revealing colored segments through a stroked mask,
              so one dashoffset sweep can carry several semantic colors at once. */}
          <mask id={`approach-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
            <path
              d={approachPath}
              fill="none"
              stroke="white"
              strokeWidth={10}
              strokeLinecap="butt"
              className={`till-draw-${uid}`}
              style={{
                strokeDasharray: approachLength,
                strokeDashoffset: approachLength,
                animationName: `till-draw-${uid}`,
                animationDuration: "var(--draw-duration)",
                animationTimingFunction: "var(--ease-out)",
                animationFillMode: "forwards",
              }}
            />
          </mask>
          <mask id={`recovery-${uid}`} maskUnits="userSpaceOnUse" x="0" y="0" width={VB_W} height={VB_H}>
            <path
              d={recoveryPath}
              fill="none"
              stroke="white"
              strokeWidth={10}
              strokeLinecap="butt"
              className={`till-draw-${uid}`}
              style={{
                strokeDasharray: recoveryLength,
                strokeDashoffset: recoveryLength,
                animationName: `till-draw-${uid}`,
                animationDuration: "calc(var(--draw-duration) * 0.8)",
                animationDelay: "calc(var(--draw-duration) * 1.55)",
                animationTimingFunction: "var(--ease-out)",
                animationFillMode: "forwards",
              }}
            />
          </mask>
        </defs>

        {zeroVisible ? (
          <>
            <rect
              x={0}
              y={zeroY}
              width={VB_W}
              height={PLOT_BOTTOM - zeroY}
              className="fill-bone"
              opacity={0.06}
            />
            <line x1={0} y1={zeroY} x2={VB_W} y2={zeroY} className="stroke-bone-dim" strokeWidth={0.75} opacity={0.45} />
          </>
        ) : null}

        {cliff ? (
          <line
            x1={cliff.x0}
            y1={PLOT_TOP}
            x2={cliff.x0}
            y2={PLOT_BOTTOM}
            className={`stroke-rust till-mark-${uid}`}
            strokeWidth={1}
            opacity={0.22}
            style={{
              animationName: `till-mark-${uid}`,
              animationDuration: "calc(var(--draw-duration) * 0.35)",
              animationDelay: "calc(var(--draw-duration) * 0.9)",
              animationTimingFunction: "var(--ease-out)",
              animationFillMode: "both",
            }}
          />
        ) : null}

        {active ? (
          <>
            <line
              x1={active.x0 + step / 2}
              y1={PLOT_TOP}
              x2={active.x0 + step / 2}
              y2={PLOT_BOTTOM}
              className="stroke-bone-dim"
              strokeWidth={0.75}
              strokeDasharray="2 3"
              opacity={0.5}
            />
            <text
              x={Math.min(Math.max(active.x0 + step / 2, 26), VB_W - 26)}
              y={PLOT_TOP - 14}
              textAnchor="middle"
              className={cn("money", fillFor(active))}
              style={{ fontSize: "var(--type-small)" }}
            >
              {formatMoney(active.balance)}
            </text>
            <text
              x={Math.min(Math.max(active.x0 + step / 2, 26), VB_W - 26)}
              y={PLOT_TOP - 4}
              textAnchor="middle"
              className="fill-bone-dim"
              style={{ fontSize: "var(--type-micro)" }}
            >
              {shortLabel(active.date)}
            </text>
          </>
        ) : null}

        <g mask={`url(#approach-${uid})`} fill="none" strokeLinecap="butt">
          {approachSegments.map((segment) => (
            <path key={segment.d} d={segment.d} className={segment.cls} strokeWidth={LINE_W} />
          ))}
        </g>

        {hasDrop && cliff && beforeCliff ? (
          <line
            x1={cliff.x0}
            y1={beforeCliff.y}
            x2={cliff.x0}
            y2={cliff.y}
            className={`stroke-rust till-draw-${uid}`}
            strokeWidth={DROP_W}
            strokeLinecap="butt"
            style={{
              strokeDasharray: Math.abs(cliff.y - beforeCliff.y),
              strokeDashoffset: Math.abs(cliff.y - beforeCliff.y),
              animationName: `till-draw-${uid}`,
              animationDuration: "calc(var(--draw-duration) * 0.34)",
              animationDelay: "var(--draw-duration)",
              animationTimingFunction: "var(--ease-out)",
              animationFillMode: "forwards",
            }}
          />
        ) : null}

        <g mask={`url(#recovery-${uid})`} fill="none" strokeLinecap="butt">
          {recoverySegments.map((segment) => (
            <path key={segment.d} d={segment.d} className={segment.cls} strokeWidth={LINE_W} />
          ))}
        </g>

        {cliff ? (
          <g
            className={`till-mark-${uid}`}
            style={{
              animationName: `till-mark-${uid}`,
              animationDuration: "calc(var(--draw-duration) * 0.3)",
              animationDelay: "calc(var(--draw-duration) * 1.3)",
              animationTimingFunction: "var(--ease-out)",
              animationFillMode: "both",
            }}
          >
            <circle cx={cliff.x0} cy={cliff.y} r={2.75} className="fill-rust" />
            <text
              x={dropLabelLeft ? cliff.x0 - 6 : cliff.x0 + 6}
              y={cliff.y - 6}
              textAnchor={dropLabelLeft ? "end" : "start"}
              className="money fill-rust"
              style={{ fontSize: "var(--type-small)" }}
            >
              {dropLabel}
            </text>
          </g>
        ) : null}

        {ticks.map((tick) => (
          <text
            key={tick.date}
            x={Math.min(Math.max(tick.x0 + step / 2, 14), VB_W - 14)}
            y={PLOT_BOTTOM + 14}
            textAnchor="middle"
            className={cliff && tick.date === cliff.date ? "fill-rust" : "fill-bone-dim"}
            style={{ fontSize: "var(--type-micro)" }}
          >
            {shortLabel(tick.date)}
          </text>
        ))}
      </svg>

      {/* Tap targets sit above the graphic as real buttons so the day columns are
          keyboard reachable and the SVG stays a single labelled image. */}
      <div
        className="absolute right-0 left-0 flex"
        style={{ top: `${topPct}%`, bottom: `${bottomPct}%` }}
      >
        {points.map((point) => (
          <button
            key={point.date}
            type="button"
            onClick={() => tap(point.date)}
            aria-pressed={activeDate === point.date}
            className={cn(
              "min-w-0 flex-1 cursor-pointer outline-none",
              "focus-visible:bg-bone/10",
              activeDate === point.date && (point.isCliff ? "bg-rust/10" : "bg-bone/5"),
            )}
          >
            <span className="sr-only">
              {`${shortLabel(point.date)}, balance ${formatMoney(point.balance)}${point.isCliff ? ", cliff day" : ""}`}
            </span>
          </button>
        ))}
      </div>

      <p className="sr-only">{summary}</p>
    </div>
  )
}
