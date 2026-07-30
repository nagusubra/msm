"use client"

import { usePathname, useRouter } from "next/navigation"
import { DATA_MAX_DATE, DATA_MIN_DATE } from "@/lib/dates"

type DateSelectorProps = {
  date: string
  workerId: string
}

export const DateSelector = ({ date, workerId }: DateSelectorProps) => {
  const router = useRouter()
  const pathname = usePathname()

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextDate = event.target.value
    if (!nextDate) return
    const params = new URLSearchParams()
    params.set("worker", workerId)
    params.set("date", nextDate)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <label className="flex max-w-xs flex-col gap-2 text-sm">
      <span className="font-medium text-foreground">Simulate date</span>
      <input
        type="date"
        value={date}
        min={DATA_MIN_DATE}
        max={DATA_MAX_DATE}
        onChange={handleDateChange}
        aria-label="Select simulation date"
        className="h-11 rounded-lg border border-border bg-background px-3 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
      />
    </label>
  )
}
