import Link from "next/link";
import { getCtx } from "@/lib/ctx";
import Logo from "@/components/Logo";
import Tiles from "@/components/Tiles";
import { LangSwitch, ScriptSwitch } from "@/components/Switches";

// Every page reads the Latin/Cyrillic cookie, so nothing is prerendered.
export const dynamic = "force-dynamic";

export default async function LangLayout({ children, params }: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { t, script } = await getCtx(lang);
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href={`/${lang}`} className="brand"><Logo />{t("brand")}</Link>
          <nav className="nav" aria-label="Main">
            <Link href={`/${lang}/topics`}>{t("nav_topics")}</Link>
            <Link href={`/${lang}/scholars`}>{t("nav_scholars")}</Link>
            <Link href={`/${lang}/method`}>{t("nav_method")}</Link>
            <Link href={`/${lang}/track`}>{t("nav_track")}</Link>
          </nav>
          <span className="spacer" />
          <div className="toggles">
            <LangSwitch lang={lang as "uz" | "en"} />
            {lang === "uz" && <ScriptSwitch script={script} />}
          </div>
          <Link href={`/${lang}/ask`} className="btn">{t("ask")}</Link>
        </div>
      </header>
      <Tiles />
      <main lang={lang}>{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <p>{t("footer_note")}</p>
          <p className="row">
            <span>© {new Date().getFullYear()} Aqeedah</span>
            <Link href={`/${lang}/method`}>{t("nav_method")}</Link>
            <Link href="/workspace">Ishxona · Workspace</Link>
          </p>
        </div>
      </footer>
    </>
  );
}
