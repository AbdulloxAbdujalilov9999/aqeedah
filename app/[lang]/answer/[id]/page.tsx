import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCtx } from "@/lib/ctx";
import { fmtDate, otherLang } from "@/lib/i18n";
import { getAnswerVersions, getBylines, getSimilar, getTopics } from "@/lib/data";
import { supabaseServer } from "@/lib/supabase/server";
import AnswerBody from "@/components/AnswerBody";
import Person from "@/components/Person";

export const dynamic = "force-dynamic";

async function load(id: string) {
  const qid = Number(id);
  if (!Number.isInteger(qid)) return null;
  const versions = await getAnswerVersions(qid);
  return versions.length ? { qid, versions } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { lang, id } = await params;
  const data = await load(id);
  const a = data?.versions.find((v) => v.lang === lang) ?? data?.versions[0];
  return a ? { title: a.title, description: a.short_answer.slice(0, 160) } : {};
}

export default async function AnswerPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: l, id } = await params;
  const { t, tx, lang } = await getCtx(l);
  const data = await load(id);
  if (!data) notFound();
  const { qid, versions } = data;
  const a = versions.find((v) => v.lang === lang) ?? versions.find((v) => !v.is_translation) ?? versions[0];
  const other = versions.find((v) => v.lang !== a.lang);
  const [topics, people, similar] = await Promise.all([
    getTopics(),
    getBylines([a.author_id, a.reviewer_id, a.translator_id]),
    getSimilar(a.title, qid),
  ]);
  const sb = await supabaseServer();
  await sb.rpc("bump_views", { p_question_id: qid });
  const topic = topics.find((x) => x.id === a.topic_id);
  const author = a.author_id ? people[a.author_id] : undefined;
  const reviewer = a.reviewer_id ? people[a.reviewer_id] : undefined;
  const translator = a.translator_id ? people[a.translator_id] : undefined;
  // Uzbek Cyrillic conversion applies only to Uzbek text.
  const ctx = a.lang === "uz" ? tx : (s: string) => s;

  return (
    <div className="wrap answer">
      <article className="stack" lang={a.lang}>
        <div className="crumbs">
          <Link href={`/${lang}/topics`}>{t("topics")}</Link>
          {topic && <> › <Link href={`/${lang}/topics/${topic.slug}`}>{tx(lang === "uz" ? topic.name_uz : topic.name_en)}</Link></>}
        </div>
        <h1>{ctx(a.title)}</h1>
        <div className="meta">
          <span>{t("question_no")} AQ-{qid}</span>
          <span>{t("madhhab")}: {t("hanafi")}</span>
          <span>{t("published")}: {fmtDate(a.published_at, lang)}</span>
        </div>
        {a.lang !== lang && <div className="alert info">{t("only_other_lang")}</div>}
        <p className="asked">“{ctx(a.question_text)}”</p>
        <section className="short">
          <span className="label">{t("short_answer")}</span>
          <p>{ctx(a.short_answer)}</p>
        </section>
        {a.body.trim() && (
          <section className="stack">
            <h2>{t("details")}</h2>
            <AnswerBody body={a.body} tx={ctx} />
          </section>
        )}
      </article>
      <aside className="side">
        {author && <div className="stack" style={{ gap: 6 }}><span className="label">{t("answered_by")}</span><Person p={author} lang={lang} tx={tx} /></div>}
        {reviewer && (
          <div className="seal"><b>✓ {t("reviewed")}</b><span>{t("reviewed_by")}: {tx(reviewer.full_name ?? "")}</span></div>
        )}
        {translator && a.is_translation && <div className="small muted">{t("translated_by")}: {tx(translator.full_name ?? "")}</div>}
        <dl className="facts">
          <dt>{t("language")}</dt>
          <dd>{a.lang.toUpperCase()}{other && <> · <Link href={`/${otherLang(a.lang)}/answer/${qid}`}>{other.lang.toUpperCase()}</Link></>}</dd>
          <dt>{t("views")}</dt>
          <dd>{a.views + 1}</dd>
        </dl>
        {similar.length > 0 && (
          <div className="stack" style={{ gap: 4 }}>
            <span className="label">{t("similar")}</span>
            <div className="qlist">
              {similar.map((s) => (
                <div className="qitem" key={s.question_id} style={{ padding: "8px 0" }}>
                  <Link className="title" style={{ fontSize: ".9rem" }} href={`/${lang}/answer/${s.question_id}`}>{s.lang === "uz" ? tx(s.title) : s.title}</Link>
                </div>
              ))}
            </div>
          </div>
        )}
        <Link className="btn ghost sm" href={`/${lang}/ask`}>{t("ask")}</Link>
      </aside>
    </div>
  );
}
