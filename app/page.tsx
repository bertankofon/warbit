"use client"

import Link from "next/link"
import { useState, useEffect } from "react"

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: -100, y: -100 })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleClick = (e: MouseEvent) => {
      // Create flying coins that look like the coin follower
      for (let i = 0; i < 10; i++) {
        const coin = document.createElement("div")
        coin.className = "coin-follower coin-explosion"

        // Random position around the click point
        const angle = Math.random() * Math.PI * 2 // Random angle
        const distance = 20 + Math.random() * 80 // Random distance

        // Set initial position at the click point
        coin.style.position = "fixed"
        const startX = e.clientX
        const startY = e.clientY

        coin.style.left = `${startX}px`
        coin.style.top = `${startY}px`

        // Calculate end position
        const endX = startX + Math.cos(angle) * distance
        const endY = startY + Math.sin(angle) * distance

        // Add to body
        document.body.appendChild(coin)

        // Animate the coin
        setTimeout(() => {
          coin.style.transition = "all 0.5s ease-out"
          coin.style.left = `${endX}px`
          coin.style.top = `${endY}px`
          coin.style.opacity = "0"
        }, 10)

        // Remove coin after animation
        setTimeout(() => {
          if (document.body.contains(coin)) {
            document.body.removeChild(coin)
          }
        }, 1000)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("click", handleClick)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("click", handleClick)
    }
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {isClient && (
        <div
          className="coin-follower"
          style={{
            left: `${mousePosition.x}px`,
            top: `${mousePosition.y}px`,
          }}
        />
      )}

      <div className="w-full max-w-4xl text-center space-y-8">
        <div className="mario-container space-y-6 mx-auto max-w-3xl p-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-red-600 pixel-font float retro-text">
              WARBIT
            </h1>
            <div className="h-3 w-64 mx-auto bg-yellow-400 mb-6"></div>
            <p className="text-2xl md:text-3xl text-green-400 pixel-font">
              CREATE WARRIORS. BATTLE OPPONENTS. EARN TOKENS.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-10 justify-center mt-12">
            <Link href="/signup">
              <button className="w-full md:w-auto mario-button-3d px-10 py-8 text-xl">CREATE WARRIOR</button>
            </Link>
            <Link href="/login">
              <button className="w-full md:w-auto mario-button-3d mario-button-green-3d px-10 py-8 text-xl">
                BATTLE ARENA
              </button>
            </Link>
          </div>

          <div className="text-xs text-white pixel-font p-4 mt-8">
            2025 ETHGlobal Taipei -{" "}
            <a
              href="https://github.com/bertankofon"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:text-yellow-300 relative"
            >
              @bertankofon
            </a>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 mario-cloud"></div>
        <div className="absolute top-20 right-20 mario-cloud"></div>
        <div className="absolute bottom-10 left-20 mario-cloud"></div>
        <div className="absolute bottom-20 right-10 mario-cloud"></div>
      </div>

      {/* Footer with Metal logo text */}
      <div className="w-full fixed bottom-0 left-0">
        <div className="brick-pattern py-4 flex items-center justify-center">
          <span className="text-base md:text-lg text-white pixel-font mr-3 font-bold">POWERED BY</span>
          <a
            href="https://metal.build"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <div className="metal-logo-text text-black text-4xl md:text-5xl font-bold">
              <span className="metal-m">m</span>
              <span className="metal-e">e</span>
              <span className="metal-t">t</span>
              <span className="metal-a">a</span>
              <span className="metal-l">l</span>
            </div>
          </a>
        </div>
        <div className="h-4 bg-green-800"></div>
        <div className="h-2 bg-black"></div>
      </div>
    </main>
  )
}

