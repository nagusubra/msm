import {
  DATA_MAX_DATE,
  DATA_MIN_DATE,
  clampDate,
  isDateInRange,
} from "@/lib/dates"
import { FEATURED_DEFAULT_DATE, FEATURED_WORKER_ID } from "@/lib/persona"

export type ResolvedParams = {
  workerId: string
  date: string
}

export const resolveDashboardParams = (searchParams: {
  worker?: string | string[]
  date?: string | string[]
}): ResolvedParams => {
  const rawDate = Array.isArray(searchParams.date)
    ? searchParams.date[0]
    : searchParams.date

  const date =
    rawDate && isDateInRange(rawDate, DATA_MIN_DATE, DATA_MAX_DATE)
      ? rawDate
      : clampDate(FEATURED_DEFAULT_DATE)

  return {
    workerId: FEATURED_WORKER_ID,
    date,
  }
}
