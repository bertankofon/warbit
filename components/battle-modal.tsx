"use client"

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
import { Loader2, Sword } from "lucide-react"

interface BattleModalProps {
  opponent: any
  myWarrior: any
  onClose: () => void
}

export default function BattleModal({ opponent, myWarrior, onClose }: BattleModalProps) {
  const [battling, setBattling] = useState(false)
  const [result, setResult] = useState<"win" | "loss" | null>(null)
  const [battleLog, setBattleLog] = useState<string[]>([])

  const startBattle = () => {
    setBattling(true)
    setBattleLog([`Battle between ${myWarrior.name} and ${opponent.name} begins!`])

    // Simulate battle with random outcome
    setTimeout(() => {
      const logs = [
        `${myWarrior.name} attacks with a powerful strike!`,
        `${opponent.name} defends and counters!`,
        `${myWarrior.name} uses special ability!`,
      ]
      setBattleLog((prev) => [...prev, logs[0]])

      setTimeout(() => {
        setBattleLog((prev) => [...prev, logs[1]])

        setTimeout(() => {
          setBattleLog((prev) => [...prev, logs[2]])

          setTimeout(() => {
            // Determine winner (random for demo)
            const win = Math.random() > 0.5
            setResult(win ? "win" : "loss")

            const resultLog = win
              ? `${myWarrior.name} defeats ${opponent.name}! You win!`
              : `${opponent.name} defeats ${myWarrior.name}! You lose!`

            setBattleLog((prev) => [...prev, resultLog])
            setBattling(false)
          }, 1000)
        }, 1000)
      }, 1000)
    }, 1000)
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
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 mb-2">
                <span>{myWarrior.name.charAt(0)}</span>
              </div>
              <div className="font-bold">{myWarrior.name}</div>
              <div className="text-xs text-gray-400">{myWarrior.token_symbol}</div>
            </div>

            <div className="flex items-center justify-center">
              <Sword className="h-8 w-8 text-yellow-500" />
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 mb-2">
                <span>{opponent.name.charAt(0)}</span>
              </div>
              <div className="font-bold">{opponent.name}</div>
              <div className="text-xs text-gray-400">{opponent.token_symbol}</div>
            </div>
          </div>

          {battleLog.length > 0 && (
            <div className="bg-gray-800 p-3 rounded-md border border-gray-700 mb-4 h-32 overflow-y-auto">
              {battleLog.map((log, index) => (
                <div key={index} className="mb-1 text-sm">
                  {log}
                </div>
              ))}
            </div>
          )}

          {result && (
            <div className={`text-center font-bold text-lg ${result === "win" ? "text-green-400" : "text-red-400"}`}>
              {result === "win" ? "VICTORY!" : "DEFEAT!"}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {!battling && !result && (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1 border-gray-700 hover:bg-gray-800">
                Cancel
              </Button>
              <Button onClick={startBattle} className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black">
                Start Battle
              </Button>
            </>
          )}

          {battling && (
            <Button disabled className="w-full">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Battling...
            </Button>
          )}

          {result && (
            <Button onClick={onClose} className="w-full bg-green-500 hover:bg-green-600 text-black">
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

