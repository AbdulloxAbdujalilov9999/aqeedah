import { Fragment, type ReactNode } from "react";

// Answer bodies use a small, safe text format:
//   ## Heading
//   > quotation
//   - list item
//   **bold**, *italic*
//   :::ayah Baqara 2:184          :::hadith Buxoriy, 1903 · sahih
//   <arabic text>                  <arabic text, optional>
//   ---                            ---
//   <translation>                  <translation>
//   :::                            :::

type Tx = (s: string) => string;

function inline(text: string, tx: Tx): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{tx(p.slice(2, -2))}</strong>;
    if (p.startsWith("*") && p.endsWith("*") && p.length > 2) return <em key={i}>{tx(p.slice(1, -1))}</em>;
    return <Fragment key={i}>{tx(p)}</Fragment>;
  });
}

const ARABIC = /[؀-ۿ]/;

function Evidence({ kind, ref_, lines, tx }: { kind: string; ref_: string; lines: string[]; tx: Tx }) {
  const sep = lines.indexOf("---");
  const arabic = sep >= 0 ? lines.slice(0, sep) : lines.filter((l) => ARABIC.test(l));
  const trans = sep >= 0 ? lines.slice(sep + 1) : lines.filter((l) => !ARABIC.test(l));
  return (
    <figure className={`evidence ${kind}`}>
      {arabic.join(" ").trim() && <blockquote className="ar" lang="ar" dir="rtl">{arabic.join(" ")}</blockquote>}
      {trans.join(" ").trim() && <p className="tr">{inline(trans.join(" "), tx)}</p>}
      {ref_ && <figcaption>{tx(ref_)}</figcaption>}
    </figure>
  );
}

export default function AnswerBody({ body, tx }: { body: string; tx: Tx }) {
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  const out: ReactNode[] = [];
  let i = 0;
  let para: string[] = [];
  let list: string[] = [];
  const flush = () => {
    if (para.length) out.push(<p key={`p${out.length}`}>{inline(para.join(" "), tx)}</p>);
    if (list.length) out.push(<ul key={`l${out.length}`}>{list.map((l, j) => <li key={j}>{inline(l, tx)}</li>)}</ul>);
    para = [];
    list = [];
  };
  while (i < lines.length) {
    const line = lines[i];
    const block = line.match(/^:::(ayah|hadith|source)\s*(.*)$/);
    if (block) {
      flush();
      const inner: string[] = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ":::") inner.push(lines[i++].trim());
      out.push(<Evidence key={`e${out.length}`} kind={block[1]} ref_={block[2].trim()} lines={inner.filter(Boolean)} tx={tx} />);
      i++;
      continue;
    }
    if (!line.trim()) flush();
    else if (line.startsWith("## ")) { flush(); out.push(<h3 key={`h${out.length}`}>{inline(line.slice(3), tx)}</h3>); }
    else if (line.startsWith("> ")) { flush(); out.push(<blockquote key={`q${out.length}`} className="quote">{inline(line.slice(2), tx)}</blockquote>); }
    else if (/^[-•]\s/.test(line)) { if (para.length) flush(); list.push(line.replace(/^[-•]\s/, "")); }
    else { if (list.length) flush(); para.push(line.trim()); }
    i++;
  }
  flush();
  return <div className="prose">{out}</div>;
}
