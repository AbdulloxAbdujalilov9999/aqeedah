import Link from "next/link";
import { notFound } from "next/navigation";
import { getCtx } from "@/lib/ctx";
import { getLatest, getTopics } from "@/lib/data";
import AnswerList from "@/components/AnswerList";

export const dynamic = "force-dynamic";

export default async function TopicPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang: l, slug } = await params;
  const { t, tx, lang } = await getCtx(l);
  const topics = await getTopics();
  const topic = topics.find((x) => x.slug === slug);
  if (!topic) notFound();
  const items = await getLatest(lang, 50, topic.id);
  return (
    <div className="wrap narrow stack-lg">
      <div className="stack">
        <div className="crumbs"><Link href={`/${lang}/topics`}>{t("topics")}</Link> ›</div>
        <h1>{tx(lang === "uz" ? topic.name_uz : topic.name_en)}</h1>
        <p className="muted">{tx(lang === "uz" ? topic.intro_uz : topic.intro_en)}</p>
      </div>
      <AnswerList items={items} topics={topics} lang={lang} tx={tx} empty={t("topic_empty")} />
      <div className="askcard">
        <b>{t("not_found_q")}</b>
        <span>{t("not_found_body")}</span>
        <Link className="btn sm" href={`/${lang}/ask?topic=${topic.id}`}>{t("ask")}</Link>
      </div>
    </div>
  );
}
