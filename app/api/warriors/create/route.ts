import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const { type, name, ticker } = await request.json()

    // Validate input
    if (!type || !name || !ticker) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["fire", "water", "earth", "air"].includes(type)) {
      return NextResponse.json({ error: "Invalid warrior type" }, { status: 400 })
    }

    if (ticker.length > 5) {
      return NextResponse.json({ error: "Ticker must be 5 characters or less" }, { status: 400 })
    }

    // First, check if the user already has a holder account with Metal
    const checkHolderUrl = `https://api.metal.build/holder/${userId}?publicKey=${process.env.NEXT_PUBLIC_METAL_API_KEY}`
    const checkHolderResponse = await fetch(checkHolderUrl, {
      headers: {
        "x-api-key": process.env.METAL_API_SECRET_KEY!,
      },
    })

    let holderAddress

    // If holder doesn't exist, create one
    if (checkHolderResponse.status === 404) {
      const createHolderResponse = await fetch(`https://api.metal.build/holder/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.METAL_API_SECRET_KEY!,
        },
      })

      if (!createHolderResponse.ok) {
        return NextResponse.json({ error: "Failed to create holder" }, { status: createHolderResponse.status })
      }

      const holderData = await createHolderResponse.json()
      holderAddress = holderData.address
    } else if (checkHolderResponse.ok) {
      const holderData = await checkHolderResponse.json()
      holderAddress = holderData.address
    } else {
      return NextResponse.json({ error: "Failed to check holder status" }, { status: checkHolderResponse.status })
    }

    // Store warrior data in user metadata
    // In a real app, you'd store this in a database
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        warrior: {
          type,
          name,
          ticker,
          created_at: new Date().toISOString(),
          stats: {
            level: 1,
            experience: 0,
            wins: 0,
            losses: 0,
          },
        },
      },
    })

    if (updateError) {
      return NextResponse.json({ error: "Failed to save warrior data" }, { status: 500 })
    }

    // Distribute initial tokens to the user
    const distributeResponse = await fetch(`https://api.metal.build/token/${process.env.TOKEN_ADDRESS}/distribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.METAL_API_SECRET_KEY!,
      },
      body: JSON.stringify({
        sendToAddress: holderAddress,
        amount: 100, // Initial tokens for new warrior
      }),
    })

    if (!distributeResponse.ok) {
      // We'll continue even if token distribution fails
      console.error("Failed to distribute initial tokens:", await distributeResponse.text())
    }

    return NextResponse.json({
      success: true,
      message: "Warrior created successfully",
      warrior: {
        type,
        name,
        ticker,
        holderAddress,
      },
    })
  } catch (error) {
    console.error("Error in /api/warriors/create:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

