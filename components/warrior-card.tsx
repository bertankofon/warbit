"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Shield, Sword } from "lucide-react"

interface WarriorCardProps {
  warrior: any
  onBattle: () => void
}

export default function WarriorCard({ warrior, onBattle }: WarriorCardProps) {
  return (
    <Card className="bg-gray-800 border-gray-700 overflow-hidden">
      <div className="h-2 bg-yellow-500"></div>
      <CardContent className="pt-6">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-700 mb-2">
            <span className="text-2xl">{warrior.name.charAt(0)}</span>
          </div>
          <h3 className="text-lg font-bold">{warrior.name}</h3>
          <p className="text-sm text-gray-400">{warrior.token_symbol}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Sword className="h-4 w-4 mr-2 text-green-400" />
            <span>Wins: {warrior.wins || 0}</span>
          </div>
          <div className="flex items-center">
            <Shield className="h-4 w-4 mr-2 text-red-400" />
            <span>Losses: {warrior.losses || 0}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onBattle} className="w-full bg-green-500 hover:bg-green-600 text-black">
          Battle
        </Button>
      </CardFooter>
    </Card>
  )
}

