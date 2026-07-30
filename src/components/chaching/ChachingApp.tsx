"use client"

import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import {
  type AccountabilityFriend,
  type ChartDay,
  CHART_H,
  GAP_AMOUNT,
  MONTH_WEEKS,
  SLATE_GIGS,
  VAULT_APY,
  WEEK_DAYS,
  ZAYZOON_FEE,
} from "@/data/chachingDemo"
import { cn } from "@/lib/utils"

type Path = "gig" | "zay" | null
type Range = "week" | "month"
type Overlay = "friend" | "sms-advance" | "sms-save" | null

const receiveToday = GAP_AMOUNT - ZAYZOON_FEE

const formatAxis = (max: number) => {
  const top = max
  const mid1 = Math.round(max * (2 / 3))
  const mid2 = Math.round(max / 3)
  const fmt = (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
    return `$${n}`
  }
  return [fmt(top), fmt(mid1), fmt(mid2), "$0"]
}

const barH = (amt: number, max: number) => {
  if (amt <= 0) return 2
  const h = Math.round((amt / max) * CHART_H)
  return Math.max(4, Math.min(CHART_H, h))
}

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export const ChachingApp = () => {
  const [range, setRange] = useState<Range>("week")
  const [activeId, setActiveId] = useState("fri")
  const [path, setPath] = useState<Path>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [friend, setFriend] = useState<AccountabilityFriend | null>(null)
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [toastZay, setToastZay] = useState<string | null>(null)
  const [toastGig, setToastGig] = useState<string | null>(null)
  const [friendName, setFriendName] = useState("Jamie")
  const [friendPhone, setFriendPhone] = useState("(403) 555-0142")
  const [consent, setConsent] = useState(true)
  const [lastVault, setLastVault] = useState(0)

  const panelZayRef = useRef<HTMLElement>(null)
  const panelGigRef = useRef<HTMLElement>(null)
  const socialRef = useRef<HTMLElement>(null)
  const phoneInputRef = useRef<HTMLInputElement>(null)
  const consentInputRef = useRef<HTMLInputElement>(null)

  const chartSet = range === "week" ? WEEK_DAYS : MONTH_WEEKS
  const activeDay = chartSet.find((d) => d.id === activeId) ?? chartSet[0]

  const scaleMax = useMemo(() => {
    const peak = Math.max(...chartSet.flatMap((d) => [d.in, d.out]))
    return Math.ceil(peak / 100) * 100
  }, [chartSet])

  const axisLabels = formatAxis(scaleMax)

  const picks = SLATE_GIGS.filter((g) => selected.has(g.id))
  const gapPicks = picks.filter((g) => !g.vault)
  const vaultPicks = picks.filter((g) => g.vault)
  const gapTotal = gapPicks.reduce((sum, g) => sum + g.pay, 0)
  const vaultTotal = vaultPicks.reduce((sum, g) => sum + g.pay, 0)
  const left = Math.max(0, GAP_AMOUNT - gapTotal)
  const pct = Math.min(100, Math.round((gapTotal / GAP_AMOUNT) * 100))
  const gapClosed = gapTotal >= GAP_AMOUNT

  const gapGigs = SLATE_GIGS.filter((g) => !g.vault)
  const vaultGigs = SLATE_GIGS.filter((g) => g.vault)
  const gapWidths = gapGigs.map((g) =>
    selected.has(g.id) ? (g.pay / GAP_AMOUNT) * 100 : 0
  )
  const vaultWidth = vaultGigs.reduce(
    (sum, g) => sum + (selected.has(g.id) ? (g.pay / GAP_AMOUNT) * 100 : 0),
    0
  )

  const handleRange = (next: Range) => {
    setRange(next)
    if (next === "week") {
      setActiveId("fri")
    } else {
      setActiveId("w1")
    }
  }

  const handleOpenPath = (which: "gig" | "zay") => {
    setPath(which)
    setToastZay(null)
    setToastGig(null)
    const panel = which === "zay" ? panelZayRef.current : panelGigRef.current
    window.setTimeout(() => {
      panel?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 50)
  }

  const handleToggleGig = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setToastGig(null)
  }

  const handleZay = () => {
    if (!friend) {
      setToastZay(
        "Advance started · fee $4.99 — Add an accountability friend to notify them."
      )
      setOverlay("friend")
      return
    }
    setToastZay(
      `Advance started · ${friend.name} notified — $${receiveToday.toFixed(2)} on the way. Fee $${ZAYZOON_FEE}.`
    )
    setLastVault(0)
    setOverlay("sms-advance")
  }

  const handleClaimGig = () => {
    if (!gapClosed) return
    setLastVault(vaultTotal)
    if (vaultTotal > 0) {
      setToastGig(
        `Slate claimed · $${vaultTotal} to Vault — Gap closed at $0 fee. Extra pay → ${VAULT_APY} APY.`
      )
      if (!friend) {
        setOverlay("friend")
        return
      }
      setOverlay("sms-save")
      return
    }
    setToastGig(
      "Slate claimed · $0 fee — Gap closed. Add a Vault gig next time to grow savings."
    )
  }

  const handleSaveFriend = () => {
    const name = friendName.trim() || "Friend"
    const phone = friendPhone.trim()
    if (!phone) {
      phoneInputRef.current?.focus()
      return
    }
    if (!consent) {
      consentInputRef.current?.focus()
      return
    }
    setFriend({ name, phone })
    setOverlay(null)
    window.setTimeout(() => {
      socialRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 50)
  }

  const handleOpenFriend = () => {
    if (friend) {
      setFriendName(friend.name)
      setFriendPhone(friend.phone)
    }
    setOverlay("friend")
  }

  const smsAdvanceBody = `Hi ${friend?.name ?? "there"}. Alex shared Chaching updates with you. They got some of their pay early today to cover a shortfall before payday. No action needed. Reply STOP to opt out of Chaching texts. Msg & data rates may apply.`
  const smsAdvanceFollowUp =
    "Good news: Alex finished a gig today and earned extra cash. Nice work closing the gap!"
  const smsSaveBody = `Hi ${friend?.name ?? "there"} — good news from Alex on Chaching: they closed a $${GAP_AMOUNT} cash gap with gig work${
    lastVault > 0
      ? ` and added $${lastVault} to their high-interest Chaching Vault`
      : ""
  } instead of taking an advance. Reply STOP to opt out. Msg & data rates may apply.`

  let slateSum: { ready: boolean; html: ReactNode }
  if (gapTotal === 0) {
    slateSum = {
      ready: false,
      html: (
        <>
          Select gap gigs that add up to <strong>${GAP_AMOUNT}</strong>. Extra →
          Vault.
        </>
      ),
    }
  } else if (gapTotal < GAP_AMOUNT) {
    slateSum = {
      ready: false,
      html: (
        <>
          <strong>${gapTotal}</strong> of ${GAP_AMOUNT} · need{" "}
          <strong>${left}</strong> more
        </>
      ),
    }
  } else if (vaultTotal > 0) {
    slateSum = {
      ready: true,
      html: (
        <>
          Gap closed · <strong>${vaultTotal}</strong> deposits to Vault at{" "}
          {VAULT_APY} APY
        </>
      ),
    }
  } else {
    slateSum = {
      ready: true,
      html: (
        <>
          <strong>${GAP_AMOUNT}</strong> gap closed · add a Vault gig to grow
          savings
        </>
      ),
    }
  }

  return (
    <div className="phone relative h-[var(--phone-h)] max-h-[calc(100dvh-56px)] w-[var(--phone-w)] shrink-0 rounded-[54px] bg-[#161a20] p-[11px] shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_0_0_6px_#080a0d,0_40px_90px_rgba(0,0,0,0.65)] max-[440px]:h-[100dvh] max-[440px]:max-h-none max-[440px]:w-full max-[440px]:rounded-none max-[440px]:p-0 max-[440px]:shadow-none">
      <div className="phone-screen relative flex h-full w-full flex-col overflow-hidden rounded-[44px] bg-[linear-gradient(180deg,#f7f4ef_0%,#eef1f5_48%,#e8edf2_100%)] max-[440px]:rounded-none">
        <div
          className="pointer-events-none absolute top-[11px] left-1/2 z-50 h-[34px] w-[122px] -translate-x-1/2 rounded-[20px] bg-black"
          aria-hidden="true"
        />

        <div className="z-40 flex h-[var(--safe-top)] shrink-0 items-start justify-between px-[26px] pt-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold tracking-[-0.02em] text-ink">
          <span>9:41</span>
          <div className="flex items-center gap-[5px]">
            <svg width="16" height="11" viewBox="0 0 16 11" aria-hidden="true">
              <rect x="0" y="3" width="3" height="8" fill="#12161c" />
              <rect x="4" y="2" width="3" height="9" fill="#12161c" />
              <rect x="8" y="0" width="3" height="11" fill="#12161c" />
              <rect
                x="12"
                y="0"
                width="3"
                height="11"
                fill="#12161c"
                opacity="0.3"
              />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" aria-hidden="true">
              <rect
                x="0.5"
                y="0.5"
                width="20"
                height="11"
                rx="2"
                stroke="#12161c"
                fill="none"
                opacity="0.5"
              />
              <rect x="2" y="2" width="15" height="8" rx="1" fill="#12161c" />
              <path
                d="M22 3.5v5a1.5 1.5 0 0 0 0-5z"
                fill="#12161c"
                opacity="0.4"
              />
            </svg>
          </div>
        </div>

        <main className="cha-scrollbar-none content flex-1 overflow-x-hidden overflow-y-auto px-[18px] pt-1 pb-9">
          <div className="mb-1.5 flex items-baseline justify-between">
            <div className="font-[family-name:var(--font-display)] text-[28px] leading-none tracking-[-0.02em] text-ink">
              Cha<em className="italic text-late">ching</em>
            </div>
            <div className="font-[family-name:var(--font-mono)] text-[10px] font-semibold tracking-[0.04em] text-fog uppercase">
              {range === "week" ? "Apr 27 – May 3" : "May 2026"}
            </div>
          </div>

          {/* Gap hero */}
          <section
            aria-label="Cash gap"
            className="relative my-2 overflow-hidden rounded-[20px] bg-ink px-4 pt-[18px] pb-4 text-[#f7f4ef]"
          >
            <div
              className="pointer-events-none absolute -top-[20%] -right-[10%] h-40 w-40 bg-[radial-gradient(circle,rgba(232,93,4,0.45),transparent_70%)]"
              aria-hidden="true"
            />
            <div className="relative mb-1.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold tracking-[0.1em] text-[#ffb38a] uppercase">
              Timing · not totals
            </div>
            <h1 className="relative m-0 font-[family-name:var(--font-display)] text-[34px] leading-[1.05] font-normal tracking-[-0.02em]">
              You have a{" "}
              <em className="animate-gap-blink italic text-[#ffb38a]">
                ${GAP_AMOUNT} gap
              </em>
            </h1>
            <p className="relative mt-2 mb-3.5 max-w-[34ch] text-[13px] leading-[1.4] text-[rgba(247,244,239,0.68)]">
              Timing tax — not broke this month. Rent hits Friday; pay lands
              Saturday. Close it with a gig (you earn; Zayzoon gets a placement
              commission) or an advance.
            </p>
            <div className="relative grid grid-cols-2 gap-2">
              <button
                type="button"
                aria-pressed={path === "gig"}
                aria-label="Close gap with gig stack"
                onClick={() => handleOpenPath("gig")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleOpenPath("gig")
                }}
                tabIndex={0}
                className={cn(
                  "cursor-pointer rounded-[14px] border-0 bg-[var(--ok)] px-2.5 py-3 text-left text-white transition-[transform,filter] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none",
                  path === "gig" && "shadow-[0_0_0_2px_#f7f4ef]"
                )}
              >
                <span className="mb-1 block font-[family-name:var(--font-mono)] text-[9px] font-semibold tracking-[0.08em] uppercase opacity-75">
                  $0 fee
                </span>
                <span className="mb-0.5 block text-[15px] font-bold">Gig</span>
                <span className="block font-[family-name:var(--font-mono)] text-[11px] font-semibold">
                  Stack shifts → ${GAP_AMOUNT}
                </span>
              </button>
              <button
                type="button"
                aria-pressed={path === "zay"}
                aria-label="Close gap with Zayzoon advance"
                onClick={() => handleOpenPath("zay")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") handleOpenPath("zay")
                }}
                tabIndex={0}
                className={cn(
                  "cursor-pointer rounded-[14px] border border-white/18 bg-white/10 px-2.5 py-3 text-left text-[#f7f4ef] transition-[transform,filter] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none",
                  path === "zay" && "shadow-[0_0_0_2px_#f7f4ef]"
                )}
              >
                <span className="mb-1 block font-[family-name:var(--font-mono)] text-[9px] font-semibold tracking-[0.08em] uppercase opacity-75">
                  Zayzoon
                </span>
                <span className="mb-0.5 block text-[15px] font-bold">
                  Advance
                </span>
                <span className="block font-[family-name:var(--font-mono)] text-[11px] font-semibold">
                  ${GAP_AMOUNT} now · fee ${ZAYZOON_FEE}
                </span>
              </button>
            </div>
          </section>

          {/* Week chart */}
          <section
            aria-label="Cash in vs out chart"
            className="mb-3 rounded-[18px] border border-[var(--line)] bg-panel px-3 pt-3.5 pb-3"
          >
            <div className="flex items-center justify-between gap-2 px-1 pb-2.5">
              <h2 className="m-0 text-[13px] font-semibold">
                {range === "week" ? "This week · in vs out" : "May · by week"}
              </h2>
              <div
                className="flex gap-0.5 rounded-lg bg-[var(--panel-mute)] p-0.5"
                role="group"
                aria-label="Chart range"
              >
                <button
                  type="button"
                  aria-pressed={range === "week"}
                  onClick={() => handleRange("week")}
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer rounded-md border-0 bg-transparent px-2.5 py-[5px] text-[11px] font-semibold text-fog",
                    range === "week" &&
                      "bg-panel text-ink shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
                  )}
                >
                  Week
                </button>
                <button
                  type="button"
                  aria-pressed={range === "month"}
                  onClick={() => handleRange("month")}
                  tabIndex={0}
                  className={cn(
                    "cursor-pointer rounded-md border-0 bg-transparent px-2.5 py-[5px] text-[11px] font-semibold text-fog",
                    range === "month" &&
                      "bg-panel text-ink shadow-[0_1px_3px_rgba(18,22,28,0.08)]"
                  )}
                >
                  Month
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 px-1 pb-2.5">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-fog">
                <i className="inline-block h-2 w-2 rounded-sm bg-[var(--in)]" />{" "}
                Income
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-fog">
                <i className="inline-block h-2 w-2 rounded-sm bg-[var(--out)]" />{" "}
                Expenses
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-fog">
                <i className="inline-block h-2 w-2 rounded-sm bg-[var(--late)]" />{" "}
                Gap
              </div>
            </div>

            <div className="grid grid-cols-[36px_1fr] items-stretch gap-1">
              <div
                className="flex h-[110px] flex-col justify-between text-right font-[family-name:var(--font-mono)] text-[8px] font-semibold leading-none text-fog-dim"
                aria-hidden="true"
              >
                {axisLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
              <div className="relative min-h-[148px]">
                <div
                  className="pointer-events-none absolute top-0 right-0 left-0 flex h-[110px] flex-col justify-between"
                  aria-hidden="true"
                >
                  <i className="block h-px bg-[var(--line)]" />
                  <i className="block h-px bg-[var(--line)]" />
                  <i className="block h-px bg-[var(--line)]" />
                  <i className="block h-px bg-[var(--line)]" />
                </div>
                <div
                  className={cn(
                    "relative z-1 grid items-end gap-1",
                    range === "month" ? "grid-cols-5" : "grid-cols-7"
                  )}
                  role="list"
                >
                  {chartSet.map((day) => (
                    <DayColumn
                      key={day.id}
                      day={day}
                      max={scaleMax}
                      isMonth={range === "month"}
                      isOn={day.id === activeId}
                      onSelect={() => setActiveId(day.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-2.5 mx-1 rounded-xl border border-[rgba(232,93,4,0.25)] bg-[linear-gradient(135deg,#fff7f0,#fff)] px-3 py-2.5 text-[12px] leading-[1.4] text-fog">
              {range === "week" ? (
                <>
                  <strong className="font-semibold text-late">Fri May 1:</strong>{" "}
                  Rent + phone (−$2,122). Cash on hand isn&apos;t enough.{" "}
                  <strong className="font-semibold text-late">Sat May 2:</strong>{" "}
                  +$672 lands — one day late.
                </>
              ) : (
                <>
                  <strong className="font-semibold text-late">
                    Month totals work
                  </strong>{" "}
                  (+$876 left). Week 1 is the squeeze — rent lands before pay.
                  Other weeks run ahead.
                </>
              )}
            </p>

            {activeDay && <DayDetail day={activeDay} />}
          </section>

          {/* Zayzoon panel */}
          {path === "zay" && (
            <section
              ref={panelZayRef}
              aria-label="Zayzoon advance"
              className="animate-rise mb-3"
            >
              <div className="mb-2 rounded-2xl border border-[var(--line)] bg-panel p-3.5">
                <h3 className="m-0 mb-1 text-[15px] font-semibold">
                  Zayzoon · early wage access
                </h3>
                <p className="mb-3 text-[12px] leading-[1.4] text-fog">
                  Pull ${GAP_AMOUNT} of wages you&apos;ve already worked —
                  available instantly. Repaid from Saturday&apos;s deposit.
                  Prefer to earn it instead? Take the gig path — you get paid,
                  Zayzoon earns a placement commission. Beyond budgeting for both
                  sides.
                </p>
                <ZayRow
                  label="Amount available"
                  value={`$${GAP_AMOUNT.toFixed(2)}`}
                  tone="ok"
                />
                <ZayRow
                  label="Transfer fee"
                  value={`−$${ZAYZOON_FEE.toFixed(2)}`}
                  tone="fee"
                />
                <ZayRow
                  label="You receive today"
                  value={`$${receiveToday.toFixed(2)}`}
                />
                <ZayRow label="Repaid" value="Sat May 2 deposit" />
                <ZayRow
                  label="Friend notified"
                  value={friend ? `${friend.name} via SMS` : "Add a friend first"}
                  tone={friend ? "ok" : undefined}
                />
                <button
                  type="button"
                  onClick={handleZay}
                  tabIndex={0}
                  aria-label={`Pull $${GAP_AMOUNT} with Zayzoon`}
                  className="mt-3 block w-full cursor-pointer rounded-xl border-0 bg-[var(--zay)] px-4 py-3 text-center text-sm font-semibold text-white transition-[filter,transform] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none"
                >
                  Pull ${GAP_AMOUNT} with Zayzoon
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenPath("gig")}
                  tabIndex={0}
                  aria-label="Compare gig path instead"
                  className="mt-2 block w-full cursor-pointer rounded-xl border-0 bg-[var(--panel-mute)] px-4 py-3 text-center text-sm font-semibold text-ink transition-[filter,transform] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none"
                >
                  Compare gig path instead
                </button>
              </div>
              {toastZay && (
                <div className="animate-rise mt-2 rounded-[14px] border border-[rgba(29,78,216,0.25)] bg-[var(--zay-soft)] px-3.5 py-3 text-[13px] leading-[1.4] text-[var(--zay)]">
                  <strong className="mb-0.5 block text-ink">
                    {toastZay.split(" — ")[0]}
                  </strong>
                  {toastZay.split(" — ")[1]}
                </div>
              )}
            </section>
          )}

          {/* Gig slate */}
          {path === "gig" && (
            <section
              ref={panelGigRef}
              aria-label="Gig slate"
              className="animate-rise mb-3"
            >
              <div className="mb-2 flex items-baseline justify-between px-0.5">
                <h3 className="m-0 text-[13px] font-semibold">
                  Gig slate · close gap, then save
                </h3>
                <span className="font-[family-name:var(--font-mono)] text-[10px] font-semibold tracking-[0.04em] text-fog-dim">
                  STACK TO ${GAP_AMOUNT}+
                </span>
              </div>

              <div className="mb-2 flex items-start gap-2.5 rounded-[14px] border border-[rgba(14,165,233,0.28)] bg-[linear-gradient(135deg,#f0f9ff,#fff)] p-3">
                <div
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-[rgba(14,165,233,0.15)] text-[#0284c7]"
                  aria-hidden="true"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
                  >
                    <rect x="4" y="8" width="16" height="12" rx="2" />
                    <path d="M8 8V6a4 4 0 0 1 8 0v2M12 13v2" />
                  </svg>
                </div>
                <div>
                  <strong className="mb-0.5 block text-[13px] text-ink">
                    You earn · Zayzoon commissions
                  </strong>
                  <p className="m-0 text-[12px] leading-[1.4] text-fog">
                    Gap gigs pay you to cover Friday. Zayzoon earns a placement
                    commission on jobs filled here — extra revenue for both sides.
                    Anything beyond deposits into your Chaching Vault at{" "}
                    <span className="font-[family-name:var(--font-mono)] font-semibold text-[#0284c7]">
                      {VAULT_APY} APY
                    </span>
                    .
                  </p>
                </div>
              </div>

              <div
                className="mb-2 rounded-[14px] border border-[var(--line)] bg-panel px-3.5 py-3"
                aria-live="polite"
              >
                <div className="mb-2 flex items-baseline justify-between">
                  <span className="text-[12px] text-fog">
                    Gap{" "}
                    <strong className="font-[family-name:var(--font-mono)] text-ink">
                      ${GAP_AMOUNT}
                    </strong>{" "}
                    · Vault{" "}
                    <strong className="font-[family-name:var(--font-mono)] text-ink">
                      ${vaultTotal}
                    </strong>
                  </span>
                  <span
                    className={cn(
                      "font-[family-name:var(--font-mono)] text-sm font-semibold text-late",
                      gapClosed && "text-[var(--ok)]"
                    )}
                  >
                    ${gapTotal} gap
                    {vaultTotal ? ` · $${vaultTotal} vault` : ""}
                  </span>
                </div>
                <div
                  className="flex h-2 overflow-hidden rounded bg-[var(--panel-mute)]"
                  aria-hidden="true"
                >
                  <i
                    className="h-full bg-[#0d9f6e] transition-[width] duration-[350ms]"
                    style={{ width: `${gapWidths[0]}%` }}
                  />
                  <i
                    className="h-full bg-[#2a9d8f] transition-[width] duration-[350ms]"
                    style={{ width: `${gapWidths[1]}%` }}
                  />
                  <i
                    className="h-full bg-[#4ade80] transition-[width] duration-[350ms]"
                    style={{ width: `${gapWidths[2]}%` }}
                  />
                  <i
                    className="h-full bg-[#0ea5e9] transition-[width] duration-[350ms]"
                    style={{ width: `${Math.min(40, vaultWidth)}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between font-[family-name:var(--font-mono)] text-[9px] font-semibold tracking-[0.04em] text-fog-dim">
                  <span>{pct}%</span>
                  <span>
                    {left === 0
                      ? vaultTotal
                        ? `GAP CLOSED · +$${vaultTotal} VAULT`
                        : "GAP CLOSED"
                      : `$${left} LEFT`}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5" role="list">
                {SLATE_GIGS.map((gig) => {
                  const on = selected.has(gig.id)
                  return (
                    <button
                      key={gig.id}
                      type="button"
                      aria-pressed={on}
                      aria-label={`${gig.title}, $${gig.pay}${gig.vault ? ", to Vault" : ""}`}
                      tabIndex={0}
                      onClick={() => handleToggleGig(gig.id)}
                      className={cn(
                        "grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-[14px] border border-[var(--line)] bg-panel px-3 py-[11px] text-left text-ink transition-[border-color,background] duration-150 hover:border-[rgba(13,159,110,0.4)] focus-visible:outline-none",
                        on &&
                          !gig.vault &&
                          "border-[var(--ok)] bg-[linear-gradient(180deg,#f0faf6,#fff)]",
                        on &&
                          gig.vault &&
                          "border-[#0ea5e9] bg-[linear-gradient(180deg,#f0f9ff,#fff)]"
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px] border-[1.5px] border-[var(--line-strong)]",
                          on &&
                            !gig.vault &&
                            "border-[var(--ok)] bg-[var(--ok)] text-white",
                          on &&
                            gig.vault &&
                            "border-[#0ea5e9] bg-[#0ea5e9] text-white"
                        )}
                        aria-hidden="true"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className={cn(
                            "h-3 w-3 fill-none stroke-current stroke-[2.5] opacity-0 [stroke-linecap:round] [stroke-linejoin:round]",
                            on && "opacity-100"
                          )}
                        >
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </span>
                      <span>
                        <span className="mb-0.5 block text-[13px] font-semibold">
                          {gig.title}
                        </span>
                        <span className="block text-[11px] leading-[1.3] text-fog">
                          {gig.meta}
                        </span>
                        {gig.vault && (
                          <span className="mt-[3px] inline-block rounded bg-[rgba(14,165,233,0.12)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] font-semibold tracking-[0.04em] text-[#0284c7]">
                            VAULT · {VAULT_APY} APY
                          </span>
                        )}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          gig.vault && "text-[#0284c7]"
                        )}
                      >
                        +${gig.pay}
                      </span>
                    </button>
                  )
                })}
              </div>

              <p
                className={cn(
                  "mt-1 rounded-xl bg-[var(--panel-mute)] px-3 py-2.5 text-center text-[12px] text-fog",
                  slateSum.ready &&
                    "bg-[var(--ok-soft)] text-[var(--ok)] [&_strong]:text-[var(--ok)]"
                )}
              >
                {slateSum.html}
              </p>

              <button
                type="button"
                disabled={!gapClosed}
                onClick={handleClaimGig}
                tabIndex={0}
                aria-label="Claim gig slate"
                className="mt-3 block w-full cursor-pointer rounded-xl border-0 bg-[var(--ok)] px-4 py-3 text-center text-sm font-semibold text-white transition-[filter,transform] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0"
              >
                {vaultTotal > 0
                  ? `Claim slate · gap + $${vaultTotal} to Vault`
                  : `Claim slate · closes $${GAP_AMOUNT} gap`}
              </button>
              <button
                type="button"
                onClick={() => handleOpenPath("zay")}
                tabIndex={0}
                aria-label="Compare Zayzoon instead"
                className="mt-2 block w-full cursor-pointer rounded-xl border-0 bg-[var(--panel-mute)] px-4 py-3 text-center text-sm font-semibold text-ink transition-[filter,transform] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none"
              >
                Compare Zayzoon instead
              </button>

              {toastGig && (
                <div className="animate-rise mt-2 rounded-[14px] border border-[rgba(13,159,110,0.3)] bg-[var(--ok-soft)] px-3.5 py-3 text-[13px] leading-[1.4] text-[var(--ok)]">
                  <strong className="mb-0.5 block text-ink">
                    {toastGig.split(" — ")[0]}
                  </strong>
                  {toastGig.split(" — ")[1]}
                </div>
              )}
            </section>
          )}

          {/* Social accountability */}
          <section
            ref={socialRef}
            aria-label="Social accountability"
            className="mb-3 rounded-2xl border border-[var(--line)] bg-panel p-3.5"
          >
            <h3 className="m-0 mb-1 text-[15px] font-semibold">
              Social accountability
            </h3>
            <p className="mb-3 text-[12px] leading-[1.4] text-fog">
              Add a friend by phone. They get a text when you take an advance —
              or when you close the gap and grow your Vault.
            </p>

            {friend ? (
              <>
                <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-[var(--panel-mute)] px-3 py-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,#1a7a6d,#0d9f6e)] text-xs font-bold text-white">
                    {initials(friend.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold">
                      {friend.name}
                    </span>
                    <span className="block font-[family-name:var(--font-mono)] text-[11px] text-fog">
                      {friend.phone}
                    </span>
                    <span className="mt-0.5 block text-[11px] text-[var(--ok)]">
                      Accountability partner · SMS on
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenFriend}
                    tabIndex={0}
                    aria-label="Edit accountability friend"
                    className="m-0 cursor-pointer rounded-xl border-0 bg-[var(--panel-mute)] px-2.5 py-2 text-xs font-semibold text-ink focus-visible:outline-none"
                  >
                    Edit
                  </button>
                </div>
                <SocialRules />
              </>
            ) : (
              <div className="flex flex-col gap-2.5">
                <SocialRules />
                <button
                  type="button"
                  onClick={handleOpenFriend}
                  tabIndex={0}
                  aria-label="Add a friend by phone"
                  className="block w-full cursor-pointer rounded-xl border-0 bg-[var(--ok)] px-4 py-3 text-center text-sm font-semibold text-white transition-[filter,transform] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none"
                >
                  Add a friend by phone
                </button>
              </div>
            )}
          </section>
        </main>

        {/* Add friend overlay */}
        <Overlay
          open={overlay === "friend"}
          title="Add friend"
          onClose={() => setOverlay(null)}
        >
          <p className="mb-2 font-[family-name:var(--font-display)] text-[28px] leading-[1.1] font-normal tracking-[-0.02em]">
            Who&apos;s got your back?
          </p>
          <p className="mb-[18px] text-[13px] leading-[1.45] text-fog">
            They&apos;ll only get Chaching texts you&apos;ve opted into — when
            you take an advance, or when you close a gap and add to savings. They
            can reply STOP anytime.
          </p>
          <div className="mb-3.5">
            <label
              htmlFor="inputName"
              className="mb-1.5 block font-[family-name:var(--font-mono)] text-[10px] font-semibold tracking-[0.06em] text-fog-dim uppercase"
            >
              Their first name
            </label>
            <input
              id="inputName"
              type="text"
              autoComplete="given-name"
              placeholder="Jamie"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              className="w-full rounded-xl border border-[var(--line-strong)] bg-panel px-3.5 py-3.5 text-base text-ink placeholder:text-fog-dim focus:border-[var(--ok)] focus:outline-2 focus:outline-[rgba(13,159,110,0.35)]"
            />
          </div>
          <div className="mb-3.5">
            <label
              htmlFor="inputPhone"
              className="mb-1.5 block font-[family-name:var(--font-mono)] text-[10px] font-semibold tracking-[0.06em] text-fog-dim uppercase"
            >
              Mobile number
            </label>
            <input
              id="inputPhone"
              ref={phoneInputRef}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(403) 555-0142"
              value={friendPhone}
              onChange={(e) => setFriendPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--line-strong)] bg-panel px-3.5 py-3.5 text-base text-ink placeholder:text-fog-dim focus:border-[var(--ok)] focus:outline-2 focus:outline-[rgba(13,159,110,0.35)]"
            />
          </div>
          <label className="mb-4 flex items-start gap-2.5 text-[12px] leading-[1.4] text-fog">
            <input
              ref={consentInputRef}
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 accent-[var(--ok)]"
            />
            <span>
              I confirm this person agreed to receive Chaching accountability
              texts about my advances and savings milestones. Msg &amp; data
              rates may apply.
            </span>
          </label>
          <p className="mb-4 text-[11px] leading-[1.4] text-fog-dim italic">
            Preview: &ldquo;Hi {friendName || "Jamie"}. Alex shared Chaching
            updates with you…&rdquo;
          </p>
          <button
            type="button"
            onClick={handleSaveFriend}
            tabIndex={0}
            aria-label="Save accountability friend"
            className="block w-full cursor-pointer rounded-xl border-0 bg-[var(--ok)] px-4 py-3 text-center text-sm font-semibold text-white transition-[filter,transform] duration-150 hover:-translate-y-px hover:brightness-105 focus-visible:outline-none"
          >
            Save accountability friend
          </button>
        </Overlay>

        {/* SMS advance */}
        <Overlay
          open={overlay === "sms-advance"}
          title="Friend’s phone"
          onClose={() => setOverlay(null)}
        >
          <SmsPhone
            bubbles={[smsAdvanceBody, smsAdvanceFollowUp]}
            times={["Today 9:41 AM", "Today 2:18 PM"]}
          />
          <p className="mt-3.5 text-center text-[12px] leading-[1.4] text-fog">
            <strong className="text-ink">Advance scenario</strong> —
            marketing-approved notice when your friend is alerted you used early
            wage access.
          </p>
        </Overlay>

        {/* SMS save */}
        <Overlay
          open={overlay === "sms-save"}
          title="Friend’s phone"
          onClose={() => setOverlay(null)}
        >
          <SmsPhone bubbles={[smsSaveBody]} times={["Today 9:42 AM"]} />
          <p className="mt-3.5 text-center text-[12px] leading-[1.4] text-fog">
            <strong className="text-ink">Vault scenario</strong> — friend is
            notified you closed the gap and added to high-interest savings.
          </p>
        </Overlay>

        <div
          className="absolute bottom-2 left-1/2 z-[70] h-1 w-[120px] -translate-x-1/2 rounded-sm bg-[rgba(18,22,28,0.25)]"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}

const DayColumn = ({
  day,
  max,
  isMonth,
  isOn,
  onSelect,
}: {
  day: ChartDay
  max: number
  isMonth: boolean
  isOn: boolean
  onSelect: () => void
}) => {
  return (
    <button
      type="button"
      role="listitem"
      aria-label={`${day.title}, in $${day.in}, out $${day.out}`}
      tabIndex={0}
      onClick={onSelect}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-1 rounded-[10px] border-0 bg-transparent p-0 font-inherit text-inherit transition-colors duration-150 hover:bg-[var(--panel-mute)] focus-visible:outline-none",
        isOn && "bg-[rgba(232,93,4,0.08)]",
        day.gap && "animate-gap-day-blink"
      )}
    >
      <div className="flex h-[110px] w-full items-end justify-center gap-0.5">
        <div
          className={cn(
            "min-h-0.5 rounded-t-[3px] rounded-b-px bg-[linear-gradient(180deg,#2a9d8f,var(--in))]",
            isMonth ? "w-3" : "w-2.5"
          )}
          style={{ height: `${barH(day.in, max)}px` }}
        />
        <div
          className={cn(
            "min-h-0.5 rounded-t-[3px] rounded-b-px bg-[linear-gradient(180deg,#e63946,var(--out))]",
            isMonth ? "w-3" : "w-2.5",
            day.gap &&
              "animate-gap-bar-blink bg-[linear-gradient(180deg,#ff6b35,var(--late))] shadow-[0_0_0_1px_rgba(232,93,4,0.35)]"
          )}
          style={{ height: `${barH(day.out, max)}px` }}
        />
      </div>
      <div className="w-full text-center">
        <span className="block text-[10px] font-semibold text-fog">{day.d}</span>
        <span
          className={cn(
            "block font-[family-name:var(--font-mono)] text-[11px] font-semibold text-ink",
            day.gap && "animate-gap-blink text-late",
            day.pay && "text-[var(--ok)]"
          )}
        >
          {day.n}
        </span>
      </div>
      <span
        className={cn(
          "h-[5px] w-[5px] rounded-full bg-transparent",
          day.gap && "animate-gap-blink bg-[var(--late)]",
          day.pay && "bg-[var(--ok)]"
        )}
        aria-hidden="true"
      />
    </button>
  )
}

const DayDetail = ({ day }: { day: ChartDay }) => {
  return (
    <div
      className="animate-rise mt-2.5 rounded-xl bg-[var(--panel-mute)] px-3 py-2.5"
      aria-live="polite"
    >
      <h3 className="mb-1.5 text-[13px] font-semibold">{day.title}</h3>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-panel px-2.5 py-2">
          <div className="font-[family-name:var(--font-mono)] text-[9px] font-semibold tracking-[0.06em] text-fog-dim uppercase">
            Income
          </div>
          <div className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--in)]">
            +${day.in.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg bg-panel px-2.5 py-2">
          <div className="font-[family-name:var(--font-mono)] text-[9px] font-semibold tracking-[0.06em] text-fog-dim uppercase">
            Expenses
          </div>
          <div className="mt-0.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--out)]">
            −${day.out.toLocaleString()}
          </div>
        </div>
      </div>
      <ul className="m-0 list-none p-0">
        {day.lines.map((line) => (
          <li
            key={`${line.t}-${line.v}`}
            className="flex justify-between gap-2 border-t border-[var(--line)] py-[5px] text-[12px] text-fog"
          >
            <b className="font-medium text-ink">{line.t}</b>
            <span
              className="whitespace-nowrap font-[family-name:var(--font-mono)] text-[11px] font-semibold"
              style={{
                color: line.kind === "in" ? "var(--in)" : "var(--out)",
              }}
            >
              {line.v}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const ZayRow = ({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: "ok" | "fee"
}) => {
  return (
    <div className="flex items-center justify-between border-t border-[var(--line)] py-2.5 text-[13px]">
      <span className="text-fog">{label}</span>
      <span
        className={cn(
          "font-[family-name:var(--font-mono)] font-semibold",
          tone === "ok" && "text-[var(--zay)]",
          tone === "fee" && "text-[var(--out)]"
        )}
      >
        {value}
      </span>
    </div>
  )
}

const SocialRules = () => {
  return (
    <ul className="mb-3 list-none p-0">
      <li className="relative border-t border-[var(--line)] py-[7px] pl-[18px] text-[12px] leading-[1.35] text-fog before:absolute before:top-3 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--zay)] before:content-['']">
        Advance chosen → friend is notified
      </li>
      <li className="relative border-t border-[var(--line)] py-[7px] pl-[18px] text-[12px] leading-[1.35] text-fog before:absolute before:top-3 before:left-0 before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#0ea5e9] before:content-['']">
        Gap closed + Vault deposit → friend is notified
      </li>
    </ul>
  )
}

const Overlay = ({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) => {
  return (
    <div
      className={cn(
        "absolute inset-0 z-[90] flex flex-col bg-[linear-gradient(180deg,#f7f4ef_0%,#eef1f5_100%)] transition-transform duration-[350ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
        open
          ? "visible translate-y-0"
          : "invisible translate-y-[105%]"
      )}
      aria-hidden={!open}
      role="dialog"
      aria-label={title}
    >
      <div className="flex shrink-0 items-center gap-2.5 px-[18px] pt-14 pb-3">
        <button
          type="button"
          onClick={onClose}
          tabIndex={0}
          aria-label="Close"
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-[10px] border-0 bg-[var(--panel-mute)] text-ink focus-visible:outline-none"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px] fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="m-0 text-[17px] font-semibold">{title}</h2>
      </div>
      <div className="cha-scrollbar-none flex-1 overflow-y-auto px-[18px] pt-2 pb-10">
        {children}
      </div>
    </div>
  )
}

const SmsPhone = ({
  bubbles,
  times,
}: {
  bubbles: string[]
  times: string[]
}) => {
  return (
    <div className="mx-auto max-w-[320px] rounded-[28px] bg-black p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[20px] bg-white">
        <div className="flex justify-between px-4 pt-3 pb-1 font-[family-name:var(--font-mono)] text-xs font-semibold">
          <span>9:41</span>
          <span>5G</span>
        </div>
        <div className="border-b border-black/6 px-4 pt-1 pb-3 text-center">
          <div className="mx-auto mb-1.5 grid h-[42px] w-[42px] place-items-center rounded-full bg-[#249645] text-[11px] font-bold text-white">
            CHA
          </div>
          <div className="text-[13px] font-semibold">Chaching</div>
          <div className="text-[11px] text-fog-dim">Text Message · SMS</div>
        </div>
        <div className="flex-1 bg-white px-3.5 py-4">
          {bubbles.map((text, i) => (
            <div key={times[i] ?? i}>
              <div className="mb-3 text-center text-[11px] text-fog-dim">
                {times[i]}
              </div>
              <div className="animate-rise mb-0 max-w-[88%] rounded-[18px] bg-[#e9e9eb] px-3.5 py-2.5 text-sm leading-[1.35] text-black">
                {text}
              </div>
              {i < bubbles.length - 1 && <div className="h-4" />}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-black/6 px-3 pt-2 pb-3.5">
          <div className="h-[34px] flex-1 rounded-[17px] border border-black/6 bg-[#f2f2f7]" />
          <div className="h-7 w-7 rounded-full bg-[#007aff]" />
        </div>
      </div>
    </div>
  )
}
