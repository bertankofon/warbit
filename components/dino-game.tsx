"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import ElementalIcon from "./elemental-icon"
import type { ElementType } from "@/components/elemental-warrior-selector"

interface DinoGameProps {
  onGameOver: (score: number) => void
  autoStart?: boolean
  elementType?: ElementType
}

export default function DinoGame({ onGameOver, autoStart = false, elementType = "fire" }: DinoGameProps) {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [jumping, setJumping] = useState(false)
  const [dinoY, setDinoY] = useState(0)
  const [obstacles, setObstacles] = useState<
    {
      x: number
      width: number
      height: number
      type: "cactus" | "rock" | "crystal" | "cloud"
    }[]
  >([])
  const [showDebug, setShowDebug] = useState(false)

  const gameLoopRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameSpeedRef = useRef(5)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameOverRef = useRef(false)
  const dinoYRef = useRef(0) // <-- Ref for the dino's vertical position
  const scoreRef = useRef(0) // <-- Ref to track the current score

  // Game constants
  const GROUND_HEIGHT = 20
  const DINO_WIDTH = 40
  const DINO_HEIGHT = 40
  const JUMP_FORCE = 12
  const GRAVITY = 0.6

  // Start game automatically if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startGame()
    }
  }, [autoStart])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.code === "Space" || e.code === "ArrowUp") && !jumping && gameStarted && !gameOver) {
        jump()
      }
      if (e.code === "Space" && !gameStarted) {
        startGame()
      }
      if (e.code === "Space" && gameOver) {
        resetGame()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [gameStarted, gameOver, jumping])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current)
    }
  }, [])

  const startGame = () => {
    if (gameStarted) return

    setGameStarted(true)
    setGameOver(false)
    gameOverRef.current = false
    setScore(0)
    scoreRef.current = 0
    setObstacles([])
    frameCountRef.current = 0
    gameSpeedRef.current = 5

    // Start the game loop
    gameLoop()

    // Start scoring
    scoreIntervalRef.current = setInterval(() => {
      if (!gameOverRef.current) {
        scoreRef.current += 1
        setScore(scoreRef.current)
      }
    }, 100)
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameOver(false)
    gameOverRef.current = false
    setScore(0)
    scoreRef.current = 0
    setDinoY(0)
    dinoYRef.current = 0
    setJumping(false)
    setObstacles([])
    frameCountRef.current = 0
    gameSpeedRef.current = 5
  }

  const jump = () => {
    if (jumping) return
    setJumping(true)

    let velocity = JUMP_FORCE
    const jumpInterval = setInterval(() => {
      if (gameOverRef.current) {
        clearInterval(jumpInterval)
        return
      }

      setDinoY((prev) => {
        const newY = prev + velocity
        dinoYRef.current = newY // Update ref with the latest value
        velocity -= GRAVITY

        // If dino is back on the ground
        if (newY <= 0) {
          clearInterval(jumpInterval)
          setJumping(false)
          dinoYRef.current = 0
          return 0
        }

        return newY
      })
    }, 16) // ~60fps
  }

  // Get obstacle type based on element
  const getObstacleType = () => {
    const types = {
      fire: ["cactus", "rock"],
      water: ["crystal", "rock"],
      earth: ["rock", "cactus"],
      air: ["cloud", "crystal"],
    }

    const availableTypes = types[elementType as keyof typeof types] || ["rock", "cactus"]
    return availableTypes[Math.floor(Math.random() * availableTypes.length)] as "cactus" | "rock" | "crystal" | "cloud"
  }

  const gameLoop = () => {
    if (gameOverRef.current) {
      return
    }

    frameCountRef.current++

    // Increase game speed over time
    if (frameCountRef.current % 500 === 0) {
      gameSpeedRef.current += 0.5
    }

    // Generate obstacles
    if (frameCountRef.current % Math.floor(100 - gameSpeedRef.current * 2) === 0) {
      const obstacleType = getObstacleType()

      // Set dimensions based on obstacle type
      let height, width

      switch (obstacleType) {
        case "cactus":
          height = 40
          width = 20
          break
        case "rock":
          height = 25
          width = 30
          break
        case "crystal":
          height = 35
          width = 25
          break
        case "cloud":
          height = 25
          width = 40
          break
        default:
          height = 30
          width = 30
      }

      // Get game area width for proper positioning
      const gameWidth = gameAreaRef.current?.clientWidth || 600

      setObstacles((prev) => [
        ...prev,
        {
          x: gameWidth,
          width,
          height,
          type: obstacleType,
        },
      ])
    }

    // Move obstacles and check for collisions
    setObstacles((prev) => {
      // Remove obstacles that are off screen
      const updated = prev
        .filter((obs) => obs.x > -obs.width)
        .map((obs) => ({
          ...obs,
          x: obs.x - gameSpeedRef.current,
        }))

      // Collision detection using the current dinoY from the ref
      const dinoHitbox = {
        x: 50,
        y: GROUND_HEIGHT + dinoYRef.current,
        width: DINO_WIDTH - 10,
        height: DINO_HEIGHT - 10,
      }

      for (const obs of updated) {
        const obsY = obs.type === "cloud" ? GROUND_HEIGHT + 50 : GROUND_HEIGHT

        if (
          dinoHitbox.x < obs.x + obs.width &&
          dinoHitbox.x + dinoHitbox.width > obs.x &&
          dinoHitbox.y < obsY + obs.height &&
          dinoHitbox.y + dinoHitbox.height > obsY
        ) {
          // Collision detected!
          console.log("Collision detected! Game over.")

          if (!gameOverRef.current) {
            gameOverRef.current = true
            setTimeout(() => endGame(), 0)
          }
          break
        }
      }

      return updated
    })

    // Continue game loop if not game over
    if (!gameOverRef.current) {
      gameLoopRef.current = requestAnimationFrame(gameLoop)
    }
  }

  const endGame = () => {
    console.log("Game ending with score:", scoreRef.current)

    // Stop all game loops and intervals
    setGameOver(true)
    gameOverRef.current = true

    if (scoreIntervalRef.current) {
      clearInterval(scoreIntervalRef.current)
      scoreIntervalRef.current = null
    }

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    // Make sure we pass the current score to the parent component
    // Use the ref value to ensure we have the latest score
    onGameOver(scoreRef.current)
  }

  // Add touch support for mobile devices
  useEffect(() => {
    const handleTouchStart = () => {
      if (!jumping && gameStarted && !gameOver) {
        jump()
      }
      if (!gameStarted) {
        startGame()
      }
      if (gameOver) {
        resetGame()
      }
    }

    document.addEventListener("touchstart", handleTouchStart)
    return () => document.removeEventListener("touchstart", handleTouchStart)
  }, [gameStarted, gameOver, jumping])

  // Get element-specific styles
  const getElementStyles = () => {
    switch (elementType) {
      case "fire":
        return {
          ground: "bg-red-900",
          obstacle: {
            cactus: "bg-red-600 border-red-800 border-2",
            rock: "bg-gray-700 border-red-900 border-2",
            crystal: "bg-orange-400 border-red-700 border-2",
            cloud: "bg-orange-300 border-red-500 border-2",
          },
        }
      case "water":
        return {
          ground: "bg-blue-900",
          obstacle: {
            cactus: "bg-blue-600 border-blue-800 border-2",
            rock: "bg-gray-700 border-blue-900 border-2",
            crystal: "bg-cyan-400 border-blue-700 border-2",
            cloud: "bg-cyan-300 border-blue-500 border-2",
          },
        }
      case "earth":
        return {
          ground: "bg-green-900",
          obstacle: {
            cactus: "bg-green-600 border-green-800 border-2",
            rock: "bg-gray-700 border-green-900 border-2",
            crystal: "bg-emerald-400 border-green-700 border-2",
            cloud: "bg-lime-300 border-green-500 border-2",
          },
        }
      case "air":
        return {
          ground: "bg-gray-500",
          obstacle: {
            cactus: "bg-gray-400 border-gray-600 border-2",
            rock: "bg-gray-700 border-gray-800 border-2",
            crystal: "bg-indigo-300 border-gray-600 border-2",
            cloud: "bg-white border-gray-400 border-2",
          },
        }
      default:
        return {
          ground: "bg-gray-700",
          obstacle: {
            cactus: "bg-red-600 border-red-800 border-2",
            rock: "bg-gray-700 border-gray-800 border-2",
            crystal: "bg-blue-400 border-blue-700 border-2",
            cloud: "bg-white border-gray-400 border-2",
          },
        }
    }
  }

  const styles = getElementStyles()

  // Render obstacle with appropriate shape based on type
  const renderObstacle = (obs: any, index: number) => {
    const obstacleStyle = styles.obstacle[obs.type]
    const isFlying = obs.type === "cloud"

    const baseStyle = {
      left: `${obs.x}px`,
      width: `${obs.width}px`,
      height: `${obs.height}px`,
      bottom: isFlying ? `${GROUND_HEIGHT + 50}px` : `${GROUND_HEIGHT}px`,
    }

    switch (obs.type) {
      case "cactus":
        return (
          <div key={index} className={`absolute ${obstacleStyle} pixel-art`} style={baseStyle}>
            <div className="absolute top-1/4 left-1/3 w-1/3 h-1/2 bg-inherit"></div>
          </div>
        )
      case "rock":
        return <div key={index} className={`absolute ${obstacleStyle} pixel-art rounded-t-lg`} style={baseStyle}></div>
      case "crystal":
        return (
          <div
            key={index}
            className={`absolute ${obstacleStyle} pixel-art transform rotate-45`}
            style={{
              ...baseStyle,
              clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            }}
          ></div>
        )
      case "cloud":
        return (
          <div key={index} className={`absolute ${obstacleStyle} pixel-art rounded-full`} style={baseStyle}>
            <div className="absolute -top-1/4 left-1/4 w-1/2 h-1/2 bg-inherit rounded-full"></div>
            <div className="absolute -top-1/4 right-1/4 w-1/2 h-1/2 bg-inherit rounded-full"></div>
          </div>
        )
      default:
        return <div key={index} className={`absolute ${obstacleStyle} pixel-art`} style={baseStyle}></div>
    }
  }

  const showDebugHitboxes = process.env.NODE_ENV === "development" || showDebug

  return (
    <div ref={gameAreaRef} className="w-full h-64 bg-gray-900 border-2 border-gray-700 relative overflow-hidden">
      {/* Ground */}
      <div className={`absolute bottom-0 left-0 w-full ${styles.ground}`} style={{ height: `${GROUND_HEIGHT}px` }} />

      {/* Dino/Character */}
      <div
        className="absolute left-12 flex items-center justify-center"
        style={{
          bottom: `${GROUND_HEIGHT + dinoY}px`,
          width: `${DINO_WIDTH}px`,
          height: `${DINO_HEIGHT}px`,
          zIndex: 10,
        }}
      >
        <ElementalIcon elementType={elementType} size="sm" className="transform scale-125" />
      </div>

      {/* Obstacles */}
      {obstacles.map((obs, index) => renderObstacle(obs, index))}

      {/* Debug hitboxes */}
      {showDebugHitboxes && (
        <>
          <div
            className="absolute border-2 border-red-500 z-50 opacity-50"
            style={{
              left: "50px",
              bottom: `${GROUND_HEIGHT + dinoY}px`,
              width: `${DINO_WIDTH - 10}px`,
              height: `${DINO_HEIGHT - 10}px`,
            }}
          />

          {obstacles.map((obs, i) => (
            <div
              key={`hitbox-${i}`}
              className="absolute border-2 border-blue-500 z-50 opacity-50"
              style={{
                left: `${obs.x}px`,
                bottom: obs.type === "cloud" ? `${GROUND_HEIGHT + 50}px` : `${GROUND_HEIGHT}px`,
                width: `${obs.width}px`,
                height: `${obs.height}px`,
              }}
            />
          ))}
        </>
      )}

      {/* Score */}
      <div className="absolute top-4 right-4 text-white pixel-font">SCORE: {score}</div>
      <div className="absolute top-4 left-4">
        <button
          onClick={() => setShowDebug((prev) => !prev)}
          className="bg-gray-800 text-xs text-gray-400 px-2 py-1 rounded"
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {/* Game over screen */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col z-20">
          <div className="text-2xl text-red-500 pixel-font mb-2">GAME OVER</div>
          <div className="text-white pixel-font mb-4">SCORE: {score}</div>
          <Button onClick={resetGame} className="pixel-button">
            PLAY AGAIN
          </Button>
        </div>
      )}

      {/* Start screen */}
      {!gameStarted && !gameOver && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center flex-col z-20">
          <div className="text-2xl text-yellow-400 pixel-font mb-4">ELEMENTAL RUNNER</div>
          <div className="text-white pixel-font mb-2">PRESS SPACE TO START</div>
          <div className="text-gray-400 pixel-font text-xs mb-4">OR</div>
          <Button onClick={startGame} className="pixel-button">
            START GAME
          </Button>
        </div>
      )}
    </div>
  )
}

