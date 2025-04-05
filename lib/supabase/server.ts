import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export function createClient() {
  // Check if we have the required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    // For demo purposes, create a mock client
    return {
      auth: {
        getUser: async () => ({
          data: {
            user: {
              id: "demo-user-id",
              email: "demo@example.com",
              user_metadata: {
                warrior: {
                  name: "DemoWarrior",
                  ticker: "DEMO",
                  element: "fire",
                  stats: {
                    level: 1,
                    experience: 0,
                    wins: 0,
                    losses: 0,
                  },
                },
              },
            },
          },
          error: null,
        }),
        getSession: async () => ({
          data: { session: { user: { id: "demo-user-id", email: "demo@example.com" } } },
          error: null,
        }),
      },
    } as any
  }

  // If we have the environment variables, create a real client
  const cookieStore = cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

