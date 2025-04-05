"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { checkTokenStatus } from "@/lib/metal-api"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { checkDatabaseSetup } from "@/lib/database-setup"

export default function TokenStatus() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get("jobId")
  const supabase = createClientComponentClient()

  const [status, setStatus] = useState<"pending" | "success" | "error">("pending")
  const [tokenData, setTokenData] = useState<any>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [previewMessage, setPreviewMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!jobId) {
      setError("No job ID provided")
      return
    }

    const checkStatus = async () => {
      try {
        console.log("Checking token status for jobId:", jobId)
        const response = await checkTokenStatus(jobId)
        console.log("Token status response:", response)

        if (response.status === "success") {
          setStatus("success")
          setTokenData(response.data)
          setProgress(100)

          // Update user metadata with token address
          const {
            data: { session },
          } = await supabase.auth.getSession()
          if (session) {
            await supabase.auth.updateUser({
              data: {
                token_address: response.data.address,
              },
            })

            // Check if we can access the warriors table
            const dbStatus = await checkDatabaseSetup()

            if (!dbStatus.success) {
              setIsPreviewMode(dbStatus.isPreviewMode)
              setPreviewMessage(dbStatus.error)
              console.log("Database status:", dbStatus)
              return
            }

            // Only try to create warrior record if we're not in preview mode
            if (!dbStatus.isPreviewMode) {
              try {
                const { error: warriorError } = await supabase.from("warriors").insert({
                  user_id: session.user.id,
                  name: session.user.user_metadata.warrior_name,
                  token_symbol: session.user.user_metadata.token_symbol,
                  token_address: response.data.address,
                  level: 1,
                  wins: 0,
                  losses: 0,
                  token_balance: response.data.startingAppSupply,
                  token_value: "0.00",
                })

                if (warriorError) {
                  console.error("Error creating warrior record:", warriorError)
                }
              } catch (error) {
                console.error("Error creating warrior record:", error)
              }
            }
          }
        } else if (response.status === "error") {
          setStatus("error")
          setError(response.message || "An error occurred while creating your token")
          setProgress(100)
        } else {
          // Still pending
          setProgress((prev) => Math.min(prev + 5, 95)) // Increment progress but cap at 95% until complete
          setTimeout(checkStatus, 3000) // Check again in 3 seconds
        }
      } catch (err) {
        console.error("Error checking token status:", err)
        setError("Failed to check token status")
        setStatus("error")
      }
    }

    checkStatus()

    // Start with some progress to show activity
    setProgress(10)
  }, [jobId, supabase])

  const handleContinue = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-yellow-500 bg-gray-900 text-white">
        <CardHeader className="space-y-1 border-b border-yellow-500 pb-4">
          <CardTitle className="text-2xl text-center text-yellow-400 pixel-font">FORGING YOUR TOKEN</CardTitle>
          <CardDescription className="text-center text-green-400">
            {status === "pending" && "Your warrior token is being created..."}
            {status === "success" && "Your warrior token has been created!"}
            {status === "error" && "There was an issue creating your token"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-2">
            <Progress value={progress} className="h-2 bg-gray-800" />
            <p className="text-center text-sm text-gray-400">
              {status === "pending" && "This may take a few minutes..."}
              {status === "success" && "100% Complete"}
              {status === "error" && "Process Failed"}
            </p>
          </div>

          {status === "pending" && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-16 w-16 animate-spin text-yellow-500" />
            </div>
          )}

          {status === "success" && tokenData && (
            <div className="space-y-4 bg-gray-800 p-4 rounded-md border border-yellow-500">
              <h3 className="text-lg font-bold text-center text-yellow-400">Token Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Name:</div>
                <div className="text-white font-mono">{tokenData.name}</div>

                <div className="text-gray-400">Symbol:</div>
                <div className="text-white font-mono">{tokenData.symbol}</div>

                <div className="text-gray-400">Address:</div>
                <div className="text-white font-mono truncate">{tokenData.address}</div>

                <div className="text-gray-400">Total Supply:</div>
                <div className="text-white font-mono">{tokenData.totalSupply?.toLocaleString()}</div>
              </div>
            </div>
          )}

          {isPreviewMode && previewMessage && (
            <div className="bg-yellow-900/30 border border-yellow-500 p-4 rounded-md text-center">
              <p className="text-yellow-400 mb-2">Preview Mode</p>
              <p className="text-gray-300 text-sm">{previewMessage}</p>
              <p className="text-gray-300 text-sm mt-2">
                In a real deployment, you'll need to create the warriors table in your Supabase database.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="bg-red-900/30 border border-red-500 p-4 rounded-md text-center">
              <p className="text-red-400">{error || "An unknown error occurred"}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center pt-4">
          {status === "success" && (
            <Button onClick={handleContinue} className="bg-green-500 hover:bg-green-600 text-black font-bold">
              Enter Battle Arena
            </Button>
          )}

          {status === "error" && (
            <Button
              onClick={() => router.push("/signup")}
              variant="outline"
              className="border-red-500 text-red-400 hover:bg-red-900/30"
            >
              Try Again
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

