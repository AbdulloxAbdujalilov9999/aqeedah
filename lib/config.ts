// Publishable values: safe to ship to browsers. Access is enforced by row level security in Supabase.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://arejatrbitloplmvvsxq.supabase.co";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "sb_publishable_QbSS9huru6a-qaRGKvI4pw_v0fU16VB";
