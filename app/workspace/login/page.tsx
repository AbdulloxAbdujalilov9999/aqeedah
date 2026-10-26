"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ kind: "err" | "ok"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const sb = supabaseBrowser();
    if (mode === "in") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: "Email yoki parol noto‘g‘ri. · Wrong email or password." });
      router.push("/workspace");
      router.refresh();
    } else {
      const { data, error } = await sb.auth.signUp({
        email, password,
        options: { data: { full_name: name }, emailRedirectTo: `${window.location.origin}/workspace` },
      });
      setBusy(false);
      if (error) return setMsg({ kind: "err", text: error.message });
      if (data.session) { router.push("/workspace"); router.refresh(); return; }
      setMsg({ kind: "ok", text: "Emailingizga tasdiqlash xati yuborildi. Tasdiqlagach, shu yerda kiring. · Check your email to confirm your account, then sign in here." });
      setMode("in");
    }
  }

  return (
    <main className="wrap" style={{ maxWidth: 440, paddingBlock: 48 }}>
      <form className="card stack" onSubmit={submit}>
        <h1 style={{ fontSize: "1.6rem" }}>{mode === "in" ? "Kirish · Sign in" : "Ro‘yxatdan o‘tish · Create account"}</h1>
        <p className="help">Faqat olimlar, moderatorlar va tarjimonlar uchun. Yangi hisob admin rol bergandan keyin ishlaydi. · For staff only. A new account works once an admin gives it a role.</p>
        {mode === "up" && (
          <label className="field"><span>To‘liq ism · Full name</span><input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required /></label>
        )}
        <label className="field"><span>Email</span><input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <label className="field"><span>Parol · Password</span><input id="password" type="password" autoComplete={mode === "in" ? "current-password" : "new-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
        {msg && <div className={`alert ${msg.kind}`} role="status">{msg.text}</div>}
        <button className="btn" type="submit" disabled={busy}>{mode === "in" ? "Kirish · Sign in" : "Hisob ochish · Create account"}</button>
        <button type="button" className="btn ghost sm" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(null); }}>
          {mode === "in" ? "Hisobingiz yo‘qmi? Ro‘yxatdan o‘ting · Create an account" : "Hisobingiz bormi? Kiring · Sign in instead"}
        </button>
      </form>
    </main>
  );
}
