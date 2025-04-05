"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Sword, Award, AlertCircle, Eye } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [completedBattles, setCompletedBattles] = useState<any[]>([])
  const [pendingBattles, setPendingBattles] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [processingBattleId, setProcessingBattleId] = useState<string | null>(null)

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

      // Check if user is admin - for development, allow all users to access admin panel
      // In production, you would implement proper role-based access control
      const isUserAdmin = true // Allow all users to access admin panel for now

      setIsAdmin(isUserAdmin)

      if (!isUserAdmin) {
        setError("You don't have permission to access this page")
        setLoading(false)
        return
      }

      await fetchBattles()
      setLoading(false)
    }

    checkUser()
  }, [router, supabase])

  // Helper function to safely fetch data
  const safelyFetchData = async (query: any) => {
    try {
      const { data, error } = await query
      if (error) {
        console.error("Error fetching data:", error)
        return null
      }
      return data
    } catch (err) {
      console.error("Exception fetching data:", err)
      return null
    }
  }

  const fetchBattles = async () => {
    try {
      // Fetch completed battles awaiting finalization
      const completedBattlesData = await safelyFetchData(
        supabase.from("battles").select("*").eq("status", "completed").order("updated_at", { ascending: false }),
      )

      // Fetch in-progress battles
      const pendingBattlesData = await safelyFetchData(
        supabase.from("battles").select("*").eq("status", "in_progress").order("created_at", { ascending: false }),
      )

      // Process completed battles
      if (completedBattlesData && completedBattlesData.length > 0) {
        const enhancedCompletedBattles = await Promise.all(
          completedBattlesData.map(async (battle) => {
            // For preview mode, create mock data
            if (!battle.challenger_id || !battle.opponent_id) {
              return {
                ...battle,
                challenger: {
                  id: battle.challenger_id || "preview-challenger",
                  user_metadata: { warrior_name: "Preview Challenger" },
                },
                challenger_warrior: {
                  name: "Preview Challenger",
                  token_symbol: "PCH",
                },
                opponent: {
                  id: battle.opponent_id || "preview-opponent",
                  user_metadata: { warrior_name: "Preview Opponent" },
                },
                opponent_warrior: {
                  name: "Preview Opponent",
                  token_symbol: "POP",
                },
              }
            }

            // Get challenger warrior data
            const challengerWarrior = await safelyFetchData(
              supabase.from("warriors").select("*").eq("id", battle.challenger_warrior_id).single(),
            )

            // Get opponent warrior data
            const opponentWarrior = await safelyFetchData(
              supabase.from("warriors").select("*").eq("id", battle.opponent_warrior_id).single(),
            )

            // Get user data from metadata
            const {
              data: { users },
            } = await supabase.auth.admin.listUsers()
            const challengerUser = users?.find((u) => u.id === battle.challenger_id)
            const opponentUser = users?.find((u) => u.id === battle.opponent_id)

            return {
              ...battle,
              challenger: challengerUser || {
                id: battle.challenger_id,
                user_metadata: { warrior_name: "Unknown Challenger" },
              },
              challenger_warrior: challengerWarrior || {
                name: "Unknown Challenger",
                token_symbol: "???",
              },
              opponent: opponentUser || {
                id: battle.opponent_id,
                user_metadata: { warrior_name: "Unknown Opponent" },
              },
              opponent_warrior: opponentWarrior || {
                name: "Unknown Opponent",
                token_symbol: "???",
              },
            }
          }),
        )

        setCompletedBattles(enhancedCompletedBattles)
      } else {
        // Create mock data for preview mode
        setCompletedBattles([
          {
            id: "preview-completed-1",
            challenger_id: "preview-challenger-1",
            challenger_warrior_id: "preview-challenger-warrior-1",
            opponent_id: "preview-opponent-1",
            opponent_warrior_id: "preview-opponent-warrior-1",
            stake_amount: 100,
            status: "completed",
            winner: "challenger",
            challenger_health: 65,
            opponent_health: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            challenger: {
              id: "preview-challenger-1",
              user_metadata: { warrior_name: "Pixel Crusher" },
            },
            challenger_warrior: {
              name: "Pixel Crusher",
              token_symbol: "PIXL",
            },
            opponent: {
              id: "preview-opponent-1",
              user_metadata: { warrior_name: "Byte Brawler" },
            },
            opponent_warrior: {
              name: "Byte Brawler",
              token_symbol: "BYTE",
            },
          },
        ])
      }

      // Process pending battles
      if (pendingBattlesData && pendingBattlesData.length > 0) {
        const enhancedPendingBattles = await Promise.all(
          pendingBattlesData.map(async (battle) => {
            // Get challenger warrior data
            const challengerWarrior = await safelyFetchData(
              supabase.from("warriors").select("*").eq("id", battle.challenger_warrior_id).single(),
            )

            // Get opponent warrior data
            const opponentWarrior = await safelyFetchData(
              supabase.from("warriors").select("*").eq("id", battle.opponent_warrior_id).single(),
            )

            // Get user data from metadata
            const {
              data: { users },
            } = await supabase.auth.admin.listUsers()
            const challengerUser = users?.find((u) => u.id === battle.challenger_id)
            const opponentUser = users?.find((u) => u.id === battle.opponent_id)

            return {
              ...battle,
              challenger: challengerUser || {
                id: battle.challenger_id,
                user_metadata: { warrior_name: "Unknown Challenger" },
              },
              challenger_warrior: challengerWarrior || {
                name: "Unknown Challenger",
                token_symbol: "???",
              },
              opponent: opponentUser || {
                id: battle.opponent_id,
                user_metadata: { warrior_name: "Unknown Opponent" },
              },
              opponent_warrior: opponentWarrior || {
                name: "Unknown Opponent",
                token_symbol: "???",
              },
            }
          }),
        )

        setPendingBattles(enhancedPendingBattles)
      } else {
        // Create mock data for preview mode
        setPendingBattles([
          {
            id: "preview-pending-1",
            challenger_id: "preview-challenger-2",
            challenger_warrior_id: "preview-challenger-warrior-2",
            opponent_id: "preview-opponent-2",
            opponent_warrior_id: "preview-opponent-warrior-2",
            stake_amount: 100,
            status: "in_progress",
            turns: [{ turn: 1 }],
            created_at: new Date().toISOString(),
            challenger: {
              id: "preview-challenger-2",
              user_metadata: { warrior_name: "Data Destroyer" },
            },
            challenger_warrior: {
              name: "Data Destroyer",
              token_symbol: "DATA",
            },
            opponent: {
              id: "preview-opponent-2",
              user_metadata: { warrior_name: "Crypto Knight" },
            },
            opponent_warrior: {
              name: "Crypto Knight",
              token_symbol: "CRYP",
            },
          },
        ])
      }
    } catch (err) {
      console.error("Error fetching battles:", err)
      setError("Failed to load battles")

      // Set mock data for preview mode
      setCompletedBattles([
        {
          id: "preview-completed-1",
          challenger_id: "preview-challenger-1",
          challenger_warrior_id: "preview-challenger-warrior-1",
          opponent_id: "preview-opponent-1",
          opponent_warrior_id: "preview-opponent-warrior-1",
          stake_amount: 100,
          status: "completed",
          winner: "challenger",
          challenger_health: 65,
          opponent_health: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          challenger: {
            id: "preview-challenger-1",
            user_metadata: { warrior_name: "Pixel Crusher" },
          },
          challenger_warrior: {
            name: "Pixel Crusher",
            token_symbol: "PIXL",
          },
          opponent: {
            id: "preview-opponent-1",
            user_metadata: { warrior_name: "Byte Brawler" },
          },
          opponent_warrior: {
            name: "Byte Brawler",
            token_symbol: "BYTE",
          },
        },
      ])

      setPendingBattles([
        {
          id: "preview-pending-1",
          challenger_id: "preview-challenger-2",
          challenger_warrior_id: "preview-challenger-warrior-2",
          opponent_id: "preview-opponent-2",
          opponent_warrior_id: "preview-opponent-warrior-2",
          stake_amount: 100,
          status: "in_progress",
          turns: [{ turn: 1 }],
          created_at: new Date().toISOString(),
          challenger: {
            id: "preview-challenger-2",
            user_metadata: { warrior_name: "Data Destroyer" },
          },
          challenger_warrior: {
            name: "Data Destroyer",
            token_symbol: "DATA",
          },
          opponent: {
            id: "preview-opponent-2",
            user_metadata: { warrior_name: "Crypto Knight" },
          },
          opponent_warrior: {
            name: "Crypto Knight",
            token_symbol: "CRYP",
          },
        },
      ])
    }
  }

  const finalizeBattle = async (battleId: string) => {
    setProcessingBattleId(battleId)
    try {
      // Get the battle details
      const battle = completedBattles.find((b) => b.id === battleId)
      if (!battle) throw new Error("Battle not found")

      // Update battle status
      const { error: updateError } = await supabase
        .from("battles")
        .update({
          status: "finalized",
          finalized_at: new Date().toISOString(),
        })
        .eq("id", battleId)

      if (updateError) throw updateError

      // Update warrior stats based on winner
      if (battle.winner === "challenger") {
        // Update challenger stats (winner)
        await supabase
          .from("warriors")
          .update({
            wins: battle.challenger_warrior.wins + 1,
            token_balance: battle.challenger_warrior.token_balance + battle.stake_amount * 2,
          })
          .eq("id", battle.challenger_warrior_id)

        // Update opponent stats (loser)
        await supabase
          .from("warriors")
          .update({
            losses: battle.opponent_warrior.losses + 1,
          })
          .eq("id", battle.opponent_warrior_id)

        console.log(`Distributed ${battle.stake_amount * 2} ${battle.challenger_warrior.token_symbol} tokens to winner`)
      } else if (battle.winner === "opponent") {
        // Update opponent stats (winner)
        await supabase
          .from("warriors")
          .update({
            wins: battle.opponent_warrior.wins + 1,
            token_balance: battle.opponent_warrior.token_balance + battle.stake_amount * 2,
          })
          .eq("id", battle.opponent_warrior_id)

        // Update challenger stats (loser)
        await supabase
          .from("warriors")
          .update({
            losses: battle.challenger_warrior.losses + 1,
          })
          .eq("id", battle.challenger_warrior_id)

        console.log(`Distributed ${battle.stake_amount * 2} ${battle.opponent_warrior.token_symbol} tokens to winner`)
      } else {
        // It's a draw, return stakes to both
        await supabase
          .from("warriors")
          .update({
            token_balance: battle.challenger_warrior.token_balance + battle.stake_amount,
          })
          .eq("id", battle.challenger_warrior_id)

        await supabase
          .from("warriors")
          .update({
            token_balance: battle.opponent_warrior.token_balance + battle.stake_amount,
          })
          .eq("id", battle.opponent_warrior_id)

        console.log(`Returned ${battle.stake_amount} tokens to each player due to draw`)
      }

      // Refresh the battles list
      await fetchBattles()
    } catch (err) {
      console.error("Error finalizing battle:", err)
      setError("Failed to finalize battle")
    } finally {
      setProcessingBattleId(null)
    }
  }

  const viewBattleDetails = (battleId: string) => {
    // In a real implementation, this would open a modal with battle details
    console.log("Viewing battle details for:", battleId)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black p-4">
        <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b border-yellow-500 pb-4">
          <h1 className="text-3xl font-bold text-yellow-400 pixel-font">WARBIT ADMIN</h1>
          <div className="flex items-center gap-4">
            <span className="text-green-400">Admin Panel</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="border-green-500 text-green-400 hover:bg-green-900/30"
            >
              Dashboard
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

        <Tabs defaultValue="completed" className="space-y-8">
          <TabsList className="grid grid-cols-2 bg-gray-800 w-full max-w-md mx-auto">
            <TabsTrigger value="completed" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Award className="mr-2 h-4 w-4" />
              Completed Battles
            </TabsTrigger>
            <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black">
              <Sword className="mr-2 h-4 w-4" />
              In-Progress Battles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="completed" className="space-y-4">
            <Card className="bg-gray-900 border-yellow-500">
              <CardHeader>
                <CardTitle className="text-yellow-400">Completed Battles</CardTitle>
                <CardDescription>View battle results and token distributions</CardDescription>
              </CardHeader>
              <CardContent>
                {completedBattles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No completed battles awaiting finalization</div>
                ) : (
                  <div className="space-y-4">
                    {completedBattles.map((battle) => (
                      <Card key={battle.id} className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-white">Battle #{battle.id.substring(0, 8)}</CardTitle>
                            <Badge
                              className={
                                battle.winner === "challenger"
                                  ? "bg-green-500"
                                  : battle.winner === "opponent"
                                    ? "bg-blue-500"
                                    : "bg-yellow-500"
                              }
                            >
                              {battle.winner === "challenger"
                                ? "Challenger Won"
                                : battle.winner === "opponent"
                                  ? "Opponent Won"
                                  : "Draw"}
                            </Badge>
                          </div>
                          <CardDescription>Completed on {new Date(battle.updated_at).toLocaleString()}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-4">
                          <div className="flex justify-between items-center mb-4">
                            <div className="text-center">
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                                <span>{battle.challenger_warrior.name.charAt(0)}</span>
                              </div>
                              <div className="text-sm font-bold">{battle.challenger_warrior.name}</div>
                              <div className="text-xs text-gray-400">{battle.challenger_warrior.token_symbol}</div>
                              <div className="mt-1">
                                <Progress
                                  value={(battle.challenger_health / 100) * 100}
                                  className="h-2 w-20 bg-gray-700"
                                  indicatorClassName="bg-green-500"
                                />
                              </div>
                            </div>

                            <div className="text-center">
                              <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-md mb-1">
                                {battle.stake_amount} {battle.challenger_warrior.token_symbol}
                              </div>
                              <div className="text-xs text-gray-400">Stake Amount</div>
                            </div>

                            <div className="text-center">
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                                <span>{battle.opponent_warrior.name.charAt(0)}</span>
                              </div>
                              <div className="text-sm font-bold">{battle.opponent_warrior.name}</div>
                              <div className="text-xs text-gray-400">{battle.opponent_warrior.token_symbol}</div>
                              <div className="mt-1">
                                <Progress
                                  value={(battle.opponent_health / 100) * 100}
                                  className="h-2 w-20 bg-gray-700"
                                  indicatorClassName="bg-green-500"
                                />
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => viewBattleDetails(battle.id)}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-black"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <Card className="bg-gray-900 border-green-500">
              <CardHeader>
                <CardTitle className="text-green-400">In-Progress Battles</CardTitle>
                <CardDescription>Battles currently being played</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingBattles.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No battles in progress</div>
                ) : (
                  <div className="space-y-4">
                    {pendingBattles.map((battle) => (
                      <Card key={battle.id} className="bg-gray-800 border-gray-700">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-white">Battle #{battle.id.substring(0, 8)}</CardTitle>
                          <CardDescription>Started on {new Date(battle.created_at).toLocaleString()}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <div className="text-center">
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                                <span>{battle.challenger_warrior.name.charAt(0)}</span>
                              </div>
                              <div className="text-sm font-bold">{battle.challenger_warrior.name}</div>
                              <div className="text-xs text-gray-400">{battle.challenger_warrior.token_symbol}</div>
                            </div>

                            <div className="text-center">
                              <div className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-md mb-1">
                                {battle.stake_amount} {battle.challenger_warrior.token_symbol}
                              </div>
                              <div className="text-xs text-gray-400">Stake Amount</div>
                            </div>

                            <div className="text-center">
                              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 mb-1">
                                <span>{battle.opponent_warrior.name.charAt(0)}</span>
                              </div>
                              <div className="text-sm font-bold">{battle.opponent_warrior.name}</div>
                              <div className="text-xs text-gray-400">{battle.opponent_warrior.token_symbol}</div>
                            </div>
                          </div>

                          <div className="mt-4 text-center text-sm text-gray-400">
                            <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
                            Battle in progress - {battle.turns?.length || 0} turns played
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

