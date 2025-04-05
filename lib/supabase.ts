import { createClient as createSupabaseClient } from "@supabase/supabase-js"

export const createClient = () => {
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
        signInWithPassword: async () => ({
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
        signUp: async (params: any) => ({
          data: {
            user: {
              id: "demo-user-id",
              email: params.email,
              user_metadata: params.options?.data || {},
            },
          },
          error: null,
        }),
        signOut: async () => ({ error: null }),
        exchangeCodeForSession: async () => ({ error: null }),
        updateUser: async (params: any) => ({
          data: { user: { user_metadata: params.data } },
          error: null,
        }),
      },
    } as any
  }

  // If we have the environment variables, create a real client
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
}

