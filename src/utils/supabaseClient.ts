import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn("NEXT_PUBLIC_SUPABASE_URL missing in .env.local");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
