"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function LangSwitch({ lang }: { lang: "uz" | "en" }) {
  const path = usePathname() || `/${lang}`;
  const rest = path.replace(/^\/(uz|en)(?=\/|$)/, "");
  return (
    <span className="seg" role="group" aria-label="Language">
      <Link href={`/uz${rest}`} className={lang === "uz" ? "on" : ""} hrefLang="uz">UZ</Link>
      <Link href={`/en${rest}`} className={lang === "en" ? "on" : ""} hrefLang="en">EN</Link>
    </span>
  );
}

export function ScriptSwitch({ script }: { script: "lat" | "cyr" }) {
  const router = useRouter();
  const set = (v: "lat" | "cyr") => {
    document.cookie = `script=${v}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <span className="seg" role="group" aria-label="Yozuv / Script">
      <button type="button" className={script === "lat" ? "on" : ""} onClick={() => set("lat")}>Lot</button>
      <button type="button" className={script === "cyr" ? "on" : ""} onClick={() => set("cyr")}>Кир</button>
    </span>
  );
}
