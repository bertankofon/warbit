// Replace the entire file with this implementation that uses the RPS game

"use client"
import RPSBattleGame from "./rps-battle-game"

interface BattleGameModalProps {
  battle: any
  onClose: () => void
}

export default function BattleGameModal({ battle, onClose }: BattleGameModalProps) {
  return <RPSBattleGame battle={battle} onClose={onClose} />
}

