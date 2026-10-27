"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { saveTicket } from "@/lib/tickets";
import { toCyrillic } from "@/lib/translit";

type Props = {
  lang: "uz" | "en";
  cyr: boolean;
  topics: { id: number; name: string }[];
  d: Record<string, string>;
  initialQ: string;
  initialTopic: string;
};

export default function AskForm({ lang, cyr, topics, d, initialQ, initialTopic }: Props) {
  const [name, setName] = useState("");
  const [body, setBody] = useState(initialQ);
  const [topic, setTopic] = useState(initialTopic);
  const [ansLang, setAnsLang] = useState<"uz" | "en">(lang);
  const [publish, setPublish] = useState(true);
  const [urgent, setUrgent] = useState(false);
  const [phone, setPhone] = useState("");
  const [tg, setTg] = useState("");
  const [similar, setSimilar] = useState<{ question_id: number; lang: string; title: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [doneId, setDoneId] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (body.trim().length < 12) { setSimilar([]); return; }
    timer.current = setTimeout(async () => {
      const { data } = await supabaseBrowser().rpc("similar_questions", { p_q: body, p_limit: 4 });
      setSimilar((data ?? []) as typeof similar);
    }, 500);
  }, [body]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (form.get("website")) return; // honeypot
    if (!name.trim()) { setError(d.err_name); return; }
    if (body.trim().length < 15) { setError(d.err_short); return; }
    if (!publish && !phone.trim() && !tg.trim()) { setError(d.err_contact); return; }
    setBusy(true);
    setError("");
    const { data, error: err } = await supabaseBrowser().rpc("ask_question", {
      p_lang: ansLang, p_topic_id: topic ? Number(topic) : null, p_body: body, p_name: name,
      p_phone: phone || null, p_username: tg || null, p_publish_consent: publish, p_urgent: urgent,
    });
    setBusy(false);
    if (err) {
      const m = err.message;
      setError(m.includes("daily_limit") ? d.err_daily : m.includes("contact_required") ? d.err_contact : m.includes("name_required") ? d.err_name : d.err_generic);
      return;
    }
    const id = Number(data);
    setDoneId(id);
    saveTicket({ id, at: new Date().toISOString(), excerpt: body.slice(0, 90) });
    window.scrollTo({ top: 0 });
  }

  if (doneId) {
    return (
      <div className="stack card" role="status">
        <h2>{d.sent_title}</h2>
        <p>{d.sent_body}</p>
        <div className="ticket">
          <div><span className="label">{d.number}</span><span className="big">{doneId}</span></div>
        </div>
        <div><Link className="btn" href={`/${lang}/track?id=${doneId}`}>{d.go_track}</Link></div>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
      <label className="field">
        <span>{d.f_name}</span>
        <input id="name" type="text" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" required />
        <span className="help">{d.f_name_help}</span>
      </label>
      <label className="field">
        <span>{d.f_topic}</span>
        <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
          <option value="">{d.f_topic_none}</option>
          {topics.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>{d.f_question}</span>
        <textarea id="body" value={body} maxLength={4000} onChange={(e) => setBody(e.target.value)} required />
        <span className="help">{d.f_question_help} {body.length}/4000</span>
      </label>
      {similar.length > 0 && (
        <div className="similar">
          <b>{d.similar_found}</b>
          {similar.map((s) => (
            <Link key={s.question_id} href={`/${lang}/answer/${s.question_id}`} target="_blank">
              {cyr && s.lang === "uz" ? toCyrillic(s.title) : s.title}
            </Link>
          ))}
        </div>
      )}
      <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }}>
        <span>{d.f_lang}</span>
        <div className="row">
          <label className="check"><input type="radio" name="alang" checked={ansLang === "uz"} onChange={() => setAnsLang("uz")} /> O‘zbekcha</label>
          <label className="check"><input type="radio" name="alang" checked={ansLang === "en"} onChange={() => setAnsLang("en")} /> English</label>
        </div>
      </fieldset>
      <div className="field">
        <span>{d.f_contact}</span>
        <div className="grid-2">
          <input id="phone" type="tel" inputMode="tel" placeholder={d.f_phone} value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={20} autoComplete="tel" />
          <input id="tg" type="text" placeholder={d.f_username} value={tg} onChange={(e) => setTg(e.target.value)} maxLength={64} />
        </div>
        <span className="help">{d.f_contact_help}</span>
      </div>
      <label className="check">
        <input id="publish" type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        <span>{d.f_public}<span className="help" style={{ display: "block" }}>{d.f_public_help}</span></span>
      </label>
      <label className="check"><input id="urgent" type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> {d.f_urgent}</label>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      {error && <div className="alert err" role="alert">{error}</div>}
      <div><button className="btn" type="submit" disabled={busy}>{busy ? d.sending : d.submit}</button></div>
    </form>
  );
}
