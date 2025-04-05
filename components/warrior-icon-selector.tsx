"use client"
import PixelWarriorIcon, { type WarriorIconType } from "./pixel-warrior-icon"

interface WarriorIconSelectorProps {
  onSelect: (iconType: WarriorIconType) => void
  selectedIcon?: WarriorIconType
}

export default function WarriorIconSelector({ onSelect, selectedIcon }: WarriorIconSelectorProps) {
  const icons: WarriorIconType[] = ["dragon", "knight", "mage", "ninja", "robot", "samurai", "viking", "wizard"]

  const handleSelect = (icon: WarriorIconType) => {
    onSelect(icon)
  }

  return (
    <div className="space-y-2">
      <label className="block text-white text-xs pixel-font">SELECT YOUR WARRIOR TYPE</label>
      <div className="grid grid-cols-4 gap-3">
        {icons.map((icon) => (
          <button
            key={icon}
            type="button"
            className="flex flex-col items-center p-2 focus:outline-none"
            onClick={() => handleSelect(icon)}
          >
            <PixelWarriorIcon type={icon} size="md" selected={selectedIcon === icon} />
            <span className="mt-1 text-xs text-white pixel-font uppercase">{icon}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

