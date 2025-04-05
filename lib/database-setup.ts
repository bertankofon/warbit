import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function checkDatabaseSetup() {
  const supabase = createClientComponentClient()

  try {
    // Check if warriors table exists by attempting to query it
    const { error } = await supabase.from("warriors").select("id").limit(1)

    // If we get a specific error about the relation not existing
    if (error && error.message.includes('relation "public.warriors" does not exist')) {
      console.log("Warriors table does not exist")
      return {
        success: false,
        isPreviewMode: true,
        error: "Warriors table does not exist. This is expected in preview mode.",
      }
    }

    // If we get here, either the table exists or there was a different error
    return {
      success: !error,
      isPreviewMode: false,
      error: error ? error.message : undefined,
    }
  } catch (error) {
    console.error("Error checking database setup:", error)
    return {
      success: false,
      isPreviewMode: true,
      error: "Error checking database. This is expected in preview mode.",
    }
  }
}

