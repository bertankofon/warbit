"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

const WARRIOR_TYPES = [
  {
    id: "fire",
    name: "Fire Warrior",
    description: "Masters of flame and destruction",
    color: "bg-red-500",
    strengths: "Strong against Earth",
    weaknesses: "Weak against Water",
  },
  {
    id: "water",
    name: "Water Warrior",
    description: "Fluid and adaptable fighters",
    color: "bg-blue-500",
    strengths: "Strong against Fire",
    weaknesses: "Weak against Earth",
  },
  {
    id: "earth",
    name: "Earth Warrior",
    description: "Solid and powerful defenders",
    color: "bg-green-500",
    strengths: "Strong against Water",
    weaknesses: "Weak against Air",
  },
  {
    id: "air",
    name: "Air Warrior",
    description: "Swift and elusive combatants",
    color: "bg-purple-500",
    strengths: "Strong against Earth",
    weaknesses: "Weak against Fire",
  },
]

export default function WarriorSelectionPage() {
  const [selectedWarrior, setSelectedWarrior] = useState<string | null>(null)
  const [warriorName, setWarriorName] = useState("")
  const [warriorTicker, setWarriorTicker] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedWarrior || !warriorName || !warriorTicker) {
      toast({
        title: "Missing information",
        description: "Please select a warrior type and provide a name and ticker",
        variant: "destructive",
      })
      return
    }

    if (warriorTicker.length > 5) {
      toast({
        title: "Invalid ticker",
        description: "Ticker must be 5 characters or less",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Save warrior data to API
      const response = await fetch("/api/warriors/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedWarrior,
          name: warriorName,
          ticker: warriorTicker.toUpperCase(),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create warrior")
      }

      toast({
        title: "Warrior created!",
        description: `Your ${selectedWarrior} warrior ${warriorName} is ready for battle!`,
      })

      // Redirect to game dashboard
      router.push("/game")
    } catch (error) {
      console.error("Error creating warrior:", error)
      toast({
        title: "Error",
        description: "Failed to create your warrior. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-4xl py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Choose Your Warrior</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {WARRIOR_TYPES.map((warrior) => (
            <Card
              key={warrior.id}
              className={`cursor-pointer transition-all ${
                selectedWarrior === warrior.id
                  ? `border-4 border-${warrior.color.split("-")[1]}-500 shadow-lg`
                  : "border hover:shadow-md"
              }`}
              onClick={() => setSelectedWarrior(warrior.id)}
            >
              <div className={`h-24 ${warrior.color} rounded-t-lg flex items-center justify-center`}>
                <span className="text-white text-2xl font-bold">{warrior.name}</span>
              </div>
              <CardContent className="pt-4">
                <p>{warrior.description}</p>
                <div className="mt-2 text-sm">
                  <p className="text-green-600">{warrior.strengths}</p>
                  <p className="text-red-600">{warrior.weaknesses}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Name Your Warrior</CardTitle>
            <CardDescription>Give your warrior a unique name and ticker symbol</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warriorName">Warrior Name</Label>
              <Input
                id="warriorName"
                value={warriorName}
                onChange={(e) => setWarriorName(e.target.value)}
                placeholder="Enter a name for your warrior"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warriorTicker">Ticker Symbol (max 5 characters)</Label>
              <Input
                id="warriorTicker"
                value={warriorTicker}
                onChange={(e) => setWarriorTicker(e.target.value.toUpperCase())}
                placeholder="FIRE"
                maxLength={5}
                className="uppercase"
                required
              />
              <p className="text-xs text-muted-foreground">This will be your warrior's unique identifier in battles</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={!selectedWarrior || !warriorName || !warriorTicker || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Warrior...
                </>
              ) : (
                "Create Warrior"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

