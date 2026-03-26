import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase browser client.
 * Falls back to placeholder credentials during build so static generation
 * does not throw. Real credentials from NEXT_PUBLIC_* vars are required
 * in all non-build environments.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      // Minimal valid-looking JWT so @supabase/ssr passes its non-empty check
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJidWlsZCJ9.build',
  )
}
