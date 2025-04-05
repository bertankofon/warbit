import { cn } from "@/lib/utils"
import type { ElementType } from "@/components/elemental-warrior-selector"

interface ElementalIconProps {
  elementType: ElementType
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export default function ElementalIcon({ elementType, size = "md", className }: ElementalIconProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  }

  return <div className={cn("elemental-icon relative", `element-${elementType}`, sizeClasses[size], className)} />
}

