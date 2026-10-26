"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { loadTickets, type Ticket } from "@/lib/tickets";
import { toCyrillic } from "@/lib/translit";
import { fmtDate } from "@/lib/i18n";
import AnswerBody from "@/components/AnswerBody";

type Result = {
  number: string;
  status: string;
  body: string;
  created_at: string;
  decline_reason: string | null;
  events: { status: string; at: string }[];
  answer_question_id: number | null;
  private_answer: { title: string; short_answer: string; body: string } | null;
};

const ORDER = ["received", "assigned", "answering", "in_review", "answered"];

export default function TrackView({ lang, cyr, d, n, c }: { lang: "uz" | "en"; cyr: boolean; d: Record<string, string>; n: string; c: string }) {
  const [num, setNum] = useState(n);
  const [code, setCode] = useState(c);
  const [res, setRes] = useState<Result | null>(null);
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const tx = (s: string) => (cyr ? toCyrillic(s) : s);

  const look = useCallback(async (nn: string, cc: string) => {
    setMsg("");
    const { data, error } = await supabaseBrowser().rpc("track_question", { p_number: nn, p_code: cc });
    if (error) { setMsg(d.err_generic); setRes(null); return; }
    if (!data) { setMsg(d.track_not_found); setRes(null); return; }
    setRes(data as Result);
  }, [d]);

  useEffect(() => {
    setTickets(loadTickets());
    if (n && c) void look(n, c);
  }, [n, c, look]);

  const label = (s: string) => d[`st_${s}`] ?? s;
  const finalBad = res && (res.status === "declined" || res.status === "duplicate");
  const reached = res ? Math.max(...res.events.map((e) => ORDER.indexOf(e.status)), ORDER.indexOf(res.status)) : -1;

  return (
    <div className="stack-lg">
      <form className="stack card" onSubmit={(e) => { e.preventDefault(); void look(num, code); }}>
        <p className="muted">{d.track_intro}</p>
        <div className="grid-2">
          <label className="field"><span>{d.number}</span><input id="num" type="text" placeholder="AQ-1001" value={num} onChange={(e) => setNum(e.target.value)} required /></label>
          <label className="field"><span>{d.code}</span><input id="code" type="text" placeholder="A1B2C3" value={code} onChange={(e) => setCode(e.target.value)} required /></label>
        </div>
        <div><button className="btn" type="submit">{d.track_btn}</button></div>
        {msg && <div className="alert err" role="alert">{msg}</div>}
      </form>

      {res && (
        <section className="stack card">
          <div className="meta"><span className="tag">{res.number}</span><span>{fmtDate(res.created_at, lang)}</span></div>
          <p style={{ fontWeight: 600 }}>{res.body}</p>
          <div className="timeline">
            {ORDER.map((s, i) => {
              const ev = res.events.find((e) => e.status === s);
              const cls = res.status === s && s !== "answered" ? "now" : i <= reached ? "done" : "";
              return (
                <div key={s} className={`tl ${cls}`}>
                  <span className="dot" />
                  <div>{label(s)}{ev && <small>{fmtDate(ev.at, lang)}</small>}</div>
                </div>
              );
            })}
            {finalBad && (
              <div className="tl bad"><span className="dot" /><div>{label(res.status)}{res.decline_reason && <small>{d.decline_reason}: {res.decline_reason}</small>}</div></div>
            )}
          </div>
          {res.answer_question_id && (res.status === "answered" || res.status === "duplicate") && !res.private_answer && (
            <div><Link className="btn" href={`/${lang}/answer/${res.answer_question_id}`}>{d.read_answer}</Link></div>
          )}
          {res.private_answer && (
            <div className="stack">
              <span className="label">{d.private_answer}</span>
              <h2>{tx(res.private_answer.title)}</h2>
              <div className="short"><span className="label">{d.short_answer}</span><p>{tx(res.private_answer.short_answer)}</p></div>
              <AnswerBody body={res.private_answer.body} tx={tx} />
            </div>
          )}
        </section>
      )}

      {tickets.length > 0 && (
        <section className="stack">
          <span className="label">{d.my_questions}</span>
          <div className="qlist">
            {tickets.map((tk) => (
              <div className="qitem" key={tk.number}>
                <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => { setNum(tk.number); setCode(tk.code); void look(tk.number, tk.code); }}>
                  {tk.number} · {tk.code}
                </button>
                <span className="help">{tk.excerpt}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
