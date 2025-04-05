import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { distributeTokens as metalDistributeTokens, getHolder } from "@/lib/metal-api"

/**
 * Automatically distributes tokens to the winner of a battle
 * and updates warrior stats without requiring admin finalization
 */
export async function autoDistributeTokens(battleId: string) {
  const supabase = createClientComponentClient()

  try {
    // Get the battle details
    const { data: battle, error: battleError } = await supabase.from("battles").select("*").eq("id", battleId).single()

    if (battleError) throw battleError
    if (!battle) throw new Error("Battle not found")

    // Get challenger warrior data
    const { data: challengerWarrior, error: challengerError } = await supabase
      .from("warriors")
      .select("*")
      .eq("id", battle.challenger_warrior_id)
      .single()

    if (challengerError) throw challengerError

    // Get opponent warrior data
    const { data: opponentWarrior, error: opponentError } = await supabase
      .from("warriors")
      .select("*")
      .eq("id", battle.opponent_warrior_id)
      .single()

    if (opponentError) throw opponentError

    // Get challenger user data to get wallet address
    const { data: challengerUser } = await supabase.auth.admin.getUserById(battle.challenger_id)
    if (!challengerUser || !challengerUser.user) throw new Error("Challenger user not found")

    // Get opponent user data to get wallet address
    const { data: opponentUser } = await supabase.auth.admin.getUserById(battle.opponent_id)
    if (!opponentUser || !opponentUser.user) throw new Error("Opponent user not found")

    // Get wallet addresses from user metadata
    const challengerWalletAddress = challengerUser.user.user_metadata?.wallet_address
    const opponentWalletAddress = opponentUser.user.user_metadata?.wallet_address

    if (!challengerWalletAddress) throw new Error("Challenger wallet address not found")
    if (!opponentWalletAddress) throw new Error("Opponent wallet address not found")

    // Update battle status to finalized
    const { error: updateError } = await supabase
      .from("battles")
      .update({
        status: "finalized",
        finalized_at: new Date().toISOString(),
      })
      .eq("id", battleId)

    if (updateError) throw updateError

    // Distribute tokens based on winner
    if (battle.winner === "challenger") {
      try {
        console.log(`Distributing ${battle.stake_amount * 2} ${challengerWarrior.token_symbol} tokens to challenger`)

        // Call Metal API to distribute tokens to winner
        const distributionResult = await metalDistributeTokens(challengerWarrior.token_address, {
          sendTo: challengerWalletAddress,
          amount: battle.stake_amount * 2,
        })

        if (!distributionResult.success) {
          throw new Error(`Token distribution failed: ${JSON.stringify(distributionResult)}`)
        }

        // Update challenger stats (winner)
        await supabase
          .from("warriors")
          .update({
            wins: (challengerWarrior.wins || 0) + 1,
            token_balance: (challengerWarrior.token_balance || 0) + battle.stake_amount * 2,
          })
          .eq("id", battle.challenger_warrior_id)

        // Update opponent stats (loser)
        await supabase
          .from("warriors")
          .update({
            losses: (opponentWarrior.losses || 0) + 1,
          })
          .eq("id", battle.opponent_warrior_id)

        // Verify token transfer by checking updated balance
        try {
          const updatedHolderData = await getHolder(challengerUser.user.id)
          const tokenBalance = updatedHolderData.tokens.find(
            (token) => token.address === challengerWarrior.token_address,
          )?.balance

          console.log(`Verified new token balance for winner: ${tokenBalance}`)
        } catch (verifyError) {
          console.warn("Could not verify token balance after distribution:", verifyError)
        }

        return {
          success: true,
          winner: "challenger",
          winnerName: challengerWarrior.name,
          tokenAmount: battle.stake_amount * 2,
          tokenSymbol: challengerWarrior.token_symbol,
        }
      } catch (distributionError) {
        console.error("Error distributing tokens to challenger:", distributionError)
        throw new Error(`Failed to distribute tokens to challenger: ${distributionError.message}`)
      }
    } else if (battle.winner === "opponent") {
      try {
        console.log(`Distributing ${battle.stake_amount * 2} ${opponentWarrior.token_symbol} tokens to opponent`)

        // Call Metal API to distribute tokens to winner
        const distributionResult = await metalDistributeTokens(opponentWarrior.token_address, {
          sendTo: opponentWalletAddress,
          amount: battle.stake_amount * 2,
        })

        if (!distributionResult.success) {
          throw new Error(`Token distribution failed: ${JSON.stringify(distributionResult)}`)
        }

        // Update opponent stats (winner)
        await supabase
          .from("warriors")
          .update({
            wins: (opponentWarrior.wins || 0) + 1,
            token_balance: (opponentWarrior.token_balance || 0) + battle.stake_amount * 2,
          })
          .eq("id", battle.opponent_warrior_id)

        // Update challenger stats (loser)
        await supabase
          .from("warriors")
          .update({
            losses: (challengerWarrior.losses || 0) + 1,
          })
          .eq("id", battle.challenger_warrior_id)

        // Verify token transfer by checking updated balance
        try {
          const updatedHolderData = await getHolder(opponentUser.user.id)
          const tokenBalance = updatedHolderData.tokens.find(
            (token) => token.address === opponentWarrior.token_address,
          )?.balance

          console.log(`Verified new token balance for winner: ${tokenBalance}`)
        } catch (verifyError) {
          console.warn("Could not verify token balance after distribution:", verifyError)
        }

        return {
          success: true,
          winner: "opponent",
          winnerName: opponentWarrior.name,
          tokenAmount: battle.stake_amount * 2,
          tokenSymbol: opponentWarrior.token_symbol,
        }
      } catch (distributionError) {
        console.error("Error distributing tokens to opponent:", distributionError)
        throw new Error(`Failed to distribute tokens to opponent: ${distributionError.message}`)
      }
    } else {
      // It's a draw, return stakes to both players
      try {
        console.log(`Returning ${battle.stake_amount} tokens to each player due to draw`)

        // Call Metal API to return tokens to challenger
        const challengerReturnResult = await metalDistributeTokens(challengerWarrior.token_address, {
          sendTo: challengerWalletAddress,
          amount: battle.stake_amount,
        })

        if (!challengerReturnResult.success) {
          throw new Error(`Token return to challenger failed: ${JSON.stringify(challengerReturnResult)}`)
        }

        // Call Metal API to return tokens to opponent
        const opponentReturnResult = await metalDistributeTokens(opponentWarrior.token_address, {
          sendTo: opponentWalletAddress,
          amount: battle.stake_amount,
        })

        if (!opponentReturnResult.success) {
          throw new Error(`Token return to opponent failed: ${JSON.stringify(opponentReturnResult)}`)
        }

        // Update database records
        await supabase
          .from("warriors")
          .update({
            token_balance: (challengerWarrior.token_balance || 0) + battle.stake_amount,
          })
          .eq("id", battle.challenger_warrior_id)

        await supabase
          .from("warriors")
          .update({
            token_balance: (opponentWarrior.token_balance || 0) + battle.stake_amount,
          })
          .eq("id", battle.opponent_warrior_id)

        return {
          success: true,
          winner: "draw",
          tokenAmount: battle.stake_amount,
          challengerTokenSymbol: challengerWarrior.token_symbol,
          opponentTokenSymbol: opponentWarrior.token_symbol,
        }
      } catch (drawDistributionError) {
        console.error("Error returning tokens in draw:", drawDistributionError)
        throw new Error(`Failed to return tokens in draw: ${drawDistributionError.message}`)
      }
    }
  } catch (err) {
    console.error("Error distributing tokens:", err)
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to distribute tokens",
    }
  }
}

/**
 * Logs a token transaction for audit purposes
 */
export async function logTokenTransaction(data: {
  battleId: string
  fromUserId: string
  toUserId: string
  tokenAddress: string
  tokenSymbol: string
  amount: number
  transactionType: "stake" | "win" | "return"
}) {
  const supabase = createClientComponentClient()

  try {
    const { error } = await supabase.from("token_transactions").insert({
      battle_id: data.battleId,
      from_user_id: data.fromUserId,
      to_user_id: data.toUserId,
      token_address: data.tokenAddress,
      token_symbol: data.tokenSymbol,
      amount: data.amount,
      transaction_type: data.transactionType,
      timestamp: new Date().toISOString(),
    })

    if (error) throw error

    return { success: true }
  } catch (err) {
    console.error("Error logging token transaction:", err)
    return { success: false, error: err instanceof Error ? err.message : "Failed to log transaction" }
  }
}

