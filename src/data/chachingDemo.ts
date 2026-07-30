export const GAP_AMOUNT = 312
export const CHART_H = 110
export const ZAYZOON_FEE = 4.99
export const VAULT_APY = "4.50%"

export type ChartLine = {
  t: string
  v: string
  kind: "in" | "out"
}

export type ChartDay = {
  id: string
  d: string
  n: string
  in: number
  out: number
  gap: boolean
  pay: boolean
  title: string
  lines: ChartLine[]
}

export type SlateGig = {
  id: string
  title: string
  meta: string
  pay: number
  vault: boolean
}

export type AccountabilityFriend = {
  name: string
  phone: string
}

export const WEEK_DAYS: ChartDay[] = [
  {
    id: "mon",
    d: "Mon",
    n: "27",
    in: 224,
    out: 118,
    gap: false,
    pay: false,
    title: "Monday Apr 27",
    lines: [
      { t: "Day shift pay · Apr 26", v: "+$224", kind: "in" },
      { t: "Living · food / transit", v: "−$43", kind: "out" },
      { t: "Advance used + fee", v: "−$75", kind: "out" },
    ],
  },
  {
    id: "tue",
    d: "Tue",
    n: "28",
    in: 0,
    out: 52,
    gap: false,
    pay: false,
    title: "Tuesday Apr 28",
    lines: [
      { t: "No pay lands", v: "$0", kind: "in" },
      { t: "Living · groceries", v: "−$52", kind: "out" },
    ],
  },
  {
    id: "wed",
    d: "Wed",
    n: "29",
    in: 0,
    out: 48,
    gap: false,
    pay: false,
    title: "Wednesday Apr 29",
    lines: [
      { t: "No pay lands", v: "$0", kind: "in" },
      { t: "Living · transit / food", v: "−$48", kind: "out" },
    ],
  },
  {
    id: "thu",
    d: "Thu",
    n: "30",
    in: 0,
    out: 268,
    gap: false,
    pay: false,
    title: "Thursday Apr 30",
    lines: [
      { t: "No pay lands", v: "$0", kind: "in" },
      { t: "Debt payment", v: "−$225", kind: "out" },
      { t: "Living", v: "−$43", kind: "out" },
    ],
  },
  {
    id: "fri",
    d: "Fri",
    n: "01",
    in: 0,
    out: 2122,
    gap: true,
    pay: false,
    title: "Friday May 1 · gap day",
    lines: [
      { t: "No pay lands", v: "$0", kind: "in" },
      { t: "Rent autopay", v: "−$2,056", kind: "out" },
      { t: "Mobile phone", v: "−$66", kind: "out" },
      { t: "Shortfall vs cash on hand", v: "−$312", kind: "out" },
    ],
  },
  {
    id: "sat",
    d: "Sat",
    n: "02",
    in: 672,
    out: 45,
    gap: false,
    pay: true,
    title: "Saturday May 2 · pay lands",
    lines: [
      { t: "Night + split + day deposit", v: "+$672", kind: "in" },
      { t: "Living", v: "−$45", kind: "out" },
      { t: "Would have covered Friday", v: "1 day late", kind: "out" },
    ],
  },
  {
    id: "sun",
    d: "Sun",
    n: "03",
    in: 0,
    out: 40,
    gap: false,
    pay: false,
    title: "Sunday May 3",
    lines: [
      { t: "No pay lands", v: "$0", kind: "in" },
      { t: "Living", v: "−$40", kind: "out" },
    ],
  },
]

export const MONTH_WEEKS: ChartDay[] = [
  {
    id: "w1",
    d: "Wk 1",
    n: "27–3",
    in: 896,
    out: 2693,
    gap: true,
    pay: false,
    title: "Week 1 · Apr 27 – May 3",
    lines: [
      { t: "Income landed", v: "+$896", kind: "in" },
      { t: "Rent + phone + debt + living", v: "−$2,693", kind: "out" },
      { t: "Timing gap on Friday", v: "−$312", kind: "out" },
    ],
  },
  {
    id: "w2",
    d: "Wk 2",
    n: "4–10",
    in: 720,
    out: 398,
    gap: false,
    pay: true,
    title: "Week 2 · May 4 – 10",
    lines: [
      { t: "Typical 4 shifts", v: "+$720", kind: "in" },
      { t: "Utilities May 5", v: "−$154", kind: "out" },
      { t: "Living", v: "−$244", kind: "out" },
    ],
  },
  {
    id: "w3",
    d: "Wk 3",
    n: "11–17",
    in: 720,
    out: 260,
    gap: false,
    pay: false,
    title: "Week 3 · May 11 – 17",
    lines: [
      { t: "Typical 4 shifts", v: "+$720", kind: "in" },
      { t: "Living only", v: "−$260", kind: "out" },
    ],
  },
  {
    id: "w4",
    d: "Wk 4",
    n: "18–24",
    in: 680,
    out: 250,
    gap: false,
    pay: false,
    title: "Week 4 · May 18 – 24",
    lines: [
      { t: "3–4 shifts", v: "+$680", kind: "in" },
      { t: "Living", v: "−$250", kind: "out" },
    ],
  },
  {
    id: "w5",
    d: "Wk 5",
    n: "25–31",
    in: 564,
    out: 240,
    gap: false,
    pay: false,
    title: "Week 5 · May 25 – 31",
    lines: [
      { t: "Closing shifts", v: "+$564", kind: "in" },
      { t: "Living", v: "−$240", kind: "out" },
      { t: "Month leftover", v: "+$876", kind: "in" },
    ],
  },
]

export const SLATE_GIGS: SlateGig[] = [
  {
    id: "g1",
    title: "Dinner delivery",
    meta: "Tonight · 3 hrs · SE Calgary",
    pay: 71,
    vault: false,
  },
  {
    id: "g2",
    title: "Warehouse load-out",
    meta: "Thu evening · 4 hrs · NE",
    pay: 95,
    vault: false,
  },
  {
    id: "g3",
    title: "Morning move assist",
    meta: "Fri 6–11am · before rent hits",
    pay: 146,
    vault: false,
  },
  {
    id: "g4",
    title: "Weekend event staff",
    meta: "Sat · 4 hrs · after gap is closed",
    pay: 80,
    vault: true,
  },
]
