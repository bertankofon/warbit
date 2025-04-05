"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, LogOut, Swords } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { PixelButton } from "@/components/pixel-button"
import { PixelCharacter } from "@/components/pixel-character"

interface Warrior {
  id: string
  name: string
  ticker: string
  element: string
  owner: {
    id: string
    email: string
  }
  stats: {
    level: number
    experience: number
    wins: number
    losses: number
  }
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [warriors, setWarriors] = useState<Warrior[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [balance, setBalance] = useState<number | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        if (userError || !user) {
          throw new Error("Not authenticated")
        }

        setCurrentUser(user)

        // For demo purposes, we'll create some mock warriors
        // In a real app, you'd fetch this from your database
        const mockWarriors: Warrior[] = [
          {
            id: "1",
            name: "Flamebringer",
            ticker: "FLAME",
            element: "fire",
            owner: {
              id: "mock-1",
              email: "warrior1@example.com",
            },
            stats: {
              level: 3,
              experience: 45,
              wins: 5,
              losses: 2,
            },
          },
          {
            id: "2",
            name: "Aquamancer",
            ticker: "AQUA",
            element: "water",
            owner: {
              id: "mock-2",
              email: "warrior2@example.com",
            },
            stats: {
              level: 2,
              experience: 25,
              wins: 3,
              losses: 1,
            },
          },
          {
            id: "3",
            name: "Stoneguard",
            ticker: "STONE",
            element: "earth",
            owner: {
              id: "mock-3",
              email: "warrior3@example.com",
            },
            stats: {
              level: 4,
              experience: 70,
              wins: 8,
              losses: 3,
            },
          },
          {
            id: "4",
            name: "Windwalker",
            ticker: "WIND",
            element: "air",
            owner: {
              id: "mock-4",
              email: "warrior4@example.com",
            },
            stats: {
              level: 2,
              experience: 30,
              wins: 4,
              losses: 2,
            },
          },
        ]

        // Add the current user's warrior if it exists
        if (user.user_metadata?.warrior) {
          const userWarrior: Warrior = {
            id: user.id,
            name: user.user_metadata.warrior.name,
            ticker: user.user_metadata.warrior.ticker,
            element: user.user_metadata.warrior.element,
            owner: {
              id: user.id,
              email: user.email,
            },
            stats: user.user_metadata.warrior.stats,
          }

          // Add to beginning of array
          mockWarriors.unshift(userWarrior)
        }

        setWarriors(mockWarriors)

        // Fetch token balance
        try {
          const response = await fetch(`/api/holders/${user.id}/balance`)
          if (response.ok) {
            const data = await response.json()
            setBalance(data.balance)
          }
        } catch (error) {
          console.error("Error fetching balance:", error)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        })
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, supabase, toast])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const handleBattleRequest = (opponent: Warrior) => {
    toast({
      title: "Battle Request Sent!",
      description: `You challenged ${opponent.name} to a battle!`,
    })
  }

  if (isLoading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="font-pixel">LOADING WARRIORS...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-pixel text-3xl">WARBIT</h1>
        <PixelButton onClick={handleLogout} size="sm">
          <LogOut className="h-4 w-4 mr-2" />
          LOGOUT
        </PixelButton>
      </div>

      {/* User's warrior card */}
      {currentUser?.user_metadata?.warrior && (
        <div className="mb-8">
          <h2 className="font-pixel text-xl mb-4">YOUR WARRIOR</h2>
          <div className="pixel-box">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className={`p-4 element-${currentUser.user_metadata.warrior.element}`}>
                <PixelCharacter element={currentUser.user_metadata.warrior.element} size="lg" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                  <h3 className="font-pixel text-lg">{currentUser.user_metadata.warrior.name}</h3>
                  <span className="font-pixel text-sm bg-black text-white px-2 py-1">
                    {currentUser.user_metadata.warrior.ticker}
                  </span>
                </div>
                <p className="font-pixel text-xs mb-4 capitalize">
                  {currentUser.user_metadata.warrior.element} Warrior • Level{" "}
                  {currentUser.user_metadata.warrior.stats.level}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="border-2 border-black p-2">
                    <p className="font-pixel text-xs">WINS</p>
                    <p className="font-pixel text-lg">{currentUser.user_metadata.warrior.stats.wins}</p>
                  </div>
                  <div className="border-2 border-black p-2">
                    <p className="font-pixel text-xs">LOSSES</p>
                    <p className="font-pixel text-lg">{currentUser.user_metadata.warrior.stats.losses}</p>
                  </div>
                </div>
                <div className="border-2 border-black p-2 mb-4">
                  <p className="font-pixel text-xs">TOKENS</p>
                  <p className="font-pixel text-lg">{balance ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other warriors */}
      <div>
        <h2 className="font-pixel text-xl mb-4">WARRIORS TO BATTLE</h2>
        <div className="grid gap-4">
          {warriors
            .filter((warrior) => warrior.owner.id !== currentUser?.id)
            .map((warrior) => (
              <div key={warrior.id} className="pixel-box">
                <div className="flex flex-col md:flex-row items-center gap-4">
                  <div className={`p-4 element-${warrior.element}`}>
                    <PixelCharacter element={warrior.element as any} size="md" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                      <h3 className="font-pixel text-base">{warrior.name}</h3>
                      <span className="font-pixel text-xs bg-black text-white px-2 py-1">{warrior.ticker}</span>
                    </div>
                    <p className="font-pixel text-xs mb-2 capitalize">
                      {warrior.element} Warrior • Level {warrior.stats.level}
                    </p>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="font-pixel text-xs">WINS</p>
                          <p className="font-pixel text-sm">{warrior.stats.wins}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-pixel text-xs">LOSSES</p>
                          <p className="font-pixel text-sm">{warrior.stats.losses}</p>
                        </div>
                      </div>
                      <PixelButton
                        onClick={() => handleBattleRequest(warrior)}
                        variant={warrior.element as any}
                        size="sm"
                      >
                        <Swords className="h-4 w-4 mr-2" />
                        BATTLE
                      </PixelButton>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

