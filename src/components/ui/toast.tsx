"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { cn } from "@/lib/utils"

export type ToastTone = "shame" | "pride" | "neutral"

export type ToastMessage = {
  id: string
  title: string
  body: string
  tone: ToastTone
}

type ToastContextValue = {
  pushToast: (toast: Omit<ToastMessage, "id">) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const toneStyles: Record<ToastTone, string> = {
  shame: "border-rose-500/40 bg-rose-500 text-white",
  pride: "border-emerald-500/40 bg-emerald-600 text-white",
  neutral: "border-border bg-foreground text-background",
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const pushToast = useCallback((toast: Omit<ToastMessage, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo(() => ({ pushToast }), [pushToast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-3 px-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const ToastItem = ({
  toast,
  onDismiss,
}: {
  toast: ToastMessage
  onDismiss: () => void
}) => {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 5200)
    return () => window.clearTimeout(timer)
  }, [onDismiss])

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto w-full max-w-md animate-[slideUp_0.35s_ease-out] rounded-2xl border px-4 py-3 shadow-lg",
        toneStyles[toast.tone]
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{toast.title}</p>
          <p className="mt-1 text-sm opacity-95">{toast.body}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-xs font-medium opacity-80 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          aria-label="Dismiss notification"
        >
          Close
        </button>
      </div>
    </div>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

export const SOCIAL_TOASTS = {
  overAllowance: {
    title: "Friends notified",
    body: "Your friends have been notified about your poor financial choices buddy!",
    tone: "shame" as const,
  },
  gigAccepted: {
    title: "Friends notified",
    body: "Your friends have been notified about your gig work!",
    tone: "pride" as const,
  },
}
