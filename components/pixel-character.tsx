type ElementType = "fire" | "water" | "earth" | "air"

interface PixelCharacterProps {
  element: ElementType
  size?: "sm" | "md" | "lg"
  className?: string
}

export function PixelCharacter({ element, size = "md", className = "" }: PixelCharacterProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  }

  // Simple 8-bit style character representations
  const characterSvg = {
    fire: (
      <svg viewBox="0 0 16 16" className={`${sizeClasses[size]} ${className}`} style={{ imageRendering: "pixelated" }}>
        <rect x="6" y="2" width="4" height="2" fill="#FF4500" />
        <rect x="4" y="4" width="8" height="2" fill="#FF4500" />
        <rect x="4" y="6" width="8" height="2" fill="#FF4500" />
        <rect x="6" y="8" width="4" height="2" fill="#FF4500" />
        <rect x="6" y="10" width="2" height="2" fill="#FF4500" />
        <rect x="8" y="10" width="2" height="2" fill="#FF4500" />
        <rect x="4" y="12" width="2" height="2" fill="#FF4500" />
        <rect x="10" y="12" width="2" height="2" fill="#FF4500" />
        <rect x="6" y="4" width="4" height="2" fill="#FFA500" />
        <rect x="6" y="6" width="4" height="2" fill="#FFA500" />
      </svg>
    ),
    water: (
      <svg viewBox="0 0 16 16" className={`${sizeClasses[size]} ${className}`} style={{ imageRendering: "pixelated" }}>
        <rect x="6" y="2" width="4" height="2" fill="#1E90FF" />
        <rect x="4" y="4" width="8" height="2" fill="#1E90FF" />
        <rect x="4" y="6" width="8" height="2" fill="#1E90FF" />
        <rect x="6" y="8" width="4" height="2" fill="#1E90FF" />
        <rect x="6" y="10" width="2" height="2" fill="#1E90FF" />
        <rect x="8" y="10" width="2" height="2" fill="#1E90FF" />
        <rect x="4" y="12" width="2" height="2" fill="#1E90FF" />
        <rect x="10" y="12" width="2" height="2" fill="#1E90FF" />
        <rect x="6" y="4" width="4" height="2" fill="#00BFFF" />
        <rect x="6" y="6" width="4" height="2" fill="#00BFFF" />
      </svg>
    ),
    earth: (
      <svg viewBox="0 0 16 16" className={`${sizeClasses[size]} ${className}`} style={{ imageRendering: "pixelated" }}>
        <rect x="6" y="2" width="4" height="2" fill="#228B22" />
        <rect x="4" y="4" width="8" height="2" fill="#228B22" />
        <rect x="4" y="6" width="8" height="2" fill="#228B22" />
        <rect x="6" y="8" width="4" height="2" fill="#228B22" />
        <rect x="6" y="10" width="2" height="2" fill="#228B22" />
        <rect x="8" y="10" width="2" height="2" fill="#228B22" />
        <rect x="4" y="12" width="2" height="2" fill="#228B22" />
        <rect x="10" y="12" width="2" height="2" fill="#228B22" />
        <rect x="6" y="4" width="4" height="2" fill="#32CD32" />
        <rect x="6" y="6" width="4" height="2" fill="#32CD32" />
      </svg>
    ),
    air: (
      <svg viewBox="0 0 16 16" className={`${sizeClasses[size]} ${className}`} style={{ imageRendering: "pixelated" }}>
        <rect x="6" y="2" width="4" height="2" fill="#9370DB" />
        <rect x="4" y="4" width="8" height="2" fill="#9370DB" />
        <rect x="4" y="6" width="8" height="2" fill="#9370DB" />
        <rect x="6" y="8" width="4" height="2" fill="#9370DB" />
        <rect x="6" y="10" width="2" height="2" fill="#9370DB" />
        <rect x="8" y="10" width="2" height="2" fill="#9370DB" />
        <rect x="4" y="12" width="2" height="2" fill="#9370DB" />
        <rect x="10" y="12" width="2" height="2" fill="#9370DB" />
        <rect x="6" y="4" width="4" height="2" fill="#B19CD9" />
        <rect x="6" y="6" width="4" height="2" fill="#B19CD9" />
      </svg>
    ),
  }

  return characterSvg[element]
}

