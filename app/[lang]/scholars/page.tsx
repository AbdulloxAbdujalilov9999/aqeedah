import { getCtx } from "@/lib/ctx";
import { getPublicScholars } from "@/lib/data";
import Person from "@/components/Person";

export const dynamic = "force-dynamic";

export default async function Scholars({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: l } = await params;
  const { t, tx, lang } = await getCtx(l);
  const people = await getPublicScholars();
  return (
    <div className="wrap narrow stack-lg">
      <div className="stack">
        <h1>{t("scholars_title")}</h1>
        <p className="muted">{t("scholars_intro")}</p>
      </div>
      {people.length === 0 ? <div className="empty">{t("no_scholars")}</div> : (
        <div className="grid-2">
          {people.map((p) => (
            <div className="card stack" key={p.id} style={{ gap: 10 }}>
              <Person p={p} lang={lang} tx={tx} />
              {(lang === "uz" ? p.bio_uz : p.bio_en) && <p className="small">{tx((lang === "uz" ? p.bio_uz : p.bio_en) ?? "")}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
