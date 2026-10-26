import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export type Role = "moderator" | "scholar" | "reviewer" | "translator" | "admin";
export type Profile = {
  id: string;
  full_name: string | null;
  role: Role | null;
  title_uz: string | null;
  title_en: string | null;
  bio_uz: string | null;
  bio_en: string | null;
  credentials: string | null;
  is_public: boolean;
};

export const ROLE_LABEL: Record<Role, string> = {
  moderator: "Moderator",
  scholar: "Olim · Scholar",
  reviewer: "Katta olim · Reviewer",
  translator: "Tarjimon · Translator",
  admin: "Admin",
};

export const can = {
  triage: (r: Role | null) => r === "moderator" || r === "reviewer" || r === "admin",
  answer: (r: Role | null) => r === "scholar" || r === "reviewer" || r === "admin",
  review: (r: Role | null) => r === "reviewer" || r === "admin",
  translate: (r: Role | null) => r === "translator" || r === "scholar" || r === "reviewer" || r === "admin",
  admin: (r: Role | null) => r === "admin",
};

export async function getStaff() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/workspace/login");
  const { data } = await sb.from("profiles").select("*").eq("id", user.id).single();
  return { sb, user, profile: (data ?? { id: user.id, role: null }) as Profile };
}
