import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-4xl text-center space-y-8">
        <div className="space-y-2">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-yellow-400 pixel-font">WARBIT</h1>
          <p className="text-xl md:text-2xl text-green-400 pixel-font">
            Create warriors. Battle opponents. Earn tokens.
          </p>
        </div>

        <div className="relative w-full h-64 md:h-80">
          <Image
            src="/placeholder.svg?height=320&width=640"
            alt="8-bit warriors ready for battle"
            fill
            className="object-contain"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button className="w-full md:w-auto bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-6 text-lg pixel-font">
              CREATE WARRIOR
            </Button>
          </Link>
          <Link href="/login">
            <Button
              variant="outline"
              className="w-full md:w-auto border-green-500 text-green-500 hover:bg-green-900 font-bold px-8 py-6 text-lg pixel-font"
            >
              BATTLE ARENA
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}

