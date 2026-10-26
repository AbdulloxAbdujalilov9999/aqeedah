import { supabaseServer } from "@/lib/supabase/server";
import type { Byline, PublicAnswer, Topic } from "@/lib/types";

const LIST_COLS =
  "id,question_id,lang,is_translation,title,question_text,short_answer,madhhab,author_id,reviewer_id,translator_id,views,published_at,topic_id,asked_at";

export async function getTopics(): Promise<Topic[]> {
  const sb = await supabaseServer();
  const { data } = await sb.from("topics").select("*").order("sort");
  return (data ?? []) as Topic[];
}

export async function getTopicCounts(): Promise<Record<number, number>> {
  const sb = await supabaseServer();
  const { data } = await sb.from("public_answers").select("question_id,topic_id");
  const seen = new Set<number>();
  const counts: Record<number, number> = {};
  for (const r of (data ?? []) as { question_id: number; topic_id: number | null }[]) {
    if (seen.has(r.question_id) || r.topic_id == null) continue;
    seen.add(r.question_id);
    counts[r.topic_id] = (counts[r.topic_id] ?? 0) + 1;
  }
  return counts;
}

// One row per question: the version in `lang` when it exists, otherwise the original.
export function pickPerQuestion(rows: PublicAnswer[], lang: string): PublicAnswer[] {
  const byQ = new Map<number, PublicAnswer>();
  for (const r of rows) {
    const cur = byQ.get(r.question_id);
    if (!cur || (r.lang === lang && cur.lang !== lang)) byQ.set(r.question_id, r);
  }
  return [...byQ.values()];
}

export async function getLatest(lang: string, limit = 8, topicId?: number): Promise<PublicAnswer[]> {
  const sb = await supabaseServer();
  let q = sb.from("public_answers").select(LIST_COLS).order("published_at", { ascending: false }).limit(limit * 2);
  if (topicId) q = q.eq("topic_id", topicId);
  const { data } = await q;
  return pickPerQuestion((data ?? []) as PublicAnswer[], lang).slice(0, limit);
}

export async function countAnswers(): Promise<number> {
  const sb = await supabaseServer();
  const { count } = await sb.from("public_answers").select("question_id", { count: "exact", head: true }).eq("is_translation", false);
  return count ?? 0;
}

export async function search(q: string, lang: string): Promise<PublicAnswer[]> {
  const sb = await supabaseServer();
  const { data } = await sb.rpc("search_answers", { p_q: q, p_lang: null, p_limit: 40 });
  return pickPerQuestion((data ?? []) as PublicAnswer[], lang);
}

export async function getAnswerVersions(questionId: number): Promise<PublicAnswer[]> {
  const sb = await supabaseServer();
  const { data } = await sb.from("public_answers").select("*").eq("question_id", questionId);
  return (data ?? []) as PublicAnswer[];
}

export async function getSimilar(text: string, excludeQid: number) {
  const sb = await supabaseServer();
  const { data } = await sb.rpc("similar_questions", { p_q: text, p_limit: 6 });
  const rows = (data ?? []) as { question_id: number; lang: string; title: string }[];
  const seen = new Set<number>([excludeQid]);
  return rows.filter((r) => (seen.has(r.question_id) ? false : (seen.add(r.question_id), true))).slice(0, 4);
}

export async function getBylines(ids: (string | null)[]): Promise<Record<string, Byline>> {
  const clean = ids.filter(Boolean) as string[];
  if (!clean.length) return {};
  const sb = await supabaseServer();
  const { data } = await sb.from("staff_bylines").select("*").in("id", clean);
  return Object.fromEntries(((data ?? []) as Byline[]).map((b) => [b.id, b]));
}

export async function getPublicScholars(): Promise<Byline[]> {
  const sb = await supabaseServer();
  const { data } = await sb.from("staff_bylines").select("*").eq("is_public", true).order("full_name");
  return (data ?? []) as Byline[];
}

export async function getScholarAnswers(id: string, lang: string): Promise<PublicAnswer[]> {
  const sb = await supabaseServer();
  const { data } = await sb.from("public_answers").select(LIST_COLS).or(`author_id.eq.${id},reviewer_id.eq.${id}`).order("published_at", { ascending: false }).limit(60);
  return pickPerQuestion((data ?? []) as PublicAnswer[], lang);
}
