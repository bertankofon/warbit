import type React from "react"
import { cn } from "@/lib/utils"

interface PixelCardProps {
  className?: string
  children: React.ReactNode
  variant?: "question" | "brick" | "pipe" | "mario"
}

export function PixelCard({ className, children, variant = "mario" }: PixelCardProps) {
  const variantStyles = {
    question: "question-block",
    brick: "brick-block",
    pipe: "pipe-green",
    mario: "mario-block",
  }

  return (
    <div className={cn(variantStyles[variant], className)}>
      <div className="bg-black p-4">{children}</div>
    </div>
  )
}

interface PixelCardHeaderProps {
  className?: string
  children: React.ReactNode
}

export function PixelCardHeader({ className, children }: PixelCardHeaderProps) {
  return <div className={cn("text-center mb-4", className)}>{children}</div>
}

interface PixelCardTitleProps {
  className?: string
  children: React.ReactNode
}

export function PixelCardTitle({ className, children }: PixelCardTitleProps) {
  return <h3 className={cn("text-xl text-red-500 pixel-font", className)}>{children}</h3>
}

interface PixelCardContentProps {
  className?: string
  children: React.ReactNode
}

export function PixelCardContent({ className, children }: PixelCardContentProps) {
  return <div className={cn("space-y-4", className)}>{children}</div>
}

interface PixelCardFooterProps {
  className?: string
  children: React.ReactNode
}

export function PixelCardFooter({ className, children }: PixelCardFooterProps) {
  return <div className={cn("mt-6 pt-4 border-t-2 border-gray-800", className)}>{children}</div>
}

