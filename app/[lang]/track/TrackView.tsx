"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { loadTickets, type Ticket } from "@/lib/tickets";
import { fmtDate } from "@/lib/i18n";

type Result = {
  id: number;
  status: string;
  created_at: string;
  publish_consent: boolean;
  decline_reason: string | null;
  events: { status: string; at: string }[];
  answer_question_id: number | null;
};

const ORDER = ["received", "assigned", "answering", "in_review", "answered"];

export default function TrackView({ lang, d, initialId }: { lang: "uz" | "en"; d: Record<string, string>; initialId: string }) {
  const [id, setId] = useState(initialId);
  const [res, setRes] = useState<Result | null>(null);
  const [msg, setMsg] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const look = useCallback(async (raw: string) => {
    setMsg("");
    const n = Number(String(raw).replace(/\D/g, ""));
    if (!n) { setMsg(d.track_not_found); setRes(null); return; }
    const { data, error } = await supabaseBrowser().rpc("question_status", { p_id: n });
    if (error) { setMsg(d.err_generic); setRes(null); return; }
    if (!data) { setMsg(d.track_not_found); setRes(null); return; }
    setRes(data as Result);
  }, [d]);

  useEffect(() => {
    setTickets(loadTickets());
    if (initialId) void look(initialId);
  }, [initialId, look]);

  const label = (s: string) => d[`st_${s}`] ?? s;
  const finalBad = res && (res.status === "declined" || res.status === "duplicate");
  const reached = res ? Math.max(...res.events.map((e) => ORDER.indexOf(e.status)), ORDER.indexOf(res.status)) : -1;

  return (
    <div className="stack-lg">
      <form className="stack card" onSubmit={(e) => { e.preventDefault(); void look(id); }}>
        <p className="muted">{d.track_intro}</p>
        <div className="row">
          <label className="field" style={{ flex: "1 1 200px" }}>
            <span>{d.number}</span>
            <input id="qid" type="text" inputMode="numeric" placeholder="1001" value={id} onChange={(e) => setId(e.target.value)} required />
          </label>
          <button className="btn" type="submit" style={{ alignSelf: "flex-end" }}>{d.track_btn}</button>
        </div>
        {msg && <div className="alert err" role="alert">{msg}</div>}
      </form>

      {res && (
        <section className="stack card">
          <div className="meta"><span className="tag">№ {res.id}</span><span>{fmtDate(res.created_at, lang)}</span></div>
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
          {res.answer_question_id ? (
            <div><Link className="btn" href={`/${lang}/answer/${res.answer_question_id}`}>{d.read_answer}</Link></div>
          ) : !res.publish_consent && <p className="alert info">{d.private_note}</p>}
        </section>
      )}

      {tickets.length > 0 && (
        <section className="stack">
          <span className="label">{d.my_questions}</span>
          <div className="qlist">
            {tickets.map((tk) => (
              <div className="qitem" key={tk.id}>
                <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => { setId(String(tk.id)); void look(String(tk.id)); }}>
                  № {tk.id}
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
