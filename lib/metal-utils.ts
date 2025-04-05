import { createToken, checkTokenStatus } from "@/lib/metal-api"

export const createUserToken = async (name: string, symbol: string, walletAddress: string) => {
  try {
    const response = await createToken({
      name: name,
      symbol: symbol,
      merchantAddress: walletAddress,
    })
    return response.jobId
  } catch (error: any) {
    console.error("Error creating token:", error)
    throw new Error(error.message || "Failed to create token")
  }
}

export const checkUserTokenStatus = async (jobId: string) => {
  try {
    const response = await checkTokenStatus(jobId)

    if (response.status === "success") {
      return {
        isComplete: true,
        isSuccess: true,
        tokenData: response.data,
        error: null,
      }
    } else if (response.status === "error") {
      return {
        isComplete: true,
        isSuccess: false,
        tokenData: null,
        error: response.message || "Token creation failed",
      }
    } else {
      return {
        isComplete: false,
        isSuccess: false,
        tokenData: null,
        error: null,
      }
    }
  } catch (error: any) {
    console.error("Error checking token status:", error)
    return {
      isComplete: true,
      isSuccess: false,
      tokenData: null,
      error: error.message || "Failed to check token status",
    }
  }
}

