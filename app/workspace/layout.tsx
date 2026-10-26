import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/Logo";

export const metadata: Metadata = { title: "Ishxona · Workspace", robots: { index: false } };

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="wrap" style={{ maxWidth: "none" }}>
          <Link href="/workspace" className="brand"><Logo />Aqeedah</Link>
          <span className="eyebrow">Ishxona · Workspace</span>
          <span className="spacer" />
          <Link href="/uz" className="small">Saytga qaytish · Back to site</Link>
        </div>
      </header>
      {children}
    </>
  );
}
