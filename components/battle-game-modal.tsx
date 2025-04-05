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
import { Progress } from "@/components/ui/progress"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Loader2, Sword, Shield, Zap, Heart, Target, Flame, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Define the possible moves
const MOVES = {
  ATTACK: {
    name: "Attack",
    icon: Sword,
    color: "text-red-400",
    description: "Deal 15-20 damage to opponent",
    energyCost: 0,
    energyGain: 15,
  },
  DEFEND: {
    name: "Defend",
    icon: Shield,
    color: "text-blue-400",
    description: "Reduce incoming damage by 50% and gain 5 health",
    energyCost: 0,
    energyGain: 10,
  },
  SPECIAL: {
    name: "Special Attack",
    icon: Zap,
    color: "text-yellow-400",
    description: "Deal 25-35 damage but 20% chance to miss",
    energyCost: 50,
    energyGain: 0,
  },
  HEAL: {
    name: "Heal",
    icon: Heart,
    color: "text-green-400",
    description: "Recover 15-25 health points",
    energyCost: 30,
    energyGain: 0,
  },
  CRITICAL: {
    name: "Critical Strike",
    icon: Target,
    color: "text-purple-400",
    description: "30% chance to deal double damage (30-40)",
    energyCost: 70,
    energyGain: 0,
  },
  ULTIMATE: {
    name: "Ultimate",
    icon: Flame,
    color: "text-orange-400",
    description: "Deal 40-60 damage based on your token power",
    energyCost: 100,
    energyGain: 0,
  },
}

// Game constants
const MAX_TURNS = 10
const MAX_HEALTH = 100
const MAX_ENERGY = 100
const BASE_DAMAGE = { min: 15, max: 20 }
const DEFENSE_REDUCTION = 0.5
const SPECIAL_DAMAGE = { min: 25, max: 35 }
const SPECIAL_MISS_CHANCE = 0.2
const CRITICAL_DAMAGE = { min: 30, max: 40 }
const CRITICAL_DOUBLE_CHANCE = 0.3
const ULTIMATE_DAMAGE = { min: 40, max: 60 }
const HEAL_AMOUNT = { min: 15, max: 25 }

interface BattleGameModalProps {
  battle: any
  onClose: () => void
}

export default function BattleGameModal({ battle, onClose }: BattleGameModalProps) {
  const supabase = createClientComponentClient()
  const [gameState, setGameState] = useState({
    turn: 1,
    currentPlayer: "challenger", // challenger or opponent
    challengerHealth: MAX_HEALTH,
    opponentHealth: MAX_HEALTH,
    challengerEnergy: 20, // Start with some energy
    opponentEnergy: 20,
    challengerMove: null,
    opponentMove: null,
    battleLog: ["Battle begins!"],
    gameOver: false,
    winner: null,
    lastDamage: { challenger: 0, opponent: 0 },
    lastEffect: { challenger: null, opponent: null },
    animation: null,
  })
  const [loading, setLoading] = useState(false)
  const [selectedMove, setSelectedMove] = useState<string | null>(null)
  const [showAnimation, setShowAnimation] = useState<string | null>(null)

  // Get current user to determine if player is challenger or opponent
  const [isChallenger, setIsChallenger] = useState(false)

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
  }, [battle.challenger_id, supabase.auth])

  const isMyTurn = () => {
    return (
      (isChallenger && gameState.currentPlayer === "challenger") ||
      (!isChallenger && gameState.currentPlayer === "opponent")
    )
  }

  // Get the current player's warrior
  const myWarrior = isChallenger ? battle.challenger_warrior : battle.opponent_warrior
  const opponentWarrior = isChallenger ? battle.opponent_warrior : battle.challenger_warrior

  const handleMoveSelection = (move: string) => {
    // Check if player has enough energy for the selected move
    const moveEnergyCost = MOVES[move as keyof typeof MOVES].energyCost
    const playerEnergy = isChallenger ? gameState.challengerEnergy : gameState.opponentEnergy

    if (playerEnergy < moveEnergyCost) {
      // Not enough energy, can't select this move
      return
    }

    setSelectedMove(move)
  }

  const executeMove = async () => {
    if (!selectedMove) return

    setLoading(true)

    try {
      // Get current battle state from database to ensure we have the latest
      const { data: currentBattle, error: battleError } = await supabase
        .from("battles")
        .select("*")
        .eq("id", battle.id)
        .single()

      if (battleError) throw battleError

      // Process the move
      const player = isChallenger ? "challenger" : "opponent"

      // Create a new turn object
      const newTurn = {
        turn: gameState.turn,
        [player + "Move"]: selectedMove,
        timestamp: new Date().toISOString(),
      }

      // Update the battle with the new turn
      const turns = [...(currentBattle.turns || []), newTurn]
      const { error: updateError } = await supabase.from("battles").update({ turns }).eq("id", battle.id)

      if (updateError) throw updateError

      // Update local game state
      const newGameState = { ...gameState }
      if (player === "challenger") {
        newGameState.challengerMove = selectedMove
      } else {
        newGameState.opponentMove = selectedMove
      }

      // If both players have moved, process the turn
      if (newGameState.challengerMove && newGameState.opponentMove) {
        processTurn(newGameState)
      } else {
        // Switch player
        newGameState.currentPlayer = player === "challenger" ? "opponent" : "challenger"
      }

      setGameState(newGameState)
      setSelectedMove(null)
    } catch (err) {
      console.error("Error executing move:", err)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get random number between min and max
  const getRandomDamage = (min: number, max: number) => {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  // Helper function to determine if an action is successful based on chance
  const isSuccessful = (chance: number) => {
    return Math.random() <= chance
  }

  const processTurn = (state: any) => {
    const challengerMove = state.challengerMove
    const opponentMove = state.opponentMove
    const log = []

    // Reset last damage and effects
    state.lastDamage = { challenger: 0, opponent: 0 }
    state.lastEffect = { challenger: null, opponent: null }

    // Process energy costs
    if (challengerMove) {
      const moveEnergyCost = MOVES[challengerMove as keyof typeof MOVES].energyCost
      state.challengerEnergy = Math.max(0, state.challengerEnergy - moveEnergyCost)
    }

    if (opponentMove) {
      const moveEnergyCost = MOVES[opponentMove as keyof typeof MOVES].energyCost
      state.opponentEnergy = Math.max(0, state.opponentEnergy - moveEnergyCost)
    }

    // Calculate challenger damage
    let challengerDamage = 0
    let opponentDamage = 0

    // Process challenger's move
    if (challengerMove === "ATTACK") {
      challengerDamage = getRandomDamage(BASE_DAMAGE.min, BASE_DAMAGE.max)
      log.push(`${battle.challenger_warrior.name} attacks for ${challengerDamage} damage!`)
      state.lastEffect.challenger = "attack"

      // Gain energy
      state.challengerEnergy = Math.min(MAX_ENERGY, state.challengerEnergy + MOVES.ATTACK.energyGain)
    } else if (challengerMove === "DEFEND") {
      // Defender gains some health
      const healthGain = 5
      state.challengerHealth = Math.min(MAX_HEALTH, state.challengerHealth + healthGain)
      log.push(`${battle.challenger_warrior.name} defends and recovers ${healthGain} health!`)
      state.lastEffect.challenger = "defend"

      // Gain energy
      state.challengerEnergy = Math.min(MAX_ENERGY, state.challengerEnergy + MOVES.DEFEND.energyGain)
    } else if (challengerMove === "SPECIAL") {
      if (!isSuccessful(SPECIAL_MISS_CHANCE)) {
        challengerDamage = getRandomDamage(SPECIAL_DAMAGE.min, SPECIAL_DAMAGE.max)
        log.push(`${battle.challenger_warrior.name} lands a powerful special attack for ${challengerDamage} damage!`)
        state.lastEffect.challenger = "special"
      } else {
        log.push(`${battle.challenger_warrior.name}'s special attack misses!`)
        state.lastEffect.challenger = "miss"
      }
    } else if (challengerMove === "HEAL") {
      const healAmount = getRandomDamage(HEAL_AMOUNT.min, HEAL_AMOUNT.max)
      state.challengerHealth = Math.min(MAX_HEALTH, state.challengerHealth + healAmount)
      log.push(`${battle.challenger_warrior.name} heals for ${healAmount} health!`)
      state.lastEffect.challenger = "heal"
    } else if (challengerMove === "CRITICAL") {
      challengerDamage = getRandomDamage(CRITICAL_DAMAGE.min, CRITICAL_DAMAGE.max)
      if (isSuccessful(CRITICAL_DOUBLE_CHANCE)) {
        challengerDamage *= 2
        log.push(`${battle.challenger_warrior.name} lands a CRITICAL HIT for ${challengerDamage} damage!`)
        state.lastEffect.challenger = "critical"
      } else {
        log.push(`${battle.challenger_warrior.name} attempts a critical strike for ${challengerDamage} damage!`)
        state.lastEffect.challenger = "attack"
      }
    } else if (challengerMove === "ULTIMATE") {
      // Ultimate damage is based on token symbol length (just for fun)
      const tokenBonus = battle.challenger_warrior.token_symbol.length * 2
      challengerDamage = getRandomDamage(ULTIMATE_DAMAGE.min, ULTIMATE_DAMAGE.max) + tokenBonus
      log.push(`${battle.challenger_warrior.name} unleashes ULTIMATE attack for ${challengerDamage} damage!`)
      state.lastEffect.challenger = "ultimate"
    }

    // Process opponent's move
    if (opponentMove === "ATTACK") {
      opponentDamage = getRandomDamage(BASE_DAMAGE.min, BASE_DAMAGE.max)
      log.push(`${battle.opponent_warrior.name} attacks for ${opponentDamage} damage!`)
      state.lastEffect.opponent = "attack"

      // Gain energy
      state.opponentEnergy = Math.min(MAX_ENERGY, state.opponentEnergy + MOVES.ATTACK.energyGain)
    } else if (opponentMove === "DEFEND") {
      // Defender gains some health
      const healthGain = 5
      state.opponentHealth = Math.min(MAX_HEALTH, state.opponentHealth + healthGain)
      log.push(`${battle.opponent_warrior.name} defends and recovers ${healthGain} health!`)
      state.lastEffect.opponent = "defend"

      // Gain energy
      state.opponentEnergy = Math.min(MAX_ENERGY, state.opponentEnergy + MOVES.DEFEND.energyGain)
    } else if (opponentMove === "SPECIAL") {
      if (!isSuccessful(SPECIAL_MISS_CHANCE)) {
        opponentDamage = getRandomDamage(SPECIAL_DAMAGE.min, SPECIAL_DAMAGE.max)
        log.push(`${battle.opponent_warrior.name} lands a powerful special attack for ${opponentDamage} damage!`)
        state.lastEffect.opponent = "special"
      } else {
        log.push(`${battle.opponent_warrior.name}'s special attack misses!`)
        state.lastEffect.opponent = "miss"
      }
    } else if (opponentMove === "HEAL") {
      const healAmount = getRandomDamage(HEAL_AMOUNT.min, HEAL_AMOUNT.max)
      state.opponentHealth = Math.min(MAX_HEALTH, state.opponentHealth + healAmount)
      log.push(`${battle.opponent_warrior.name} heals for ${healAmount} health!`)
      state.lastEffect.opponent = "heal"
    } else if (opponentMove === "CRITICAL") {
      opponentDamage = getRandomDamage(CRITICAL_DAMAGE.min, CRITICAL_DAMAGE.max)
      if (isSuccessful(CRITICAL_DOUBLE_CHANCE)) {
        opponentDamage *= 2
        log.push(`${battle.opponent_warrior.name} lands a CRITICAL HIT for ${opponentDamage} damage!`)
        state.lastEffect.opponent = "critical"
      } else {
        log.push(`${battle.opponent_warrior.name} attempts a critical strike for ${opponentDamage} damage!`)
        state.lastEffect.opponent = "attack"
      }
    } else if (opponentMove === "ULTIMATE") {
      // Ultimate damage is based on token symbol length (just for fun)
      const tokenBonus = battle.opponent_warrior.token_symbol.length * 2
      opponentDamage = getRandomDamage(ULTIMATE_DAMAGE.min, ULTIMATE_DAMAGE.max) + tokenBonus
      log.push(`${battle.opponent_warrior.name} unleashes ULTIMATE attack for ${opponentDamage} damage!`)
      state.lastEffect.opponent = "ultimate"
    }

    // Apply defense reduction if applicable
    if (opponentMove === "DEFEND") {
      const originalDamage = challengerDamage
      challengerDamage = Math.floor(challengerDamage * DEFENSE_REDUCTION)
      if (challengerDamage > 0) {
        log.push(
          `${battle.opponent_warrior.name} defends and reduces damage from ${originalDamage} to ${challengerDamage}!`,
        )
      }
    }

    if (challengerMove === "DEFEND") {
      const originalDamage = opponentDamage
      opponentDamage = Math.floor(opponentDamage * DEFENSE_REDUCTION)
      if (opponentDamage > 0) {
        log.push(
          `${battle.challenger_warrior.name} defends and reduces damage from ${originalDamage} to ${opponentDamage}!`,
        )
      }
    }

    // Apply damage
    state.opponentHealth = Math.max(0, state.opponentHealth - challengerDamage)
    state.challengerHealth = Math.max(0, state.challengerHealth - opponentDamage)

    // Store last damage for animation
    state.lastDamage.challenger = opponentDamage
    state.lastDamage.opponent = challengerDamage

    // Check if game is over
    if (state.opponentHealth <= 0 || state.challengerHealth <= 0 || state.turn >= MAX_TURNS) {
      state.gameOver = true

      // Determine winner
      if (state.opponentHealth <= 0 && state.challengerHealth <= 0) {
        state.winner = "draw"
        log.push("The battle ends in a draw!")
      } else if (state.opponentHealth <= 0) {
        state.winner = "challenger"
        log.push(`${battle.challenger_warrior.name} wins the battle!`)
      } else if (state.challengerHealth <= 0) {
        state.winner = "opponent"
        log.push(`${battle.opponent_warrior.name} wins the battle!`)
      } else if (state.turn >= MAX_TURNS) {
        // If max turns reached, winner is the one with more health
        if (state.challengerHealth > state.opponentHealth) {
          state.winner = "challenger"
          log.push(`${battle.challenger_warrior.name} wins the battle with more health!`)
        } else if (state.opponentHealth > state.challengerHealth) {
          state.winner = "opponent"
          log.push(`${battle.opponent_warrior.name} wins the battle with more health!`)
        } else {
          state.winner = "draw"
          log.push("The battle ends in a draw!")
        }
      }

      // Update battle status in database
      updateBattleStatus(state)
    } else {
      // Prepare for next turn
      state.turn += 1
      state.currentPlayer = "challenger" // Challenger always goes first
      state.challengerMove = null
      state.opponentMove = null
    }

    // Update battle log
    state.battleLog = [...state.battleLog, ...log]

    // Trigger animation
    setShowAnimation("active")
    setTimeout(() => setShowAnimation(null), 1000)
  }

  const updateBattleStatus = async (state: any) => {
    try {
      await supabase
        .from("battles")
        .update({
          status: "completed",
          winner: state.winner,
          challenger_health: state.challengerHealth,
          opponent_health: state.opponentHealth,
          updated_at: new Date().toISOString(),
        })
        .eq("id", battle.id)
    } catch (err) {
      console.error("Error updating battle status:", err)
    }
  }

  // Get the appropriate effect class for animations
  const getEffectClass = (effect: string | null) => {
    switch (effect) {
      case "attack":
        return "animate-attack"
      case "defend":
        return "animate-defend"
      case "special":
        return "animate-special"
      case "critical":
        return "animate-critical"
      case "heal":
        return "animate-heal"
      case "miss":
        return "animate-miss"
      case "ultimate":
        return "animate-ultimate"
      default:
        return ""
    }
  }

  // Get the appropriate icon for the effect
  const getEffectIcon = (effect: string | null) => {
    switch (effect) {
      case "attack":
        return <Sword className="h-8 w-8 text-red-500" />
      case "defend":
        return <Shield className="h-8 w-8 text-blue-500" />
      case "special":
        return <Zap className="h-8 w-8 text-yellow-500" />
      case "critical":
        return <Target className="h-8 w-8 text-purple-500" />
      case "heal":
        return <Heart className="h-8 w-8 text-green-500" />
      case "miss":
        return <AlertCircle className="h-8 w-8 text-gray-500" />
      case "ultimate":
        return <Flame className="h-8 w-8 text-orange-500" />
      default:
        return null
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-gray-900 text-white border-yellow-500 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-yellow-400 pixel-font">BATTLE ARENA</DialogTitle>
          <DialogDescription>
            Turn {gameState.turn} of {MAX_TURNS} -{" "}
            {gameState.gameOver
              ? "Battle Complete"
              : `${gameState.currentPlayer === "challenger" ? battle.challenger_warrior.name : battle.opponent_warrior.name}'s Turn`}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Battle arena */}
          <div className="relative bg-gray-800 rounded-md border border-gray-700 p-4 h-48 overflow-hidden">
            {/* Challenger warrior */}
            <div
              className={cn(
                "absolute left-10 bottom-4 transition-all duration-300",
                showAnimation && gameState.lastEffect.challenger && getEffectClass(gameState.lastEffect.challenger),
              )}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 border-2 border-yellow-500">
                  <span className="text-2xl">{battle.challenger_warrior.name.charAt(0)}</span>
                </div>
                <span className="text-xs font-bold">{battle.challenger_warrior.name}</span>

                {/* Damage indicator */}
                {showAnimation && gameState.lastDamage.challenger > 0 && (
                  <div className="absolute -top-6 left-4 text-red-500 font-bold animate-damage">
                    -{gameState.lastDamage.challenger}
                  </div>
                )}

                {/* Effect icon */}
                {showAnimation && gameState.lastEffect.challenger && (
                  <div className="absolute -right-4 top-0">{getEffectIcon(gameState.lastEffect.challenger)}</div>
                )}
              </div>
            </div>

            {/* Opponent warrior */}
            <div
              className={cn(
                "absolute right-10 bottom-4 transition-all duration-300",
                showAnimation && gameState.lastEffect.opponent && getEffectClass(gameState.lastEffect.opponent),
              )}
            >
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mb-2 border-2 border-green-500">
                  <span className="text-2xl">{battle.opponent_warrior.name.charAt(0)}</span>
                </div>
                <span className="text-xs font-bold">{battle.opponent_warrior.name}</span>

                {/* Damage indicator */}
                {showAnimation && gameState.lastDamage.opponent > 0 && (
                  <div className="absolute -top-6 right-4 text-red-500 font-bold animate-damage">
                    -{gameState.lastDamage.opponent}
                  </div>
                )}

                {/* Effect icon */}
                {showAnimation && gameState.lastEffect.opponent && (
                  <div className="absolute -left-4 top-0">{getEffectIcon(gameState.lastEffect.opponent)}</div>
                )}
              </div>
            </div>

            {/* VS indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <Badge className="bg-yellow-500 text-black px-3 py-1">VS</Badge>
            </div>
          </div>

          {/* Health and energy bars */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{battle.challenger_warrior.name}</span>
                <span className="text-sm">
                  {gameState.challengerHealth}/{MAX_HEALTH} HP
                </span>
              </div>
              <Progress
                value={(gameState.challengerHealth / MAX_HEALTH) * 100}
                className="h-3 bg-gray-800"
                indicatorClassName="bg-green-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-yellow-400">Energy</span>
                <span className="text-xs">
                  {gameState.challengerEnergy}/{MAX_ENERGY}
                </span>
              </div>
              <Progress
                value={(gameState.challengerEnergy / MAX_ENERGY) * 100}
                className="h-2 bg-gray-800"
                indicatorClassName="bg-yellow-500"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold">{battle.opponent_warrior.name}</span>
                <span className="text-sm">
                  {gameState.opponentHealth}/{MAX_HEALTH} HP
                </span>
              </div>
              <Progress
                value={(gameState.opponentHealth / MAX_HEALTH) * 100}
                className="h-3 bg-gray-800"
                indicatorClassName="bg-green-500"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-yellow-400">Energy</span>
                <span className="text-xs">
                  {gameState.opponentEnergy}/{MAX_ENERGY}
                </span>
              </div>
              <Progress
                value={(gameState.opponentEnergy / MAX_ENERGY) * 100}
                className="h-2 bg-gray-800"
                indicatorClassName="bg-yellow-500"
              />
            </div>
          </div>

          {/* Battle log */}
          <div className="bg-gray-800 p-3 rounded-md border border-gray-700 h-32 overflow-y-auto">
            {gameState.battleLog.map((log, index) => (
              <div key={index} className="mb-1 text-sm">
                {log}
              </div>
            ))}
          </div>

          {/* Move selection */}
          {!gameState.gameOver && isMyTurn() && (
            <div className="space-y-2">
              <h3 className="font-bold text-center">Choose your move</h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(MOVES).map(([key, move]) => {
                  const MoveIcon = move.icon
                  const playerEnergy = isChallenger ? gameState.challengerEnergy : gameState.opponentEnergy
                  const disabled = playerEnergy < move.energyCost

                  return (
                    <Button
                      key={key}
                      variant={selectedMove === key ? "default" : "outline"}
                      className={`flex items-center justify-start ${
                        selectedMove === key ? "bg-gray-700" : "border-gray-700"
                      } hover:bg-gray-800 ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                      onClick={() => !disabled && handleMoveSelection(key)}
                      disabled={disabled}
                    >
                      <MoveIcon className={`h-5 w-5 mr-2 ${move.color}`} />
                      <div className="text-left">
                        <div className="font-bold flex items-center">
                          {move.name}
                          {move.energyCost > 0 && (
                            <span className="ml-1 text-xs text-yellow-400">({move.energyCost})</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">{move.description}</div>
                      </div>
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Waiting for opponent */}
          {!gameState.gameOver && !isMyTurn() && (
            <div className="text-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-yellow-500 mx-auto mb-2" />
              <p>
                Waiting for{" "}
                {gameState.currentPlayer === "challenger"
                  ? battle.challenger_warrior.name
                  : battle.opponent_warrior.name}{" "}
                to make a move...
              </p>
            </div>
          )}

          {/* Game over state */}
          {gameState.gameOver && (
            <div className="text-center py-4">
              <h3 className="text-xl font-bold mb-2">
                {gameState.winner === "challenger"
                  ? `${battle.challenger_warrior.name} Wins!`
                  : gameState.winner === "opponent"
                    ? `${battle.opponent_warrior.name} Wins!`
                    : "Battle Ended in a Draw!"}
              </h3>
              <p className="text-gray-400">
                The battle is complete. An admin will finalize the results and distribute the stakes.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!gameState.gameOver && isMyTurn() ? (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1 border-gray-700 hover:bg-gray-800">
                Forfeit
              </Button>
              <Button
                onClick={executeMove}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black"
                disabled={!selectedMove || loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Executing...
                  </>
                ) : (
                  "Execute Move"
                )}
              </Button>
            </>
          ) : (
            <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600 text-black">
              {gameState.gameOver ? "Close" : "Check Later"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

