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
import { PixelCharacter } from "@/components/pixel-character"

const ELEMENTS = [
  { id: "fire", name: "Fire", color: "bg-red-500" },
  { id: "water", name: "Water", color: "bg-blue-500" },
  { id: "earth", name: "Earth", color: "bg-green-500" },
  { id: "air", name: "Air", color: "bg-purple-500" },
]

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [warriorName, setWarriorName] = useState("")
  const [warriorTicker, setWarriorTicker] = useState("")
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
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

  const handleSignup = async (e: React.FormEvent) => {
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

    if (!email || !password || !warriorName || !warriorTicker || !selectedElement) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select an element",
        variant: "destructive",
      })
      return
    }

    if (warriorTicker.length > 5) {
      toast({
        title: "Error",
        description: "Ticker must be 5 characters or less",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Sign up with Supabase Auth - skip email verification
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            warrior: {
              name: warriorName,
              ticker: warriorTicker.toUpperCase(),
              element: selectedElement,
              created_at: new Date().toISOString(),
              stats: {
                level: 1,
                experience: 0,
                wins: 0,
                losses: 0,
              },
            },
          },
          // Skip email verification for testing
          emailRedirectTo: undefined,
        },
      })

      if (error) {
        throw error
      }

      if (data.user) {
        // After successful signup, create a Metal holder for the user
        const response = await fetch("/api/holders/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ holderId: data.user.id }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error("API error:", errorData)
          // We'll continue even if holder creation fails, as we can retry later
        }

        toast({
          title: "Success!",
          description: "Your warrior has been created!",
        })

        // Redirect to dashboard
        router.push("/dashboard")
      }
    } catch (error: any) {
      console.error("Signup error:", error)
      setErrorMessage(error.message || "Failed to create your account. Please try again.")
      toast({
        title: "Error",
        description: error.message || "Failed to create your account",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container flex items-center justify-center min-h-screen py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-pixel text-4xl mb-4 text-center">WARBIT</h1>
          <p className="font-pixel text-sm">Create your warrior and join the battle!</p>
        </div>

        <div className="pixel-box mb-8">
          <h2 className="font-pixel text-xl mb-6 text-center">SIGN UP</h2>

          <form onSubmit={handleSignup} className="space-y-6">
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

            <div className="space-y-2">
              <Label htmlFor="warriorName" className="font-pixel text-xs">
                WARRIOR NAME
              </Label>
              <Input
                id="warriorName"
                type="text"
                placeholder="BattleMaster"
                value={warriorName}
                onChange={(e) => setWarriorName(e.target.value)}
                required
                className="font-pixel text-sm h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="warriorTicker" className="font-pixel text-xs">
                TICKER (MAX 5 CHARS)
              </Label>
              <Input
                id="warriorTicker"
                type="text"
                placeholder="WRRR"
                value={warriorTicker}
                onChange={(e) => setWarriorTicker(e.target.value.toUpperCase())}
                maxLength={5}
                required
                className="font-pixel text-sm h-10 uppercase"
              />
            </div>

            <div className="space-y-2">
              <Label className="font-pixel text-xs">ELEMENT</Label>
              <div className="grid grid-cols-2 gap-4">
                {ELEMENTS.map((element) => (
                  <div
                    key={element.id}
                    onClick={() => setSelectedElement(element.id)}
                    className={`cursor-pointer transition-all p-2 border-2 ${
                      selectedElement === element.id
                        ? `border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)] element-${element.id}`
                        : "border-gray-300 hover:border-gray-400"
                    } flex flex-col items-center`}
                  >
                    <PixelCharacter element={element.id as any} size="sm" />
                    <span className="font-pixel text-xs mt-2">{element.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {errorMessage && (
              <div className="text-sm text-red-500 p-2 bg-red-50 rounded border border-red-200 font-pixel">
                {errorMessage}
              </div>
            )}

            <PixelButton
              type="submit"
              className="w-full"
              disabled={isLoading}
              variant={(selectedElement as any) || "default"}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin inline-block" />
                  CREATING...
                </>
              ) : (
                "CREATE WARRIOR"
              )}
            </PixelButton>

            <div className="text-center font-pixel text-xs mt-4">
              Already have a warrior?{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                LOG IN
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

