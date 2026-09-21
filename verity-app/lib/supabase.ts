// =============================================================================
// VERITY — Supabase Client (Browser)
// =============================================================================
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.trim() !== ''
)

export function createClient() {
  if (!isConfigured) {
    // Development fallback mock client when Supabase credentials are not set yet
    const demoSession = {
      access_token: 'demo-local-token',
      token_type: 'bearer',
      user: {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'explorer@verity.ai',
        user_metadata: {
          full_name: 'Verity Explorer',
        },
      },
    }

    return {
      auth: {
        async getSession() {
          return { data: { session: demoSession }, error: null }
        },
        async getUser() {
          return { data: { user: demoSession.user }, error: null }
        },
        async signInWithPassword(_credentials: { email: string; password?: string }) {
          return { data: { session: demoSession, user: demoSession.user }, error: null }
        },
        async signUp(_credentials: { email: string; password?: string; options?: any }) {
          return { data: { session: demoSession, user: demoSession.user }, error: null }
        },
        async signOut() {
          return { error: null }
        },
        async resetPasswordForEmail(_email: string) {
          return { data: {}, error: null }
        },
      },
    } as any
  }

  return createBrowserClient(
    supabaseUrl!,
    supabaseAnonKey!
  )
}
