import Link from "next/link";
import { getCtx } from "@/lib/ctx";
import { getTopicCounts, getTopics } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Topics({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const { t, tx, lang } = await getCtx(l);
  const [topics, counts] = await Promise.all([getTopics(), getTopicCounts()]);
  return (
    <div className="wrap stack-lg">
      <h1>{t("topics")}</h1>
      <div className="topic-grid">
        {topics.map((tp) => (
          <Link key={tp.id} className="topic-tile" href={`/${lang}/topics/${tp.slug}`}>
            <b>{tx(lang === "uz" ? tp.name_uz : tp.name_en)}</b>
            <p>{tx(lang === "uz" ? tp.intro_uz : tp.intro_en)}</p>
            <span className="n">{counts[tp.id] ?? 0} {t("answers_count")}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
