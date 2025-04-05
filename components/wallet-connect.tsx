"use client"

import { useState } from "react"
import { useWeb3 } from "@/lib/web3-context"
import { Button } from "@/components/ui/button"
import { Loader2, Wallet, AlertCircle, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function WalletConnect() {
  const {
    connectWallet,
    disconnectWallet,
    isConnected,
    isConnecting,
    address,
    balance,
    chainId,
    error,
    refreshBalance,
  } = useWeb3()
  const [showDetails, setShowDetails] = useState(false)

  // Add a function to handle balance refresh
  const handleRefreshBalance = async () => {
    if (isConnected) {
      await refreshBalance()
    }
  }

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  const getChainName = (id: number | null) => {
    if (!id) return "Unknown Network"

    switch (id) {
      case 1:
        return "Ethereum Mainnet"
      case 5:
        return "Goerli Testnet"
      case 11155111:
        return "Sepolia Testnet"
      case 137:
        return "Polygon Mainnet"
      case 80001:
        return "Mumbai Testnet"
      case 42161:
        return "Arbitrum One"
      case 421613:
        return "Arbitrum Goerli"
      case 8453:
        return "Base Mainnet"
      case 84531:
        return "Base Goerli"
      default:
        return `Chain ID: ${id}`
    }
  }

  return (
    <div className="flex flex-col space-y-2">
      {!isConnected ? (
        <Button onClick={connectWallet} disabled={isConnecting} className="pixel-button pixel-button-green">
          {isConnecting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              CONNECTING...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              CONNECT WALLET
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Button onClick={() => setShowDetails(!showDetails)} className="pixel-button">
              <Wallet className="mr-2 h-4 w-4" />
              {formatAddress(address || "")}
            </Button>
            <Button onClick={disconnectWallet} className="pixel-button pixel-button-red" size="sm">
              DISCONNECT
            </Button>
          </div>

          {showDetails && (
            <div className="bg-gray-800 p-2 rounded text-xs">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Balance:</span>
                <div className="flex items-center">
                  <span className="text-yellow-400">{Number.parseFloat(balance).toFixed(4)} ETH</span>
                  <button
                    onClick={handleRefreshBalance}
                    className="ml-2 p-1 bg-gray-700 rounded hover:bg-gray-600"
                    title="Refresh Balance"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">Network:</span>
                <span className="text-green-400">{getChainName(chainId)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-400">Address:</span>
                <span className="text-green-400 font-mono">{address}</span>
              </div>
              {address && (
                <div className="mt-2 text-center">
                  <a
                    href={`https://${chainId === 8453 ? "base" : chainId === 84531 ? "goerli.base" : chainId === 1 ? "" : "goerli."}${chainId === 8453 || chainId === 84531 ? "scan.io" : "etherscan.io"}/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center justify-center"
                  >
                    View on {chainId === 8453 || chainId === 84531 ? "Basescan" : "Etherscan"}{" "}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="bg-red-900/30 border-red-500 text-red-400">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

