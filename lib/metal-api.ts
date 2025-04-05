// Metal API Client

// Base URL for all API requests
const METAL_API_BASE_URL = "https://api.metal.build"

// Common interfaces
export interface TokenData {
  id: string
  address: string
  name: string
  symbol: string
  totalSupply: number
  startingAppSupply: number
  remainingAppSupply: number
  merchantSupply: number
  merchantAddress: string
  price: number | null
}

export interface HolderData {
  id: string
  address: string
  balance: number
  value: number
}

export interface TokenWithHolders extends TokenData {
  holders: HolderData[]
}

export interface HolderTokenData {
  id: string
  address: string
  name: string
  symbol: string
  balance: number
  value: number
}

export interface HolderInfo {
  id: string
  address: string
  totalValue: number
  tokens: HolderTokenData[]
}

// API request interfaces
export interface CreateTokenParams {
  name: string
  symbol: string
  merchantAddress?: string
  canDistribute?: boolean
  canLP?: boolean
}

export interface DistributeTokenParams {
  sendTo: string
  amount: number
}

export interface WithdrawTokenParams {
  tokenAddress: string
  amount: number
  toAddress: string
}

export interface SpendTokenParams {
  tokenAddress: string
  amount: number
}

// API response interfaces
export interface CreateTokenResponse {
  jobId: string
}

export interface TokenStatusResponse {
  jobId: string
  status: "pending" | "success" | "error"
  data: TokenData
  message?: string
}

export interface SuccessResponse {
  success: boolean
}

export interface GetOrCreateHolderResponse {
  success: boolean
  id: string
  address: string
  totalValue: number
  tokens: HolderTokenData[]
}

// Helper function for API requests
async function makeRequest<T>(endpoint: string, method: "GET" | "POST" | "PUT" = "GET", body?: any): Promise<T> {
  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add API key if available
    if (process.env.METAL_API_SECRET_KEY) {
      headers["x-api-key"] = process.env.METAL_API_SECRET_KEY
    } else {
      console.warn("METAL_API_SECRET_KEY is not set")
    }

    const options: RequestInit = {
      method,
      headers,
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    console.log(`Making ${method} request to ${endpoint}`)
    const response = await fetch(`${METAL_API_BASE_URL}${endpoint}`, options)
    const data = await response.json()

    if (!response.ok) {
      console.error(`API error (${response.status}):`, data)
      throw new Error(data.message || `API request failed with status ${response.status}`)
    }

    return data as T
  } catch (error) {
    console.error(`Error in API request to ${endpoint}:`, error)
    throw error
  }
}

// Token Management APIs
export async function createToken(params: CreateTokenParams): Promise<CreateTokenResponse> {
  return makeRequest<CreateTokenResponse>("/merchant/create-token", "POST", {
    name: params.name,
    symbol: params.symbol,
    merchantAddress: params.merchantAddress,
    canDistribute: params.canDistribute !== undefined ? params.canDistribute : true,
    canLP: params.canLP !== undefined ? params.canLP : true,
  })
}

export async function checkTokenStatus(jobId: string): Promise<TokenStatusResponse> {
  return makeRequest<TokenStatusResponse>(`/merchant/create-token/status/${jobId}`)
}

export async function getAllTokens(): Promise<TokenData[]> {
  return makeRequest<TokenData[]>("/merchant/all-tokens")
}

export async function getToken(address: string): Promise<TokenWithHolders> {
  return makeRequest<TokenWithHolders>(`/token/${address}`)
}

export async function distributeTokens(tokenAddress: string, params: DistributeTokenParams): Promise<SuccessResponse> {
  return makeRequest<SuccessResponse>(`/token/${tokenAddress}/distribute`, "POST", params)
}

export async function createLiquidity(tokenAddress: string): Promise<SuccessResponse> {
  return makeRequest<SuccessResponse>(`/token/${tokenAddress}/liquidity`, "POST")
}

// Holder Management APIs
export async function getHolder(userId: string, publicKey?: string): Promise<HolderInfo> {
  const endpoint = publicKey ? `/holder/${userId}?publicKey=${publicKey}` : `/holder/${userId}`
  return makeRequest<HolderInfo>(endpoint)
}

export async function getOrCreateHolder(userId: string): Promise<GetOrCreateHolderResponse> {
  return makeRequest<GetOrCreateHolderResponse>(`/holder/${userId}`, "PUT")
}

export async function getHolderTokenBalance(holderAddress: string, tokenAddress: string): Promise<HolderTokenData> {
  return makeRequest<HolderTokenData>(`/holder/${holderAddress}/token/${tokenAddress}`)
}

export async function withdrawTokens(userId: string, params: WithdrawTokenParams): Promise<SuccessResponse> {
  return makeRequest<SuccessResponse>(`/holder/${userId}/withdraw`, "POST", params)
}

export async function spendTokens(userId: string, params: SpendTokenParams): Promise<SuccessResponse> {
  return makeRequest<SuccessResponse>(`/holder/${userId}/spend`, "POST", params)
}

