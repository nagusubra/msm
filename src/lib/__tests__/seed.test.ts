import { describe, expect, it } from "vitest"
import seed from "../../../public/seed.json"

/**
 * seed.json is a read-only input and every claim in docs/numbers.md and the
 * README traces back to it. These assertions guard the input itself: if a row is
 * ever edited, rounded, or invented, one of these fails instead of the change
 * quietly propagating into a screenshot.
 */
describe("seed.json integrity", () => {
  it("freezes the clock the whole app runs on", () => {
    expect(seed.meta.today).toBe("2026-05-27T18:40")
    expect(seed.meta.opening_balance_2026_04_01).toBe(900)
  })

  it("holds the validation moment the /math route is built on", () => {
    const { engine_predicted_shortfall, worker_actual_advance_next_evening, actual_advance_fee } =
      seed.meta.validation
    expect(engine_predicted_shortfall).toBe(58.39)
    expect(worker_actual_advance_next_evening).toBe(55.92)
    expect(actual_advance_fee).toBe(2.8)

    const errorPct =
      (engine_predicted_shortfall - worker_actual_advance_next_evening) /
      worker_actual_advance_next_evening
    expect(errorPct).toBeLessThan(0.05)
  })

  it("keeps the persona solvent but tight, which is the whole thesis", () => {
    const obligationTotal = seed.obligations.reduce((sum, o) => sum + o.amount, 0)
    expect(obligationTotal).toBeCloseTo(seed.worker.monthly_obligations, 2)
    expect(seed.worker.monthly_income - obligationTotal).toBeCloseTo(331.41, 2)
  })

  it("has exactly one large bill, on the 1st, which is why there is one cliff a month", () => {
    const large = seed.obligations.filter((o) => o.amount > 500)
    expect(large).toHaveLength(1)
    expect(large[0]?.name).toBe("Rent")
    expect(large[0]?.due_day).toBe(1)
  })

  it("keeps every advance inside the post-shift evening window (finding 1)", () => {
    expect(seed.advances).toHaveLength(8)
    for (const advance of seed.advances) {
      const hour = Number(advance.requested_at.slice(11, 13))
      expect(hour).toBeGreaterThanOrEqual(17)
      expect(hour).toBeLessThanOrEqual(23)
    }
  })

  it("keeps every advance smaller than one mean shift (finding 3)", () => {
    const meanShiftNet = 111.25
    for (const advance of seed.advances) {
      expect(advance.amount).toBeLessThan(meanShiftNet)
    }
  })

  it("prices extra work at the persona's net hourly rate", () => {
    for (const option of seed.extra_work) {
      const impliedHourly = option.est_net / option.hours
      expect(Math.abs(impliedHourly - seed.worker.net_hourly)).toBeLessThan(0.05)
    }
  })

  it("offers routes that span the time-to-cash axis the solver filters on", () => {
    const payoutDays = seed.extra_work.map((o) => o.payout_days)
    expect(Math.min(...payoutDays)).toBe(0)
    expect(Math.max(...payoutDays)).toBeGreaterThan(5)
    expect(seed.extra_work.some((o) => o.conflicts)).toBe(true)
  })

  it("has unconfirmed shifts, so the three money states are real", () => {
    expect(seed.shifts).toHaveLength(13)
    expect(seed.shifts.some((s) => !s.confirmed)).toBe(true)
    expect(seed.shifts.some((s) => !s.paid_same_day)).toBe(true)
    expect(seed.hours_feed.status).toBe("stale")
  })
})
