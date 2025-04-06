"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import ElementalIcon from "./elemental-icon"
import type { ElementType } from "@/components/elemental-warrior-selector"

interface FlappyBirdProps {
  onGameOver: (score: number) => void
  autoStart?: boolean
  elementType?: ElementType
}

export default function FlappyBird({ onGameOver, autoStart = false, elementType = "fire" }: FlappyBirdProps) {
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [score, setScore] = useState(0)
  const [birdY, setBirdY] = useState(150)
  const [birdVelocity, setBirdVelocity] = useState(0)
  const [pipes, setPipes] = useState<{ x: number; topHeight: number; passed: boolean }[]>([])
  const [showDebug, setShowDebug] = useState(false)

  const gameLoopRef = useRef<number | null>(null)
  const frameCountRef = useRef(0)
  const scoreRef = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const gameOverRef = useRef(false)
  const birdYRef = useRef(150)
  const birdVelocityRef = useRef(0)

  // Game constants
  const GRAVITY = 0.5
  const JUMP_FORCE = -8
  const BIRD_WIDTH = 30
  const BIRD_HEIGHT = 30
  const PIPE_WIDTH = 60
  const PIPE_GAP = 150
  const GAME_HEIGHT = 400
  const GAME_SPEED = 3

  // Start game automatically if autoStart is true
  useEffect(() => {
    if (autoStart) {
      startGame()
    }
  }, [autoStart])

  // Handle keyboard and touch controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !gameOver && gameStarted) {
        flap()
      }
      if (e.code === "Space" && !gameStarted) {
        startGame()
      }
      if (e.code === "Space" && gameOver) {
        resetGame()
      }
    }

    const handleTouchStart = () => {
      if (!gameOver && gameStarted) {
        flap()
      }
      if (!gameStarted) {
        startGame()
      }
      if (gameOver) {
        resetGame()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    document.addEventListener("touchstart", handleTouchStart)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("touchstart", handleTouchStart)
    }
  }, [gameStarted, gameOver])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current)
    }
  }, [])

  const startGame = () => {
    if (gameStarted) return

    setGameStarted(true)
    setGameOver(false)
    gameOverRef.current = false
    setScore(0)
    scoreRef.current = 0
    setBirdY(150)
    birdYRef.current = 150
    setBirdVelocity(0)
    birdVelocityRef.current = 0
    setPipes([])
    frameCountRef.current = 0

    // Start the game loop
    gameLoop()
  }

  const resetGame = () => {
    setGameStarted(false)
    setGameOver(false)
    gameOverRef.current = false
    setScore(0)
    scoreRef.current = 0
    setBirdY(150)
    birdYRef.current = 150
    setBirdVelocity(0)
    birdVelocityRef.current = 0
    setPipes([])
    frameCountRef.current = 0
  }

  const flap = () => {
    setBirdVelocity(JUMP_FORCE)
    birdVelocityRef.current = JUMP_FORCE
  }

  const gameLoop = () => {
    if (gameOverRef.current) {
      return
    }

    frameCountRef.current++

    // Update bird position
    const newVelocity = birdVelocityRef.current + GRAVITY
    birdVelocityRef.current = newVelocity
    const newBirdY = birdYRef.current + newVelocity
    birdYRef.current = newBirdY
    setBirdY(newBirdY)
    setBirdVelocity(newVelocity)

    // Generate new pipes
    if (frameCountRef.current % 100 === 0) {
      const gameWidth = gameAreaRef.current?.clientWidth || 600
      const topHeight = Math.random() * (GAME_HEIGHT - PIPE_GAP - 100) + 50

      setPipes((prev) => [
        ...prev,
        {
          x: gameWidth,
          topHeight,
          passed: false,
        },
      ])
    }

    // Update pipes position and check for score
    setPipes((prev) => {
      const updated = prev
        .filter((pipe) => pipe.x > -PIPE_WIDTH)
        .map((pipe) => {
          // Move pipe
          const newX = pipe.x - GAME_SPEED

          // Check if bird passed the pipe
          if (!pipe.passed && newX + PIPE_WIDTH < 100) {
            scoreRef.current += 1
            setScore(scoreRef.current)
            return { ...pipe, x: newX, passed: true }
          }

          return { ...pipe, x: newX }
        })

      return updated
    })

    // Check for collisions
    const birdHitbox = {
      left: 100 - BIRD_WIDTH / 2,
      right: 100 + BIRD_WIDTH / 2,
      top: birdYRef.current - BIRD_HEIGHT / 2,
      bottom: birdYRef.current + BIRD_HEIGHT / 2,
    }

    // Check if bird hit the ground or ceiling
    if (birdHitbox.bottom > GAME_HEIGHT || birdHitbox.top < 0) {
      endGame()
      return
    }

    // Check if bird hit any pipes
    for (const pipe of pipes) {
      const pipeTopHitbox = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: 0,
        bottom: pipe.topHeight,
      }

      const pipeBottomHitbox = {
        left: pipe.x,
        right: pipe.x + PIPE_WIDTH,
        top: pipe.topHeight + PIPE_GAP,
        bottom: GAME_HEIGHT,
      }

      // Check collision with top pipe
      if (
        birdHitbox.right > pipeTopHitbox.left &&
        birdHitbox.left < pipeTopHitbox.right &&
        birdHitbox.top < pipeTopHitbox.bottom
      ) {
        endGame()
        return
      }

      // Check collision with bottom pipe
      if (
        birdHitbox.right > pipeBottomHitbox.left &&
        birdHitbox.left < pipeBottomHitbox.right &&
        birdHitbox.bottom > pipeBottomHitbox.top
      ) {
        endGame()
        return
      }
    }

    // Continue game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }

  const endGame = () => {
    console.log("Game ending with score:", scoreRef.current)
    setGameOver(true)
    gameOverRef.current = true

    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current)
      gameLoopRef.current = null
    }

    // Pass the score to the parent component
    onGameOver(scoreRef.current)
  }

  // Get element-specific styles
  const getElementStyles = () => {
    switch (elementType) {
      case "fire":
        return {
          bird: "bg-red-500 border-red-700",
          pipe: "bg-orange-700 border-orange-900",
          background: "bg-red-900/20",
        }
      case "water":
        return {
          bird: "bg-blue-500 border-blue-700",
          pipe: "bg-blue-700 border-blue-900",
          background: "bg-blue-900/20",
        }
      case "earth":
        return {
          bird: "bg-green-500 border-green-700",
          pipe: "bg-green-700 border-green-900",
          background: "bg-green-900/20",
        }
      case "air":
        return {
          bird: "bg-gray-300 border-gray-500",
          pipe: "bg-gray-500 border-gray-700",
          background: "bg-gray-900/20",
        }
      default:
        return {
          bird: "bg-yellow-500 border-yellow-700",
          pipe: "bg-green-700 border-green-900",
          background: "bg-blue-900/20",
        }
    }
  }

  const styles = getElementStyles()

  return (
    <div
      ref={gameAreaRef}
      className={`w-full h-[400px] ${styles.background} border-2 border-gray-700 relative overflow-hidden`}
    >
      {/* Bird */}
      <div
        className={`absolute left-[100px] rounded-full ${styles.bird} border-2 flex items-center justify-center transition-transform`}
        style={{
          top: `${birdY}px`,
          width: `${BIRD_WIDTH}px`,
          height: `${BIRD_HEIGHT}px`,
          transform: `rotate(${birdVelocity * 3}deg)`,
        }}
      >
        <ElementalIcon elementType={elementType} size="sm" className="transform scale-75" />
      </div>

      {/* Pipes */}
      {pipes.map((pipe, index) => (
        <div key={index}>
          {/* Top pipe */}
          <div
            className={`absolute ${styles.pipe} border-2`}
            style={{
              left: `${pipe.x}px`,
              top: 0,
              width: `${PIPE_WIDTH}px`,
              height: `${pipe.topHeight}px`,
            }}
          />
          {/* Bottom pipe */}
          <div
            className={`absolute ${styles.pipe} border-2`}
            style={{
              left: `${pipe.x}px`,
              top: `${pipe.topHeight + PIPE_GAP}px`,
              width: `${PIPE_WIDTH}px`,
              height: `${GAME_HEIGHT - pipe.topHeight - PIPE_GAP}px`,
            }}
          />
        </div>
      ))}

      {/* Score */}
      <div className="absolute top-4 right-4 text-white pixel-font">SCORE: {score}</div>

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
          <div>Bird Y: {Math.round(birdY)}</div>
          <div>Velocity: {Math.round(birdVelocity * 100) / 100}</div>
          <div>Pipes: {pipes.length}</div>
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
          <div className="text-2xl text-yellow-400 pixel-font mb-4">FLAPPY ELEMENTAL</div>
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

