import { notFound } from "next/navigation";
import { getCtx } from "@/lib/ctx";
import { getBylines, getScholarAnswers, getTopics } from "@/lib/data";
import AnswerList from "@/components/AnswerList";
import { initials } from "@/components/Person";

export const dynamic = "force-dynamic";

export default async function Scholar({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: l, id } = await params;
  const { t, tx, lang } = await getCtx(l);
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const p = (await getBylines([id]))[id];
  if (!p || !p.is_public) notFound();
  const [topics, items] = await Promise.all([getTopics(), getScholarAnswers(id, lang)]);
  const bio = lang === "uz" ? p.bio_uz : p.bio_en;
  return (
    <div className="wrap narrow stack-lg">
      <div className="row" style={{ gap: 16 }}>
        <span className="avatar" style={{ width: 64, height: 64, fontSize: "1.2rem" }}>{initials(p.full_name)}</span>
        <div className="stack" style={{ gap: 4 }}>
          <h1>{tx(p.full_name ?? "")}</h1>
          <span className="muted">{tx((lang === "uz" ? p.title_uz : p.title_en) ?? "")}</span>
        </div>
      </div>
      {bio && <p>{tx(bio)}</p>}
      {p.credentials && <div className="card small"><span className="label">Ijazah · {lang === "uz" ? "Ma'lumoti" : "Credentials"}</span><p style={{ whiteSpace: "pre-wrap" }}>{tx(p.credentials)}</p></div>}
      <section className="stack">
        <h2>{t("scholar_answers")}</h2>
        <AnswerList items={items} topics={topics} lang={lang} tx={tx} empty={t("topic_empty")} />
      </section>
    </div>
  );
}
