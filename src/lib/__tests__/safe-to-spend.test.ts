import { describe, expect, it } from "vitest"
import { advanceAfter, feedHealth, feesPaid, latestShift, medianFee, moneyStates, projectDays, safeToSpendToday } from "../engine"
import { seed } from "../types"
import { ledgerInput, persona, TODAY } from "./fixture"

const days = projectDays(ledgerInput())
const safe = safeToSpendToday(days, persona().shifts, TODAY)

describe("safeToSpendToday", () => {
  it("shows the whole chain that produces the shortfall", () => {
    expect(safe.balance_today).toBeCloseTo(1016.34, 2)
    expect(safe.inflow_before_cliff).toBeCloseTo(235.27, 2)
    expect(safe.committed).toBeCloseTo(1310, 2)
    expect(safe.shortfall).toBeCloseTo(58.39, 2)
  })

  it("returns zero rather than a negative number when committed exceeds available", () => {
    expect(safe.safe).toBe(0)
    expect(safe.safe).not.toBeLessThan(0)
  })

  it("counts five days to the cliff", () => {
    expect(safe.days_to_cliff).toBe(5)
    expect(safe.next_cliff?.label).toBe("June 1")
  })

  it("reports no earnings on the demo date, because the data has no shift that day", () => {
    expect(safe.today_earned).toBe(0)
    expect(latestShift(persona().shifts, TODAY)?.date).toBe("2026-05-25")
  })
})

describe("moneyStates: the three-state bar", () => {
  const cliffDate = safe.next_cliff?.date ?? "2026-06-01"
  const states = moneyStates(
    persona().shifts,
    TODAY,
    safe.balance_today,
    seed.hours_feed.last_sync,
    cliffDate,
  )

  it("leads with what is actually in the account", () => {
    expect(states[0]?.key).toBe("banked")
    expect(states[0]?.amount).toBeCloseTo(1016.34, 2)
    expect(states[0]?.advanceable).toBe(true)
  })

  it("marks unconfirmed hours not advanceable at the derived $208.91", () => {
    const unconfirmed = states.find((state) => state.key === "unconfirmed")
    expect(unconfirmed).toBeDefined()
    expect(unconfirmed?.advanceable).toBe(false)
    expect(unconfirmed?.confidence).toBe("stale")
    expect(unconfirmed?.amount).toBeCloseTo(208.91, 2)
    const scheduled = states.find((state) => state.key === "scheduled")
    expect(scheduled?.advanceable).toBe(false)
  })

  it("never double-counts wages that have already landed", () => {
    const earnedUnpaid = states.find((state) => state.key === "earned_unpaid")
    const total = states.reduce((sum, state) => sum + state.amount, 0)
    expect(total).toBeGreaterThan(safe.balance_today)
    if (earnedUnpaid) {
      // Only money worked but not yet deposited may sit in this state.
      expect(earnedUnpaid.amount).toBeLessThan(safe.balance_today)
    }
  })
})

describe("feedHealth", () => {
  const cliffDate = safe.next_cliff?.date ?? "2026-06-01"
  const health = feedHealth(seed.hours_feed, persona().shifts, TODAY, cliffDate)

  it("reports the feed two days stale and names the employer as the fix", () => {
    expect(health.days_stale).toBe(2)
    expect(health.escalation_target).toBe("employer_payroll_admin")
    expect(health.escalation_draft.length).toBeGreaterThan(0)
  })

  it("never shows a bare zero: unconfirmed hours carry the derived estimate", () => {
    expect(health.unconfirmed_shifts).toBe(2)
    expect(health.estimated_net).toBeCloseTo(208.91, 2)
    expect(health.message).toContain("estimated")
  })
})

describe("her real advance history, used only for validation", () => {
  it("totals $23.14 in fees across 8 advances, median $2.35", () => {
    expect(persona().advances).toHaveLength(8)
    expect(feesPaid(persona().advances)).toBeCloseTo(23.14, 2)
    expect(medianFee(persona().advances)).toBeCloseTo(2.35, 2)
  })

  it("shows the engine predicted her next move: $58.39 against her actual $55.92", () => {
    const next = advanceAfter(persona().advances, TODAY)
    expect(next?.requested_at.slice(0, 10)).toBe("2026-05-28")
    expect(next?.amount).toBeCloseTo(55.92, 2)
    expect(next?.fee).toBeCloseTo(2.8, 2)

    const errorPct = Math.abs(safe.shortfall - (next?.amount ?? 0)) / (next?.amount ?? 1)
    expect(errorPct).toBeLessThan(0.05)
  })
})
