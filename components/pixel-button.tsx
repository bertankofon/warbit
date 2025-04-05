import type React from "react"
import { cn } from "@/lib/utils"

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "fire" | "water" | "earth" | "air"
  size?: "sm" | "md" | "lg"
}

export function PixelButton({ className, variant = "default", size = "md", children, ...props }: PixelButtonProps) {
  const variantClasses = {
    default: "bg-gray-200 hover:bg-gray-300 text-black",
    fire: "bg-red-500 hover:bg-red-600 text-white border-red-700",
    water: "bg-blue-500 hover:bg-blue-600 text-white border-blue-700",
    earth: "bg-green-500 hover:bg-green-600 text-white border-green-700",
    air: "bg-purple-500 hover:bg-purple-600 text-white border-purple-700",
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-4 py-2",
    lg: "text-base px-6 py-3",
  }

  return (
    <button
      className={cn(
        "font-pixel border-2 border-black",
        "shadow-[4px_4px_0px_0px_rgba(0,0,0,0.8)]",
        "active:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.8)]",
        "active:translate-x-[2px] active:translate-y-[2px]",
        "transition-all duration-100 hover:brightness-110",
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

