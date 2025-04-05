import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Web3Provider } from "@/lib/web3-context"

export const metadata: Metadata = {
  title: "Warbit - 8-Bit Warrior Token Game",
  description: "Create warriors, battle opponents, and earn tokens in this 8-bit style game.",
  generator: "v0.dev",
  icons: {
    icon: "/favicon.ico",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // This will be replaced with the actual contract address
  const contractAddress = process.env.TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000"

  return (
    <html lang="en">
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Web3Provider contractAddress={contractAddress}>{children}</Web3Provider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'