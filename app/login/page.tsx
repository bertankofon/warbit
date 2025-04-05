"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, AlertCircle, Clock } from "lucide-react"

export default function Login() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Rate limiting state
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [cooldownProgress, setCooldownProgress] = useState(0)

  // Check for existing rate limit on component mount
  useEffect(() => {
    const rateLimitExpiry = localStorage.getItem("rateLimitExpiry")
    if (rateLimitExpiry) {
      const expiryTime = Number.parseInt(rateLimitExpiry, 10)
      if (expiryTime > Date.now()) {
        setIsRateLimited(true)
        setCooldownTime(Math.ceil((expiryTime - Date.now()) / 1000))
      } else {
        // Clear expired rate limit
        localStorage.removeItem("rateLimitExpiry")
      }
    }
  }, [])

  // Countdown timer for rate limit cooldown
  useEffect(() => {
    if (!isRateLimited || cooldownTime <= 0) return

    const totalCooldown = Number.parseInt(localStorage.getItem("rateLimitDuration") || "30", 10)
    setCooldownProgress(((totalCooldown - cooldownTime) / totalCooldown) * 100)

    const timer = setTimeout(() => {
      if (cooldownTime <= 1) {
        setIsRateLimited(false)
        localStorage.removeItem("rateLimitExpiry")
        localStorage.removeItem("rateLimitDuration")
        setError(null)
      } else {
        setCooldownTime(cooldownTime - 1)
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [isRateLimited, cooldownTime])

  // Set rate limit with exponential backoff
  const setRateLimit = (attempts = 1) => {
    // Exponential backoff: 15s, 30s, 60s, 120s, etc.
    const duration = Math.min(15 * Math.pow(2, attempts - 1), 300) // Cap at 5 minutes
    const expiry = Date.now() + duration * 1000

    localStorage.setItem("rateLimitExpiry", expiry.toString())
    localStorage.setItem("rateLimitDuration", duration.toString())
    localStorage.setItem("rateLimitAttempts", attempts.toString())

    setIsRateLimited(true)
    setCooldownTime(duration)

    return duration
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Don't proceed if rate limited or already loading
    if (isRateLimited || loading) return

    setLoading(true)
    setError(null)

    try {
      // Use a demo mode for preview to avoid actual rate limits
      const isPreviewMode = process.env.NODE_ENV === "development" || window.location.hostname.includes("vercel.app")

      if (isPreviewMode) {
        // In preview mode, simulate successful login after a delay
        await new Promise((resolve) => setTimeout(resolve, 1500))

        // For demo purposes, show rate limit error on empty password
        if (!password) {
          const attempts = Number.parseInt(localStorage.getItem("rateLimitAttempts") || "0", 10) + 1
          const duration = setRateLimit(attempts)
          throw new Error(`Too many login attempts. Please wait ${duration} seconds before trying again.`)
        }

        // Simulate successful login
        router.push("/dashboard")
        return
      }

      // Real authentication for production
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("rate limit")) {
          const attempts = Number.parseInt(localStorage.getItem("rateLimitAttempts") || "0", 10) + 1
          const duration = setRateLimit(attempts)
          throw new Error(`Too many login attempts. Please wait ${duration} seconds before trying again.`)
        }
        throw error
      }

      router.push("/dashboard")
    } catch (error) {
      console.error("Error during login:", error)
      setError(error instanceof Error ? error.message : "Invalid login credentials")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md question-block">
        <div className="bg-black p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl text-green-500 pixel-font">ENTER BATTLE ARENA</h1>
            <div className="h-1 w-32 mx-auto bg-green-500 my-4"></div>
            <p className="text-white text-sm pixel-font">LOG IN TO BATTLE WITH YOUR WARRIOR</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-white text-xs pixel-font">EMAIL</label>
              <input
                type="email"
                placeholder="WARRIOR@EXAMPLE.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border-2 border-blue-600 text-green-400 p-3 text-sm pixel-font"
                disabled={isRateLimited}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-white text-xs pixel-font">PASSWORD</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border-2 border-blue-600 text-green-400 p-3 text-sm pixel-font"
                disabled={isRateLimited}
                required
              />
            </div>

            {isRateLimited && (
              <div className="bg-yellow-900/30 border-2 border-yellow-500 p-3 text-yellow-400 text-xs pixel-font">
                <div className="flex items-center mb-2">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>COOLDOWN: {cooldownTime}s</span>
                </div>
                <div className="w-full h-4 bg-black border border-yellow-500">
                  <div className="h-full bg-yellow-500" style={{ width: `${cooldownProgress}%` }}></div>
                </div>
              </div>
            )}

            {error && !isRateLimited && (
              <div className="bg-red-900/30 border-2 border-red-500 p-3 text-red-400 text-xs pixel-font">
                <AlertCircle className="inline-block mr-1 h-4 w-4" />
                {error}
              </div>
            )}

            <button type="submit" className="w-full mario-button p-4 text-sm" disabled={loading || isRateLimited}>
              {loading ? (
                <>
                  <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                  LOGGING IN...
                </>
              ) : isRateLimited ? (
                <>
                  <Clock className="inline-block mr-2 h-4 w-4" />
                  COOLDOWN ACTIVE
                </>
              ) : (
                "ENTER ARENA"
              )}
            </button>

            {/* For preview mode only - reset rate limit */}
            {process.env.NODE_ENV === "development" && isRateLimited && (
              <button
                type="button"
                className="w-full mt-2 text-xs border-2 border-yellow-500 text-yellow-400 p-2 pixel-font"
                onClick={() => {
                  localStorage.removeItem("rateLimitExpiry")
                  localStorage.removeItem("rateLimitDuration")
                  localStorage.removeItem("rateLimitAttempts")
                  setIsRateLimited(false)
                  setError(null)
                }}
              >
                RESET RATE LIMIT (PREVIEW ONLY)
              </button>
            )}
          </form>

          <div className="mt-8 pt-4 border-t-2 border-gray-800 text-center">
            <p className="text-xs text-gray-400 pixel-font">
              DON'T HAVE A WARRIOR YET?{" "}
              <Link href="/signup" className="text-green-400 hover:underline">
                CREATE ONE NOW
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

