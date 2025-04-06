"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import ElementalIcon from "./elemental-icon"
import type { ElementType } from "@/components/elemental-warrior-selector"

interface FormulaGameProps {
  onGameOver: (score: number) => void
  autoStart?: boolean
  elementType?: ElementType
}

export default function FormulaGame({ onGameOver, autoStart = false, elementType = "fire" }: FormulaGameProps) {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [carPosition, setCarPosition] = useState(50) // percentage from left
  const [obstacles, setObstacles] = useState<
    { x: number; y: number; width: number; height: number; passed: boolean }[]
  >([])
  const [showDebug, setShowDebug] = useState(false)
  const [gameSpeed, setGameSpeed] = useState(3)

  const gameLoopRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const gameSpeedRef = useRef(3)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameOverRef = useRef(false)
  const carPositionRef = useRef(50)
  const scoreRef = useRef(0)
  const keysPressed = useRef<{ [key: string]: boolean }>({})

  // Game constants
  const CAR_WIDTH = 40
  const CAR_HEIGHT = 60
  const LANE_WIDTH = 100 // percentage
  const MOVE_SPEED = 2 // percentage per frame
  const GAME_HEIGHT = 400
  const OBSTACLE_SPEED_MULTIPLIER = 1.5

  // Start game automatically if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startGame()
    }
  }, [autoStart])

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = true

      if (e.code === "Space" && !gameStarted) {
        startGame()
      }
      if (e.code === "Space" && gameOver) {
        resetGame()
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.code] = false
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [gameStarted, gameOver])

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
    setCarPosition(50)
    carPositionRef.current = 50
    setObstacles([])
    frameCountRef.current = 0
    gameSpeedRef.current = 3
    setGameSpeed(3)

    // Start the game loop
    gameLoop()

    // Start scoring
    scoreIntervalRef.current = setInterval(() => {
      if (!gameOverRef.current) {
        scoreRef.current += 1
        setScore(scoreRef.current)

        // Increase game speed over time
        if (scoreRef.current % 10 === 0) {
          gameSpeedRef.current += 0.5
          setGameSpeed(gameSpeedRef.current)
        }
      }
    }, 100)
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameOver(false)
    gameOverRef.current = false
    setScore(0)
    scoreRef.current = 0
    setCarPosition(50)
    carPositionRef.current = 50
    setObstacles([])
    frameCountRef.current = 0
    gameSpeedRef.current = 3
    setGameSpeed(3)
  }

  const gameLoop = () => {
    if (gameOverRef.current) {
      return
    }

    frameCountRef.current++

    // Handle car movement
    if (keysPressed.current["ArrowLeft"] || keysPressed.current["KeyA"]) {
      carPositionRef.current = Math.max(0, carPositionRef.current - MOVE_SPEED)
      setCarPosition(carPositionRef.current)
    }
    if (keysPressed.current["ArrowRight"] || keysPressed.current["KeyD"]) {
      carPositionRef.current = Math.min(
        100 - (CAR_WIDTH / (gameAreaRef.current?.clientWidth || 600)) * 100,
        carPositionRef.current + MOVE_SPEED,
      )
      setCarPosition(carPositionRef.current)
    }

    // Generate obstacles
    if (frameCountRef.current % Math.floor(100 / gameSpeedRef.current) === 0) {
      const gameWidth = gameAreaRef.current?.clientWidth || 600
      const obstacleWidth = Math.random() * 50 + 30 // Random width between 30 and 80
      const obstacleHeight = Math.random() * 30 + 20 // Random height between 20 and 50

      // Random x position (percentage)
      const obstacleX = Math.random() * (100 - (obstacleWidth / gameWidth) * 100)

      setObstacles((prev) => [
        ...prev,
        {
          x: obstacleX,
          y: -obstacleHeight,
          width: obstacleWidth,
          height: obstacleHeight,
          passed: false,
        },
      ])
    }

    // Move obstacles and check for collisions
    setObstacles((prev) => {
      // Remove obstacles that are off screen
      const updated = prev
        .filter((obs) => obs.y < GAME_HEIGHT)
        .map((obs) => {
          // Move obstacle down
          const newY = obs.y + gameSpeedRef.current * OBSTACLE_SPEED_MULTIPLIER

          // Check if obstacle has been passed
          let passed = obs.passed
          if (!passed && newY > GAME_HEIGHT) {
            passed = true
          }

          return {
            ...obs,
            y: newY,
            passed,
          }
        })

      // Get game area dimensions
      const gameWidth = gameAreaRef.current?.clientWidth || 600

      // Calculate car hitbox (in pixels)
      const carLeft = (carPositionRef.current / 100) * gameWidth
      const carRight = carLeft + CAR_WIDTH
      const carTop = GAME_HEIGHT - CAR_HEIGHT - 10 // 10px from bottom
      const carBottom = GAME_HEIGHT - 10

      // Check for collisions
      for (const obs of updated) {
        const obsLeft = (obs.x / 100) * gameWidth
        const obsRight = obsLeft + obs.width
        const obsTop = obs.y
        const obsBottom = obs.y + obs.height

        if (carRight > obsLeft && carLeft < obsRight && carBottom > obsTop && carTop < obsBottom) {
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

    // Pass the score to the parent component
    onGameOver(scoreRef.current)
  }

  // Add touch support for mobile devices
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!gameStarted) {
        startGame()
        return
      }

      if (gameOver) {
        resetGame()
        return
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!gameStarted || gameOver) return

      const touch = e.touches[0]
      const gameWidth = gameAreaRef.current?.clientWidth || 600
      const touchX = touch.clientX

      // Calculate touch position as percentage of game width
      const touchPercent = (touchX / gameWidth) * 100

      // Set car position based on touch, with boundaries
      const newPosition = Math.max(
        0,
        Math.min(100 - (CAR_WIDTH / gameWidth) * 100, touchPercent - (CAR_WIDTH / gameWidth) * 50),
      )
      carPositionRef.current = newPosition
      setCarPosition(newPosition)
    }

    document.addEventListener("touchstart", handleTouchStart)
    document.addEventListener("touchmove", handleTouchMove)

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
    }
  }, [gameStarted, gameOver])

  // Get element-specific styles
  const getElementStyles = () => {
    switch (elementType) {
      case "fire":
        return {
          car: "bg-red-600 border-red-800",
          obstacle: "bg-gray-700 border-red-900",
          road: "bg-gray-800",
          roadLine: "bg-yellow-400",
        }
      case "water":
        return {
          car: "bg-blue-600 border-blue-800",
          obstacle: "bg-gray-700 border-blue-900",
          road: "bg-gray-800",
          roadLine: "bg-blue-400",
        }
      case "earth":
        return {
          car: "bg-green-600 border-green-800",
          obstacle: "bg-gray-700 border-green-900",
          road: "bg-gray-800",
          roadLine: "bg-green-400",
        }
      case "air":
        return {
          car: "bg-gray-300 border-gray-500",
          obstacle: "bg-gray-700 border-gray-900",
          road: "bg-gray-800",
          roadLine: "bg-white",
        }
      default:
        return {
          car: "bg-yellow-500 border-yellow-700",
          obstacle: "bg-gray-700 border-gray-900",
          road: "bg-gray-800",
          roadLine: "bg-yellow-400",
        }
    }
  }

  const styles = getElementStyles()

  return (
    <div
      ref={gameAreaRef}
      className={`w-full h-[400px] ${styles.road} border-2 border-gray-700 relative overflow-hidden`}
    >
      {/* Road lines */}
      <div
        className={`absolute left-1/2 top-0 w-2 h-full ${styles.roadLine} opacity-70`}
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, ${styles.roadLine}, ${styles.roadLine} 30px, transparent 30px, transparent 60px)`,
          transform: "translateX(-50%)",
        }}
      ></div>

      {/* Car */}
      <div
        className={`absolute ${styles.car} border-2 rounded-md pixel-art`}
        style={{
          left: `${carPosition}%`,
          bottom: "10px",
          width: `${CAR_WIDTH}px`,
          height: `${CAR_HEIGHT}px`,
          transform: "translateX(-50%)",
        }}
      >
        {/* Car details */}
        <div className="absolute top-1 left-1/4 right-1/4 h-1/3 bg-black rounded-t-sm"></div>
        <div className="absolute bottom-2 left-2 w-2 h-2 bg-red-500 rounded-full"></div>
        <div className="absolute bottom-2 right-2 w-2 h-2 bg-red-500 rounded-full"></div>
        <ElementalIcon
          elementType={elementType}
          size="sm"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-75"
        />
      </div>

      {/* Obstacles */}
      {obstacles.map((obstacle, index) => (
        <div
          key={index}
          className={`absolute ${styles.obstacle} border-2 rounded-sm pixel-art`}
          style={{
            left: `${obstacle.x}%`,
            top: `${obstacle.y}px`,
            width: `${obstacle.width}px`,
            height: `${obstacle.height}px`,
          }}
        ></div>
      ))}

      {/* Score and speed */}
      <div className="absolute top-4 right-4 text-white pixel-font">SCORE: {score}</div>
      <div className="absolute top-10 right-4 text-yellow-400 pixel-font">SPEED: {Math.round(gameSpeed * 10)}</div>

      {/* Debug button */}
      <div className="absolute top-4 left-4">
        <button
          onClick={() => setShowDebug((prev) => !prev)}
          className="bg-gray-800 text-xs text-gray-400 px-2 py-1 rounded"
        >
          {showDebug ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {/* Debug info */}
      {showDebug && (
        <div className="absolute bottom-4 left-4 text-xs text-white bg-black/50 p-2">
          <div>Car Position: {Math.round(carPosition)}%</div>
          <div>Game Speed: {gameSpeed.toFixed(1)}</div>
          <div>Obstacles: {obstacles.length}</div>
          <div>Frame: {frameCountRef.current}</div>
        </div>
      )}

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
          <div className="text-2xl text-yellow-400 pixel-font mb-4">FORMULA RACER</div>
          <div className="text-white pixel-font mb-2">PRESS SPACE TO START</div>
          <div className="text-gray-400 pixel-font text-xs mb-2">USE ARROW KEYS TO MOVE</div>
          <div className="text-gray-400 pixel-font text-xs mb-4">OR TOUCH SCREEN</div>
          <Button onClick={startGame} className="pixel-button">
            START GAME
          </Button>
        </div>
      )}
    </div>
  )
}

