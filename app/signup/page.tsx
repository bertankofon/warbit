"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createUserToken } from "@/lib/metal-utils"
import { Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from "@/components/ui/alert"

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

  // Validate Ethereum wallet address
  const validateWalletAddress = (address: string): boolean => {
    // Check if it's a valid Ethereum address format (0x followed by 40 hex characters)
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethAddressRegex.test(address);
  };

  const handleWalletAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);
    
    if (address && !validateWalletAddress(address)) {
      setWalletError("Please enter a valid Ethereum wallet address (0x followed by 40 hex characters)");
    } else {
      setWalletError(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate wallet address before proceeding
    if (!validateWalletAddress(walletAddress)) {
      setError("Please enter a valid wallet address");
      setLoading(false);
      return;
    }

    try {
      console.log('Creating token for warrior:', warriorName, 'with symbol:', tokenSymbol);
      console.log('Using merchant wallet address:', walletAddress);
      
      // Create token using our utility function
      const jobId = await createUserToken(
        `${warriorName} Token`,
        tokenSymbol.toUpperCase(),
        walletAddress
      );

      // Sign up user with wallet address in metadata
      const { error: signUpError, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            warrior_name: warriorName,
            token_job_id: jobId,
            token_symbol: tokenSymbol.toUpperCase(),
            wallet_address: walletAddress, // Store wallet address in user metadata
          },
        }
      });

      if (signUpError) throw signUpError;

      console.log('User signed up successfully:', data);

      // Redirect to token status page
      router.push(`/token-status?jobId=${jobId}`);
    } catch (error) {
      console.error("Error during signup:", error);
      setError(error instanceof Error ? error.message : "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md border-yellow-500 bg-gray-900 text-white">
        <CardHeader className="space-y-1 border-b border-yellow-500 pb-4">
          <CardTitle className="text-2xl text-center text-yellow-400 pixel-font">CREATE YOUR WARRIOR</CardTitle>
          <CardDescription className="text-center text-green-400">Sign up and mint your warrior token</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="step1" value={`step${step}`}>
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              <TabsTrigger
                value="step1"
                disabled={step !== 1}
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
              >
                Warrior Info
              </TabsTrigger>
              <TabsTrigger
                value="step2"
                disabled={step !== 2}
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black"
              >
                Account Setup
              </TabsTrigger>
            </TabsList>
            <TabsContent value="step1" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="warriorName" className="text-white">
                  Warrior Name
                </Label>
                <Input
                  id="warriorName"
                  placeholder="BattleMaster"
                  value={warriorName}
                  onChange={(e) => setWarriorName(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tokenSymbol" className="text-white">
                  Token Symbol (2-5 characters)
                </Label>
                <Input
                  id="tokenSymbol"
                  placeholder="WAR"
                  value={tokenSymbol}
                  onChange={(e) => setTokenSymbol(e.target.value.slice(0, 5))}
                  className="bg-gray-800 border-gray-700 text-white uppercase"
                  required
                  maxLength={5}
                  minLength={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="walletAddress" className="text-white">
                  Wallet Address (for token allocation)
                </Label>
                <Input
                  id="walletAddress"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={handleWalletAddressChange}
                  className="bg-gray-800 border-gray-700 text-white font-mono text-sm"
                  required
                />
                {walletError && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{walletError}</AlertDescription>
                  </Alert>
                )}
              </div>
              <Button
                onClick={() => setStep(2)}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
                disabled={!warriorName || tokenSymbol.length < 2 || !validateWalletAddress(walletAddress)}
              >
                Next
              </Button>
            </TabsContent>
            <TabsContent value="step2" className="space-y-4 pt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="warrior@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white"
                    required
                  />
                </div>
                {error && (
                  <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1 border-gray-700 text-white hover:bg-gray-800"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-500 hover:bg-green-600 text-black font-bold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Warrior"
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 border-t border-yellow-500 pt-4">
          <div className="text-sm text-center text-gray-400">
            Already have a warrior?{" "}
            <Link href="/login" className="text-yellow-400 hover:underline">
              Log in to battle
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

