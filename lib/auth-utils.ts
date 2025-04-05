import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export async function getCurrentUser() {
  const supabase = createClientComponentClient()

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error("Error getting session:", error)
      return null
    }

    if (!session) {
      return null
    }

    return session.user
  } catch (err) {
    console.error("Error in getCurrentUser:", err)
    return null
  }
}

export async function signOut() {
  const supabase = createClientComponentClient()

  try {
    await supabase.auth.signOut()
    return { success: true }
  } catch (err) {
    console.error("Error signing out:", err)
    return { success: false, error: String(err) }
  }
}

