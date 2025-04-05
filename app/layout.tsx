import type React from "react"
import type { Metadata } from "next"
import { Press_Start_2P } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

// Load the 8-bit font using Next.js font system
const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Warbit - 8-Bit Battle Game",
  description: "Choose your elemental warrior, battle opponents, and earn tokens!",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${pixelFont.variable}`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}



import './globals.css'