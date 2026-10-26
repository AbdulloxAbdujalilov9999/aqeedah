"use client";
import { useRef, useState } from "react";
import AnswerBody from "@/components/AnswerBody";
import { saveAnswer } from "../../actions";

const SNIPPETS: [string, string][] = [
  ["+ Oyat · Ayah", ":::ayah Sura nomi, oyat raqami\nArabcha matn\n---\nTarjima\n:::"],
  ["+ Hadis · Hadith", ":::hadith Manba, raqam · daraja (sahih/hasan)\nArabcha matn (ixtiyoriy)\n---\nTarjima\n:::"],
  ["+ Manba · Source", ":::source Kitob nomi, muallif, jild/sahifa\nIqtibos\n:::"],
  ["+ Sarlavha · Heading", "## Sarlavha"],
  ["+ Mazhablar · Madhhabs", "## Mazhablar qarashi\n- **Hanafiy:** ...\n- **Shofeiy:** ...\n- **Molikiy:** ...\n- **Hanbaliy:** ..."],
];

type Initial = { title: string; question_text: string; short_answer: string; body: string };

export default function Editor({ qid, lang, initial, disabled }: { qid: number; lang: string; initial: Initial; disabled?: boolean }) {
  const [body, setBody] = useState(initial.body);
  const [preview, setPreview] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  const insert = (snip: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? body.length;
    const before = body.slice(0, start);
    const pad = before && !before.endsWith("\n\n") ? (before.endsWith("\n") ? "\n" : "\n\n") : "";
    const next = `${before}${pad}${snip}\n\n${body.slice(start)}`;
    setBody(next);
    requestAnimationFrame(() => el.focus());
  };

  return (
    <form action={saveAnswer} className="stack">
      <input type="hidden" name="qid" value={qid} />
      <input type="hidden" name="lang" value={lang} />
      <label className="field"><span>Sarlavha (ochiq savol) · Public title</span>
        <input id={`title-${lang}`} type="text" name="title" defaultValue={initial.title} required disabled={disabled} maxLength={200} />
      </label>
      <label className="field"><span>Savol matni (shaxsiy ma’lumotsiz) · Question as published</span>
        <textarea id={`qt-${lang}`} name="question_text" defaultValue={initial.question_text} required disabled={disabled} style={{ minHeight: 90 }} />
        <span className="help">Ism, joy va boshqa shaxsiy tafsilotlarni olib tashlang · Remove names, places and other personal details.</span>
      </label>
      <label className="field"><span>Qisqa javob · Short answer</span>
        <textarea id={`sa-${lang}`} name="short_answer" defaultValue={initial.short_answer} required disabled={disabled} style={{ minHeight: 90 }} />
        <span className="help">2–3 gap. Faqat shuni o‘qigan odam ham javobni bilsin · 2–3 sentences that stand on their own.</span>
      </label>
      <div className="field">
        <span>Batafsil javob va dalillar · Detailed answer and evidence</span>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div className="toolbar">{SNIPPETS.map(([l, s]) => <button key={l} type="button" className="btn ghost sm" onClick={() => insert(s)} disabled={disabled || preview}>{l}</button>)}</div>
          <button type="button" className="btn ghost sm" onClick={() => setPreview(!preview)}>{preview ? "Tahrirlash · Edit" : "Ko‘rish · Preview"}</button>
        </div>
        {preview ? (
          <div className="card"><AnswerBody body={body} tx={(s) => s} /></div>
        ) : (
          <textarea ref={ref} id={`body-${lang}`} value={body} onChange={(e) => setBody(e.target.value)} disabled={disabled} style={{ minHeight: 320, fontFamily: "var(--f-mono)", fontSize: ".85rem" }} />
        )}
        <input type="hidden" name="body" value={body} />
      </div>
      {!disabled && (
        <div className="row">
          <button className="btn ghost" type="submit" name="intent" value="draft">Qoralamani saqlash · Save draft</button>
          <button className="btn" type="submit" name="intent" value="review">Tekshiruvga yuborish · Send for review</button>
        </div>
      )}
    </form>
  );
}
