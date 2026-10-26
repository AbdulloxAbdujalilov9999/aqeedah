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
  const [body, setBody] = useState(initialQ);
  const [topic, setTopic] = useState(initialTopic);
  const [ansLang, setAnsLang] = useState<"uz" | "en">(lang);
  const [anon, setAnon] = useState(true);
  const [name, setName] = useState("");
  const [publish, setPublish] = useState(true);
  const [urgent, setUrgent] = useState(false);
  const [email, setEmail] = useState("");
  const [tg, setTg] = useState("");
  const [similar, setSimilar] = useState<{ question_id: number; lang: string; title: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ number: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
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
    if (body.trim().length < 15) { setError(d.err_short); return; }
    setBusy(true);
    setError("");
    const { data, error: err } = await supabaseBrowser().rpc("submit_question", {
      p_lang: ansLang, p_topic_id: topic ? Number(topic) : null, p_body: body, p_anonymous: anon,
      p_asker_name: anon ? null : name, p_publish_consent: publish, p_contact_email: email || null,
      p_contact_telegram: tg.replace(/^@/, "") || null, p_urgent: urgent,
    });
    setBusy(false);
    if (err) { setError(err.message.includes("daily_limit") ? d.err_daily : d.err_generic); return; }
    const row = (Array.isArray(data) ? data[0] : data) as { number: string; track_code: string };
    setDone({ number: row.number, code: row.track_code });
    saveTicket({ number: row.number, code: row.track_code, at: new Date().toISOString(), excerpt: body.slice(0, 90) });
    window.scrollTo({ top: 0 });
  }

  if (done) {
    const text = `${d.number}: ${done.number} · ${d.code}: ${done.code}`;
    return (
      <div className="stack card" role="status">
        <h2>{d.sent_title}</h2>
        <p>{d.sent_body}</p>
        <div className="ticket">
          <div><span className="label">{d.number}</span><span className="big">{done.number}</span></div>
          <div><span className="label">{d.code}</span><span className="big">{done.code}</span></div>
        </div>
        <div className="row">
          <button type="button" className="btn ghost" onClick={async () => {
            try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
          }}>{copied ? d.copied : d.copy}</button>
          <Link className="btn" href={`/${lang}/track?n=${done.number}&c=${done.code}`}>{d.go_track}</Link>
        </div>
      </div>
    );
  }

  return (
    <form className="stack" onSubmit={submit} noValidate>
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
      <label className="check"><input id="anon" type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> {d.f_anon}</label>
      {!anon && (
        <label className="field"><span>{d.f_name}</span><input id="name" type="text" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} /></label>
      )}
      <label className="check">
        <input id="publish" type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
        <span>{d.f_public}<span className="help" style={{ display: "block" }}>{d.f_public_help}</span></span>
      </label>
      <label className="check"><input id="urgent" type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} /> {d.f_urgent}</label>
      <div className="field">
        <span>{d.f_contact}</span>
        <div className="grid-2">
          <input id="email" type="email" placeholder={d.f_email} value={email} onChange={(e) => setEmail(e.target.value)} maxLength={120} />
          <input id="tg" type="text" placeholder={`@${d.f_telegram}`} value={tg} onChange={(e) => setTg(e.target.value)} maxLength={64} />
        </div>
        <span className="help">{d.f_contact_help}</span>
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px" }} />
      {error && <div className="alert err" role="alert">{error}</div>}
      <div><button className="btn" type="submit" disabled={busy}>{busy ? d.sending : d.submit}</button></div>
    </form>
  );
}
