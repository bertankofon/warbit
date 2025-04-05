import { cn } from "@/lib/utils"

export type WarriorIconType = "dragon" | "knight" | "mage" | "ninja" | "robot" | "samurai" | "viking" | "wizard"

interface PixelWarriorIconProps {
  type: WarriorIconType
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  selected?: boolean
}

export function PixelWarriorIcon({ type, size = "md", className, selected = false }: PixelWarriorIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  // Each icon has a specific background color
  const iconColors: Record<WarriorIconType, string> = {
    dragon: "bg-red-600",
    knight: "bg-blue-600",
    mage: "bg-purple-600",
    ninja: "bg-gray-800",
    robot: "bg-gray-400",
    samurai: "bg-red-800",
    viking: "bg-blue-800",
    wizard: "bg-indigo-600",
  }

  // Each icon has a specific letter or symbol
  const iconSymbols: Record<WarriorIconType, string> = {
    dragon: "D",
    knight: "K",
    mage: "M",
    ninja: "N",
    robot: "R",
    samurai: "S",
    viking: "V",
    wizard: "W",
  }

  // The actual pixel art is handled with CSS in globals.css
  // Here we just create placeholder containers with appropriate colors and symbols
  return (
    <div
      className={cn(
        "pixel-warrior-icon relative flex items-center justify-center",
        sizeClasses[size],
        iconColors[type],
        selected && "border-4 border-yellow-400",
        className,
      )}
      data-warrior-type={type}
    >
      <span className="text-white pixel-font">{iconSymbols[type]}</span>
      <div className={cn("absolute inset-0 opacity-0 transition-opacity", `warrior-${type}`, "pixel-art")} />
    </div>
  )
}

export default PixelWarriorIcon

