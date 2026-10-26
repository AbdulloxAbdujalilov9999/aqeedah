"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { can, getStaff, type Role } from "@/lib/staff";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (qid: number | string, msg?: string) =>
  redirect(`/workspace/q/${qid}${msg ? `?msg=${encodeURIComponent(msg)}` : ""}`);

function deny(qid: number | string): never {
  back(qid, "Bu amal uchun ruxsatingiz yo'q · You don't have permission for this");
  throw new Error("unreachable");
}

export async function triage(f: FormData) {
  const { sb, profile } = await getStaff();
  const qid = Number(str(f, "qid"));
  if (!can.triage(profile.role)) deny(qid);
  const assigned = str(f, "assigned_to") || null;
  const { data: q } = await sb.from("questions").select("status").eq("id", qid).single();
  const patch: Record<string, unknown> = {
    topic_id: str(f, "topic_id") ? Number(str(f, "topic_id")) : null,
    urgent: f.get("urgent") === "on",
    assigned_to: assigned,
    staff_note: str(f, "staff_note") || null,
  };
  if (assigned && q?.status === "received") patch.status = "assigned";
  if (!assigned && q?.status === "assigned") patch.status = "received";
  const { error } = await sb.from("questions").update(patch).eq("id", qid);
  revalidatePath("/workspace");
  back(qid, error ? error.message : "Saqlandi · Saved");
}

export async function markDuplicate(f: FormData) {
  const { sb, profile } = await getStaff();
  const qid = Number(str(f, "qid"));
  if (!can.triage(profile.role)) deny(qid);
  const num = str(f, "dup").toUpperCase().replace(/^AQ-?/, "");
  const target = Number(num);
  if (!Number.isInteger(target) || target === qid) back(qid, "Savol raqamini tekshiring · Check the question number");
  const { data: pub } = await sb.from("answers").select("id").eq("question_id", target).eq("status", "published").limit(1);
  if (!pub?.length) back(qid, `AQ-${target} uchun chop etilgan javob yo'q · AQ-${target} has no published answer`);
  const { error } = await sb.from("questions").update({ status: "duplicate", duplicate_of: target }).eq("id", qid);
  revalidatePath("/workspace");
  back(qid, error ? error.message : `AQ-${target} ga ulandi · Linked to AQ-${target}`);
}

export async function decline(f: FormData) {
  const { sb, profile } = await getStaff();
  const qid = Number(str(f, "qid"));
  if (!can.triage(profile.role)) deny(qid);
  const reason = str(f, "reason");
  if (!reason) back(qid, "Sababni yozing · Write the reason");
  const { error } = await sb.from("questions").update({ status: "declined", decline_reason: reason }).eq("id", qid);
  revalidatePath("/workspace");
  back(qid, error ? error.message : "Rad etildi · Declined");
}

export async function reopen(f: FormData) {
  const { sb, profile } = await getStaff();
  const qid = Number(str(f, "qid"));
  if (!can.triage(profile.role)) deny(qid);
  await sb.from("questions").update({ status: "received", duplicate_of: null, decline_reason: null }).eq("id", qid);
  revalidatePath("/workspace");
  back(qid, "Qayta ochildi · Reopened");
}

export async function saveAnswer(f: FormData) {
  const { sb, profile, user } = await getStaff();
  const qid = Number(str(f, "qid"));
  const lang = str(f, "lang");
  const intent = str(f, "intent"); // draft | review
  const { data: q } = await sb.from("questions").select("lang,status").eq("id", qid).single();
  if (!q) back(qid, "Savol topilmadi · Question not found");
  const isTranslation = lang !== q!.lang;
  if (isTranslation ? !can.translate(profile.role) : !can.answer(profile.role)) deny(qid);
  const fields = {
    title: str(f, "title"),
    question_text: str(f, "question_text"),
    short_answer: str(f, "short_answer"),
    body: String(f.get("body") ?? ""),
  };
  if (!fields.title || !fields.question_text || !fields.short_answer) back(qid, "Sarlavha, savol va qisqa javob majburiy · Title, question and short answer are required");

  const { data: existing } = await sb.from("answers").select("id,status,author_id").eq("question_id", qid).eq("lang", lang).maybeSingle();
  if (existing?.status === "published") back(qid, "Chop etilgan javobni avval qaytarib oling · Unpublish the answer before editing");
  const row: Record<string, unknown> = {
    ...fields,
    question_id: qid,
    lang,
    is_translation: isTranslation,
    status: intent === "review" ? "in_review" : "draft",
    ...(isTranslation ? { translator_id: user.id } : { author_id: existing?.author_id ?? user.id }),
  };
  const { error } = existing
    ? await sb.from("answers").update(row).eq("id", existing.id)
    : await sb.from("answers").insert(row);
  if (!error && !isTranslation && !["answered", "declined", "duplicate"].includes(q!.status)) {
    await sb.from("questions").update({
      status: intent === "review" ? "in_review" : "answering",
      ...(q!.status === "received" ? { assigned_to: user.id } : {}),
    }).eq("id", qid);
  }
  revalidatePath("/workspace");
  back(qid, error ? error.message : intent === "review" ? "Tekshiruvga yuborildi · Sent for review" : "Qoralama saqlandi · Draft saved");
}

export async function review(f: FormData) {
  const { sb, profile, user } = await getStaff();
  const qid = Number(str(f, "qid"));
  const answerId = Number(str(f, "answer_id"));
  if (!can.review(profile.role)) deny(qid);
  const { data: a } = await sb.from("answers").select("id,author_id,translator_id,is_translation,status").eq("id", answerId).single();
  if (!a || a.status !== "in_review") back(qid, "Javob tekshiruvda emas · The answer is not in review");
  const writer = a!.is_translation ? a!.translator_id : a!.author_id;
  if (writer === user.id && (profile.role as Role) !== "admin") back(qid, "O'zingiz yozgan javobni tekshira olmaysiz · You can't review your own answer");

  if (str(f, "decision") === "approve") {
    const { error } = await sb.from("answers").update({ status: "published", reviewer_id: a!.is_translation ? undefined : user.id, published_at: new Date().toISOString() }).eq("id", answerId);
    if (!error && !a!.is_translation) await sb.from("questions").update({ status: "answered" }).eq("id", qid);
    revalidatePath("/", "layout");
    back(qid, error ? error.message : "Chop etildi · Published");
  } else {
    const note = str(f, "note");
    if (!note) back(qid, "Qaytarish sababini yozing · Write why you're returning it");
    const { error } = await sb.from("answers").update({ status: "returned", review_note: note }).eq("id", answerId);
    if (!error && !a!.is_translation) await sb.from("questions").update({ status: "answering" }).eq("id", qid);
    revalidatePath("/workspace");
    back(qid, error ? error.message : "Muallifga qaytarildi · Returned to the author");
  }
}

export async function unpublish(f: FormData) {
  const { sb, profile } = await getStaff();
  const qid = Number(str(f, "qid"));
  if (!can.review(profile.role)) deny(qid);
  const answerId = Number(str(f, "answer_id"));
  const { data: a } = await sb.from("answers").select("is_translation").eq("id", answerId).single();
  await sb.from("answers").update({ status: "draft", published_at: null }).eq("id", answerId);
  if (a && !a.is_translation) await sb.from("questions").update({ status: "answering" }).eq("id", qid);
  revalidatePath("/", "layout");
  back(qid, "Chop etishdan olindi · Unpublished");
}

export async function setRole(f: FormData) {
  const { sb, profile } = await getStaff();
  if (!can.admin(profile.role)) redirect("/workspace");
  const id = str(f, "id");
  const role = str(f, "role") || null;
  await sb.from("profiles").update({ role, is_public: f.get("is_public") === "on" }).eq("id", id);
  revalidatePath("/workspace/team");
  redirect("/workspace/team");
}

export async function updateProfile(f: FormData) {
  const { sb, user } = await getStaff();
  await sb.from("profiles").update({
    full_name: str(f, "full_name") || null,
    title_uz: str(f, "title_uz") || null,
    title_en: str(f, "title_en") || null,
    bio_uz: str(f, "bio_uz") || null,
    bio_en: str(f, "bio_en") || null,
    credentials: str(f, "credentials") || null,
  }).eq("id", user.id);
  revalidatePath("/workspace/profile");
  redirect("/workspace/profile?saved=1");
}

export async function signOut() {
  const { sb } = await getStaff();
  await sb.auth.signOut();
  redirect("/workspace/login");
}
