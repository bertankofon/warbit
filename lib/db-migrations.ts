import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function addTokenFieldsToBattles() {
  const supabase = createClientComponentClient()

  try {
    console.log("Checking if stake_token_address column exists in battle_proposals table")

    // First, check if the table exists
    const { data: tableExists, error: tableError } = await supabase.from("battle_proposals").select("id").limit(1)

    if (tableError) {
      console.error("Error checking battle_proposals table:", tableError)
      return false
    }

    // Try to add the column using a simpler approach
    try {
      // Try to add the column to battle_proposals table
      await supabase.rpc("add_column_if_not_exists", {
        table_name: "battle_proposals",
        column_name: "stake_token_address",
        column_type: "text",
      })

      // Try to add the column to battles table
      await supabase.rpc("add_column_if_not_exists", {
        table_name: "battles",
        column_name: "stake_token_address",
        column_type: "text",
      })

      console.log("Migration completed successfully")
      return true
    } catch (rpcError) {
      console.error("RPC error:", rpcError)

      // If RPC fails, we'll just return false and the app will work without the column
      console.log("Migration failed, but app will continue without token address column")
      return false
    }
  } catch (error) {
    console.error("Error in addTokenFieldsToBattles:", error)
    return false
  }
}

