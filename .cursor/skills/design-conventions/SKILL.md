---
name: design-conventions
description: "TILL's visual grammar: the six tokens and what each one means semantically, the type rules for money, the one permitted animation, and the generated-design tells to avoid. Fire before writing or changing any UI, CSS, or copy."
---

# Design conventions

UX & design is only 5–10% of the score, but the visual pass is a separate scored pass and screenshots feed it directly. The goal is a repo that looks deliberately designed rather than generated. Deliberate here means **semantic**: the color tells you what kind of money you are looking at.

## Tokens are the vocabulary

Defined once in `src/app/globals.css`. Never a hardcoded hex, never an arbitrary Tailwind value.

| Token | Value | Means |
| --- | --- | --- |
| `--clock-slate` | `#12161C` | page base |
| `--clock-raise` | `#1B222B` | card surface |
| `--punch-bone` | `#E8E4DA` | text |
| `--wage-amber` | `#E0A244` | **confirmed money** — banked, paid, advanceable |
| `--pending-haze` | `#6E7C8C` | **estimated / stale / not advanceable** — unconfirmed hours, scheduled shifts |
| `--cliff-rust` | `#C2503A` | **cliff days and shortfalls only** — appears on roughly one day per month |

Amber versus haze is the product's core distinction rendered in color: 60% of her shifts are not paid same day, so "money you have" and "money you are owed" must never look the same. Rust used for generic emphasis destroys the signal that a rust day is a wall.

## The dark UI is evidence, not taste

100% of the 535 observed advance requests happen between 5 PM and midnight. Peak 11 PM. Say that in the README next to the palette. A justified risk scores; an unjustified one reads as a default.

## Type

- Display: condensed grotesk (Archivo Condensed or Oswald) for headline figures.
- Body: Inter, 15px.
- **All money: JetBrains Mono with tabular figures.** `.money { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }`. Proportional figures in a money column is the tell that gives away a generated design faster than anything else.
- Money is right-aligned in any column of more than one row.

## The one animation

The balance line in Screen B draws left to right on load and **stops hard at June 1**, with the shortfall labelled on the drop. That is the signature: the cliff drawn as an actual edge. One orchestrated moment, then stillness. No other entrance animations, no hover lifts, no shimmer. Everything gated on `prefers-reduced-motion: reduce` — respect it by rendering the final state instantly, not by removing the chart.

## Layout

390px phone frame centered on desktop, with the surrounding page in `--clock-slate` so the frame reads as a device and not as a narrow column. Mobile-first inside the frame. One page, three stacked sections; `/math` is a plain vertical document, deliberately unstyled-looking, because its credibility comes from density.

## Avoid the three generated-design tells

1. cream + serif + terracotta
2. near-black + acid green
3. broadsheet hairlines and rules everywhere

If a choice could have come from any AI-generated landing page, change it or delete it.

## Copy

Short, second person, no exclamation marks, no encouragement. "Rent is in 5 days and you're $58 short" — state the fact, then offer the route. No em dashes in shipped copy. Numbers in copy still come from the engine, never typed.

## Before done

- `npm run check` green.
- Look at it in the browser at 390px and read the numbers against `docs/numbers.md`.
- Grep for hardcoded hex and money literals (`audit-numbers` skill, step 2).
