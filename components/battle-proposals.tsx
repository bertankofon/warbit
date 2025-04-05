"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Sword, Shield, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import BattleGameModal from "@/components/battle-game-modal"

interface BattleProposalsProps {
  userId: string
  warriorId: string
}

export default function BattleProposals({ userId, warriorId }: BattleProposalsProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [proposals, setProposals] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [activeBattle, setActiveBattle] = useState<any>(null)
  const [showBattleGame, setShowBattleGame] = useState(false)

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    setLoading(true)
    try {
      // Get battle proposals where this user is the opponent
      const { data: proposalsData, error } = await supabase
        .from("battle_proposals")
        .select("*")
        .eq("opponent_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })

      if (error) throw error

      // If we have proposals, fetch the related warrior data separately
      if (proposalsData && proposalsData.length > 0) {
        const enhancedProposals = await Promise.all(
          proposalsData.map(async (proposal) => {
            // Get challenger warrior data
            const { data: challengerWarrior } = await supabase
              .from("warriors")
              .select("*")
              .eq("id", proposal.challenger_warrior_id)
              .single()

            // Get opponent warrior data
            const { data: opponentWarrior } = await supabase
              .from("warriors")
              .select("*")
              .eq("id", proposal.opponent_warrior_id)
              .single()

            return {
              ...proposal,
              challenger: {
                id: proposal.challenger_id,
                user_metadata: {
                  warrior_name: challengerWarrior?.name || "Unknown Warrior",
                },
              },
              challenger_warrior: challengerWarrior || { name: "Unknown", token_symbol: "???" },
              opponent: {
                id: userId,
                user_metadata: {
                  warrior_name: opponentWarrior?.name || "Your Warrior",
                },
              },
              opponent_warrior: opponentWarrior || { name: "Your Warrior", token_symbol: "???" },
            }
          }),
        )

        setProposals(enhancedProposals)
      } else {
        setProposals([])
      }
    } catch (err) {
      console.error("Error fetching battle proposals:", err)
      setError("Failed to load battle proposals")
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (proposalId: string) => {
    try {
      // First, get the proposal details
      const { data: proposal, error: proposalError } = await supabase
        .from("battle_proposals")
        .select("*")
        .eq("id", proposalId)
        .single()

      if (proposalError) throw proposalError

      // Update proposal status to accepted
      const { error: updateError } = await supabase
        .from("battle_proposals")
        .update({ status: "accepted" })
        .eq("id", proposalId)

      if (updateError) throw updateError

      // Get challenger warrior data
      const { data: challengerWarrior, error: challengerError } = await supabase
        .from("warriors")
        .select("*")
        .eq("id", proposal.challenger_warrior_id)
        .single()

      if (challengerError) throw challengerError

      // Get opponent warrior data
      const { data: opponentWarrior, error: opponentError } = await supabase
        .from("warriors")
        .select("*")
        .eq("id", proposal.opponent_warrior_id)
        .single()

      if (opponentError) throw opponentError

      // Create battle record
      const { data: battle, error: battleError } = await supabase
        .from("battles")
        .insert({
          proposal_id: proposalId,
          challenger_id: proposal.challenger_id,
          challenger_warrior_id: proposal.challenger_warrior_id,
          opponent_id: proposal.opponent_id,
          opponent_warrior_id: proposal.opponent_warrior_id,
          stake_amount: proposal.stake_amount,
          status: "in_progress",
          turns: [],
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (battleError) throw battleError

      // Construct the complete battle object with related data
      const completeBattle = {
        ...battle,
        challenger: {
          id: proposal.challenger_id,
          user_metadata: { warrior_name: challengerWarrior.name },
        },
        challenger_warrior: challengerWarrior,
        opponent: {
          id: proposal.opponent_id,
          user_metadata: { warrior_name: opponentWarrior.name },
        },
        opponent_warrior: opponentWarrior,
      }

      setActiveBattle(completeBattle)
      setShowBattleGame(true)
      console.log("Opening battle game modal:", activeBattle)

      // Remove from proposals list
      setProposals(proposals.filter((p) => p.id !== proposalId))

      // Add this debug code
      if (completeBattle) {
        console.log("Battle created:", completeBattle)

        // If the modal doesn't open automatically, we can try to force it
        setTimeout(() => {
          console.log("Forcing battle game modal to open")
          setShowBattleGame(true)
        }, 500)
      }

      // Remove from proposals list
      setProposals(proposals.filter((p) => p.id !== proposalId))
    } catch (err) {
      console.error("Error accepting battle:", err)
      setError("Failed to accept battle")
    }
  }

  const handleDecline = async (proposalId: string) => {
    try {
      // Update proposal status to declined
      const { error } = await supabase.from("battle_proposals").update({ status: "declined" }).eq("id", proposalId)

      if (error) throw error

      // Remove from proposals list
      setProposals(proposals.filter((p) => p.id !== proposalId))
    } catch (err) {
      console.error("Error declining battle:", err)
      setError("Failed to decline battle")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (proposals.length === 0) {
    return <div className="text-center py-6 text-gray-400">No battle proposals at the moment</div>
  }

  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <Card key={proposal.id} className="bg-gray-800 border-yellow-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-400 flex items-center">
              <Sword className="h-5 w-5 mr-2" />
              Battle Challenge
            </CardTitle>
            <CardDescription>
              {proposal.challenger?.user_metadata?.warrior_name || "Unknown Warrior"} has challenged you to a battle!
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="flex justify-between items-center">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                  <span>{proposal.challenger?.user_metadata?.warrior_name?.charAt(0) || "?"}</span>
                </div>
                <div className="text-sm font-bold">{proposal.challenger?.user_metadata?.warrior_name || "Unknown"}</div>
                <div className="text-xs text-gray-400">{proposal.challenger_warrior?.token_symbol}</div>
              </div>

              <div className="text-center">
                <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-md mb-1">
                  {proposal.stake_amount} ETH
                </div>
                <div className="text-xs text-gray-400">Stake Amount</div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                  <span>{proposal.opponent?.user_metadata?.warrior_name?.charAt(0) || "?"}</span>
                </div>
                <div className="text-sm font-bold">{proposal.opponent?.user_metadata?.warrior_name || "You"}</div>
                <div className="text-xs text-gray-400">{proposal.opponent_warrior?.token_symbol}</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-gray-400 text-center">
              Proposed {new Date(proposal.created_at).toLocaleString()}
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleDecline(proposal.id)}
              className="flex-1 border-red-500 text-red-400 hover:bg-red-900/30"
            >
              <Shield className="h-4 w-4 mr-2" />
              Decline
            </Button>
            <Button
              onClick={() => handleAccept(proposal.id)}
              className="flex-1 bg-green-500 hover:bg-green-600 text-black"
            >
              <Sword className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </CardFooter>
        </Card>
      ))}

      {showBattleGame && activeBattle && (
        <BattleGameModal battle={activeBattle} onClose={() => setShowBattleGame(false)} />
      )}
    </div>
  )
}

