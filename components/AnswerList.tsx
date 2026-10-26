import Link from "next/link";
import { fmtDate, type Lang } from "@/lib/i18n";
import type { PublicAnswer, Topic } from "@/lib/types";

export default function AnswerList({
  items, topics, lang, tx, empty,
}: {
  items: PublicAnswer[];
  topics: Topic[];
  lang: Lang;
  tx: (s: string) => string;
  empty: string;
}) {
  if (!items.length) return <div className="empty">{empty}</div>;
  const byId = new Map(topics.map((t) => [t.id, t]));
  return (
    <div className="qlist">
      {items.map((a) => {
        const topic = a.topic_id ? byId.get(a.topic_id) : undefined;
        return (
          <article className="qitem" key={a.question_id}>
            <Link className="title" href={`/${lang}/answer/${a.question_id}`} lang={a.lang}>{tx(a.title)}</Link>
            <p className="excerpt" lang={a.lang}>{tx(a.short_answer)}</p>
            <div className="meta">
              {topic && <Link className="cat" href={`/${lang}/topics/${topic.slug}`}>{tx(lang === "uz" ? topic.name_uz : topic.name_en)}</Link>}
              <span>AQ-{a.question_id}</span>
              <span className="tag">{a.lang.toUpperCase()}</span>
              <span>{fmtDate(a.published_at, lang)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
