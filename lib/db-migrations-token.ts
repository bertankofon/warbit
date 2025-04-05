import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function setupTokenTransactionsTable() {
  const supabase = createClientComponentClient()

  try {
    console.log("Setting up token_transactions table if it doesn't exist")

    // Check if the table exists by attempting to query it
    const { error: checkError } = await supabase.from("token_transactions").select("id").limit(1)

    // If the table doesn't exist, create it
    if (checkError && checkError.message.includes('relation "public.token_transactions" does not exist')) {
      console.log("token_transactions table doesn't exist, creating it...")

      try {
        // Try to create the table using RPC
        await supabase.rpc("create_token_transactions_table")
        console.log("token_transactions table created successfully")
        return true
      } catch (rpcError) {
        console.error("RPC error:", rpcError)
        console.log("Failed to create token_transactions table, but app will continue")
        return false
      }
    } else {
      console.log("token_transactions table already exists")
      return true
    }
  } catch (error) {
    console.error("Error in setupTokenTransactionsTable:", error)
    return false
  }
}

// Function to add the stake_token_address column to battle_proposals and battles tables
export async function addTokenAddressColumns() {
  const supabase = createClientComponentClient()

  try {
    console.log("Adding stake_token_address column to tables if it doesn't exist")

    // Try to add the column to battle_proposals table
    try {
      await supabase.rpc("add_column_if_not_exists", {
        table_name: "battle_proposals",
        column_name: "stake_token_address",
        column_type: "text",
      })
      console.log("Added stake_token_address to battle_proposals table")
    } catch (error) {
      console.warn("Could not add stake_token_address to battle_proposals:", error)
    }

    // Try to add the column to battles table
    try {
      await supabase.rpc("add_column_if_not_exists", {
        table_name: "battles",
        column_name: "stake_token_address",
        column_type: "text",
      })
      console.log("Added stake_token_address to battles table")
    } catch (error) {
      console.warn("Could not add stake_token_address to battles:", error)
    }

    return true
  } catch (error) {
    console.error("Error in addTokenAddressColumns:", error)
    return false
  }
}

