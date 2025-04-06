"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Sword, AlertCircle, Coins } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ElementalIcon from "./elemental-icon"
import type { ElementType } from "@/components/elemental-warrior-selector"

// Define the game types
export type GameType = "dino" | "flappy" | "formula"

interface BattleModalProps {
  opponent: any
  myWarrior: any
  onClose: () => void
}

export default function BattleModal({ opponent, myWarrior, onClose }: BattleModalProps) {
  const supabase = createClientComponentClient()
  const [stakeAmount, setStakeAmount] = useState<string>("100")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [selectedGame, setSelectedGame] = useState<GameType>("dino")

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers
    const value = e.target.value.replace(/[^0-9]/g, "")
    setStakeAmount(value)
  }

  const handleProposeBattle = async () => {
    if (!stakeAmount || Number.parseInt(stakeAmount) <= 0) {
      setError("Please enter a valid stake amount")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get current user
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("You must be logged in to propose a battle")
      }

      // Store the selected game type in a local variable to ensure it's used consistently
      const gameType = selectedGame
      console.log("Proposing battle with game type:", gameType)

      // First try to insert with game_type
      try {
        const { error: proposalError } = await supabase.from("battle_proposals").insert({
          challenger_id: session.user.id,
          challenger_warrior_id: myWarrior.id,
          opponent_id: opponent.user_id,
          opponent_warrior_id: opponent.id,
          stake_amount: Number.parseInt(stakeAmount),
          status: "pending",
          created_at: new Date().toISOString(),
          game_type: gameType, // Use the local variable
        })

        if (proposalError) {
          // If error mentions game_type column, try without it
          if (proposalError.message && proposalError.message.includes("game_type")) {
            console.log("game_type column not found, trying without it")

            // Store the game type in localStorage as a workaround
            localStorage.setItem(`battle_game_type_${session.user.id}_${opponent.user_id}`, gameType)

            const { error: retryError } = await supabase.from("battle_proposals").insert({
              challenger_id: session.user.id,
              challenger_warrior_id: myWarrior.id,
              opponent_id: opponent.user_id,
              opponent_warrior_id: opponent.id,
              stake_amount: Number.parseInt(stakeAmount),
              status: "pending",
              created_at: new Date().toISOString(),
              // game_type removed
            })

            if (retryError) throw retryError
          } else {
            throw proposalError
          }
        }
      } catch (err) {
        throw err
      }

      setSuccess(true)
    } catch (err) {
      console.error("Error proposing battle:", err)
      setError(err instanceof Error ? err.message : "Failed to propose battle")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border-yellow-500 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-yellow-400 pixel-font">BATTLE CHALLENGE</DialogTitle>
          <DialogDescription>Challenge {opponent.name} to a battle!</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-between items-center mb-6">
            <div className="text-center">
              <div className="mb-2">
                {myWarrior.element_type ? (
                  <ElementalIcon elementType={myWarrior.element_type as ElementType} size="md" />
                ) : (
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 mb-2 border-2 border-yellow-500">
                    <span className="text-2xl">{myWarrior.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="font-bold">{myWarrior.name}</div>
              <div className="text-xs text-gray-400">{myWarrior.token_symbol}</div>
            </div>

            <div className="flex items-center justify-center">
              <Sword className="h-8 w-8 text-yellow-500" />
            </div>

            <div className="text-center">
              <div className="mb-2">
                {opponent.element_type ? (
                  <ElementalIcon elementType={opponent.element_type as ElementType} size="md" />
                ) : (
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 mb-2 border-2 border-green-500">
                    <span className="text-2xl">{opponent.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <div className="font-bold">{opponent.name}</div>
              <div className="text-xs text-gray-400">{opponent.token_symbol}</div>
            </div>
          </div>

          {!success ? (
            <div className="space-y-4">
              {/* Game Selection with Images */}
              <div className="space-y-2">
                <Label htmlFor="gameType" className="text-white">
                  Select Game Type
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Dino Runner Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedGame("dino")}
                    className={`p-3 rounded-lg transition-all ${
                      selectedGame === "dino"
                        ? "bg-yellow-500 border-4 border-yellow-300"
                        : "bg-gray-800 border-2 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mb-2 bg-green-800 rounded-lg flex items-center justify-center">
                        <div className="w-10 h-10 bg-green-600 rounded-full relative">
                          {/* Simple dinosaur pixel art */}
                          <div className="absolute top-1 left-1 w-2 h-2 bg-white rounded-full"></div>
                          <div className="absolute bottom-0 left-0 w-10 h-3 bg-green-700"></div>
                          <div className="absolute top-0 right-0 w-4 h-2 bg-green-700"></div>
                        </div>
                      </div>
                      <span className="text-sm pixel-font">Dino Runner</span>
                    </div>
                  </button>

                  {/* Flappy Bird Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedGame("flappy")}
                    className={`p-3 rounded-lg transition-all ${
                      selectedGame === "flappy"
                        ? "bg-yellow-500 border-4 border-yellow-300"
                        : "bg-gray-800 border-2 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mb-2 bg-blue-800 rounded-lg flex items-center justify-center">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full relative">
                          {/* Simple bird pixel art */}
                          <div className="absolute top-2 left-2 w-2 h-2 bg-black rounded-full"></div>
                          <div className="absolute top-4 right-1 w-4 h-2 bg-orange-600"></div>
                          <div className="absolute bottom-1 right-2 w-6 h-2 bg-yellow-600"></div>
                        </div>
                      </div>
                      <span className="text-sm pixel-font">Flappy Bird</span>
                    </div>
                  </button>

                  {/* Formula Racer Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedGame("formula")}
                    className={`p-3 rounded-lg transition-all ${
                      selectedGame === "formula"
                        ? "bg-yellow-500 border-4 border-yellow-300"
                        : "bg-gray-800 border-2 border-gray-700 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mb-2 bg-red-800 rounded-lg flex items-center justify-center">
                        <div className="w-10 h-10 bg-red-600 relative">
                          {/* Simple car pixel art */}
                          <div className="absolute top-0 left-2 right-2 h-3 bg-black rounded-t-sm"></div>
                          <div className="absolute bottom-0 left-0 w-2 h-2 bg-black rounded-full"></div>
                          <div className="absolute bottom-0 right-0 w-2 h-2 bg-black rounded-full"></div>
                        </div>
                      </div>
                      <span className="text-sm pixel-font">Formula Racer</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="stakeAmount" className="text-white flex items-center">
                  <Coins className="h-4 w-4 mr-2" />
                  Stake Amount ({myWarrior.token_symbol})
                </Label>
                <Input
                  id="stakeAmount"
                  type="text"
                  value={stakeAmount}
                  onChange={handleStakeChange}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="100"
                />
                <div className="flex justify-between text-xs">
                  <p className="text-gray-400">
                    Your balance:{" "}
                    <span className="text-green-400">
                      {myWarrior.token_balance?.toLocaleString() || 0} {myWarrior.token_symbol}
                    </span>
                  </p>
                  <button
                    className="text-blue-400 hover:underline"
                    onClick={() => setStakeAmount(Math.min(myWarrior.token_balance || 0, 1000).toString())}
                  >
                    Max: 1000
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  This amount of {myWarrior.token_symbol} tokens will be staked for the battle. If you win, you'll
                  receive your tokens back plus {opponent.token_symbol} tokens from your opponent.
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="bg-green-900/30 border border-green-500 p-4 rounded-md text-center">
              <p className="text-green-400 font-bold">Battle proposal sent!</p>
              <p className="text-gray-300 text-sm mt-2">
                Your battle challenge has been sent to {opponent.name}. You've staked {stakeAmount}{" "}
                {myWarrior.token_symbol} tokens. You'll be notified when they respond.
              </p>
              <p className="text-gray-300 text-sm mt-2">
                Game type:{" "}
                {selectedGame === "dino" ? "Dino Runner" : selectedGame === "flappy" ? "Flappy Bird" : "Formula Racer"}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!success ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1 border-gray-700 hover:bg-gray-800">
                Cancel
              </Button>
              <Button
                onClick={handleProposeBattle}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Staking...
                  </>
                ) : (
                  "Propose Battle"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600 text-black">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

