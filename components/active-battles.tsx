"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Sword } from "lucide-react"
import BattleGameModal from "@/components/battle-game-modal"

interface ActiveBattlesProps {
  userId: string
}

export default function ActiveBattles({ userId }: ActiveBattlesProps) {
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [battles, setBattles] = useState<any[]>([])
  const [activeBattle, setActiveBattle] = useState<any>(null)
  const [showBattleGame, setShowBattleGame] = useState(false)

  useEffect(() => {
    fetchActiveBattles()
  }, [])

  const fetchActiveBattles = async () => {
    setLoading(true)
    try {
      // Get battles where this user is either challenger or opponent
      const { data: battlesData, error } = await supabase
        .from("battles")
        .select("*")
        .or(`challenger_id.eq.${userId},opponent_id.eq.${userId}`)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })

      if (error) throw error

      // If we have battles, fetch the related warrior data separately
      if (battlesData && battlesData.length > 0) {
        const enhancedBattles = await Promise.all(
          battlesData.map(async (battle) => {
            // Get challenger warrior data
            const { data: challengerWarrior } = await supabase
              .from("warriors")
              .select("*")
              .eq("id", battle.challenger_warrior_id)
              .single()

            // Get opponent warrior data
            const { data: opponentWarrior } = await supabase
              .from("warriors")
              .select("*")
              .eq("id", battle.opponent_warrior_id)
              .single()

            // Get challenger user data
            const { data: challengerUser } = await supabase.auth.admin.getUserById(battle.challenger_id)

            // Get opponent user data
            const { data: opponentUser } = await supabase.auth.admin.getUserById(battle.opponent_id)

            return {
              ...battle,
              challenger: challengerUser?.user || {
                id: battle.challenger_id,
                user_metadata: { warrior_name: challengerWarrior?.name || "Unknown" },
              },
              challenger_warrior: challengerWarrior || { name: "Unknown", token_symbol: "???" },
              opponent: opponentUser?.user || {
                id: battle.opponent_id,
                user_metadata: { warrior_name: opponentWarrior?.name || "Unknown" },
              },
              opponent_warrior: opponentWarrior || { name: "Unknown", token_symbol: "???" },
            }
          }),
        )

        setBattles(enhancedBattles)
      } else {
        setBattles([])
      }
    } catch (err) {
      console.error("Error fetching active battles:", err)

      // Create mock data for preview mode
      setBattles([
        {
          id: "preview-battle-1",
          challenger_id: "preview-challenger-1",
          challenger_warrior_id: "preview-challenger-warrior-1",
          opponent_id: userId,
          opponent_warrior_id: "preview-opponent-warrior-1",
          stake_amount: 0.05,
          status: "in_progress",
          turns: [],
          created_at: new Date().toISOString(),
          challenger: {
            id: "preview-challenger-1",
            user_metadata: { warrior_name: "Pixel Crusher" },
          },
          challenger_warrior: {
            name: "Pixel Crusher",
            token_symbol: "PIXL",
          },
          opponent: {
            id: userId,
            user_metadata: { warrior_name: "Your Warrior" },
          },
          opponent_warrior: {
            name: "Your Warrior",
            token_symbol: "YOUR",
          },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleContinueBattle = (battle: any) => {
    setActiveBattle(battle)
    setShowBattleGame(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (battles.length === 0) {
    return <div className="text-center py-6 text-gray-400">No active battles</div>
  }

  return (
    <div className="space-y-4">
      {battles.map((battle) => (
        <div key={battle.id} className="pixel-border bg-gray-900">
          <div className="bg-black p-4">
            <div className="flex items-center mb-2">
              <Sword className="h-5 w-5 mr-2 text-yellow-400" />
              <h3 className="text-yellow-400 pixel-font">ACTIVE BATTLE</h3>
            </div>
            <p className="text-gray-400 text-sm mb-4 pixel-font">
              BATTLE BETWEEN {battle.challenger_warrior.name} AND {battle.opponent_warrior.name}
            </p>

            <div className="flex justify-between items-center mb-4">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                  <span className="pixel-font">{battle.challenger_warrior.name.charAt(0)}</span>
                </div>
                <div className="text-sm font-bold pixel-font">{battle.challenger_warrior.name}</div>
                <div className="text-xs text-gray-400 pixel-font">{battle.challenger_warrior.token_symbol}</div>
              </div>

              <div className="text-center">
                <div className="bg-yellow-500 text-black font-bold px-3 py-1 pixel-font">{battle.stake_amount} ETH</div>
                <div className="text-xs text-gray-400 pixel-font">STAKE</div>
              </div>

              <div className="text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                  <span className="pixel-font">{battle.opponent_warrior.name.charAt(0)}</span>
                </div>
                <div className="text-sm font-bold pixel-font">{battle.opponent_warrior.name}</div>
                <div className="text-xs text-gray-400 pixel-font">{battle.opponent_warrior.token_symbol}</div>
              </div>
            </div>

            <div className="mt-3 text-xs text-gray-400 text-center pixel-font">
              STARTED {new Date(battle.created_at).toLocaleString()}
            </div>

            <div className="mt-4">
              <button onClick={() => handleContinueBattle(battle)} className="w-full pixel-button pixel-button-green">
                <Sword className="h-4 w-4 mr-2 inline-block" />
                CONTINUE BATTLE
              </button>
            </div>
          </div>
        </div>
      ))}

      {showBattleGame && activeBattle && (
        <BattleGameModal battle={activeBattle} onClose={() => setShowBattleGame(false)} />
      )}
    </div>
  )
}

