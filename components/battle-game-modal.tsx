// Replace the entire file with this implementation that uses the Dino game
"use client"
import DinoBattleModal from "./dino-battle-modal"

interface BattleGameModalProps {
  battle: any
  onClose: () => void
}

export default function BattleGameModal({ battle, onClose }: BattleGameModalProps) {
  // Make sure we're passing the battle data correctly
  return <DinoBattleModal battle={battle} onClose={onClose} />
}

