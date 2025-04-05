"use client"
import { cn } from "@/lib/utils"

export type ElementType = "fire" | "water" | "earth" | "air"

interface ElementalWarriorSelectorProps {
  onSelect: (element: ElementType) => void
  selectedElement?: ElementType
}

export default function ElementalWarriorSelector({ onSelect, selectedElement }: ElementalWarriorSelectorProps) {
  const elements: { type: ElementType; name: string }[] = [
    { type: "fire", name: "FIRE" },
    { type: "water", name: "WATER" },
    { type: "earth", name: "EARTH" },
    { type: "air", name: "AIR" },
  ]

  return (
    <div className="space-y-2">
      <label className="block text-white text-xs pixel-font">SELECT YOUR ELEMENT</label>
      <div className="grid grid-cols-2 gap-4">
        {elements.map((element) => (
          <button
            key={element.type}
            type="button"
            className={cn(
              "flex flex-col items-center p-3 focus:outline-none transition-all",
              selectedElement === element.type ? "scale-105" : "opacity-80 hover:opacity-100",
            )}
            onClick={() => onSelect(element.type)}
          >
            <div
              className={cn(
                "elemental-icon w-16 h-16 relative",
                `element-${element.type}`,
                selectedElement === element.type && "border-4 border-yellow-400",
              )}
            />
            <span className="mt-2 text-sm text-white pixel-font">{element.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

