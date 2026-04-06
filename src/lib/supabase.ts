/**
 * Supabase Browser Client
 *
 * Uses the anon key — safe to expose to the browser.
 * All access is governed by Supabase Row-Level Security (RLS) policies.
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During Next.js build passes, these may be undefined if not injected.
// We guard at runtime (not build time) to avoid silent auth failures.
const isBuildTime =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE === "phase-production-build";

if (!isBuildTime && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    "[supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.\n" +
      "Add them to .env.local and restart the dev server."
  );
}

export const supabase = createClient(
  supabaseUrl ?? "https://placeholder.supabase.co",
  supabaseAnonKey ?? "placeholder-key",
  {
    auth: {
      autoRefreshToken: true,
      persistSession: false, // Session managed server-side via httpOnly cookies
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  }
);
