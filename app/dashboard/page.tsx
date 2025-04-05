"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
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
  const [activeTab, setActiveTab] = useState("arena")

  useEffect(() => {
    const checkUser = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          console.log("No session found, redirecting to login")
          router.push("/login")
          return
        }

        console.log("User session found:", session.user)
        setUser(session.user)

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
            element_type: session.user.user_metadata?.element_type || "fire",
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
              element_type: "water",
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
              element_type: "earth",
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
      } catch (error) {
        console.error("Session check error:", error)
        router.push("/login")
      }
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
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-yellow-500 mx-auto mb-4" />
          <p className="text-yellow-400 pixel-font">LOADING...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-8 border-b-4 border-yellow-500 pb-4">
          <h1 className="text-3xl font-bold text-yellow-400 pixel-font float">WARBIT ARENA</h1>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <span className="text-green-400 pixel-font">{user?.user_metadata?.warrior_name || "WARRIOR"}</span>
            <button
              className="pixel-button pixel-button-green text-sm"
              onClick={() => router.push("/dashboard/token-management")}
            >
              TOKENS
            </button>
            <button className="pixel-button text-sm" onClick={() => router.push("/admin")}>
              ADMIN
            </button>
            <button
              className="pixel-button pixel-button-red text-sm"
              onClick={() => supabase.auth.signOut().then(() => router.push("/"))}
            >
              LOGOUT
            </button>
          </div>
        </header>

        {isPreviewMode && previewMessage && (
          <div className="pixel-border bg-gray-900 mb-6">
            <div className="bg-black p-4 border-2 border-yellow-500">
              <h2 className="text-yellow-400 pixel-font mb-2">PREVIEW MODE</h2>
              <p className="text-gray-400 mb-2 text-sm">{previewMessage}</p>
              <p className="text-gray-400 text-sm">
                In a real deployment, you would need to create the "warriors" table in your Supabase database.
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <div className="grid grid-cols-5 bg-gray-900 border-2 border-gray-700 p-1 w-full max-w-md mx-auto">
            <button
              className={`p-2 text-xs pixel-font ${activeTab === "arena" ? "bg-yellow-500 text-black" : "bg-black text-gray-400"}`}
              onClick={() => setActiveTab("arena")}
            >
              <Sword className="h-4 w-4 mx-auto mb-1" />
              ARENA
            </button>
            <button
              className={`p-2 text-xs pixel-font ${activeTab === "warriors" ? "bg-yellow-500 text-black" : "bg-black text-gray-400"}`}
              onClick={() => setActiveTab("warriors")}
            >
              <Users className="h-4 w-4 mx-auto mb-1" />
              WARRIORS
            </button>
            <button
              className={`p-2 text-xs pixel-font relative ${activeTab === "challenges" ? "bg-yellow-500 text-black" : "bg-black text-gray-400"}`}
              onClick={() => setActiveTab("challenges")}
            >
              <Bell className="h-4 w-4 mx-auto mb-1" />
              CHALLENGES
              {proposalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {proposalCount}
                </span>
              )}
            </button>
            <button
              className={`p-2 text-xs pixel-font ${activeTab === "battles" ? "bg-yellow-500 text-black" : "bg-black text-gray-400"}`}
              onClick={() => setActiveTab("battles")}
            >
              <Sword className="h-4 w-4 mx-auto mb-1" />
              BATTLES
            </button>
            <button
              className={`p-2 text-xs pixel-font ${activeTab === "profile" ? "bg-yellow-500 text-black" : "bg-black text-gray-400"}`}
              onClick={() => setActiveTab("profile")}
            >
              <Trophy className="h-4 w-4 mx-auto mb-1" />
              MY WARRIOR
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {activeTab === "arena" && (
            <div className="pixel-border bg-gray-900">
              <div className="bg-black p-4 border-2 border-gray-800">
                <div className="flex flex-row items-center justify-between mb-4">
                  <div>
                    <h2 className="text-yellow-400 pixel-font">BATTLE ARENA</h2>
                    <p className="text-gray-400 text-sm">Challenge other warriors to battle</p>
                  </div>
                  <button className="pixel-button pixel-button-green text-sm" onClick={refreshWarriors}>
                    <Loader2 className="h-4 w-4 mr-2 inline-block" />
                    REFRESH
                  </button>
                </div>

                {warriors.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 pixel-font">NO WARRIORS AVAILABLE TO BATTLE</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {warriors.map((warrior) => (
                      <WarriorCard key={warrior.id} warrior={warrior} onBattle={() => handleBattleRequest(warrior)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "warriors" && (
            <div className="pixel-border bg-gray-900">
              <div className="bg-black p-4 border-2 border-gray-800">
                <div className="flex flex-row items-center justify-between mb-4">
                  <div>
                    <h2 className="text-green-400 pixel-font">WARRIOR RANKINGS</h2>
                    <p className="text-gray-400 text-sm">See all warriors and their stats</p>
                  </div>
                  <button className="pixel-button pixel-button-green text-sm" onClick={refreshWarriors}>
                    <Loader2 className="h-4 w-4 mr-2 inline-block" />
                    REFRESH
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b-2 border-gray-700">
                        <th className="text-left py-2 px-4 text-xs pixel-font">RANK</th>
                        <th className="text-left py-2 px-4 text-xs pixel-font">WARRIOR</th>
                        <th className="text-left py-2 px-4 text-xs pixel-font">TOKEN</th>
                        <th className="text-right py-2 px-4 text-xs pixel-font">WINS</th>
                        <th className="text-right py-2 px-4 text-xs pixel-font">LOSSES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...warriors, myWarrior]
                        .filter(Boolean)
                        .sort((a, b) => b.wins - a.wins)
                        .map((warrior, index) => (
                          <tr key={warrior.id} className="border-b border-gray-800 hover:bg-gray-900">
                            <td className="py-2 px-4 text-xs">{index + 1}</td>
                            <td className="py-2 px-4 text-xs font-bold">
                              {warrior.name}
                              {warrior.user_id === user?.id && (
                                <span className="ml-2 text-xs text-yellow-400">(YOU)</span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-xs">{warrior.token_symbol}</td>
                            <td className="py-2 px-4 text-right text-xs text-green-400">{warrior.wins || 0}</td>
                            <td className="py-2 px-4 text-right text-xs text-red-400">{warrior.losses || 0}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === "challenges" && (
            <div className="pixel-border bg-gray-900">
              <div className="bg-black p-4 border-2 border-gray-800">
                <div className="mb-4">
                  <h2 className="text-yellow-400 pixel-font">BATTLE CHALLENGES</h2>
                  <p className="text-gray-400 text-sm">Accept or decline battle challenges from other warriors</p>
                </div>

                {!isPreviewMode ? (
                  <BattleProposals userId={user?.id} warriorId={myWarrior?.id} />
                ) : (
                  <div className="text-center py-8 text-gray-400 pixel-font">
                    BATTLE CHALLENGES ARE NOT AVAILABLE IN PREVIEW MODE
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "battles" && (
            <div className="pixel-border bg-gray-900">
              <div className="bg-black p-4 border-2 border-gray-800">
                <div className="mb-4">
                  <h2 className="text-yellow-400 pixel-font">ACTIVE BATTLES</h2>
                  <p className="text-gray-400 text-sm">Continue your ongoing battles</p>
                </div>

                {!isPreviewMode ? (
                  <ActiveBattles userId={user?.id} />
                ) : (
                  <div className="text-center py-8 text-gray-400 pixel-font">
                    ACTIVE BATTLES ARE NOT AVAILABLE IN PREVIEW MODE
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "profile" && myWarrior && (
            <div className="pixel-border bg-gray-900">
              <div className="bg-black p-4 border-2 border-gray-800">
                <div className="mb-4">
                  <h2 className="text-green-400 pixel-font">{myWarrior.name}</h2>
                  <p className="text-gray-400 text-sm">Your warrior profile and stats</p>
                </div>

                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="pixel-border bg-gray-900 flex-1">
                      <div className="bg-black p-4 border-2 border-yellow-500">
                        <h3 className="text-lg font-bold mb-4 text-yellow-400 pixel-font">WARRIOR STATS</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-400 pixel-font">LEVEL:</div>
                          <div className="text-white pixel-font">{myWarrior.level || 1}</div>

                          <div className="text-gray-400 pixel-font">WINS:</div>
                          <div className="text-green-400 pixel-font">{myWarrior.wins || 0}</div>

                          <div className="text-gray-400 pixel-font">LOSSES:</div>
                          <div className="text-red-400 pixel-font">{myWarrior.losses || 0}</div>

                          <div className="text-gray-400 pixel-font">WIN RATE:</div>
                          <div className="text-white pixel-font">
                            {myWarrior.wins + myWarrior.losses > 0
                              ? `${Math.round((myWarrior.wins / (myWarrior.wins + myWarrior.losses)) * 100)}%`
                              : "N/A"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pixel-border bg-gray-900 flex-1">
                      <div className="bg-black p-4 border-2 border-green-500">
                        <h3 className="text-lg font-bold mb-4 text-green-400 pixel-font">TOKEN INFO</h3>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-gray-400 pixel-font">SYMBOL:</div>
                          <div className="text-white pixel-font">{myWarrior.token_symbol}</div>

                          <div className="text-gray-400 pixel-font">TOKEN ADDRESS:</div>
                          <div className="text-white font-mono text-xs truncate">{myWarrior.token_address}</div>

                          <div className="text-gray-400 pixel-font">WALLET ADDRESS:</div>
                          <div className="text-white font-mono text-xs truncate">
                            {user?.user_metadata?.wallet_address || "Not provided"}
                          </div>

                          <div className="text-gray-400 pixel-font">BALANCE:</div>
                          <div className="text-white pixel-font">{myWarrior.token_balance?.toLocaleString() || 0}</div>

                          <div className="text-gray-400 pixel-font">VALUE:</div>
                          <div className="text-white pixel-font">${myWarrior.token_value || "0.00"}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pixel-border bg-gray-900">
                    <div className="bg-black p-4 border-2 border-gray-700">
                      <h3 className="text-lg font-bold mb-4 text-white pixel-font">BATTLE HISTORY</h3>
                      {(myWarrior.battles?.length || 0) > 0 ? (
                        <div className="space-y-2">
                          {myWarrior.battles?.map((battle: any, index: number) => (
                            <div
                              key={index}
                              className="flex justify-between items-center border-b border-gray-700 pb-2"
                            >
                              <div>
                                <span className="font-bold pixel-font text-xs">{battle.opponent}</span>
                                <span className="text-xs text-gray-400 ml-2 pixel-font">
                                  {new Date(battle.date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className={battle.result === "win" ? "text-green-400" : "text-red-400"}>
                                <span className="pixel-font text-xs">
                                  {battle.result === "win" ? "VICTORY" : "DEFEAT"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-400 pixel-font">NO BATTLES YET</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "profile" && !myWarrior && (
            <div className="pixel-border bg-gray-900">
              <div className="bg-black p-4 border-2 border-yellow-500">
                <div className="mb-4">
                  <h2 className="text-yellow-400 pixel-font">CREATE YOUR WARRIOR</h2>
                  <p className="text-gray-400 text-sm">You don't have a warrior yet</p>
                </div>

                <div className="text-center py-8">
                  <button className="pixel-button" onClick={() => router.push("/signup")}>
                    CREATE WARRIOR
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showBattleModal && selectedOpponent && (
        <BattleModal opponent={selectedOpponent} onClose={() => setShowBattleModal(false)} myWarrior={myWarrior} />
      )}
    </div>
  )
}

