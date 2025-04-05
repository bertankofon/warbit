// Metal API integration

interface CreateTokenParams {
  name: string
  symbol: string
  merchantAddress?: string
  canDistribute?: boolean
  canLP?: boolean
}

export async function createToken(params: CreateTokenParams) {
  try {
    console.log("Creating token with params:", {
      name: params.name,
      symbol: params.symbol,
      merchantAddress: params.merchantAddress || process.env.TOKEN_ADDRESS,
      canDistribute: params.canDistribute,
      canLP: params.canLP,
    })

    const response = await fetch("https://api.metal.build/merchant/create-token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.METAL_API_SECRET_KEY || "",
      },
      body: JSON.stringify({
        name: params.name,
        symbol: params.symbol,
        merchantAddress: params.merchantAddress || process.env.TOKEN_ADDRESS,
        canDistribute: params.canDistribute !== undefined ? params.canDistribute : true,
        canLP: params.canLP !== undefined ? params.canLP : true,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Token creation API error:", data)
      throw new Error(data.message || `Failed to create token: ${response.status}`)
    }

    console.log("Token creation successful:", data)
    return data
  } catch (error) {
    console.error("Error creating token:", error)
    throw error
  }
}

export async function checkTokenStatus(jobId: string) {
  try {
    console.log("Checking token status for jobId:", jobId)

    const response = await fetch(`https://api.metal.build/merchant/create-token/status/${jobId}`, {
      headers: {
        "x-api-key": process.env.METAL_API_SECRET_KEY || "",
      },
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Token status API error:", data)
      throw new Error(data.message || `Failed to check token status: ${response.status}`)
    }

    console.log("Token status response:", data)
    return data
  } catch (error) {
    console.error("Error checking token status:", error)
    throw error
  }
}

