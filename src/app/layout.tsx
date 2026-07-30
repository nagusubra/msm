import type { Metadata } from "next"
import { DM_Sans, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
})

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Chaching",
    template: "%s | Chaching",
  },
  description:
    "Beyond budgeting: ChaChing closes daily cash gaps with same-day jobs and Zayzoon advances — workers earn extra income; Zayzoon earns placement commissions. Timing · not totals.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="font-sans text-ink">{children}</body>
    </html>
  )
}
