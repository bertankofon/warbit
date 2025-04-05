"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, AlertCircle } from "lucide-react"

export default function Login() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Remove rate limiting state and logic
  const [isRateLimited, setIsRateLimited] = useState(false)
  const [cooldownTime, setCooldownTime] = useState(0)
  const [cooldownProgress, setCooldownProgress] = useState(0)

  // Check for existing session on component mount
  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.push("/dashboard")
      }
    }

    checkSession()
  }, [router, supabase.auth])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // Don't proceed if already loading
    if (loading) return

    setLoading(true)
    setError(null)

    try {
      // Perform login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        console.error("Authentication error:", authError)
        throw new Error(authError.message || "Invalid login credentials")
      }

      if (data?.session) {
        // Successfully logged in
        console.log("Login successful, redirecting to dashboard")
        router.push("/dashboard")
      } else {
        throw new Error("Failed to create session")
      }
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
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border-2 border-red-500 p-3 text-red-400 text-xs pixel-font">
                <AlertCircle className="inline-block mr-1 h-4 w-4" />
                {error}
              </div>
            )}

            <button type="submit" className="w-full mario-button p-4 text-sm" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                  LOGGING IN...
                </>
              ) : (
                "ENTER ARENA"
              )}
            </button>

            {/* Debug button for development only */}
            {process.env.NODE_ENV === "development" && (
              <button
                type="button"
                className="w-full mt-2 text-xs border-2 border-yellow-500 text-yellow-400 p-2 pixel-font"
                onClick={async () => {
                  try {
                    // Force sign out first to clear any existing sessions
                    await supabase.auth.signOut()
                    console.log("Signed out successfully")

                    // Try to sign in with demo credentials
                    const { data, error } = await supabase.auth.signInWithPassword({
                      email: "demo@example.com",
                      password: "password123",
                    })

                    if (error) {
                      console.error("Debug login error:", error)
                      setError("Debug login failed: " + error.message)
                    } else {
                      console.log("Debug login successful:", data)
                      router.push("/dashboard")
                    }
                  } catch (err) {
                    console.error("Debug login exception:", err)
                    setError("Debug login exception: " + String(err))
                  }
                }}
              >
                DEBUG LOGIN (DEV ONLY)
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

