"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, AlertCircle, Trophy } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import FlappyBird from "./flappy-bird"
import ElementalIcon from "./elemental-icon"
import type { ElementType } from "@/components/elemental-warrior-selector"

interface FlappyBirdModalProps {
  battle: any
  onClose: () => void
}

export default function FlappyBirdModal({ battle, onClose }: FlappyBirdModalProps) {
  const supabase = createClientComponentClient()
  const [isChallenger, setIsChallenger] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Game state
  const [challengerScore, setChallengerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"challenger" | "opponent" | "draw" | null>(null)
  const [battleData, setBattleData] = useState<any>(null)
  const [currentTurn, setCurrentTurn] = useState<"challenger" | "opponent" | null>(null)
  const [myTurn, setMyTurn] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [gamePhase, setGamePhase] = useState<"waiting" | "playing" | "results">("waiting")
  const [debugInfo, setDebugInfo] = useState<any>({})

  // Get the element type for the current player
  const getMyElementType = (): ElementType => {
    if (isChallenger) {
      return (battle.challenger_warrior.element_type || "fire") as ElementType
    } else {
      return (battle.opponent_warrior.element_type || "water") as ElementType
    }
  }

  // Set up real-time subscription
  useEffect(() => {
    fetchBattleState()

    const battleSubscription = supabase
      .channel(`battle-${battle.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "battles",
          filter: `id=eq.${battle.id}`,
        },
        (payload) => {
          console.log("Battle updated:", payload)
          fetchBattleState()
        },
      )
      .subscribe()

    return () => {
      battleSubscription.unsubscribe()
    }
  }, [battle.id, supabase])

  const fetchBattleState = async () => {
    try {
      setLoading(true)
      const { data: currentBattle, error: battleError } = await supabase
        .from("battles")
        .select("*")
        .eq("id", battle.id)
        .single()

      if (battleError) throw battleError

      console.log("Current battle data:", currentBattle)
      setBattleData(currentBattle)

      const {
        data: { session },
      } = await supabase.auth.getSession()
      const userIsChallenger = session?.user?.id === battle.challenger_id
      setIsChallenger(userIsChallenger)

      if (currentBattle.turns && currentBattle.turns.length > 0) {
        processTurns(currentBattle.turns, userIsChallenger)
      } else {
        // Opponent starts first
        setCurrentTurn("opponent")
        setMyTurn(!userIsChallenger)
        setGamePhase(userIsChallenger ? "waiting" : "playing")
        setWaitingForOpponent(userIsChallenger)
      }
    } catch (err) {
      console.error("Error fetching battle state:", err)
      setError("Failed to load battle state")
    } finally {
      setLoading(false)
    }
  }

  const handleGameOver = async (score: number) => {
    console.log("Game over with score:", score)
    setLoading(true)

    try {
      // Update local state immediately for UI feedback
      if (isChallenger) {
        setChallengerScore(score)
      } else {
        setOpponentScore(score)
      }

      // Get current battle state
      const { data: currentBattle, error: battleError } = await supabase
        .from("battles")
        .select("*")
        .eq("id", battle.id)
        .single()

      if (battleError) throw battleError

      const turns = currentBattle.turns || []
      const updatedTurns = [...turns]
      const player = isChallenger ? "challenger" : "opponent"

      // Check if this player already has a turn
      const existingTurnIndex = updatedTurns.findIndex((t) => t.player === player)

      if (existingTurnIndex >= 0) {
        // Update existing turn with new score
        updatedTurns[existingTurnIndex] = {
          ...updatedTurns[existingTurnIndex],
          player,
          score: score,
          timestamp: new Date().toISOString(),
        }
      } else {
        // Add new turn with score
        updatedTurns.push({
          player,
          score: score,
          timestamp: new Date().toISOString(),
        })
      }

      console.log("Updating turns:", updatedTurns)

      // Update battle with new turns
      const { error: updateError } = await supabase.from("battles").update({ turns: updatedTurns }).eq("id", battle.id)

      if (updateError) throw updateError

      // Check if both players have played
      const challengerTurn = updatedTurns.find((t) => t.player === "challenger")
      const opponentTurn = updatedTurns.find((t) => t.player === "opponent")
      const bothPlayed = !!challengerTurn && !!opponentTurn

      if (bothPlayed) {
        // Get scores
        const cScore = challengerTurn?.score || 0
        const oScore = opponentTurn?.score || 0

        console.log("Both played. Challenger score:", cScore, "Opponent score:", oScore)

        // Update UI with final scores
        setChallengerScore(cScore)
        setOpponentScore(oScore)

        // Determine winner
        let battleWinner: "challenger" | "opponent" | "draw" = "draw"

        if (cScore > oScore) {
          battleWinner = "challenger"
        } else if (oScore > cScore) {
          battleWinner = "opponent"
        }

        console.log("Battle winner:", battleWinner)
        setWinner(battleWinner)
        setGameOver(true)
        setGamePhase("results")

        // Update battle status
        await updateBattleStatus(battleWinner)
      } else {
        // Switch turns
        setWaitingForOpponent(true)
        setGamePhase("waiting")
      }
    } catch (err) {
      console.error("Error saving score:", err)
      setError("Failed to save your score")
    } finally {
      setLoading(false)
    }
  }

  const processTurns = (turns: any[], isUserChallenger: boolean) => {
    if (!turns || turns.length === 0) {
      // Opponent starts first
      setCurrentTurn("opponent")
      setMyTurn(!isUserChallenger)
      setGamePhase(isUserChallenger ? "waiting" : "playing")
      setWaitingForOpponent(isUserChallenger)
      return
    }

    console.log("Processing turns:", turns)

    // Find turns for each player
    const challengerTurn = turns.find((turn) => turn.player === "challenger")
    const opponentTurn = turns.find((turn) => turn.player === "opponent")

    // Debug info
    setDebugInfo({
      turns,
      challengerTurn,
      opponentTurn,
      isUserChallenger,
    })

    // Check if each player has played and has a score
    const challengerPlayed = !!challengerTurn && challengerTurn.score !== undefined
    const opponentPlayed = !!opponentTurn && opponentTurn.score !== undefined

    console.log("Challenger played:", challengerPlayed, "Opponent played:", opponentPlayed)
    console.log("Challenger score:", challengerTurn?.score, "Opponent score:", opponentTurn?.score)

    // Update scores in UI
    if (challengerPlayed) {
      setChallengerScore(Number(challengerTurn.score))
    }

    if (opponentPlayed) {
      setOpponentScore(Number(opponentTurn.score))
    }

    // Determine current game state
    if (challengerPlayed && opponentPlayed) {
      // Both have played, show results
      setGamePhase("results")
      setGameOver(true)

      // Determine winner
      const cScore = Number(challengerTurn.score) || 0
      const oScore = Number(opponentTurn.score) || 0

      console.log("Final scores - Challenger:", cScore, "Opponent:", oScore)

      if (cScore > oScore) {
        setWinner("challenger")
      } else if (oScore > cScore) {
        setWinner("opponent")
      } else {
        setWinner("draw")
      }
    } else if (!opponentPlayed) {
      // Opponent needs to play first
      setCurrentTurn("opponent")
      setMyTurn(!isUserChallenger)
      setGamePhase(!isUserChallenger ? "playing" : "waiting")
      setWaitingForOpponent(isUserChallenger)
    } else if (!challengerPlayed) {
      // Then challenger plays
      setCurrentTurn("challenger")
      setMyTurn(isUserChallenger)
      setGamePhase(isUserChallenger ? "playing" : "waiting")
      setWaitingForOpponent(!isUserChallenger)
    }
  }

  const updateBattleStatus = async (battleWinner: "challenger" | "opponent" | "draw") => {
    try {
      await supabase
        .from("battles")
        .update({
          status: "completed",
          winner: battleWinner,
          challenger_health: battleWinner === "challenger" ? 100 : 0,
          opponent_health: battleWinner === "opponent" ? 100 : 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", battle.id)
    } catch (err) {
      console.error("Error updating battle status:", err)
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border-yellow-500 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-yellow-400 pixel-font">FLAPPY ELEMENTAL BATTLE</DialogTitle>
          <DialogDescription>Fly through pipes and get the highest score to win!</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Battle info */}
          <div className="flex justify-between items-center">
            <div className="text-center">
              <div className="mb-2">
                {battle.challenger_warrior.element_type ? (
                  <ElementalIcon elementType={battle.challenger_warrior.element_type as ElementType} size="md" />
                ) : (
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 border-2 border-white">
                    <span className="text-2xl pixel-font text-white">{battle.challenger_warrior.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-bold">{battle.challenger_warrior.name}</span>
              <div className="mt-2 text-center">
                <div className="text-xl font-bold text-yellow-400 pixel-font">{challengerScore}</div>
                <div className="text-xs text-gray-400">SCORE</div>
              </div>
            </div>

            <div className="text-center">
              <div className="bg-yellow-500 text-black font-bold px-3 py-1 pixel-font">{battle.stake_amount} ETH</div>
              <div className="text-xs text-gray-400 pixel-font">STAKE</div>
            </div>

            <div className="text-center">
              <div className="mb-2">
                {battle.opponent_warrior.element_type ? (
                  <ElementalIcon elementType={battle.opponent_warrior.element_type as ElementType} size="md" />
                ) : (
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 border-2 border-white">
                    <span className="text-2xl pixel-font text-white">{battle.opponent_warrior.name.charAt(0)}</span>
                  </div>
                )}
              </div>
              <span className="text-sm font-bold">{battle.opponent_warrior.name}</span>
              <div className="mt-2 text-center">
                <div className="text-xl font-bold text-yellow-400 pixel-font">{opponentScore}</div>
                <div className="text-xs text-gray-400">SCORE</div>
              </div>
            </div>
          </div>

          {/* Game area */}
          {gamePhase === "playing" && myTurn && (
            <>
              <div className="text-center text-green-400 pixel-font mb-2">YOUR TURN!</div>
              <FlappyBird onGameOver={handleGameOver} autoStart={false} elementType={getMyElementType()} />
              <div className="text-center text-xs text-gray-400 pixel-font">PRESS SPACE OR TAP TO FLAP</div>
            </>
          )}

          {gamePhase === "waiting" && (
            <div className="w-full h-64 bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-yellow-500 mx-auto mb-4" />
                <div className="text-yellow-400 pixel-font">
                  {waitingForOpponent ? "WAITING FOR OPPONENT TO PLAY..." : "WAITING FOR YOUR TURN..."}
                </div>
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-4 text-xs text-gray-500">
                    <div>Debug: {isChallenger ? "You are challenger" : "You are opponent"}</div>
                    <div>Current Turn: {currentTurn}</div>
                    <div>My Turn: {myTurn ? "Yes" : "No"}</div>
                    <div>Game Phase: {gamePhase}</div>
                    <div>Battle ID: {battle.id}</div>
                    <div>Challenger Score: {challengerScore}</div>
                    <div>Opponent Score: {opponentScore}</div>
                    <div>Turns: {JSON.stringify(debugInfo.turns)}</div>
                    <Button
                      onClick={() => {
                        setGamePhase("playing")
                        setMyTurn(true)
                        setWaitingForOpponent(false)
                      }}
                      className="mt-4 bg-red-500 hover:bg-red-600 text-white"
                    >
                      DEV: FORCE START GAME
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {gamePhase === "results" && (
            <div className="w-full h-64 bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
              <div className="text-center">
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <div className="text-2xl font-bold pixel-font mb-2">
                  {winner === (isChallenger ? "challenger" : "opponent") ? (
                    <span className="text-green-500">YOU WIN!</span>
                  ) : winner === "draw" ? (
                    <span className="text-yellow-500">IT'S A DRAW!</span>
                  ) : (
                    <span className="text-red-500">YOU LOSE!</span>
                  )}
                </div>
                <div className="text-white pixel-font">
                  {isChallenger ? "YOUR SCORE: " : "OPPONENT SCORE: "}
                  {challengerScore}
                </div>
                <div className="text-white pixel-font">
                  {!isChallenger ? "YOUR SCORE: " : "OPPONENT SCORE: "}
                  {opponentScore}
                </div>
                {process.env.NODE_ENV === "development" && (
                  <div className="mt-4 text-xs text-gray-500">
                    <div>Debug Info:</div>
                    <div>Challenger Score: {challengerScore}</div>
                    <div>Opponent Score: {opponentScore}</div>
                    <div>Winner: {winner}</div>
                    <div>Turns: {JSON.stringify(debugInfo.turns)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {gameOver ? (
            <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600 text-black">
              CLOSE
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose} className="w-full border-gray-700 hover:bg-gray-800">
              FORFEIT BATTLE
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

