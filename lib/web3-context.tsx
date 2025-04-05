"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Chain configuration
const SUPPORTED_CHAIN_ID = 8453 // Base Mainnet
const SUPPORTED_CHAIN_NAME = "Base Mainnet"
const CHAIN_RPC_URL = "https://developer-access-mainnet.base.org"
const CHAIN_BLOCK_EXPLORER_URL = "https://basescan.org"
const CHAIN_CURRENCY_NAME = "ETH"
const CHAIN_CURRENCY_SYMBOL = "ETH"
const CHAIN_CURRENCY_DECIMALS = 18

// Uniswap V3 constants
const DEFAULT_TICK_LOWER = -887272 // Default tick range for Uniswap V3
const DEFAULT_TICK_UPPER = 887272 // Default tick range for Uniswap V3

interface Web3ContextType {
  provider: ethers.providers.Web3Provider | null
  signer: ethers.Signer | null
  address: string | null
  chainId: number | null
  balance: string
  isConnected: boolean
  isConnecting: boolean
  error: string | null
  battleContract: ethers.Contract | null
  connectWallet: () => Promise<void>
  disconnectWallet: () => void
  refreshBalance: () => Promise<void>
  stakeBattle: (
    battleId: string,
    amount: string,
    opponentAddress: string,
    tokenA: string,
    tokenB: string,
  ) => Promise<boolean>
  acceptBattle: (battleId: string, amount: string) => Promise<boolean>
  finalizeBattle: (
    battleId: string,
    winnerAddress: string,
    tokenAddress: string,
    tokenAmount: string,
  ) => Promise<boolean>
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined)

export function Web3Provider({ children, contractAddress }: { children: ReactNode; contractAddress?: string }) {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider | null>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [balance, setBalance] = useState<string>("0")
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isConnecting, setIsConnecting] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [battleContract, setBattleContract] = useState<ethers.Contract | null>(null)

  // Initialize provider from window.ethereum if available
  useEffect(() => {
    const initProvider = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          // Check if already connected
          const ethProvider = new ethers.providers.Web3Provider(window.ethereum)
          const accounts = await ethProvider.listAccounts()

          if (accounts.length > 0) {
            await connectWallet()
          }
        } catch (err) {
          console.error("Failed to initialize provider:", err)
        }
      }
    }

    initProvider()
  }, [])

  // Set up event listeners for wallet changes
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnectWallet()
        } else if (accounts[0] !== address) {
          // Account changed, update state
          setAddress(accounts[0])
          updateBalance(accounts[0])
        }
      }

      const handleChainChanged = (chainIdHex: string) => {
        const newChainId = Number.parseInt(chainIdHex, 16)
        setChainId(newChainId)
        // Reload the page as recommended by MetaMask
        window.location.reload()
      }

      const handleDisconnect = () => {
        disconnectWallet()
      }

      window.ethereum.on("accountsChanged", handleAccountsChanged)
      window.ethereum.on("chainChanged", handleChainChanged)
      window.ethereum.on("disconnect", handleDisconnect)

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
        window.ethereum.removeListener("disconnect", handleDisconnect)
      }
    }
  }, [address])

  // Update user's ETH balance
  const updateBalance = async (userAddress: string) => {
    if (!userAddress) return

    try {
      // Create a fresh provider instance to ensure we're getting the latest data
      if (typeof window !== "undefined" && window.ethereum) {
        const tempProvider = new ethers.providers.Web3Provider(window.ethereum)
        const balanceWei = await tempProvider.getBalance(userAddress)
        const balanceEth = ethers.utils.formatEther(balanceWei)
        console.log(`Updated balance for ${userAddress}: ${balanceEth} ETH`)
        setBalance(balanceEth)
      }
    } catch (err) {
      console.error("Failed to get balance:", err)
    }
  }

  // Check if user is on the correct chain and switch if needed
  const checkAndSwitchChain = async () => {
    if (!window.ethereum) return false

    try {
      // Get current chain ID
      const currentChainIdHex = await window.ethereum.request({ method: "eth_chainId" })
      const currentChainId = Number.parseInt(currentChainIdHex, 16)

      console.log("Current chain ID:", currentChainId)
      console.log("Supported chain ID:", SUPPORTED_CHAIN_ID)

      // If already on the correct chain, return true
      if (currentChainId === SUPPORTED_CHAIN_ID) {
        return true
      }

      // Try to switch to the supported chain
      try {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${SUPPORTED_CHAIN_ID.toString(16)}` }],
        })
        console.log("Successfully switched chain")
        return true
      } catch (switchError: any) {
        console.error("Error switching chain:", switchError)

        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          try {
            console.log("Adding chain to wallet...")
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: `0x${SUPPORTED_CHAIN_ID.toString(16)}`,
                  chainName: SUPPORTED_CHAIN_NAME,
                  nativeCurrency: {
                    name: CHAIN_CURRENCY_NAME,
                    symbol: CHAIN_CURRENCY_SYMBOL,
                    decimals: CHAIN_CURRENCY_DECIMALS,
                  },
                  rpcUrls: [CHAIN_RPC_URL],
                  blockExplorerUrls: [CHAIN_BLOCK_EXPLORER_URL],
                },
              ],
            })
            console.log("Chain added successfully")
            return true
          } catch (addError: any) {
            console.error("Error adding chain:", addError)
            setError(`Failed to add ${SUPPORTED_CHAIN_NAME} to your wallet: ${addError.message}`)
            return false
          }
        }

        // User rejected the request
        if (switchError.code === 4001) {
          setError("Please switch to Base Mainnet to use this app. Operation canceled by user.")
        } else {
          setError(`Failed to switch to ${SUPPORTED_CHAIN_NAME}: ${switchError.message}`)
        }
        return false
      }
    } catch (error: any) {
      console.error("Error in checkAndSwitchChain:", error)
      setError(`Chain switching error: ${error.message}`)
      return false
    }
  }

  // Refresh balance when chainId changes
  useEffect(() => {
    if (chainId === SUPPORTED_CHAIN_ID && address) {
      console.log("Chain ID changed to supported chain, refreshing balance")
      updateBalance(address)
    }
  }, [chainId, address])

  // Initialize contract instance
  useEffect(() => {
    if (signer && contractAddress) {
      try {
        const contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer)
        setBattleContract(contract)
        console.log("Battle contract initialized at address:", contractAddress)
      } catch (err) {
        console.error("Failed to initialize contract:", err)
        setError("Failed to initialize battle contract")
      }
    }
  }, [signer, contractAddress])

  // Connect wallet function
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      setError("No Ethereum wallet found. Please install MetaMask.")
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      // Request account access first
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })
      console.log("Connected accounts:", accounts)

      if (accounts.length === 0) {
        throw new Error("No accounts found. Please unlock your wallet.")
      }

      // Check if on correct chain and switch if needed
      const isCorrectChain = await checkAndSwitchChain()
      if (!isCorrectChain) {
        setIsConnecting(false)
        return // Error is already set in checkAndSwitchChain
      }

      // Now that we have the correct chain, initialize the provider
      const ethProvider = new ethers.providers.Web3Provider(window.ethereum)
      const network = await ethProvider.getNetwork()
      console.log("Connected to network:", network)

      // Get signer
      const ethSigner = ethProvider.getSigner()
      const connectedAddress = await ethSigner.getAddress()
      console.log("Connected with address:", connectedAddress)

      setProvider(ethProvider)
      setSigner(ethSigner)
      setAddress(connectedAddress)
      setChainId(network.chainId)
      setIsConnected(true)

      // Update balance - do this after everything else is set up
      // Add a small delay to ensure the chain switch has fully completed
      setTimeout(() => {
        updateBalance(connectedAddress)
      }, 500)
    } catch (err: any) {
      console.error("Failed to connect wallet:", err)
      setError(err.message || "Failed to connect wallet")
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }

  // Disconnect wallet function
  const disconnectWallet = () => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setChainId(null)
    setBalance("0")
    setIsConnected(false)
    setBattleContract(null)
  }

  // Check if on correct chain before contract interactions
  const ensureCorrectChain = async (): Promise<boolean> => {
    if (!provider) return false

    const network = await provider.getNetwork()
    if (network.chainId !== SUPPORTED_CHAIN_ID) {
      setError(`Please switch to ${SUPPORTED_CHAIN_NAME} to perform this action`)
      return false
    }
    return true
  }

  // Stake ETH for a battle (createBattle function in the contract)
  const stakeBattle = async (
    battleId: string,
    amount: string,
    opponentAddress: string,
    tokenA: string,
    tokenB: string,
  ): Promise<boolean> => {
    if (!battleContract || !signer) {
      setError("Wallet not connected or contract not initialized")
      return false
    }

    try {
      // Ensure on correct chain
      const isCorrectChain = await ensureCorrectChain()
      if (!isCorrectChain) return false

      // Convert the amount to Wei
      const amountWei = ethers.utils.parseEther(amount)

      console.log(`Creating battle with stake: ${amount} ETH (${amountWei.toString()} wei)`)
      console.log(`Opponent: ${opponentAddress}`)
      console.log(`Token A: ${tokenA}`)
      console.log(`Token B: ${tokenB}`)

      // Call the contract's createBattle function
      const tx = await battleContract.createBattle(opponentAddress, tokenA, tokenB, { value: amountWei })

      console.log("Transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // Get the battleId from the event
      const battleCreatedEvent = receipt.events?.find((event: any) => event.event === "BattleCreated")

      if (battleCreatedEvent) {
        const contractBattleId = battleCreatedEvent.args.battleId.toString()
        console.log("Battle created with ID:", contractBattleId)

        // Store the mapping between our database battleId and contract battleId
        const supabase = createClientComponentClient()
        await supabase.from("battle_proposals").update({ contract_battle_id: contractBattleId }).eq("id", battleId)

        console.log("Updated battle proposal with contract battle ID")
      }

      // Update balance after staking
      if (address) {
        await updateBalance(address)
      }

      return true
    } catch (err: any) {
      console.error("Failed to stake for battle:", err)
      setError(err.message || "Failed to stake for battle")
      return false
    }
  }

  // Accept a battle (joinBattle function in the contract)
  const acceptBattle = async (battleId: string, amount: string): Promise<boolean> => {
    if (!battleContract || !signer) {
      setError("Wallet not connected or contract not initialized")
      return false
    }

    try {
      // Ensure on correct chain
      const isCorrectChain = await ensureCorrectChain()
      if (!isCorrectChain) return false

      // Get the contract battle ID from our database
      const supabase = createClientComponentClient()
      const { data: battleProposal } = await supabase
        .from("battle_proposals")
        .select("contract_battle_id")
        .eq("id", battleId)
        .single()

      if (!battleProposal || !battleProposal.contract_battle_id) {
        throw new Error("Contract battle ID not found")
      }

      const contractBattleId = battleProposal.contract_battle_id

      // Convert the amount to Wei
      const amountWei = ethers.utils.parseEther(amount)

      console.log(`Joining battle ${contractBattleId} with stake ${amount} ETH (${amountWei.toString()} wei)`)

      // Call the contract's joinBattle function
      const tx = await battleContract.joinBattle(contractBattleId, { value: amountWei })
      console.log("Transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // Update balance after accepting
      if (address) {
        await updateBalance(address)
      }

      return true
    } catch (err: any) {
      console.error("Failed to accept battle:", err)
      setError(err.message || "Failed to accept battle")
      return false
    }
  }

  // Finalize a battle (finalizeBattle function in the contract)
  const finalizeBattle = async (
    battleId: string,
    winnerAddress: string,
    tokenAddress: string,
    tokenAmount: string,
  ): Promise<boolean> => {
    if (!battleContract || !signer) {
      setError("Wallet not connected or contract not initialized")
      return false
    }

    try {
      // Ensure on correct chain
      const isCorrectChain = await ensureCorrectChain()
      if (!isCorrectChain) return false

      // Get the contract battle ID from our database
      const supabase = createClientComponentClient()
      const { data: battle } = await supabase.from("battles").select("proposal_id").eq("id", battleId).single()

      if (!battle) {
        throw new Error("Battle not found")
      }

      const { data: battleProposal } = await supabase
        .from("battle_proposals")
        .select("contract_battle_id")
        .eq("id", battle.proposal_id)
        .single()

      if (!battleProposal || !battleProposal.contract_battle_id) {
        throw new Error("Contract battle ID not found")
      }

      const contractBattleId = battleProposal.contract_battle_id

      // Convert token amount to Wei
      const tokenAmountWei = ethers.utils.parseEther(tokenAmount)

      console.log(`Finalizing battle ${contractBattleId}`)
      console.log(`Winner: ${winnerAddress}`)
      console.log(`Token: ${tokenAddress}`)
      console.log(`Token amount: ${tokenAmount} (${tokenAmountWei.toString()} wei)`)

      // Call the contract's finalizeBattle function
      const tx = await battleContract.finalizeBattle(
        contractBattleId,
        winnerAddress,
        tokenAmountWei,
        DEFAULT_TICK_LOWER,
        DEFAULT_TICK_UPPER,
      )

      console.log("Transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // Get the LP token ID from the event
      const battleFinalizedEvent = receipt.events?.find((event: any) => event.event === "BattleFinalized")

      if (battleFinalizedEvent) {
        const lpTokenId = battleFinalizedEvent.args.lpTokenId.toString()
        console.log("Battle finalized with LP token ID:", lpTokenId)

        // Store the LP token ID in our database
        await supabase.from("battles").update({ lp_token_id: lpTokenId }).eq("id", battleId)

        console.log("Updated battle with LP token ID")
      }

      return true
    } catch (err: any) {
      console.error("Failed to finalize battle:", err)
      setError(err.message || "Failed to finalize battle")
      return false
    }
  }

  // Function to manually refresh balance
  const refreshBalance = async () => {
    if (address) {
      await updateBalance(address)
    }
  }

  const value = {
    provider,
    signer,
    address,
    chainId,
    balance,
    isConnected,
    isConnecting,
    error,
    battleContract,
    connectWallet,
    disconnectWallet,
    refreshBalance,
    stakeBattle,
    acceptBattle,
    finalizeBattle,
  }

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>
}

export function useWeb3() {
  const context = useContext(Web3Context)
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider")
  }
  return context
}

// Full ABI for the TokenBattleArenaV3 contract
const CONTRACT_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_positionManager",
        type: "address",
      },
      {
        internalType: "address",
        name: "_weth",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "battleId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "playerA",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "playerB",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "stakeAmount",
        type: "uint256",
      },
    ],
    name: "BattleCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "battleId",
        type: "uint256",
      },
      {
        indexed: true,
        internalType: "address",
        name: "winner",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "lpTokenId",
        type: "uint256",
      },
    ],
    name: "BattleFinalized",
    type: "event",
  },
  {
    inputs: [],
    name: "WETH",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "battleCount",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    name: "battles",
    outputs: [
      {
        internalType: "address",
        name: "playerA",
        type: "address",
      },
      {
        internalType: "address",
        name: "playerB",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "stakeAmount",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "winner",
        type: "address",
      },
      {
        internalType: "address",
        name: "tokenA",
        type: "address",
      },
      {
        internalType: "address",
        name: "tokenB",
        type: "address",
      },
      {
        internalType: "bool",
        name: "finalized",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "lpTokenId",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "_opponent",
        type: "address",
      },
      {
        internalType: "address",
        name: "_tokenA",
        type: "address",
      },
      {
        internalType: "address",
        name: "_tokenB",
        type: "address",
      },
    ],
    name: "createBattle",
    outputs: [
      {
        internalType: "uint256",
        name: "battleId",
        type: "uint256",
      },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_battleId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "_winner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
      {
        internalType: "int24",
        name: "tickLower",
        type: "int24",
      },
      {
        internalType: "int24",
        name: "tickUpper",
        type: "int24",
      },
    ],
    name: "finalizeBattle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_battleId",
        type: "uint256",
      },
    ],
    name: "joinBattle",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeePercent",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "poolFee",
    outputs: [
      {
        internalType: "uint24",
        name: "",
        type: "uint24",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "positionManager",
    outputs: [
      {
        internalType: "contract INonfungiblePositionManager",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "_percent",
        type: "uint256",
      },
    ],
    name: "setFeePercent",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "withdrawERC20",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawETH",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "withdrawLPNFT",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
]

