"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sword, Trophy, Users, Bell } from "lucide-react"
import WarriorCard from "@/components/warrior-card"
import BattleModal from "@/components/battle-modal"
import BattleProposals from "@/components/battle-proposals"
import { checkDatabaseSetup } from "@/lib/database-setup"
import { getAllTokens } from "@/lib/metal-api"
import ActiveBattles from "@/components/active-battles"

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
  const [proposalCount, setProposalCount] = useState(0)

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

        // Fetch all warriors from the database
        await fetchAllWarriors(session.user.id)

        // Check for battle proposals
        const { data: proposals, error: proposalsError } = await supabase
          .from("battle_proposals")
          .select("*")
          .eq("opponent_id", session.user.id)
          .eq("status", "pending")

        if (!proposalsError) {
          setProposalCount(proposals?.length || 0)
        }
      } catch (error) {
        console.error("Error in dashboard:", error)
      }

      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  // Function to fetch all warriors
  const fetchAllWarriors = async (currentUserId: string) => {
    try {
      // First try to get warriors from the database
      const { data: dbWarriors, error: dbError } = await supabase
        .from("warriors")
        .select("*")
        .neq("user_id", currentUserId)

      if (dbError) {
        console.error("Error fetching warriors from database:", dbError)
      } else if (dbWarriors && dbWarriors.length > 0) {
        console.log("Warriors found in database:", dbWarriors.length)
        setWarriors(dbWarriors)
        return
      }

      // If no warriors in database or there was an error, try to get tokens from Metal API
      try {
        const tokens = await getAllTokens()
        console.log("Tokens from Metal API:", tokens)

        if (tokens && tokens.length > 0) {
          // Convert tokens to warriors format
          const apiWarriors = tokens
            .filter((token) => token.address !== myWarrior?.token_address) // Filter out current user's token
            .map((token, index) => ({
              id: `api-${index}`,
              user_id: `api-user-${index}`,
              name: token.name.replace(" Token", ""), // Remove " Token" suffix if present
              token_symbol: token.symbol,
              token_address: token.address,
              level: Math.floor(Math.random() * 5) + 1, // Random level 1-5
              wins: Math.floor(Math.random() * 10),
              losses: Math.floor(Math.random() * 5),
              token_balance: token.remainingAppSupply,
              token_value: "0.00",
            }))

          console.log("Warriors created from API tokens:", apiWarriors)
          setWarriors(apiWarriors)
        }
      } catch (apiError) {
        console.error("Error fetching tokens from Metal API:", apiError)
      }
    } catch (error) {
      console.error("Error in fetchAllWarriors:", error)
    }
  }

  const handleBattleRequest = (opponent: any) => {
    setSelectedOpponent(opponent)
    setShowBattleModal(true)
  }

  // Function to refresh the warriors list
  const refreshWarriors = async () => {
    if (user) {
      setLoading(true)
      await fetchAllWarriors(user.id)
      setLoading(false)
    }
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
              onClick={() => router.push("/dashboard/token-management")}
              className="border-green-500 text-green-400 hover:bg-green-900/30"
            >
              Manage Tokens
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin")}
              className="border-yellow-500 text-yellow-400 hover:bg-yellow-900/30"
            >
              Admin Panel
            </Button>
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
);

CREATE TABLE public.battle_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challenger_id UUID NOT NULL,
  challenger_warrior_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  opponent_warrior_id UUID NOT NULL,
  stake_amount FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL,
  challenger_id UUID NOT NULL,
  challenger_warrior_id UUID NOT NULL,
  opponent_id UUID NOT NULL,
  opponent_warrior_id UUID NOT NULL,
  stake_amount FLOAT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  turns JSONB DEFAULT '[]'::jsonb,
  winner TEXT,
  challenger_health INTEGER,
  opponent_health INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE,
  finalized_at TIMESTAMP WITH TIME ZONE
);`}
              </pre>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="arena" className="space-y-8">
          <TabsList className="grid grid-cols-5 bg-gray-800 w-full max-w-md mx-auto">
            <TabsTrigger value="arena" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Sword className="mr-2 h-4 w-4" />
              Arena
            </TabsTrigger>
            <TabsTrigger value="warriors" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Users className="mr-2 h-4 w-4" />
              Warriors
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black relative"
            >
              <Bell className="mr-2 h-4 w-4" />
              Challenges
              {proposalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {proposalCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="battles" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Sword className="mr-2 h-4 w-4" />
              Battles
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Trophy className="mr-2 h-4 w-4" />
              My Warrior
            </TabsTrigger>
          </TabsList>

          <TabsContent value="arena" className="space-y-4">
            <Card className="bg-gray-900 border-yellow-500">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-yellow-400">Battle Arena</CardTitle>
                  <CardDescription>Challenge other warriors to battle</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshWarriors}
                  className
                  size="sm"
                  onClick={refreshWarriors}
                  className="border-green-500 text-green-400 hover:bg-green-900/30"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Refresh Warriors
                </Button>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-green-400">Warrior Rankings</CardTitle>
                  <CardDescription>See all warriors and their stats</CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshWarriors}
                  className="border-green-500 text-green-400 hover:bg-green-900/30"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
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

          <TabsContent value="challenges" className="space-y-4">
            <Card className="bg-gray-900 border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-400">Battle Challenges</CardTitle>
                <CardDescription>Accept or decline battle challenges from other warriors</CardDescription>
              </CardHeader>
              <CardContent>
                {!isPreviewMode ? (
                  <BattleProposals userId={user?.id} warriorId={myWarrior?.id} />
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    Battle challenges are not available in preview mode
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="battles" className="space-y-4">
            <Card className="bg-gray-900 border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-400">Active Battles</CardTitle>
                <CardDescription>Continue your ongoing battles</CardDescription>
              </CardHeader>
              <CardContent>
                {!isPreviewMode ? (
                  <ActiveBattles userId={user?.id} />
                ) : (
                  <div className="text-center py-8 text-gray-400">Active battles are not available in preview mode</div>
                )}
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

                        <div className="text-gray-400">Token Address:</div>
                        <div className="text-white font-mono text-xs truncate">{myWarrior.token_address}</div>

                        <div className="text-gray-400">Wallet Address:</div>
                        <div className="text-white font-mono text-xs truncate">
                          {user?.user_metadata?.wallet_address || "Not provided"}
                        </div>

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

