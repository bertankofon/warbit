"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createUserToken } from "@/lib/metal-utils"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

import ElementalWarriorSelector, { type ElementType } from "@/components/elemental-warrior-selector"

export default function SignUp() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [warriorName, setWarriorName] = useState("")
  const [tokenSymbol, setTokenSymbol] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const [elementType, setElementType] = useState<ElementType>("fire")

  // Validate Ethereum wallet address
  const validateWalletAddress = (address: string): boolean => {
    // Check if it's a valid Ethereum address format (0x followed by 40 hex characters)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/
    return ethAddressRegex.test(address)
  }

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value
    setWalletAddress(address)

    if (address && !validateWalletAddress(address)) {
      setWalletError("Please enter a valid Ethereum wallet address (0x followed by 40 hex characters)")
    } else {
      setWalletError(null)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    // If already loading, don't allow another attempt
    if (loading) return

    setLoading(true)
    setError(null)

    // Validate wallet address before proceeding
    if (!validateWalletAddress(walletAddress)) {
      setError("Please enter a valid wallet address")
      setLoading(false)
      return
    }

    try {
      // Add a small delay to prevent rapid successive requests
      await new Promise((resolve) => setTimeout(resolve, 500))

      console.log("Creating token for warrior:", warriorName, "with symbol:", tokenSymbol)
      console.log("Using merchant wallet address:", walletAddress)

      // Create token using our utility function
      const jobId = await createUserToken(`${warriorName} Token`, tokenSymbol.toUpperCase(), walletAddress)

      // Sign up user with wallet address and element type in metadata
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            warrior_name: warriorName,
            token_job_id: jobId,
            token_symbol: tokenSymbol.toUpperCase(),
            wallet_address: walletAddress, // Store wallet address in user metadata
            element_type: elementType, // Store the selected element type
          },
        },
      })

      if (signUpError) {
        if (signUpError.message.includes("rate limit")) {
          throw new Error("Too many signup attempts. Please wait a moment before trying again.")
        }
        throw signUpError
      }

      console.log("User signed up successfully:", data)

      // Redirect to token status page
      router.push(`/token-status?jobId=${jobId}`)
    } catch (error) {
      console.error("Error during signup:", error)
      setError(error instanceof Error ? error.message : "An error occurred during signup")

      // Add a longer delay after an error to prevent rapid retries
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <div className="w-full max-w-md pixel-border bg-gray-900">
        <div className="bg-black p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl text-yellow-400 pixel-font">CREATE YOUR WARRIOR</h1>
            <div className="h-1 w-32 mx-auto bg-yellow-500 my-4"></div>
            <p className="text-green-400 text-sm pixel-font">SIGN UP AND MINT YOUR WARRIOR TOKEN</p>
          </div>

          <Tabs defaultValue="step1" value={`step${step}`}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger
                value="step1"
                disabled={step !== 1}
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black pixel-font"
              >
                WARRIOR INFO
              </TabsTrigger>
              <TabsTrigger
                value="step2"
                disabled={step !== 2}
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black pixel-font"
              >
                ACCOUNT SETUP
              </TabsTrigger>
            </TabsList>
            <TabsContent value="step1" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="warriorName" className="text-white pixel-font text-xs">
                  WARRIOR NAME
                </Label>
                <Input
                  id="warriorName"
                  placeholder="BATTLEMASTER"
                  value={warriorName}
                  onChange={(e) => setWarriorName(e.target.value)}
                  className="bg-black border-2 border-gray-700 text-yellow-400 p-3 text-sm pixel-font"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol" className="text-white pixel-font text-xs">
                  TOKEN SYMBOL (2-5 CHARACTERS)
                </Label>
                <Input
                  id="tokenSymbol"
                  placeholder="WAR"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.slice(0, 5))}
                  className="bg-black border-2 border-gray-700 text-yellow-400 p-3 text-sm pixel-font uppercase"
                  required
                  maxLength={5}
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletAddress" className="text-white pixel-font text-xs">
                  WALLET ADDRESS (FOR TOKEN ALLOCATION)
                </Label>
                <Input
                  id="walletAddress"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={handleWalletAddressChange}
                  className="bg-black border-2 border-gray-700 text-yellow-400 p-3 text-sm font-mono"
                  required
                />
                {walletError && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="pixel-font text-xs">{walletError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <ElementalWarriorSelector selectedElement={elementType} onSelect={setElementType} />
              <button
                onClick={() => setStep(2)}
                className="w-full pixel-button"
                disabled={!warriorName || tokenSymbol.length < 2 || !validateWalletAddress(walletAddress)}
              >
                NEXT
              </button>
            </TabsContent>
            <TabsContent value="step2" className="space-y-4 pt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white pixel-font text-xs">
                    EMAIL
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="warrior@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black border-2 border-gray-700 text-yellow-400 p-3 text-sm pixel-font"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white pixel-font text-xs">
                    PASSWORD
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-black border-2 border-gray-700 text-yellow-400 p-3 text-sm pixel-font"
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="pixel-font text-xs">
                      {error.includes("Too many") ? <span className="font-medium">{error}</span> : error}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 border-2 border-gray-700 text-white hover:bg-gray-800 p-3 pixel-font"
                    onClick={() => setStep(1)}
                  >
                    BACK
                  </button>
                  <button type="submit" className="flex-1 pixel-button pixel-button-green" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        CREATING...
                      </>
                    ) : (
                      "CREATE WARRIOR"
                    )}
                  </button>
                </div>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-8 pt-4 border-t-2 border-gray-800 text-center">
            <p className="text-xs text-gray-400 pixel-font">
              ALREADY HAVE A WARRIOR?{" "}
              <Link href="/login" className="text-yellow-400 hover:underline">
                LOG IN TO BATTLE
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

