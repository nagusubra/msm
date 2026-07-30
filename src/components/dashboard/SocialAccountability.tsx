"use client"

import { useEffect, useRef } from "react"
import { SOCIAL_TOASTS, useToast } from "@/components/ui/toast"

type SocialAccountabilityProps = {
  isOverAllowance: boolean
  workerId: string
  date: string
}

export const SocialAccountability = ({
  isOverAllowance,
  workerId,
  date,
}: SocialAccountabilityProps) => {
  const { pushToast } = useToast()
  const lastKey = useRef<string | null>(null)

  useEffect(() => {
    if (!isOverAllowance) return

    const key = `over|${workerId}|${date}`
    if (lastKey.current === key) return
    lastKey.current = key

    const timer = window.setTimeout(() => {
      pushToast(SOCIAL_TOASTS.overAllowance)
    }, 450)

    return () => window.clearTimeout(timer)
  }, [isOverAllowance, workerId, date, pushToast])

  return null
}
