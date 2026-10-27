import Link from "next/link";
import { getCtx } from "@/lib/ctx";
import { getTopics, search } from "@/lib/data";
import AnswerList from "@/components/AnswerList";
import SearchBar from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function SearchPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ q?: string }> }) {
  const { lang: l } = await params;
  const { q = "" } = await searchParams;
  const { t, tx, lang } = await getCtx(l);
  const query = q.trim().slice(0, 200);
  const [topics, results] = await Promise.all([getTopics(), query.length >= 2 ? search(query, lang) : Promise.resolve([])]);
  return (
    <div className="wrap narrow stack-lg">
      <SearchBar autoFocus={!query} lang={lang} placeholder={t("search_ph")} button={t("search_btn")} value={query} />
      {query.length >= 2 ? (
        <section className="stack">
          <h1 style={{ fontSize: "1.6rem" }}>{t("results_for")}: “{query}”</h1>
          <AnswerList items={results} topics={topics} lang={lang} tx={tx} empty={t("no_results")} />
        </section>
      ) : (
        <section className="stack">
          <h1>{t("nav_search")}</h1>
          <p className="help">{t("search_hint")}</p>
          <div className="chips">
            {topics.map((tp) => (
              <Link key={tp.id} className="chip" href={`/${lang}/topics/${tp.slug}`}>{tx(lang === "uz" ? tp.name_uz : tp.name_en)}</Link>
            ))}
          </div>
        </section>
      )}
      <div className="askcard">
        <b>{t("not_found_q")}</b>
        <span>{t("not_found_body")}</span>
        <Link className="btn sm" href={`/${lang}/ask?q=${encodeURIComponent(query)}`}>{t("ask")}</Link>
      </div>
    </div>
  );
}
