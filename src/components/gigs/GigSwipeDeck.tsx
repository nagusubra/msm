"use client"

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import Link from "next/link"
import { GigCard } from "@/components/gigs/GigCard"
import { Button } from "@/components/ui/button"
import { SOCIAL_TOASTS, useToast } from "@/components/ui/toast"
import type { CalgaryGig } from "@/data/calgaryGigs"
import { formatCurrency } from "@/lib/dates"
import {
  addAcceptedGig,
  getAcceptedGigIds,
  getGigIncomeFor,
} from "@/lib/gigStorage"

type GigSwipeDeckProps = {
  gigs: CalgaryGig[]
  workerId: string
  date: string
}

const SWIPE_THRESHOLD = 120
const STORAGE_KEY = "chaching-accepted-gigs"

const subscribeToGigStorage = (onStoreChange: () => void) => {
  const handleChange = () => onStoreChange()
  window.addEventListener("storage", handleChange)
  window.addEventListener("chaching-gigs-updated", handleChange)
  return () => {
    window.removeEventListener("storage", handleChange)
    window.removeEventListener("chaching-gigs-updated", handleChange)
  }
}

const getGigStorageSnapshot = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? ""
  } catch {
    return ""
  }
}

const getServerGigStorageSnapshot = () => ""

export const GigSwipeDeck = ({ gigs, workerId, date }: GigSwipeDeckProps) => {
  const { pushToast } = useToast()
  const storageSnapshot = useSyncExternalStore(
    subscribeToGigStorage,
    getGigStorageSnapshot,
    getServerGigStorageSnapshot
  )

  const deckKey = `${workerId}|${date}`
  const [activeDeckKey, setActiveDeckKey] = useState(deckKey)
  const [deckOrder, setDeckOrder] = useState(() => gigs.map((gig) => gig.id))
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const pointerStartX = useRef<number | null>(null)

  if (activeDeckKey !== deckKey) {
    setActiveDeckKey(deckKey)
    setDeckOrder(gigs.map((gig) => gig.id))
    setDragOffset(0)
  }

  const acceptedIds = useMemo(() => {
    void storageSnapshot
    return new Set(getAcceptedGigIds(workerId, date))
  }, [storageSnapshot, workerId, date])

  const acceptedIncome = useMemo(() => {
    void storageSnapshot
    return getGigIncomeFor(workerId, date)
  }, [storageSnapshot, workerId, date])

  const acceptedCount = acceptedIds.size

  const queue = useMemo(() => {
    const byId = new Map(gigs.map((gig) => [gig.id, gig]))
    return deckOrder
      .map((id) => byId.get(id))
      .filter((gig): gig is CalgaryGig => {
        if (!gig) return false
        return !acceptedIds.has(gig.id)
      })
  }, [deckOrder, gigs, acceptedIds])

  const currentGig = queue[0]
  const nextGig = queue[1]

  const notifyUpdate = () => {
    window.dispatchEvent(new Event("chaching-gigs-updated"))
  }

  const handleAccept = useCallback(
    (gig: CalgaryGig) => {
      addAcceptedGig(workerId, date, {
        id: gig.id,
        title: gig.title,
        payoutCad: gig.payoutCad,
      })
      setDragOffset(0)
      notifyUpdate()
      pushToast(SOCIAL_TOASTS.gigAccepted)
    },
    [workerId, date, pushToast]
  )

  const handleSkip = useCallback((gig: CalgaryGig) => {
    setDeckOrder((prev) => {
      const without = prev.filter((id) => id !== gig.id)
      return [...without, gig.id]
    })
    setDragOffset(0)
  }, [])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!currentGig) return
    pointerStartX.current = event.clientX
    setIsDragging(true)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || pointerStartX.current === null) return
    setDragOffset(event.clientX - pointerStartX.current)
  }

  const handlePointerUp = () => {
    if (!currentGig) {
      setIsDragging(false)
      pointerStartX.current = null
      return
    }

    if (dragOffset > SWIPE_THRESHOLD) {
      handleAccept(currentGig)
    } else if (dragOffset < -SWIPE_THRESHOLD) {
      handleSkip(currentGig)
    } else {
      setDragOffset(0)
    }

    setIsDragging(false)
    pointerStartX.current = null
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!currentGig) return
    if (event.key === "ArrowRight" || event.key === "Enter") {
      event.preventDefault()
      handleAccept(currentGig)
    }
    if (event.key === "ArrowLeft" || event.key === "Backspace") {
      event.preventDefault()
      handleSkip(currentGig)
    }
  }

  const rotation = dragOffset / 20
  const dashboardHref = `/?worker=${encodeURIComponent(workerId)}&date=${encodeURIComponent(date)}`

  if (!currentGig) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-muted/30 p-8 text-center">
        <p className="text-lg font-semibold text-foreground">
          You&apos;ve reviewed all Calgary gigs
        </p>
        <p className="text-sm text-muted-foreground">
          Accepted {acceptedCount} gig{acceptedCount === 1 ? "" : "s"} for{" "}
          {formatCurrency(acceptedIncome)} today.
        </p>
        <Button href={dashboardHref}>Back to dashboard</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-emerald-500/10 px-4 py-3">
        <p className="text-sm text-foreground">
          Earned from gigs today:{" "}
          <span className="font-semibold">{formatCurrency(acceptedIncome)}</span>
          {acceptedCount > 0 ? (
            <span className="text-muted-foreground">
              {" "}
              · {acceptedCount} accepted
            </span>
          ) : null}
        </p>
        <Link
          href={dashboardHref}
          className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          View dashboard
        </Link>
      </div>

      <div
        className="relative mx-auto h-[480px] w-full max-w-md touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Gig swipe deck. Swipe right or press Enter to accept, swipe left or press Backspace to skip."
        tabIndex={0}
      >
        {nextGig ? (
          <div className="absolute inset-0 scale-95 opacity-60">
            <GigCard gig={nextGig} />
          </div>
        ) : null}
        <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
          <GigCard
            gig={currentGig}
            dragOffset={dragOffset}
            rotation={rotation}
          />
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-md items-center justify-center gap-4">
        <Button
          variant="secondary"
          onClick={() => handleSkip(currentGig)}
          aria-label="Skip this gig"
          className="min-w-28"
        >
          Skip
        </Button>
        <Button
          onClick={() => handleAccept(currentGig)}
          aria-label="Accept this gig"
          className="min-w-28"
        >
          Accept
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Swipe right to accept · swipe left to skip · {queue.length} remaining
      </p>
    </div>
  )
}
