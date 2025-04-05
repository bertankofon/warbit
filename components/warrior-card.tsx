"use client"

import { Sword, Shield } from "lucide-react"
import type { ElementType } from "@/components/elemental-warrior-selector"

interface WarriorCardProps {
  warrior: any
  onBattle: () => void
}

export default function WarriorCard({ warrior, onBattle }: WarriorCardProps) {
  return (
    <div className="mario-block overflow-hidden">
      <div className="bg-black">
        <div className="h-2 bg-red-600"></div>
        <div className="p-4">
          <div className="text-center mb-4">
            <div className="mb-2">
              {warrior.element_type ? (
                <div className={`elemental-icon w-16 h-16 element-${warrior.element_type as ElementType}`}></div>
              ) : (
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-600 mb-2 border-2 border-white">
                  <span className="text-2xl pixel-font text-white">{warrior.name.charAt(0)}</span>
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold pixel-font text-red-500">{warrior.name}</h3>
            <p className="text-sm text-blue-400 pixel-font">{warrior.token_symbol}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-4">
            <div className="flex items-center">
              <Sword className="h-4 w-4 mr-2 text-green-400" />
              <span className="pixel-font text-xs">WINS: {warrior.wins || 0}</span>
            </div>
            <div className="flex items-center">
              <Shield className="h-4 w-4 mr-2 text-red-400" />
              <span className="pixel-font text-xs">LOSSES: {warrior.losses || 0}</span>
            </div>
          </div>

          <div className="mt-4">
            <button onClick={onBattle} className="w-full mario-button mario-button-green">
              BATTLE
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

