import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono, Oswald } from "next/font/google"
import "./globals.css"

// Archivo Condensed is not published through next/font/google (only Archivo,
// Archivo Narrow, Archivo Black), so the display face is Oswald under the
// variable name globals.css already reads.
const display = Oswald({
  variable: "--font-archivo-condensed",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

const body = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
})

const money = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "TILL",
  description:
    "TILL projects a shift worker's cash position forward to the next cliff and prices every route across the gap.",
}

export const viewport: Viewport = {
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#12161C",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${money.variable} bg-slate antialiased`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-dvh bg-slate text-bone">{children}</body>
    </html>
  )
}
