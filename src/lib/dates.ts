/**
 * Date helpers, pure and UTC-only. Everything is a `YYYY-MM-DD` string at the
 * boundary so no local timezone can shift a payout across a day and change a
 * rendered figure. `new Date()` with no argument is banned in this repo: "now"
 * is data (seed.meta.today), so the demo produces identical output on any date.
 */

const MS_PER_DAY = 86_400_000

export type IsoDate = string // YYYY-MM-DD

export function toDate(iso: string): Date {
  const [y = 0, m = 1, d = 1] = iso.slice(0, 10).split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function ymd(date: Date): IsoDate {
  return date.toISOString().slice(0, 10)
}

export function dateOnly(isoTimestamp: string): IsoDate {
  return isoTimestamp.slice(0, 10)
}

export function addDays(iso: string, days: number): IsoDate {
  return ymd(new Date(toDate(iso).getTime() + days * MS_PER_DAY))
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toDate(to).getTime() - toDate(from).getTime()) / MS_PER_DAY)
}

export function dayOfMonth(iso: string): number {
  return toDate(iso).getUTCDate()
}

export function isBefore(a: string, b: string): boolean {
  return toDate(a).getTime() < toDate(b).getTime()
}

export function isAfter(a: string, b: string): boolean {
  return toDate(a).getTime() > toDate(b).getTime()
}

export function isOnOrBefore(a: string, b: string): boolean {
  return toDate(a).getTime() <= toDate(b).getTime()
}

/** "Jun 1" — the label format used on the cliff chart and detail card. */
export function shortLabel(iso: string): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  const date = toDate(iso)
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`
}

/** "June 1" — the long form for the cliff headline. */
export function longLabel(iso: string): string {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]
  const date = toDate(iso)
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}`
}

/** "Wednesday May 27" — Screen A header. */
export function weekdayLabel(iso: string): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  return `${days[toDate(iso).getUTCDay()]} ${shortLabel(iso)}`
}
