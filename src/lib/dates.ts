export const DATA_MIN_DATE = "2026-04-01"
export const DATA_MAX_DATE = "2026-06-30"

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const parseDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export const formatDate = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export const getWeekStart = (dateStr: string): string => {
  const date = parseDate(dateStr)
  const dayOfWeek = date.getUTCDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  date.setUTCDate(date.getUTCDate() - daysFromMonday)
  return formatDate(date)
}

export const getWeekEnd = (weekStartStr: string): string => {
  const date = parseDate(weekStartStr)
  date.setUTCDate(date.getUTCDate() + 6)
  return formatDate(date)
}

export const daysBetweenInclusive = (startStr: string, endStr: string): number => {
  const start = parseDate(startStr)
  const end = parseDate(endStr)
  return Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1
}

export const isDateInRange = (dateStr: string, min: string, max: string): boolean => {
  return dateStr >= min && dateStr <= max
}

export const clampDate = (dateStr: string, min = DATA_MIN_DATE, max = DATA_MAX_DATE): string => {
  if (dateStr < min) return min
  if (dateStr > max) return max
  return dateStr
}

export const formatDisplayDate = (dateStr: string): string => {
  const date = parseDate(dateStr)
  return date.toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })
}

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}
