import { createClient } from "@supabase/supabase-js";

// Use environment variables with fallback to empty strings for build time
// These will be replaced at runtime by Vercel environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create client if we have valid credentials
// During build, these will be empty, so we use placeholder values
const isValidConfig = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== "" && 
  supabaseUrl.includes("supabase.co");

export const supabase = isValidConfig
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
