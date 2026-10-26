import Link from "next/link";
import { notFound } from "next/navigation";
import { can, getStaff, ROLE_LABEL, type Role } from "@/lib/staff";
import { fmtDate } from "@/lib/i18n";
import Nav from "../../Nav";
import Pending from "../../Pending";
import Editor from "./Editor";
import { decline, markDuplicate, reopen, review, triage, unpublish } from "../../actions";

export const dynamic = "force-dynamic";

type Answer = {
  id: number; lang: string; is_translation: boolean; title: string; question_text: string; short_answer: string; body: string;
  status: string; review_note: string | null; author_id: string | null; reviewer_id: string | null; translator_id: string | null; published_at: string | null;
};

export default async function QuestionDesk({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  const { sb, user, profile } = await getStaff();
  if (!profile.role) return <Pending email={user.email ?? ""} />;
  const { id } = await params;
  const { msg } = await searchParams;
  const qid = Number(id);
  if (!Number.isInteger(qid)) notFound();

  const [{ data: q }, { data: answers }, { data: events }, { data: topics }, { data: staff }] = await Promise.all([
    sb.from("questions").select("*").eq("id", qid).maybeSingle(),
    sb.from("answers").select("*").eq("question_id", qid),
    sb.from("question_events").select("status,created_at,actor").eq("question_id", qid).order("created_at"),
    sb.from("topics").select("id,name_uz,name_en").order("sort"),
    sb.from("profiles").select("id,full_name,role").not("role", "is", null).order("full_name"),
  ]);
  if (!q) notFound();
  const r = profile.role as Role;
  const people = new Map(((staff ?? []) as { id: string; full_name: string; role: Role }[]).map((p) => [p.id, p]));
  const name = (pid: string | null) => (pid ? people.get(pid)?.full_name ?? "—" : "—");
  const list = (answers ?? []) as Answer[];
  const orig = list.find((a) => a.lang === q.lang);
  const otherLang = q.lang === "uz" ? "en" : "uz";
  const tr = list.find((a) => a.lang === otherLang);
  const closed = q.status === "declined" || q.status === "duplicate";

  const ReviewBox = ({ a }: { a: Answer }) => {
    const writer = a.is_translation ? a.translator_id : a.author_id;
    if (a.status === "in_review" && can.review(r) && (writer !== user.id || r === "admin")) {
      return (
        <form action={review} className="card stack" style={{ borderColor: "var(--warn)" }}>
          <input type="hidden" name="qid" value={qid} /><input type="hidden" name="answer_id" value={a.id} />
          <b>Tekshiruv · Review</b>
          {writer === user.id && <div className="alert err small">Bu javobni o‘zingiz yozgansiz. Admin sifatida tasdiqlay olasiz, lekin ikkinchi olim tekshirgani ma’qul · You wrote this. As admin you can approve it, but a second scholar should review.</div>}
          <label className="field"><span>Izoh (qaytarishda majburiy) · Note (required to return)</span><textarea name="note" style={{ minHeight: 80 }} /></label>
          <div className="row">
            <button className="btn" type="submit" name="decision" value="approve">Tasdiqlash va chop etish · Approve and publish</button>
            <button className="btn danger" type="submit" name="decision" value="return">Qaytarish · Return</button>
          </div>
        </form>
      );
    }
    if (a.status === "published" && can.review(r)) {
      return (
        <form action={unpublish} className="row">
          <input type="hidden" name="qid" value={qid} /><input type="hidden" name="answer_id" value={a.id} />
          <span className="alert ok small">Chop etilgan · Published {fmtDate(a.published_at, "uz")} · <Link href={`/${a.lang}/answer/${qid}`} target="_blank">ochish · open</Link></span>
          <button className="btn danger sm" type="submit">Chop etishdan olish · Unpublish</button>
        </form>
      );
    }
    return null;
  };

  return (
    <div className="ws">
      <Nav profile={profile} active="" />
      <section className="ws-main">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "1.5rem" }}>{q.number}</h1>
          <span className={`status s-${q.status}`}>{q.status}</span>
        </div>
        {msg && <div className="alert info" role="status">{msg}</div>}

        <div className="split">
          <div className="card stack">
            <span className="label">Savol · Question ({q.lang.toUpperCase()})</span>
            <p style={{ whiteSpace: "pre-wrap" }}>{q.body}</p>
            <dl className="facts">
              <dt>Yuborildi</dt><dd>{fmtDate(q.created_at, "uz")}</dd>
              <dt>Ism</dt><dd>{q.anonymous ? "Anonim" : q.asker_name ?? "—"}</dd>
              <dt>Chop etish</dt><dd>{q.publish_consent ? "Rozi · Public" : "Faqat shaxsiy · Private only"}</dd>
              <dt>Aloqa</dt><dd>{[q.contact_email, q.contact_telegram && `@${q.contact_telegram}`].filter(Boolean).join(" · ") || "—"}</dd>
              <dt>Mas’ul</dt><dd>{name(q.assigned_to)}</dd>
              {q.duplicate_of && <><dt>Dublikat</dt><dd><Link href={`/workspace/q/${q.duplicate_of}`}>AQ-{q.duplicate_of}</Link></dd></>}
              {q.decline_reason && <><dt>Sabab</dt><dd>{q.decline_reason}</dd></>}
            </dl>
            {q.urgent && <span className="urgent">Shoshilinch · Urgent</span>}
            <details className="box">
              <summary>Tarix · History</summary>
              <div className="timeline">
                {(events ?? []).map((e: { status: string; created_at: string; actor: string | null }, i: number) => (
                  <div key={i} className="tl done"><span className="dot" /><div>{e.status}<small>{fmtDate(e.created_at, "uz")} · {name(e.actor)}</small></div></div>
                ))}
              </div>
            </details>
          </div>

          {can.triage(r) && (
            <div className="stack">
              <form action={triage} className="card stack">
                <input type="hidden" name="qid" value={qid} />
                <b>Saralash · Triage</b>
                <label className="field"><span>Mavzu · Topic</span>
                  <select name="topic_id" defaultValue={q.topic_id ?? ""}>
                    <option value="">—</option>
                    {(topics ?? []).map((t: { id: number; name_uz: string; name_en: string }) => <option key={t.id} value={t.id}>{t.name_uz} · {t.name_en}</option>)}
                  </select>
                </label>
                <label className="field"><span>Olimga berish · Assign to</span>
                  <select name="assigned_to" defaultValue={q.assigned_to ?? ""}>
                    <option value="">— hech kim · nobody</option>
                    {[...people.values()].filter((p) => can.answer(p.role)).map((p) => <option key={p.id} value={p.id}>{p.full_name} ({ROLE_LABEL[p.role]})</option>)}
                  </select>
                </label>
                <label className="check"><input type="checkbox" name="urgent" defaultChecked={q.urgent} /> Shoshilinch · Urgent</label>
                <label className="field"><span>Ichki izoh · Internal note</span><textarea name="staff_note" defaultValue={q.staff_note ?? ""} style={{ minHeight: 60 }} /></label>
                <div><button className="btn sm" type="submit">Saqlash · Save</button></div>
              </form>
              {!closed ? (
                <details className="box">
                  <summary>Dublikat yoki rad etish · Duplicate or decline</summary>
                  <div className="stack">
                    <form action={markDuplicate} className="row">
                      <input type="hidden" name="qid" value={qid} />
                      <input type="text" name="dup" placeholder="AQ-1001" style={{ maxWidth: 160 }} required />
                      <button className="btn ghost sm" type="submit">Mavjud javobga ulash · Link existing answer</button>
                    </form>
                    <form action={decline} className="stack">
                      <input type="hidden" name="qid" value={qid} />
                      <textarea name="reason" placeholder="Sabab (so‘rovchiga ko‘rinadi) · Reason (shown to the asker)" style={{ minHeight: 60 }} required />
                      <div><button className="btn danger sm" type="submit">Rad etish · Decline</button></div>
                    </form>
                  </div>
                </details>
              ) : (
                <form action={reopen}><input type="hidden" name="qid" value={qid} /><button className="btn ghost sm" type="submit">Qayta ochish · Reopen</button></form>
              )}
            </div>
          )}
        </div>

        {!closed && (
          <section className="stack">
            <h2>Javob · Answer ({q.lang.toUpperCase()})</h2>
            {orig && <div className="meta"><span className={`status s-${orig.status}`}>{orig.status}</span><span>Muallif: {name(orig.author_id)}</span>{orig.reviewer_id && <span>Tekshirdi: {name(orig.reviewer_id)}</span>}</div>}
            {orig?.status === "returned" && orig.review_note && <div className="alert err"><b>Tekshiruvchi izohi · Reviewer note:</b> {orig.review_note}</div>}
            {orig && <ReviewBox a={orig} />}
            {can.answer(r) ? (
              <Editor
                key={`o-${orig?.status}`}
                qid={qid}
                lang={q.lang}
                disabled={orig?.status === "published" || orig?.status === "in_review"}
                initial={{ title: orig?.title ?? "", question_text: orig?.question_text ?? q.body, short_answer: orig?.short_answer ?? "", body: orig?.body ?? "" }}
              />
            ) : !orig && <div className="empty">Javob hali yozilmagan · No answer yet</div>}
          </section>
        )}

        {orig?.status === "published" && can.translate(r) && (
          <section className="stack">
            <h2>Tarjima · Translation ({otherLang.toUpperCase()})</h2>
            {tr && <div className="meta"><span className={`status s-${tr.status}`}>{tr.status}</span><span>Tarjimon: {name(tr.translator_id)}</span></div>}
            {tr?.status === "returned" && tr.review_note && <div className="alert err"><b>Izoh · Note:</b> {tr.review_note}</div>}
            {tr && <ReviewBox a={tr} />}
            <Editor
              key={`t-${tr?.status}`}
              qid={qid}
              lang={otherLang}
              disabled={tr?.status === "published" || tr?.status === "in_review"}
              initial={{ title: tr?.title ?? "", question_text: tr?.question_text ?? "", short_answer: tr?.short_answer ?? "", body: tr?.body ?? orig.body }}
            />
          </section>
        )}
      </section>
    </div>
  );
}
