import Link from "next/link"
import { PixelButton } from "@/components/pixel-button"
import { PixelCharacter } from "@/components/pixel-character"

export default function Home() {
  return (
    <div className="container flex flex-col items-center justify-center min-h-screen py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="font-pixel text-5xl mb-6 animate-pulse">WARBIT</h1>
        <p className="font-pixel text-sm max-w-md mx-auto">
          Choose your elemental warrior, battle opponents, and earn tokens!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 max-w-4xl">
        <div className="pixel-box">
          <h2 className="font-pixel text-xl mb-4 text-center">CHOOSE YOUR WARRIOR</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="element-fire p-4 flex flex-col items-center">
              <PixelCharacter element="fire" />
              <span className="font-pixel text-xs mt-2 text-white">FIRE</span>
            </div>
            <div className="element-water p-4 flex flex-col items-center">
              <PixelCharacter element="water" />
              <span className="font-pixel text-xs mt-2 text-white">WATER</span>
            </div>
            <div className="element-earth p-4 flex flex-col items-center">
              <PixelCharacter element="earth" />
              <span className="font-pixel text-xs mt-2 text-white">EARTH</span>
            </div>
            <div className="element-air p-4 flex flex-col items-center">
              <PixelCharacter element="air" />
              <span className="font-pixel text-xs mt-2 text-white">AIR</span>
            </div>
          </div>
          <p className="font-pixel text-xs text-center">Each element has unique strengths and weaknesses in battle.</p>
        </div>

        <div className="pixel-box">
          <h2 className="font-pixel text-xl mb-4 text-center">BATTLE & EARN</h2>
          <p className="font-pixel text-xs mb-4">
            Fight opponents to gain experience and tokens. Level up your warrior to become more powerful!
          </p>
          <ul className="space-y-2 mb-4">
            <li className="font-pixel text-xs flex items-center">
              <span className="inline-block w-2 h-2 bg-black mr-2"></span>
              Battle other warriors
            </li>
            <li className="font-pixel text-xs flex items-center">
              <span className="inline-block w-2 h-2 bg-black mr-2"></span>
              Win tokens for victories
            </li>
            <li className="font-pixel text-xs flex items-center">
              <span className="inline-block w-2 h-2 bg-black mr-2"></span>
              Climb the leaderboard
            </li>
          </ul>
          <div className="border-2 border-black p-2 text-center">
            <p className="font-pixel text-xs">TURN-BASED COMBAT</p>
          </div>
        </div>
      </div>

      <div className="pixel-box w-full max-w-md">
        <h2 className="font-pixel text-xl mb-4 text-center">READY TO PLAY?</h2>
        <p className="font-pixel text-xs mb-6 text-center">
          Create an account to start your journey and receive tokens!
        </p>
        <div className="flex gap-4">
          <Link href="/signup" className="w-1/2">
            <PixelButton className="w-full" variant="fire">
              SIGN UP
            </PixelButton>
          </Link>
          <Link href="/login" className="w-1/2">
            <PixelButton className="w-full" variant="water">
              LOG IN
            </PixelButton>
          </Link>
        </div>
      </div>
    </div>
  )
}

