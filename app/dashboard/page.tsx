"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sword, Trophy, Users } from "lucide-react"
import WarriorCard from "@/components/warrior-card"
import BattleModal from "@/components/battle-modal"
import { checkDatabaseSetup } from "@/lib/database-setup"

export default function Dashboard() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [warriors, setWarriors] = useState<any[]>([])
  const [myWarrior, setMyWarrior] = useState<any>(null)
  const [showBattleModal, setShowBattleModal] = useState(false)
  const [selectedOpponent, setSelectedOpponent] = useState<any>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        router.push("/login")
        return
      }

      setUser(session.user)
      console.log("User session:", session.user)

      // Check if we can access the warriors table
      const dbStatus = await checkDatabaseSetup()

      if (!dbStatus.success) {
        setIsPreviewMode(dbStatus.isPreviewMode)
        setPreviewMessage(dbStatus.error)
        console.log("Database status:", dbStatus)

        // Create a mock warrior for preview mode
        const mockWarrior = {
          id: "preview-id",
          user_id: session.user.id,
          name: session.user.user_metadata?.warrior_name || "Preview Warrior",
          token_symbol: session.user.user_metadata?.token_symbol || "PREV",
          token_address: session.user.user_metadata?.token_address || "0xPreviewModeAddress",
          level: 1,
          wins: 0,
          losses: 0,
          token_balance: 1000000,
          token_value: "0.00",
        }

        setMyWarrior(mockWarrior)

        // Create mock opponents for preview mode
        setWarriors([
          {
            id: "preview-opponent-1",
            user_id: "preview-user-1",
            name: "Pixel Crusher",
            token_symbol: "PIXL",
            token_address: "0xPreviewOpponent1Address",
            level: 3,
            wins: 5,
            losses: 2,
          },
          {
            id: "preview-opponent-2",
            user_id: "preview-user-2",
            name: "Byte Brawler",
            token_symbol: "BYTE",
            token_address: "0xPreviewOpponent2Address",
            level: 2,
            wins: 3,
            losses: 3,
          },
        ])

        setLoading(false)
        return
      }

      try {
        // Fetch user's warrior data
        const { data: warriorData, error: warriorError } = await supabase
          .from("warriors")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (warriorError) {
          if (warriorError.code !== "PGRST116") {
            // PGRST116 is "no rows returned" error
            console.error("Error fetching warrior:", warriorError)
          } else {
            // If no warrior found, check if we're in token creation process
            if (session.user.user_metadata?.token_job_id) {
              // User has started token creation, redirect to token status
              router.push(`/token-status?jobId=${session.user.user_metadata.token_job_id}`)
              return
            } else {
              // No token creation in progress, redirect to create one
              console.log("No warrior found for user, redirecting to signup")
              router.push("/signup")
              return
            }
          }
        }

        if (warriorData) {
          console.log("Warrior data found:", warriorData)
          setMyWarrior(warriorData)
        }

        // Fetch other warriors
        const { data: otherWarriors, error: warriorsError } = await supabase
          .from("warriors")
          .select("*")
          .neq("user_id", session.user.id)

        if (warriorsError) {
          console.error("Error fetching warriors:", warriorsError)
        } else {
          console.log("Other warriors found:", otherWarriors?.length || 0)
          setWarriors(otherWarriors || [])
        }
      } catch (error) {
        console.error("Error in dashboard:", error)
      }

      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  const handleBattleRequest = (opponent: any) => {
    setSelectedOpponent(opponent)
    setShowBattleModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-yellow-500 pb-4">
          <h1 className="text-3xl font-bold text-yellow-400 pixel-font">WARBIT ARENA</h1>
          <div className="flex items-center gap-4">
            <span className="text-green-400">{user?.user_metadata?.warrior_name || "Warrior"}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
              className="border-red-500 text-red-400 hover:bg-red-900/30"
            >
              Logout
            </Button>
          </div>
        </header>

        {isPreviewMode && previewMessage && (
          <Card className="bg-gray-900 border-yellow-500 mb-6">
            <CardHeader>
              <CardTitle className="text-yellow-400">Preview Mode</CardTitle>
              <CardDescription>
                You're viewing the dashboard in preview mode. Some features may be limited.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-2">{previewMessage}</p>
              <p className="text-gray-400">
                In a real deployment, you would need to create the "warriors" table in your Supabase database with this
                SQL:
              </p>
              <pre className="bg-gray-800 p-3 rounded-md mt-2 overflow-x-auto text-xs text-green-400">
                {`CREATE TABLE public.warriors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  token_address TEXT NOT NULL,
  level INTEGER DEFAULT 1,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  token_balance BIGINT DEFAULT 0,
  token_value TEXT DEFAULT '0.00',
  battles JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);`}
              </pre>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="arena" className="space-y-8">
          <TabsList className="grid grid-cols-3 bg-gray-800 w-full max-w-md mx-auto">
            <TabsTrigger value="arena" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Sword className="mr-2 h-4 w-4" />
              Arena
            </TabsTrigger>
            <TabsTrigger value="warriors" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Users className="mr-2 h-4 w-4" />
              Warriors
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Trophy className="mr-2 h-4 w-4" />
              My Warrior
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arena" className="space-y-4">
            <Card className="bg-gray-900 border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-400">Battle Arena</CardTitle>
                <CardDescription>Challenge other warriors to battle</CardDescription>
              </CardHeader>
              <CardContent>
                {warriors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No warriors available to battle</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {warriors.map((warrior) => (
                      <WarriorCard key={warrior.id} warrior={warrior} onBattle={() => handleBattleRequest(warrior)} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="warriors" className="space-y-4">
            <Card className="bg-gray-900 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-400">Warrior Rankings</CardTitle>
                <CardDescription>See all warriors and their stats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 px-4">Rank</th>
                        <th className="text-left py-2 px-4">Warrior</th>
                        <th className="text-left py-2 px-4">Token</th>
                        <th className="text-right py-2 px-4">Wins</th>
                        <th className="text-right py-2 px-4">Losses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...warriors, myWarrior]
                        .filter(Boolean)
                        .sort((a, b) => b.wins - a.wins)
                        .map((warrior, index) => (
                          <tr key={warrior.id} className="border-b border-gray-800 hover:bg-gray-800">
                            <td className="py-2 px-4">{index + 1}</td>
                            <td className="py-2 px-4 font-bold">
                              {warrior.name}
                              {warrior.user_id === user?.id && (
                                <span className="ml-2 text-xs text-yellow-400">(You)</span>
                              )}
                            </td>
                            <td className="py-2 px-4">{warrior.token_symbol}</td>
                            <td className="py-2 px-4 text-right text-green-400">{warrior.wins || 0}</td>
                            <td className="py-2 px-4 text-right text-red-400">{warrior.losses || 0}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            {myWarrior ? (
              <Card className="bg-gray-900 border-green-500">
                <CardHeader>
                  <CardTitle className="text-green-400">{myWarrior.name}</CardTitle>
                  <CardDescription>Your warrior profile and stats</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="bg-gray-800 p-4 rounded-md border border-yellow-500 flex-1">
                      <h3 className="text-lg font-bold mb-4 text-yellow-400">Warrior Stats</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-gray-400">Level:</div>
                        <div className="text-white">{myWarrior.level || 1}</div>

                        <div className="text-gray-400">Wins:</div>
                        <div className="text-green-400">{myWarrior.wins || 0}</div>

                        <div className="text-gray-400">Losses:</div>
                        <div className="text-red-400">{myWarrior.losses || 0}</div>

                        <div className="text-gray-400">Win Rate:</div>
                        <div className="text-white">
                          {myWarrior.wins + myWarrior.losses > 0
                            ? `${Math.round((myWarrior.wins / (myWarrior.wins + myWarrior.losses)) * 100)}%`
                            : "N/A"}
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-md border border-green-500 flex-1">
                      <h3 className="text-lg font-bold mb-4 text-green-400">Token Info</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-gray-400">Symbol:</div>
                        <div className="text-white">{myWarrior.token_symbol}</div>

                        <div className="text-gray-400">Address:</div>
                        <div className="text-white font-mono text-xs truncate">{myWarrior.token_address}</div>

                        <div className="text-gray-400">Balance:</div>
                        <div className="text-white">{myWarrior.token_balance?.toLocaleString() || 0}</div>

                        <div className="text-gray-400">Value:</div>
                        <div className="text-white">${myWarrior.token_value || "0.00"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-800 p-4 rounded-md border border-gray-700">
                    <h3 className="text-lg font-bold mb-4 text-white">Battle History</h3>
                    {(myWarrior.battles?.length || 0) > 0 ? (
                      <div className="space-y-2">
                        {myWarrior.battles?.map((battle: any, index: number) => (
                          <div key={index} className="flex justify-between items-center border-b border-gray-700 pb-2">
                            <div>
                              <span className="font-bold">{battle.opponent}</span>
                              <span className="text-xs text-gray-400 ml-2">
                                {new Date(battle.date).toLocaleDateString()}
                              </span>
                            </div>
                            <div className={battle.result === "win" ? "text-green-400" : "text-red-400"}>
                              {battle.result === "win" ? "Victory" : "Defeat"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-400">No battles yet</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900 border-yellow-500">
                <CardHeader>
                  <CardTitle className="text-yellow-400">Create Your Warrior</CardTitle>
                  <CardDescription>You don't have a warrior yet</CardDescription>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <Button
                    onClick={() => router.push("/signup")}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                  >
                    Create Warrior
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {showBattleModal && selectedOpponent && (
        <BattleModal opponent={selectedOpponent} onClose={() => setShowBattleModal(false)} myWarrior={myWarrior} />
      )}
    </div>
  )
}

