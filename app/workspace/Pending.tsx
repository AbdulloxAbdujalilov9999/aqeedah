import { signOut } from "./actions";

export default function Pending({ email }: { email: string }) {
  return (
    <main className="wrap" style={{ maxWidth: 560, paddingBlock: 48 }}>
      <div className="card stack">
        <h1 style={{ fontSize: "1.5rem" }}>Hisobingiz tasdiqlanishini kuting · Waiting for approval</h1>
        <p>Siz {email} sifatida kirdingiz. Admin sizga rol (olim, moderator, tarjimon) bergandan so‘ng ishxona ochiladi.</p>
        <p className="muted">You are signed in as {email}. The workspace opens once an admin gives you a role.</p>
        <form action={signOut}><button className="btn ghost sm" type="submit">Chiqish · Sign out</button></form>
      </div>
    </main>
  );
}
