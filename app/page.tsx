import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl text-center space-y-8">
        <div className="mario-container space-y-4">
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-red-600 pixel-font float">WARBIT</h1>
            <div className="h-2 w-48 mx-auto bg-yellow-400 mb-4"></div>
            <p className="text-xl md:text-2xl text-green-400 pixel-font">
              CREATE WARRIORS. BATTLE OPPONENTS. EARN TOKENS.
            </p>
          </div>

          <div className="question-block bg-yellow-500 p-4 relative">
            <div className="bg-black p-6">
              <h2 className="text-xl text-yellow-400 pixel-font mb-4">CHOOSE YOUR WARRIOR</h2>
              <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
                {["fire", "water", "earth", "air"].map((element) => (
                  <div key={element} className="flex flex-col items-center">
                    <div className={`elemental-icon w-16 h-16 element-${element}`}></div>
                    <p className="mt-2 text-xs text-white pixel-font uppercase">{element}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-center">
                <p className="text-green-400 pixel-font">BATTLE WITH YOUR UNIQUE 8-BIT WARRIOR!</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 justify-center mt-8">
            <Link href="/signup">
              <button className="w-full md:w-auto mario-button px-8 py-6 text-lg bounce">CREATE WARRIOR</button>
            </Link>
            <Link href="/login">
              <button className="w-full md:w-auto mario-button mario-button-green px-8 py-6 text-lg bounce">
                BATTLE ARENA
              </button>
            </Link>
          </div>

          <div className="brick-pattern p-4 mt-8">
            <div className="text-xs text-white pixel-font">© 2023 WARBIT · PRESS START TO PLAY</div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-10 left-10 mario-cloud"></div>
        <div className="absolute top-20 right-20 mario-cloud"></div>
        <div className="absolute bottom-10 left-20 mario-cloud"></div>
        <div className="absolute bottom-20 right-10 mario-cloud"></div>
      </div>
    </main>
  )
}

