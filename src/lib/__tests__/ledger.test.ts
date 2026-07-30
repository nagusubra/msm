import { describe, expect, it } from "vitest"
import {
  balanceOn,
  deriveLedger,
  findNextCliff,
  meanShiftHours,
  meanShiftNet,
  negativeDays,
  netHourly,
  projectDays,
  sameDayPayRate,
} from "../engine"
import { ledgerInput, persona, TODAY } from "./fixture"

/**
 * Every expected value here is the canonical figure from docs/numbers.md, and
 * every actual value is computed from the CSV rows. If the two ever part, one of
 * them is wrong and the repo stops being internally consistent.
 */
describe("rates derived from the shift rows", () => {
  it("computes net hourly from shifts, not from the profile field", () => {
    expect(netHourly(persona().shifts)).toBeCloseTo(15.54, 2)
    // typical_daily_net would imply a very different, wrong, hourly rate.
    expect(netHourly(persona().shifts)).not.toBeCloseTo(120.01, 2)
  })

  it("computes the mean shift at $111.25 over 7.2 hours", () => {
    expect(meanShiftNet(persona().shifts)).toBeCloseTo(111.25, 2)
    expect(meanShiftHours(persona().shifts)).toBeCloseTo(7.2, 1)
  })

  it("finds that only 36% of her shifts pay same day", () => {
    expect(sameDayPayRate(persona().shifts)).toBeCloseTo(0.36, 2)
  })
})

describe("the derived ledger", () => {
  const days = deriveLedger(ledgerInput())

  it("covers all 91 days of the window", () => {
    expect(days).toHaveLength(91)
    expect(days[0]?.date).toBe("2026-04-01")
    expect(days[days.length - 1]?.date).toBe("2026-06-30")
  })

  it("puts her at $1,016.34 on the evening of May 27", () => {
    expect(balanceOn(days, "2026-05-27")).toBeCloseTo(1016.34, 2)
  })

  it("finds 11 negative days, every one at a month boundary", () => {
    const negatives = negativeDays(days)
    expect(negatives).toHaveLength(11)
    for (const day of negatives) {
      expect(Number(day.date.slice(8, 10))).toBeLessThanOrEqual(5)
    }
  })

  it("flags exactly one cliff per month, on the 1st, because rent is her only large bill", () => {
    const cliffs = days.filter((day) => day.is_cliff)
    expect(cliffs.map((day) => day.date)).toEqual(["2026-04-01", "2026-05-01", "2026-06-01"])
  })

  it("never reads a provided balance column: the June 1 shortfall is $58.39", () => {
    const june1 = days.find((day) => day.date === "2026-06-01")
    expect(june1?.outflow).toBeCloseTo(1310, 2)
    expect(june1?.projected_balance).toBeCloseTo(-58.39, 2)
    expect(june1?.shortfall).toBeCloseTo(58.39, 2)
  })
})

describe("projectDays, the 21-day forward window", () => {
  const window = projectDays(ledgerInput())

  it("starts today and runs 21 days", () => {
    expect(window[0]?.date).toBe("2026-05-27")
    expect(window).toHaveLength(22) // today plus 21 days ahead, inclusive
  })

  it("contains exactly one cliff, June 1", () => {
    const cliffs = window.filter((day) => day.is_cliff)
    expect(cliffs).toHaveLength(1)
    expect(cliffs[0]?.date).toBe("2026-06-01")
  })

  it("marks future days estimated and past days confirmed", () => {
    expect(window[0]?.confidence).toBe("confirmed")
    expect(window.find((day) => day.date === "2026-06-10")?.confidence).not.toBe("confirmed")
  })

  it("reports the next cliff five days out with a $58.39 shortfall", () => {
    const cliff = findNextCliff(window, TODAY)
    expect(cliff?.date).toBe("2026-06-01")
    expect(cliff?.days_away).toBe(5)
    expect(cliff?.shortfall).toBeCloseTo(58.39, 2)
    expect(cliff?.obligations[0]?.name).toBe("Rent")
  })
})
