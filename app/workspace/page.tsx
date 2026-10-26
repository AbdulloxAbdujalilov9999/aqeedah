import Link from "next/link";
import { can, getStaff } from "@/lib/staff";
import { fmtDate } from "@/lib/i18n";
import Nav from "./Nav";
import Pending from "./Pending";

export const dynamic = "force-dynamic";

type QRow = { id: number; number: string; body: string; lang: string; status: string; urgent: boolean; created_at: string; topic_id: number | null; assigned_to: string | null };
type ARow = { id: number; question_id: number; lang: string; title: string; status: string; is_translation: boolean; updated_at: string };

const TITLES: Record<string, string> = {
  triage: "Saralash kutayotgan savollar · Waiting for triage",
  mine: "Menga tayinlangan · Assigned to me",
  review: "Tekshiruv kutayotgan javoblar · Waiting for review",
  translate: "Tarjima kerak · Needs translation",
  all: "Barcha savollar · All questions",
};

export default async function Workspace({ searchParams }: { searchParams: Promise<{ tab?: string; n?: string }> }) {
  const { sb, user, profile } = await getStaff();
  if (!profile.role) return <Pending email={user.email ?? ""} />;
  const sp = await searchParams;
  const r = profile.role;
  const def = can.triage(r) ? "triage" : can.answer(r) ? "mine" : "translate";
  const tab = sp.tab && TITLES[sp.tab] ? sp.tab : def;

  const qcols = "id,number,body,lang,status,urgent,created_at,topic_id,assigned_to";
  const [triageQ, mineQ, reviewA, published, trDrafts, topicsRes] = await Promise.all([
    sb.from("questions").select(qcols).eq("status", "received").order("urgent", { ascending: false }).order("created_at"),
    sb.from("questions").select(qcols).eq("assigned_to", user.id).in("status", ["assigned", "answering", "in_review"]).order("urgent", { ascending: false }).order("created_at"),
    sb.from("answers").select("id,question_id,lang,title,status,is_translation,updated_at").eq("status", "in_review").order("updated_at"),
    sb.from("answers").select("question_id,lang,status").order("question_id", { ascending: false }).limit(1000),
    sb.from("answers").select("id,question_id,lang,title,status,is_translation,updated_at").eq("is_translation", true).in("status", ["draft", "returned"]),
    sb.from("topics").select("id,name_uz"),
  ]);
  const topics = new Map(((topicsRes.data ?? []) as { id: number; name_uz: string }[]).map((t) => [t.id, t.name_uz]));

  // Questions whose original answer is published but which have no second-language version yet.
  const byQ = new Map<number, { langs: Set<string>; published: boolean }>();
  for (const a of (published.data ?? []) as { question_id: number; lang: string; status: string }[]) {
    const e = byQ.get(a.question_id) ?? { langs: new Set(), published: false };
    e.langs.add(a.lang);
    if (a.status === "published") e.published = true;
    byQ.set(a.question_id, e);
  }
  const needTr = [...byQ.entries()].filter(([, e]) => e.published && e.langs.size === 1).map(([q]) => q);

  const counts = {
    triage: triageQ.data?.length ?? 0,
    mine: mineQ.data?.length ?? 0,
    review: reviewA.data?.length ?? 0,
    translate: needTr.length + (trDrafts.data?.length ?? 0),
  };

  let qrows: QRow[] = [];
  let arows: ARow[] = [];
  if (tab === "triage") qrows = (triageQ.data ?? []) as QRow[];
  if (tab === "mine") qrows = (mineQ.data ?? []) as QRow[];
  if (tab === "review") arows = (reviewA.data ?? []) as ARow[];
  if (tab === "translate") {
    arows = (trDrafts.data ?? []) as ARow[];
    if (needTr.length) {
      const { data } = await sb.from("answers").select("id,question_id,lang,title,status,is_translation,updated_at").in("question_id", needTr.slice(0, 200)).eq("status", "published");
      arows = [...arows, ...((data ?? []) as ARow[])];
    }
  }
  if (tab === "all") {
    let q = sb.from("questions").select(qcols).order("created_at", { ascending: false }).limit(100);
    const n = (sp.n ?? "").toUpperCase().replace(/^AQ-?/, "");
    if (n && Number.isInteger(Number(n))) q = q.eq("id", Number(n));
    qrows = ((await q).data ?? []) as QRow[];
  }

  return (
    <div className="ws">
      <Nav profile={profile} active={tab} counts={counts} />
      <section className="ws-main">
        <h1 style={{ fontSize: "1.5rem" }}>{TITLES[tab]}</h1>
        {tab === "all" && (
          <form className="row" action="/workspace">
            <input type="hidden" name="tab" value="all" />
            <input id="n" type="text" name="n" placeholder="AQ-1001" defaultValue={sp.n ?? ""} style={{ maxWidth: 200 }} />
            <button className="btn sm" type="submit">Topish · Find</button>
          </form>
        )}
        {(tab === "review" || tab === "translate") ? (
          arows.length === 0 ? <div className="empty">Hozircha bo‘sh · Nothing here right now</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>№</th><th>Sarlavha · Title</th><th>Til</th><th>Holat · Status</th><th>Yangilandi</th></tr></thead>
              <tbody>{arows.map((a) => (
                <tr key={a.id}>
                  <td><Link href={`/workspace/q/${a.question_id}`}>AQ-{a.question_id}</Link></td>
                  <td><Link href={`/workspace/q/${a.question_id}`}>{a.title}</Link></td>
                  <td>{a.lang.toUpperCase()}{tab === "translate" && a.status === "published" && <> → {a.lang === "uz" ? "EN" : "UZ"}</>}</td>
                  <td><span className={`status s-${a.status}`}>{a.status}</span>{a.is_translation && <span className="help"> tarjima</span>}</td>
                  <td className="help">{fmtDate(a.updated_at, "uz")}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )
        ) : (
          qrows.length === 0 ? <div className="empty">Hozircha bo‘sh · Nothing here right now</div> : (
            <div className="table-wrap"><table>
              <thead><tr><th>№</th><th>Savol · Question</th><th>Mavzu</th><th>Til</th><th>Holat · Status</th><th>Sana</th></tr></thead>
              <tbody>{qrows.map((q) => (
                <tr key={q.id}>
                  <td><Link href={`/workspace/q/${q.id}`}>{q.number}</Link>{q.urgent && <div className="urgent small">Shoshilinch</div>}</td>
                  <td style={{ minWidth: 260 }}><Link href={`/workspace/q/${q.id}`} style={{ color: "var(--ink)" }}>{q.body.slice(0, 160)}{q.body.length > 160 ? "…" : ""}</Link></td>
                  <td className="help">{q.topic_id ? topics.get(q.topic_id) : "—"}</td>
                  <td>{q.lang.toUpperCase()}</td>
                  <td><span className={`status s-${q.status}`}>{q.status}</span></td>
                  <td className="help">{fmtDate(q.created_at, "uz")}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )
        )}
      </section>
    </div>
  );
}
