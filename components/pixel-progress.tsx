import { cn } from "@/lib/utils"

interface PixelProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  color?: "red" | "green" | "blue" | "yellow"
  height?: "sm" | "md" | "lg"
}

export function PixelProgress({
  value,
  max = 100,
  className,
  barClassName,
  color = "red",
  height = "md",
}: PixelProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const colorStyles = {
    red: "bg-red-600",
    green: "bg-green-600",
    blue: "bg-blue-600",
    yellow: "bg-yellow-500",
  }

  const heightStyles = {
    sm: "h-2",
    md: "h-4",
    lg: "h-6",
  }

  return (
    <div className={cn("w-full bg-black border-2 border-white p-1", heightStyles[height], className)}>
      <div className={cn("h-full", colorStyles[color], barClassName)} style={{ width: `${percentage}%` }}></div>
    </div>
  )
}

