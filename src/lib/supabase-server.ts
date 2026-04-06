/**
 * Supabase Server-Side Client
 *
 * Uses the service role key — bypasses RLS.
 * MUST only be imported in server-side code (API routes, Server Components, middleware).
 *
 * Security rules:
 * - Never export this module via a 'use client' file
 * - SUPABASE_URL must be a server-only env var (no NEXT_PUBLIC_ prefix)
 * - SUPABASE_SERVICE_ROLE_KEY must never be exposed to the browser
 */

import { createClient } from "@supabase/supabase-js";

// Use SUPABASE_URL (server-only) — NOT NEXT_PUBLIC_SUPABASE_URL
// If you only have NEXT_PUBLIC_SUPABASE_URL set, add SUPABASE_URL as an alias in .env.local
const supabaseUrl =
  process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "[supabase-server] Missing required environment variables.\n" +
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local / Vercel dashboard."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getSession(accessToken: string | null) {
  if (!accessToken) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) return null;
  return user;
}
