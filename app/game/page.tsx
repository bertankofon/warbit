"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Swords, Shield, Award, RefreshCw, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase"

interface Warrior {
  type: string
  name: string
  ticker: string
  stats: {
    level: number
    experience: number
    wins: number
    losses: number
  }
}

export default function GameDashboardPage() {
  const [warrior, setWarrior] = useState<Warrior | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isBattling, setIsBattling] = useState(false)
  const [isTraining, setIsTraining] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error || !user) {
          throw new Error("Not authenticated")
        }

        // Check if user has created a warrior
        if (!user.user_metadata.warrior) {
          // Redirect to warrior selection if no warrior exists
          router.push("/warrior-selection")
          return
        }

        setWarrior(user.user_metadata.warrior as Warrior)

        // Fetch token balance
        const response = await fetch(`/api/holders/${user.id}/balance`)
        if (response.ok) {
          const data = await response.json()
          setBalance(data.balance)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          title: "Error",
          description: "Failed to load game data. Please try again.",
          variant: "destructive",
        })
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [router, supabase, toast])

  const handleBattle = async () => {
    if (!warrior) return

    setIsBattling(true)
    try {
      // Simulate a battle with random outcome
      const win = Math.random() > 0.5
      const experienceGained = win ? 10 : 5
      const tokensWon = win ? 5 : 0
      const tokensLost = win ? 0 : 2

      // Update warrior stats
      const updatedWarrior = {
        ...warrior,
        stats: {
          ...warrior.stats,
          experience: warrior.stats.experience + experienceGained,
          wins: win ? warrior.stats.wins + 1 : warrior.stats.wins,
          losses: win ? warrior.stats.losses : warrior.stats.losses + 1,
        },
      }

      // Check if warrior leveled up
      const experienceNeeded = warrior.stats.level * 20
      if (updatedWarrior.stats.experience >= experienceNeeded) {
        updatedWarrior.stats.level += 1
        updatedWarrior.stats.experience = 0
      }

      // Update user metadata with new stats
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          warrior: updatedWarrior,
        },
      })

      if (updateError) {
        throw new Error("Failed to update warrior stats")
      }

      setWarrior(updatedWarrior)

      // Handle token transactions
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (win && tokensWon > 0) {
        // Reward tokens for winning
        await fetch(`/api/holders/${user?.id}/reward`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: tokensWon }),
        })
      } else if (!win && tokensLost > 0 && (balance || 0) >= tokensLost) {
        // Spend tokens for losing
        await fetch(`/api/holders/${user?.id}/spend`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ amount: tokensLost }),
        })
      }

      // Update balance
      const response = await fetch(`/api/holders/${user?.id}/balance`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
      }

      // Show battle result
      toast({
        title: win ? "Victory!" : "Defeat!",
        description: win
          ? `You won the battle and gained ${experienceGained} XP and ${tokensWon} tokens!`
          : `You lost the battle but gained ${experienceGained} XP. You lost ${tokensLost} tokens.`,
        variant: win ? "default" : "destructive",
      })
    } catch (error) {
      console.error("Battle error:", error)
      toast({
        title: "Error",
        description: "Something went wrong during the battle.",
        variant: "destructive",
      })
    } finally {
      setIsBattling(false)
    }
  }

  const handleTraining = async () => {
    if (!warrior || (balance || 0) < 1) return

    setIsTraining(true)
    try {
      // Spend 1 token for training
      const {
        data: { user },
      } = await supabase.auth.getUser()

      await fetch(`/api/holders/${user?.id}/spend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount: 1 }),
      })

      // Update balance
      const response = await fetch(`/api/holders/${user?.id}/balance`)
      if (response.ok) {
        const data = await response.json()
        setBalance(data.balance)
      }

      // Update warrior stats - training always gives XP
      const experienceGained = 15
      const updatedWarrior = {
        ...warrior,
        stats: {
          ...warrior.stats,
          experience: warrior.stats.experience + experienceGained,
        },
      }

      // Check if warrior leveled up
      const experienceNeeded = warrior.stats.level * 20
      if (updatedWarrior.stats.experience >= experienceNeeded) {
        updatedWarrior.stats.level += 1
        updatedWarrior.stats.experience = 0
      }

      // Update user metadata with new stats
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          warrior: updatedWarrior,
        },
      })

      if (updateError) {
        throw new Error("Failed to update warrior stats")
      }

      setWarrior(updatedWarrior)

      toast({
        title: "Training Complete!",
        description: `Your warrior gained ${experienceGained} XP from training.`,
      })
    } catch (error) {
      console.error("Training error:", error)
      toast({
        title: "Error",
        description: "Something went wrong during training.",
        variant: "destructive",
      })
    } finally {
      setIsTraining(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  // Get color based on warrior type
  const getWarriorColor = (type: string) => {
    switch (type) {
      case "fire":
        return "bg-red-500"
      case "water":
        return "bg-blue-500"
      case "earth":
        return "bg-green-500"
      case "air":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  // Calculate XP progress percentage
  const calculateXpProgress = () => {
    if (!warrior) return 0
    const experienceNeeded = warrior.stats.level * 20
    return (warrior.stats.experience / experienceNeeded) * 100
  }

  if (isLoading) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading your warrior...</p>
      </div>
    )
  }

  if (!warrior) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-screen gap-4">
        <p>No warrior found. Please create one.</p>
        <Button onClick={() => router.push("/warrior-selection")}>Create Warrior</Button>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Warbit</h1>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className={`h-24 ${getWarriorColor(warrior.type)} rounded-t-lg flex items-center justify-center`}>
            <span className="text-white text-2xl font-bold">{warrior.name}</span>
          </div>
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>{warrior.ticker}</CardTitle>
              <div className="px-3 py-1 bg-gray-100 rounded-full text-sm font-medium">Level {warrior.stats.level}</div>
            </div>
            <CardDescription className="capitalize">{warrior.type} Warrior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Experience</span>
                <span>
                  {warrior.stats.experience} / {warrior.stats.level * 20} XP
                </span>
              </div>
              <Progress value={calculateXpProgress()} className="h-2" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-green-50 p-2 rounded">
                <p className="text-xs text-green-600">Wins</p>
                <p className="text-xl font-bold">{warrior.stats.wins}</p>
              </div>
              <div className="bg-red-50 p-2 rounded">
                <p className="text-xs text-red-600">Losses</p>
                <p className="text-xl font-bold">{warrior.stats.losses}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Token Balance</p>
                <p className="text-2xl font-bold">{balance}</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={async () => {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser()
                  if (user) {
                    const response = await fetch(`/api/holders/${user.id}/balance`)
                    if (response.ok) {
                      const data = await response.json()
                      setBalance(data.balance)
                    }
                  }
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Battle or train your warrior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Button className="w-full" onClick={handleBattle} disabled={isBattling}>
                {isBattling ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Battling...
                  </>
                ) : (
                  <>
                    <Swords className="mr-2 h-4 w-4" />
                    Battle (Free)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Battle other warriors to gain XP and tokens. You might lose tokens if defeated!
              </p>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={handleTraining}
                disabled={isTraining || (balance || 0) < 1}
              >
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Train (1 Token)
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground">
                Spend 1 token to train your warrior and gain guaranteed XP.
              </p>
            </div>

            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2 flex items-center">
                <Award className="mr-2 h-4 w-4" />
                Leaderboard Position
              </h3>
              <p className="text-sm">
                Your warrior is ranked{" "}
                <span className="font-bold">#{warrior.stats.wins * 10 + warrior.stats.level}</span> based on wins and
                level.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

