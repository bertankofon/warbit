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
import { useWeb3 } from "@/lib/web3-context"
import WalletConnect from "./wallet-connect"

interface BattleModalProps {
  opponent: any
  myWarrior: any
  onClose: () => void
}

export default function BattleModal({ opponent, myWarrior, onClose }: BattleModalProps) {
  const supabase = createClientComponentClient()
  const { isConnected, address, balance, stakeBattle } = useWeb3()
  const [stakeAmount, setStakeAmount] = useState<string>("0.01")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

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

    if (!isConnected) {
      setError("Please connect your wallet first")
      return
    }

    // Check if user has enough balance
    if (Number.parseFloat(balance) < Number.parseFloat(stakeAmount)) {
      setError(`Insufficient balance. You have ${Number.parseFloat(balance).toFixed(4)} ETH`)
      return
    }

    // Check if we're in preview mode
    const isPreviewMode = process.env.NODE_ENV === "development" && !supabase.auth.admin
    if (isPreviewMode) {
      console.log("Running in preview mode, using simulated battle proposal")

      // Simulate a successful battle proposal
      setSuccess(true)
      setLoading(false)
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

      // Get opponent's wallet address
      let opponentAddress = "0x0000000000000000000000000000000000000000" // Default fallback address

      try {
        const { data: opponentUser } = await supabase.auth.admin.getUserById(opponent.user_id)

        // Check if we got valid data
        if (
          opponentUser &&
          opponentUser.user &&
          opponentUser.user.user_metadata &&
          opponentUser.user.user_metadata.wallet_address
        ) {
          opponentAddress = opponentUser.user.user_metadata.wallet_address
        } else {
          console.log("Opponent wallet address not found in user metadata, using fallback")

          // Try to get the address from the opponent object directly if available
          if (opponent.wallet_address) {
            opponentAddress = opponent.wallet_address
          } else {
            // In preview mode, we'll use a mock address
            console.log("Using mock address for preview mode")
          }
        }
      } catch (error) {
        console.error("Error fetching opponent user data:", error)
        console.log("Using fallback address for preview mode")
      }

      // Create battle proposal in database
      const { data: proposalData, error: proposalError } = await supabase
        .from("battle_proposals")
        .insert({
          challenger_id: session.user.id,
          challenger_warrior_id: myWarrior.id,
          opponent_id: opponent.user_id,
          opponent_warrior_id: opponent.id,
          stake_amount: Number.parseFloat(stakeAmount),
          status: "pending",
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (proposalError) throw proposalError

      console.log("Battle proposal created:", proposalData)

      try {
        // Get token addresses
        const myTokenAddress = myWarrior.token_address
        const opponentTokenAddress = opponent.token_address

        // Stake ETH for the battle
        const success = await stakeBattle(
          proposalData.id,
          stakeAmount,
          opponentAddress,
          myTokenAddress,
          opponentTokenAddress,
        )

        if (!success) {
          // If staking fails, delete the proposal
          await supabase.from("battle_proposals").delete().eq("id", proposalData.id)
          throw new Error("Failed to stake ETH for the battle")
        }

        setSuccess(true)
      } catch (stakeError) {
        // If staking fails, delete the proposal
        console.error("Staking error:", stakeError)
        await supabase.from("battle_proposals").delete().eq("id", proposalData.id)
        throw stakeError
      }
    } catch (err) {
      console.error("Error proposing battle:", err)

      // Provide more specific error messages
      if (err instanceof Error) {
        if (err.message.includes("admin.getUserById")) {
          setError("Unable to get opponent data. This may happen in preview mode.")
        } else if (err.message.includes("wallet_address")) {
          setError("Opponent wallet address not found. Make sure both users have wallet addresses set.")
        } else {
          setError(err.message)
        }
      } else {
        setError("Failed to propose battle")
      }
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
              {!isConnected && (
                <div className="mb-4">
                  <WalletConnect />
                </div>
              )}

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
                  This amount will be staked for the battle. If you win, your warrior's token will receive liquidity
                  with this ETH.
                </p>
                {isConnected && (
                  <p className="text-xs text-green-400">Your balance: {Number.parseFloat(balance).toFixed(4)} ETH</p>
                )}
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
              {transactionHash && (
                <p className="text-xs text-gray-400 mt-2">
                  Transaction: {transactionHash.substring(0, 10)}...
                  {transactionHash.substring(transactionHash.length - 8)}
                </p>
              )}
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
                disabled={loading || !isConnected}
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

