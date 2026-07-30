import { cn } from "@/lib/utils"

export interface PhoneFrameProps {
  children: React.ReactNode
  /** Frozen clock time shown in the status bar, e.g. "6:40 PM". Never system clock. */
  statusTime: string
  className?: string
}

/**
 * A real device shell: desk backdrop, phone body, status bar (frozen clock),
 * scrollable app surface, home indicator. Edge-to-edge on actual phones.
 */
export function PhoneFrame({ children, statusTime, className }: PhoneFrameProps): React.ReactElement {
  return (
    <div className="flex min-h-dvh items-stretch justify-center bg-slate sm:items-center sm:px-6 sm:py-8">
      <div
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-slate",
          "sm:h-[var(--frame-height)] sm:max-h-[calc(100dvh-4rem)] sm:rounded-[var(--radius-phone)]",
          "sm:border sm:border-edge sm:bg-raise sm:shadow-[0_40px_120px_rgba(0,0,0,0.55)]",
          className,
        )}
        style={{ maxWidth: "var(--frame-width)" }}
      >
        {/* Side bezel highlight */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-6 left-0 hidden w-px bg-gradient-to-b from-transparent via-edge to-transparent sm:block"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-6 right-0 hidden w-px bg-gradient-to-b from-transparent via-edge to-transparent sm:block"
        />

        {/* Status bar — time is seed data, not Date.now() */}
        <header
          className="relative z-20 flex shrink-0 items-center justify-between px-6 pt-3 pb-1"
          style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
        >
          <span className="money text-[length:var(--type-small)] font-medium text-bone">{statusTime}</span>

          {/* Dynamic Island / notch */}
          <div
            aria-hidden="true"
            className="absolute top-2.5 left-1/2 hidden h-7 w-[7.25rem] -translate-x-1/2 rounded-full bg-slate sm:block"
          />

          <div aria-hidden="true" className="flex items-center gap-1.5 text-bone">
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor" className="opacity-90">
              <rect x="0" y="8" width="2.5" height="4" rx="0.5" />
              <rect x="3.5" y="5.5" width="2.5" height="6.5" rx="0.5" />
              <rect x="7" y="3" width="2.5" height="9" rx="0.5" />
              <rect x="10.5" y="0.5" width="2.5" height="11.5" rx="0.5" opacity="0.35" />
            </svg>
            <svg width="15" height="12" viewBox="0 0 15 12" fill="currentColor" className="opacity-90">
              <path d="M7.5 2.2c2.1 0 4 1 5.3 2.5l-1.1 1.1A5.6 5.6 0 0 0 7.5 4.1 5.6 5.6 0 0 0 3.3 5.8L2.2 4.7A7.4 7.4 0 0 1 7.5 2.2Zm0 3.2c1.2 0 2.3.5 3.1 1.4L9.5 8A2.9 2.9 0 0 0 7.5 7.2 2.9 2.9 0 0 0 5.5 8L4.4 6.8A4.5 4.5 0 0 1 7.5 5.4Zm0 3.3c.5 0 .9.2 1.2.5L7.5 10.5 6.3 9.2c.3-.3.7-.5 1.2-.5Z" />
            </svg>
            <svg width="24" height="12" viewBox="0 0 24 12" className="opacity-90">
              <rect x="0.5" y="1" width="20" height="10" rx="2.5" stroke="currentColor" fill="none" strokeWidth="1" />
              <rect x="2" y="2.5" width="14" height="7" rx="1.5" fill="currentColor" />
              <rect x="21.5" y="3.5" width="1.5" height="5" rx="0.5" fill="currentColor" opacity="0.5" />
            </svg>
          </div>
        </header>

        {/* Scrollable app surface */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">{children}</div>

        {/* Home indicator */}
        <div
          aria-hidden="true"
          className="flex shrink-0 justify-center pb-2 pt-1 sm:pb-3"
          style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        >
          <div className="h-1 w-28 rounded-full bg-bone/25" />
        </div>
      </div>
    </div>
  )
}
