/**
 * Test fixture: the persona assembled from the raw CSVs, so the assertions run
 * against the real dataset rather than a hand-written mock. Tests execute in
 * node, so reading files here is fine; src/lib itself stays pure.
 */
import { byWorker, earnings, obligations as obligationRows, advances as advanceRows, toAdvances, toObligations, toShifts } from "../../../scripts/load"
import { seed } from "../types"
import type { Advance, Obligation, Shift } from "../types"

export const WORKER_ID = seed.meta.worker_id
export const TODAY = seed.meta.today
export const OPENING = seed.meta.opening_balance_2026_04_01
export const WINDOW_START = "2026-04-01"
export const WINDOW_END = "2026-06-30"

export interface Persona {
  shifts: Shift[]
  obligations: Obligation[]
  advances: Advance[]
}

let cached: Persona | null = null

export function persona(): Persona {
  if (cached) return cached
  const shiftRows = byWorker(earnings()).get(WORKER_ID) ?? []
  cached = {
    shifts: toShifts(shiftRows, seed.hours_feed.last_sync),
    obligations: toObligations(byWorker(obligationRows()).get(WORKER_ID) ?? []),
    advances: toAdvances(byWorker(advanceRows()).get(WORKER_ID) ?? []),
  }
  return cached
}

export function ledgerInput() {
  const { shifts, obligations } = persona()
  return {
    shifts,
    obligations,
    opening: OPENING,
    start: WINDOW_START,
    end: WINDOW_END,
    today: TODAY,
  }
}
