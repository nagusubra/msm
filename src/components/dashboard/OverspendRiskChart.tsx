import type { RiskTimelinePoint } from "@/lib/riskScore"
import { cn } from "@/lib/utils"

type OverspendRiskChartProps = {
  points: RiskTimelinePoint[]
  predictedScore: number
}

const WIDTH = 640
const HEIGHT = 260
const PAD = { top: 24, right: 20, bottom: 40, left: 40 }

export const OverspendRiskChart = ({
  points,
  predictedScore,
}: OverspendRiskChartProps) => {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Not enough history yet to graph overspend risk.
      </p>
    )
  }

  const innerW = WIDTH - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom

  const xFor = (index: number) =>
    PAD.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW)
  const yFor = (score: number) => PAD.top + ((100 - score) / 100) * innerH

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(point.score)}`)
    .join(" ")

  const areaPath = [
    `M ${xFor(0)} ${yFor(0)}`,
    ...points.map((point, index) => `L ${xFor(index)} ${yFor(point.score)}`),
    `L ${xFor(points.length - 1)} ${yFor(0)}`,
    "Z",
  ].join(" ")

  const predictionIndex = points.findIndex((point) => point.kind === "prediction")
  const historyEndIndex =
    predictionIndex > 0 ? predictionIndex - 1 : points.length - 1

  const predictionSegment =
    predictionIndex > 0
      ? `M ${xFor(historyEndIndex)} ${yFor(points[historyEndIndex].score)} L ${xFor(predictionIndex)} ${yFor(points[predictionIndex].score)}`
      : ""

  const dangerY = yFor(75)
  const watchY = yFor(55)

  const labelIndexes = new Set<number>()
  labelIndexes.add(0)
  labelIndexes.add(points.length - 1)
  if (points.length > 4) {
    labelIndexes.add(Math.floor((points.length - 1) / 2))
  }

  return (
    <div className="w-full">
      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 bg-foreground/70" />
          Past workdays
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 border-t-2 border-dashed border-rose-500" />
          Today&apos;s prediction
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500/80" />
          Danger zone (75+)
        </span>
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-auto w-full min-w-[320px]"
          role="img"
          aria-label={`Overspend risk graph. Today's predicted score is ${predictedScore} out of 100.`}
        >
          <defs>
            <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid */}
          {[0, 25, 50, 75, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={WIDTH - PAD.right}
                y1={yFor(tick)}
                y2={yFor(tick)}
                className="stroke-border"
                strokeWidth="1"
              />
              <text
                x={PAD.left - 8}
                y={yFor(tick) + 4}
                textAnchor="end"
                className="fill-muted-foreground text-[10px]"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Threshold bands */}
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={watchY}
            y2={watchY}
            className="stroke-amber-500/50"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={dangerY}
            y2={dangerY}
            className="stroke-rose-500/60"
            strokeWidth="1.5"
            strokeDasharray="5 4"
          />

          <path d={areaPath} fill="url(#riskFill)" className="text-foreground" />

          <path
            d={linePath}
            fill="none"
            className="stroke-foreground/70"
            strokeWidth="2.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {predictionSegment ? (
            <path
              d={predictionSegment}
              fill="none"
              className="stroke-rose-500"
              strokeWidth="3"
              strokeDasharray="7 5"
              strokeLinecap="round"
            />
          ) : null}

          {points.map((point, index) => {
            const isPrediction = point.kind === "prediction"
            return (
              <g key={point.date}>
                <circle
                  cx={xFor(index)}
                  cy={yFor(point.score)}
                  r={isPrediction ? 6 : 4}
                  className={cn(
                    isPrediction
                      ? "fill-rose-500 stroke-background"
                      : point.status === "over"
                        ? "fill-rose-500/80 stroke-background"
                        : point.status === "close"
                          ? "fill-amber-500 stroke-background"
                          : "fill-foreground/70 stroke-background"
                  )}
                  strokeWidth="2"
                />
                {labelIndexes.has(index) || isPrediction ? (
                  <text
                    x={xFor(index)}
                    y={HEIGHT - 14}
                    textAnchor="middle"
                    className={cn(
                      "text-[10px]",
                      isPrediction ? "fill-rose-600 font-semibold" : "fill-muted-foreground"
                    )}
                  >
                    {point.label}
                  </text>
                ) : null}
                {isPrediction ? (
                  <text
                    x={xFor(index)}
                    y={yFor(point.score) - 12}
                    textAnchor="middle"
                    className="fill-rose-600 text-[11px] font-semibold"
                  >
                    {point.score}%
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Past dots show how close each workday came to blowing the limit. The dashed
        rose segment is today&apos;s predicted chance of going over ({predictedScore}
        /100).
      </p>
    </div>
  )
}
