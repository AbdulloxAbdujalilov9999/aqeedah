import Link from "next/link";
import type { Byline } from "@/lib/types";

export function initials(name: string | null) {
  return (name ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
}

export default function Person({ p, lang, tx }: { p: Byline; lang: string; tx: (s: string) => string }) {
  const title = lang === "uz" ? p.title_uz : p.title_en;
  const inner = (
    <>
      <span className="avatar">{initials(p.full_name)}</span>
      <span><b>{tx(p.full_name ?? "")}</b>{title && <span className="help" style={{ display: "block" }}>{tx(title)}</span>}</span>
    </>
  );
  return p.is_public ? <Link className="person" href={`/${lang}/scholars/${p.id}`}>{inner}</Link> : <div className="person">{inner}</div>;
}
