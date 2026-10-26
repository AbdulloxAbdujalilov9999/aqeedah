import Link from "next/link";
import { getCtx } from "@/lib/ctx";
import { countAnswers, getLatest, getTopicCounts, getTopics } from "@/lib/data";
import AnswerList from "@/components/AnswerList";
import SearchBar from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const { t, tx, lang } = await getCtx(l);
  const [topics, latest, counts, total] = await Promise.all([getTopics(), getLatest(lang, 8), getTopicCounts(), countAnswers()]);
  return (
    <>
      <section className="hero" style={{ marginTop: -28 }}>
        <div className="wrap">
          <span className="eyebrow">{t("tagline")}</span>
          <h1>{t("hero")}</h1>
          <SearchBar lang={lang} placeholder={t("search_ph")} button={t("search_btn")} />
          <p className="help">{t("search_hint")} {total > 0 && <>· {total.toLocaleString("en").replace(/,/g, " ")} {t("answers_count")}</>}</p>
          <div className="chips">
            {topics.slice(0, 8).map((tp) => (
              <Link key={tp.id} className="chip" href={`/${lang}/topics/${tp.slug}`}>{tx(lang === "uz" ? tp.name_uz : tp.name_en)}</Link>
            ))}
          </div>
        </div>
      </section>
      <div className="wrap cols" style={{ marginTop: 24 }}>
        <section className="stack">
          <h2>{t("latest")}</h2>
          <AnswerList items={latest} topics={topics} lang={lang} tx={tx} empty={t("empty_archive")} />
        </section>
        <aside className="stack">
          <h2>{t("topics")}</h2>
          <div className="topic-grid compact">
            {topics.map((tp) => (
              <Link key={tp.id} className="topic-tile" href={`/${lang}/topics/${tp.slug}`}>
                <b>{tx(lang === "uz" ? tp.name_uz : tp.name_en)}</b>
                <span className="n">{counts[tp.id] ?? 0}</span>
              </Link>
            ))}
          </div>
          <div className="askcard">
            <b>{t("not_found_q")}</b>
            <span>{t("not_found_body")}</span>
            <Link className="btn sm" href={`/${lang}/ask`}>{t("ask")}</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
