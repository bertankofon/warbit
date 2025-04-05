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
import { Loader2, Sword, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ElementalIcon from "./elemental-icon"
import type { ElementType } from "@/components/elemental-warrior-selector"

interface BattleModalProps {
  opponent: any
  myWarrior: any
  onClose: () => void
}

export default function BattleModal({ opponent, myWarrior, onClose }: BattleModalProps) {
  const supabase = createClientComponentClient()
  const [stakeAmount, setStakeAmount] = useState<string>("0.01")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and decimals
    const value = e.target.value.replace(/[^0-9.]/g, "")
    setStakeAmount(value)
  }

  const handleProposeBattle = async () => {
    if (!stakeAmount || Number.parseFloat(stakeAmount) <= 0) {
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

      // Create battle proposal
      const { error: proposalError } = await supabase.from("battle_proposals").insert({
        challenger_id: session.user.id,
        challenger_warrior_id: myWarrior.id,
        opponent_id: opponent.user_id,
        opponent_warrior_id: opponent.id,
        stake_amount: Number.parseFloat(stakeAmount),
        status: "pending",
        created_at: new Date().toISOString(),
      })

      if (proposalError) throw proposalError

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
              <div className="space-y-2">
                <Label htmlFor="stakeAmount" className="text-white">
                  Stake Amount (ETH)
                </Label>
                <Input
                  id="stakeAmount"
                  type="text"
                  value={stakeAmount}
                  onChange={handleStakeChange}
                  className="bg-gray-800 border-gray-700 text-white"
                  placeholder="0.01"
                />
                <p className="text-xs text-gray-400">
                  This amount will be staked for the battle. If you win, you'll receive your stake back plus the
                  opponent's stake.
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
                Your battle challenge has been sent to {opponent.name}. You'll be notified when they respond.
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
                    Proposing...
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

