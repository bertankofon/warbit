"use client"
import { useState, useEffect } from "react"
import DinoBattleModal from "./dino-battle-modal"
import FlappyBirdModal from "./flappy-bird-modal"
import FormulaModal from "./formula-modal"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { GameType } from "./battle-modal"

interface BattleGameModalProps {
  battle: any
  onClose: () => void
}

export default function BattleGameModal({ battle, onClose }: BattleGameModalProps) {
  const [gameType, setGameType] = useState<GameType>("dino")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const fetchBattleDetails = async () => {
      try {
        // First try to get the game type from the battle object
        if (battle.game_type) {
          console.log("Game type from battle object:", battle.game_type)
          setGameType(battle.game_type as GameType)
          return
        }

        // If not available, try to get it from the proposal
        if (battle.proposal_id) {
          const { data, error } = await supabase
            .from("battle_proposals")
            .select("game_type")
            .eq("id", battle.proposal_id)
            .single()

          if (!error && data && data.game_type) {
            console.log("Game type from proposal:", data.game_type)
            setGameType(data.game_type as GameType)
            return
          }
        }

        // Check localStorage as a fallback
        if (battle.challenger_id && battle.opponent_id) {
          const storedGameType = localStorage.getItem(`battle_game_type_${battle.challenger_id}_${battle.opponent_id}`)
          if (storedGameType) {
            console.log("Game type from localStorage:", storedGameType)
            setGameType(storedGameType as GameType)
            return
          }
        }

        // Default to dino if game_type is not available
        console.log("Game type not found, defaulting to dino")
        setGameType("dino")
      } catch (error) {
        console.error("Error fetching battle details:", error)
        // Default to dino on error
        setGameType("dino")
      }
    }

    fetchBattleDetails()
  }, [battle, supabase])

  // Render the appropriate game based on the game type
  switch (gameType) {
    case "flappy":
      console.log("Rendering Flappy Bird game")
      return <FlappyBirdModal battle={battle} onClose={onClose} />
    case "formula":
      console.log("Rendering Formula Racer game")
      return <FormulaModal battle={battle} onClose={onClose} />
    case "dino":
    default:
      console.log("Rendering Dino Runner game")
      return <DinoBattleModal battle={battle} onClose={onClose} />
  }
}

