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
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ElementalIcon from "./elemental-icon"
import type { ElementType } from "@/components/elemental-warrior-selector"

// Define the possible moves
type RPSMove = "rock" | "paper" | "scissors" | null

interface RPSBattleGameProps {
  battle: any
  onClose: () => void
}

export default function RPSBattleGame({ battle, onClose }: RPSBattleGameProps) {
  const supabase = createClientComponentClient()
  const [isChallenger, setIsChallenger] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Game state
  const [round, setRound] = useState(1)
  const [challengerScore, setChallengerScore] = useState(0)
  const [opponentScore, setOpponentScore] = useState(0)
  const [challengerMove, setChallengerMove] = useState<RPSMove>(null)
  const [opponentMove, setOpponentMove] = useState<RPSMove>(null)
  const [roundResult, setRoundResult] = useState<"challenger" | "opponent" | "draw" | null>(null)
  const [gameOver, setGameOver] = useState(false)
  const [winner, setWinner] = useState<"challenger" | "opponent" | "draw" | null>(null)
  const [showMoves, setShowMoves] = useState(false)
  const [waitingForOpponent, setWaitingForOpponent] = useState(false)
  const [battleData, setBattleData] = useState<any>(null)

  // Animation states
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationClass, setAnimationClass] = useState("")

  // Set up real-time subscription
  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        setIsChallenger(session.user.id === battle.challenger_id)
      }
    }

    checkUser()
    fetchBattleState()

    // Set up real-time subscription to battle updates
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
  }, [battle.challenger_id, battle.id, supabase])

  const fetchBattleState = async () => {
    try {
      const { data: currentBattle, error: battleError } = await supabase
        .from("battles")
        .select("*")
        .eq("id", battle.id)
        .single()

      if (battleError) throw battleError

      setBattleData(currentBattle)

      if (currentBattle.turns && currentBattle.turns.length > 0) {
        // Process existing turns
        processTurns(currentBattle.turns)
      }
    } catch (err) {
      console.error("Error fetching battle state:", err)
      setError("Failed to load battle state")
    }
  }

  const processTurns = (turns: any[]) => {
    let cScore = 0
    let oScore = 0
    let currentRound = 1
    let waitingStatus = false
    let cMove: RPSMove = null
    let oMove: RPSMove = null

    turns.forEach((turn, index) => {
      if (turn.challenger_move && turn.opponent_move) {
        // Complete turn
        const result = determineWinner(turn.challenger_move, turn.opponent_move)
        if (result === "challenger") cScore++
        else if (result === "opponent") oScore++

        // If this is the last turn, set the current moves and result
        if (index === turns.length - 1) {
          cMove = turn.challenger_move
          oMove = turn.opponent_move
          setRoundResult(result)
          setShowMoves(true)

          // Check if game should be over
          if (cScore >= 2 || oScore >= 2) {
            setGameOver(true)
            setWinner(cScore >= 2 ? "challenger" : "opponent")
          } else {
            // Prepare for next round
            currentRound = index + 2
          }
        }
      } else {
        // Incomplete turn
        waitingStatus = true
        if (turn.challenger_move) {
          cMove = turn.challenger_move
          waitingStatus = isChallenger
        }
        if (turn.opponent_move) {
          oMove = turn.opponent_move
          waitingStatus = !isChallenger
        }
        currentRound = index + 1
      }
    })

    setRound(currentRound)
    setChallengerScore(cScore)
    setOpponentScore(oScore)
    setChallengerMove(cMove)
    setOpponentMove(oMove)
    setWaitingForOpponent(waitingStatus)

    // If game should be over based on score
    if (cScore >= 2 || oScore >= 2) {
      setGameOver(true)
      setWinner(cScore >= 2 ? "challenger" : "opponent")
    }
  }

  const determineWinner = (cMove: RPSMove, oMove: RPSMove): "challenger" | "opponent" | "draw" => {
    if (cMove === oMove) return "draw"

    if (
      (cMove === "rock" && oMove === "scissors") ||
      (cMove === "paper" && oMove === "rock") ||
      (cMove === "scissors" && oMove === "paper")
    ) {
      return "challenger"
    } else {
      return "opponent"
    }
  }

  const handleMove = async (move: RPSMove) => {
    if (loading || gameOver) return

    setLoading(true)

    try {
      // Get current battle state
      const { data: currentBattle, error: battleError } = await supabase
        .from("battles")
        .select("*")
        .eq("id", battle.id)
        .single()

      if (battleError) throw battleError

      const turns = currentBattle.turns || []
      const lastTurn = turns.length > 0 ? turns[turns.length - 1] : null

      // Determine if we're completing a turn or starting a new one
      const updatedTurns = [...turns]
      let completingTurn = false

      if (isChallenger) {
        // I'm the challenger
        if (lastTurn && !lastTurn.challenger_move && lastTurn.opponent_move) {
          // Complete this turn
          lastTurn.challenger_move = move
          updatedTurns[updatedTurns.length - 1] = lastTurn
          completingTurn = true
        } else {
          // Start a new turn
          updatedTurns.push({
            round: round,
            challenger_move: move,
            opponent_move: null,
            timestamp: new Date().toISOString(),
          })
        }
        setChallengerMove(move)
      } else {
        // I'm the opponent
        if (lastTurn && lastTurn.challenger_move && !lastTurn.opponent_move) {
          // Complete this turn
          lastTurn.opponent_move = move
          updatedTurns[updatedTurns.length - 1] = lastTurn
          completingTurn = true
        } else {
          // Start a new turn
          updatedTurns.push({
            round: round,
            challenger_move: null,
            opponent_move: move,
            timestamp: new Date().toISOString(),
          })
        }
        setOpponentMove(move)
      }

      // Update battle with new turns
      const { error: updateError } = await supabase.from("battles").update({ turns: updatedTurns }).eq("id", battle.id)

      if (updateError) throw updateError

      // If we completed a turn, process the result locally
      if (completingTurn) {
        const completedTurn = updatedTurns[updatedTurns.length - 1]
        const result = determineWinner(completedTurn.challenger_move, completedTurn.opponent_move)

        // Update scores
        let newChallengerScore = challengerScore
        let newOpponentScore = opponentScore

        if (result === "challenger") {
          newChallengerScore++
          setChallengerScore(newChallengerScore)
        } else if (result === "opponent") {
          newOpponentScore++
          setOpponentScore(newOpponentScore)
        }

        setRoundResult(result)
        setShowMoves(true)
        setShowAnimation(true)
        setAnimationClass(
          isChallenger
            ? result === "challenger"
              ? "win"
              : result === "opponent"
                ? "lose"
                : "draw"
            : result === "opponent"
              ? "win"
              : result === "challenger"
                ? "lose"
                : "draw",
        )

        // Check if game is over
        if (newChallengerScore >= 2 || newOpponentScore >= 2) {
          setGameOver(true)
          const battleWinner = newChallengerScore >= 2 ? "challenger" : "opponent"
          setWinner(battleWinner)

          // Update battle status
          await updateBattleStatus(battleWinner)
        } else {
          // Prepare for next round after delay
          setTimeout(() => {
            setRound(round + 1)
            setChallengerMove(null)
            setOpponentMove(null)
            setRoundResult(null)
            setShowMoves(false)
            setShowAnimation(false)
            setWaitingForOpponent(false)
          }, 3000)
        }
      } else {
        // We started a new turn, so we're waiting for the opponent
        setWaitingForOpponent(true)
      }
    } catch (err) {
      console.error("Error making move:", err)
      setError("Failed to make move")
    } finally {
      setLoading(false)
    }
  }

  const updateBattleStatus = async (battleWinner: "challenger" | "opponent") => {
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

  const renderMoveButton = (move: RPSMove) => {
    const isDisabled =
      loading || gameOver || waitingForOpponent || (isChallenger ? challengerMove !== null : opponentMove !== null)

    return (
      <Button
        onClick={() => handleMove(move)}
        disabled={isDisabled}
        className={`relative h-24 w-24 bg-gray-800 border-2 ${
          (isChallenger ? challengerMove : opponentMove) === move ? "border-yellow-500" : "border-gray-700"
        } hover:bg-gray-700 hover:border-yellow-400 transition-all`}
      >
        <div className={`rps-icon rps-${move}`}></div>
      </Button>
    )
  }

  const renderMoveDisplay = (player: "challenger" | "opponent") => {
    const move = player === "challenger" ? challengerMove : opponentMove
    if (!move || !showMoves) return <div className="h-24 w-24 bg-gray-800 border-2 border-gray-700"></div>

    return (
      <div
        className={`h-24 w-24 bg-gray-800 border-2 border-gray-700 flex items-center justify-center ${
          roundResult === player ? "border-green-500" : roundResult === "draw" ? "border-yellow-500" : ""
        }`}
      >
        <div className={`rps-icon rps-${move}`}></div>
      </div>
    )
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border-yellow-500 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-yellow-400 pixel-font">ROCK PAPER SCISSORS BATTLE</DialogTitle>
          <DialogDescription>Round {round} - First to win 2 rounds wins the battle!</DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Battle arena */}
          <div className="relative bg-gray-800 rounded-md border border-gray-700 p-4 h-64 overflow-hidden">
            {/* Challenger */}
            <div className="absolute left-10 top-4">
              <div className="flex flex-col items-center">
                <div className="mb-2">
                  {battle.challenger_warrior.element_type ? (
                    <ElementalIcon elementType={battle.challenger_warrior.element_type as ElementType} size="lg" />
                  ) : (
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 border-2 border-white">
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
            </div>

            {/* Opponent */}
            <div className="absolute right-10 top-4">
              <div className="flex flex-col items-center">
                <div className="mb-2">
                  {battle.opponent_warrior.element_type ? (
                    <ElementalIcon elementType={battle.opponent_warrior.element_type as ElementType} size="lg" />
                  ) : (
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 border-2 border-white">
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

            {/* VS indicator */}
            <div className="absolute top-16 left-1/2 transform -translate-x-1/2">
              <div className="text-yellow-500 text-2xl font-bold pixel-font">VS</div>
            </div>

            {/* Move display area */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center items-center gap-16">
              <div className={`${showAnimation ? `animate-rps-${animationClass}` : ""}`}>
                {renderMoveDisplay("challenger")}
              </div>
              <div
                className={`${showAnimation ? `animate-rps-${animationClass === "win" ? "lose" : animationClass === "lose" ? "win" : "draw"}` : ""}`}
              >
                {renderMoveDisplay("opponent")}
              </div>
            </div>

            {/* Round result */}
            {roundResult && showMoves && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div
                  className={`text-2xl font-bold pixel-font ${
                    roundResult === (isChallenger ? "challenger" : "opponent")
                      ? "text-green-500"
                      : roundResult === "draw"
                        ? "text-yellow-500"
                        : "text-red-500"
                  }`}
                >
                  {roundResult === (isChallenger ? "challenger" : "opponent")
                    ? "YOU WIN!"
                    : roundResult === "draw"
                      ? "DRAW!"
                      : "YOU LOSE!"}
                </div>
              </div>
            )}

            {/* Game over message */}
            {gameOver && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-center">
                  <div
                    className={`text-3xl font-bold pixel-font mb-2 ${
                      winner === (isChallenger ? "challenger" : "opponent") ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {winner === (isChallenger ? "challenger" : "opponent") ? "VICTORY!" : "DEFEAT!"}
                  </div>
                  <div className="text-yellow-400 pixel-font">
                    {winner === "challenger" ? battle.challenger_warrior.name : battle.opponent_warrior.name} WINS!
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Move selection */}
          {!gameOver && (
            <div className="space-y-2">
              <h3 className="font-bold text-center pixel-font">
                {waitingForOpponent ? "WAITING FOR OPPONENT..." : "CHOOSE YOUR MOVE"}
              </h3>

              {error && (
                <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400 mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-center gap-4">
                {renderMoveButton("rock")}
                {renderMoveButton("paper")}
                {renderMoveButton("scissors")}
              </div>

              {waitingForOpponent && (
                <div className="flex justify-center mt-4">
                  <Loader2 className="h-6 w-6 animate-spin text-yellow-500" />
                </div>
              )}
            </div>
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

