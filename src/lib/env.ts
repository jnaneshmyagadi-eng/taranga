/**
 * Lightweight env validation. Call from server entry points if needed.
 * Does not throw on missing optional keys.
 */

export function getPublicSupabaseConfig(): {
  url: string;
  anonKey: string;
} | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function assertServerEnv(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("[taranga] NEXT_PUBLIC_SUPABASE_URL is missing");
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("[taranga] NEXT_PUBLIC_SUPABASE_ANON_KEY is missing");
  }
}
