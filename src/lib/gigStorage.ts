export type AcceptedGigRecord = {
  gigId: string
  title: string
  payoutCad: number
  acceptedAt: string
}

type GigStorageBucket = {
  accepted: AcceptedGigRecord[]
}

type GigStorageShape = Record<string, GigStorageBucket>

const STORAGE_KEY = "chaching-accepted-gigs"

const makeKey = (workerId: string, date: string): string => `${workerId}|${date}`

const readStorage = (): GigStorageShape => {
  if (typeof window === "undefined") {
    return {}
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as GigStorageShape
  } catch {
    return {}
  }
}

const writeStorage = (data: GigStorageShape): void => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export const getAcceptedGigs = (
  workerId: string,
  date: string
): AcceptedGigRecord[] => {
  const data = readStorage()
  return data[makeKey(workerId, date)]?.accepted ?? []
}

export const getAcceptedGigIds = (workerId: string, date: string): string[] => {
  return getAcceptedGigs(workerId, date).map((gig) => gig.gigId)
}

export const getGigIncomeFor = (workerId: string, date: string): number => {
  return getAcceptedGigs(workerId, date).reduce(
    (sum, gig) => sum + gig.payoutCad,
    0
  )
}

export const addAcceptedGig = (
  workerId: string,
  date: string,
  gig: { id: string; title: string; payoutCad: number }
): AcceptedGigRecord[] => {
  const data = readStorage()
  const key = makeKey(workerId, date)
  const existing = data[key]?.accepted ?? []

  if (existing.some((item) => item.gigId === gig.id)) {
    return existing
  }

  const next = [
    ...existing,
    {
      gigId: gig.id,
      title: gig.title,
      payoutCad: gig.payoutCad,
      acceptedAt: new Date().toISOString(),
    },
  ]

  data[key] = { accepted: next }
  writeStorage(data)
  return next
}
