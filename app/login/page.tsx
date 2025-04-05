"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { PixelButton } from "@/components/pixel-button"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const router = useRouter()
  const { toast } = useToast()

  // Add error handling for Supabase client creation
  const [supabaseError, setSupabaseError] = useState<string | null>(null)
  let supabase: ReturnType<typeof createClient>

  try {
    supabase = createClient()
  } catch (error) {
    if (error instanceof Error) {
      setSupabaseError(error.message)
    } else {
      setSupabaseError("Failed to initialize Supabase client")
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (supabaseError) {
      toast({
        title: "Error",
        description: "Cannot connect to authentication service. Please try again later.",
        variant: "destructive",
      })
      return
    }

    if (!email || !password) {
      toast({
        title: "Error",
        description: "Please enter your email and password",
        variant: "destructive",
      })
      return
    }

    // Set loading state immediately
    setIsLoading(true)

    try {
      // Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw error
      }

      if (data.user) {
        toast({
          title: "Success!",
          description: "You've successfully logged in.",
        })

        // Redirect to dashboard
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      console.error("Login error:", error)
      setErrorMessage(error.message || "Failed to log in. Please check your credentials.")
      toast({
        title: "Error",
        description: error.message || "Failed to log in",
        variant: "destructive",
      })
      // Make sure to set loading to false on error
      setIsLoading(false)
    }
    // Note: We don't set isLoading to false on success because we're redirecting
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-pixel text-4xl mb-4 text-center">WARBIT</h1>
          <p className="font-pixel text-sm">Return to the battlefield!</p>
        </div>

        <div className="pixel-box">
          <h2 className="font-pixel text-xl mb-6 text-center">LOG IN</h2>

          <form onSubmit={handleLogin} className="space-y-6">
            {supabaseError && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200 font-pixel">
                {supabaseError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="font-pixel text-xs">
                EMAIL
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="font-pixel text-sm h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-pixel text-xs">
                PASSWORD
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="font-pixel text-sm h-10"
              />
            </div>

            {errorMessage && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200 font-pixel">
                {errorMessage}
              </div>
            )}

            <PixelButton type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                  LOGGING IN...
                </>
              ) : (
                "LOG IN"
              )}
            </PixelButton>

            <div className="text-center font-pixel text-xs mt-4">
              Don't have a warrior?{" "}
              <Link href="/signup" className="text-blue-600 hover:underline">
                SIGN UP
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

