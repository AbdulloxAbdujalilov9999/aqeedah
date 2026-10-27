import type { Metadata } from "next";
import { getCtx } from "@/lib/ctx";
import { dict, type Key } from "@/lib/i18n";
import { getTopics } from "@/lib/data";
import AskForm from "./AskForm";

export const metadata: Metadata = { title: "Savol berish · Ask" };

const KEYS: Key[] = [
  "f_topic", "f_topic_none", "f_question", "f_question_help", "f_lang", "f_name", "f_name_help", "f_phone", "f_username",
  "f_public", "f_public_help", "f_urgent", "f_contact", "f_contact_help", "similar_found", "submit", "sending",
  "sent_title", "sent_body", "number", "go_track", "err_daily", "err_generic", "err_short", "err_name", "err_contact",
];

export default async function AskPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string; topic?: string }> }) {
  const { lang: l } = await params;
  const sp = await searchParams;
  const { t, tx, lang, script } = await getCtx(l);
  const topics = (await getTopics()).map((tp) => ({ id: tp.id, name: tx(lang === "uz" ? tp.name_uz : tp.name_en) }));
  return (
    <div className="wrap narrow stack-lg">
      <div className="stack">
        <h1>{t("ask_title")}</h1>
        <p className="muted">{t("ask_intro")}</p>
      </div>
      <AskForm lang={lang} cyr={lang === "uz" && script === "cyr"} topics={topics} d={dict(lang, script, KEYS)} initialQ={sp.q ?? ""} initialTopic={sp.topic ?? ""} />
    </div>
  );
}
