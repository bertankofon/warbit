import type React from "react"
import { cn } from "@/lib/utils"

interface PixelButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "success"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

export function PixelButton({ className, variant = "primary", size = "md", children, ...props }: PixelButtonProps) {
  const variantStyles = {
    primary: "mario-button", // Red Mario button
    secondary: "mario-button mario-button-blue", // Blue Mario button
    danger: "mario-button", // Red Mario button
    success: "mario-button mario-button-green", // Green Mario button
  }

  const sizeStyles = {
    sm: "px-3 py-2 text-xs",
    md: "px-4 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  }

  return (
    <button
      className={cn(
        "font-bold pixel-font relative",
        variantStyles[variant],
        sizeStyles[size],
        props.disabled && "opacity-50 cursor-not-allowed hover:bg-opacity-100",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

