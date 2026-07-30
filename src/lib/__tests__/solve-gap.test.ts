import { describe, expect, it } from "vitest"
import {
  anyCovers,
  bestPartial,
  billsInHours,
  billsInShifts,
  meanShiftNet,
  netHourly,
  projectDays,
  safeToSpendToday,
  solveGap,
} from "../engine"
import { seed } from "../types"
import { ledgerInput, persona, TODAY } from "./fixture"

const days = projectDays(ledgerInput())
const safe = safeToSpendToday(days, persona().shifts, TODAY)
const gap = safe.shortfall
const daysUntilGap = safe.days_to_cliff

const input = {
  gap,
  daysUntilGap,
  workOptions: seed.extra_work,
  limits: seed.limits,
  groceryPortion: 33.53, // her mean monthly grocery spend, derived in scripts/analyze.ts
  periodNet: 500,
  observedFee: seed.limits.observed_fee_median,
}

describe("solveGap: the two-dimensional filter", () => {
  const routes = solveGap(input)

  it("prices a $58.39 gap five days out", () => {
    expect(gap).toBeCloseTo(58.39, 2)
    expect(daysUntilGap).toBe(5)
  })

  it("ranks the employer shift first, above the advance", () => {
    expect(routes[0]?.kind).toBe("employer_shift")
    expect(routes[0]?.cost).toBe(0)
    expect(routes[0]?.covers).toBe(true)

    const shiftIndex = routes.findIndex((route) => route.kind === "employer_shift")
    const advanceIndex = routes.findIndex((route) => route.kind === "advance")
    expect(shiftIndex).toBeLessThan(advanceIndex)
  })

  it("rejects the 7-day warehouse option against a 5-day deadline, and keeps it visible", () => {
    const warehouse = routes.find((route) => route.label.includes("Warehouse"))
    expect(warehouse).toBeDefined()
    expect(warehouse?.arrives_in_days).toBe(7)
    expect(warehouse?.reject_reason).toBe("too late")
    expect(warehouse?.covers).toBe(false)
    // Enough money, wrong time: the amount test passes on its own.
    expect(warehouse?.net_delivered).toBeGreaterThan(gap)
  })

  it("rejects an option that clashes with a scheduled shift", () => {
    const conflicting = routes.find((route) => route.reject_reason === "shift conflict")
    expect(conflicting).toBeDefined()
    expect(conflicting?.covers).toBe(false)
  })

  it("sorts every rejected route below every live one", () => {
    const lastLive = routes.reduce(
      (last, route, index) => (route.reject_reason === undefined && route.kind !== "nothing" ? index : last),
      -1,
    )
    const firstRejected = routes.findIndex(
      (route) => route.reject_reason !== undefined || route.kind === "nothing",
    )
    expect(firstRejected).toBeGreaterThan(lastLive)
  })

  it("prices the advance from the dataset's observed fee, not the $5 marketing number", () => {
    const advance = routes.find((route) => route.kind === "advance")
    expect(advance?.cost).toBeCloseTo(2.35, 2)
    expect(advance?.cost).not.toBe(5)
    expect(advance?.cost_pct).toBeCloseTo(0.04, 2)
    expect(advance?.covers).toBe(true)
  })

  it("shows Boost as a gain, not a cost", () => {
    const boost = routes.find((route) => route.kind === "boost")
    expect(boost?.cost).toBeLessThan(0)
    expect(boost?.covers).toBe(false)
  })

  it("prices doing nothing at $60 in NSF and late fees, last in the list", () => {
    const nothing = routes[routes.length - 1]
    expect(nothing?.kind).toBe("nothing")
    expect(nothing?.cost).toBeCloseTo(60, 2)
    expect(nothing?.cost_pct).toBeGreaterThan(1)
  })

  it("finds that something covers this gap, so the honest-failure path stays quiet", () => {
    expect(anyCovers(routes)).toBe(true)
  })
})

describe("solveGap when nothing can close the gap", () => {
  const routes = solveGap({ ...input, gap: 412, daysUntilGap: 3 })

  it("reports no cover and offers the best partial instead of faking a solution", () => {
    expect(anyCovers(routes)).toBe(false)
    const partial = bestPartial(routes)
    expect(partial).not.toBeNull()
    expect(partial?.net_delivered).toBeLessThan(412)
  })
})

describe("translating the gap into labour", () => {
  it("turns $58.39 into 3.8 hours at $15.54 net", () => {
    expect(billsInHours(gap, netHourly(persona().shifts))).toBeCloseTo(3.8, 1)
  })

  it("turns $58.39 into half a shift at $111.25 mean net", () => {
    expect(billsInShifts(gap, meanShiftNet(persona().shifts))).toBeCloseTo(0.5, 1)
  })

  it("leaves $3.76 over when she takes the 4-hour Saturday shift", () => {
    const saturday = seed.extra_work[0]
    expect(saturday?.est_net).toBeCloseTo(62.15, 2)
    expect((saturday?.est_net ?? 0) - gap).toBeCloseTo(3.76, 2)
  })
})
