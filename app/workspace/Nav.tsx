import Link from "next/link";
import { signOut } from "./actions";
import { can, ROLE_LABEL, type Profile } from "@/lib/staff";

export type Counts = Partial<Record<"triage" | "mine" | "review" | "translate", number>>;

export default function Nav({ profile, active, counts = {} }: { profile: Profile; active: string; counts?: Counts }) {
  const r = profile.role;
  const items: [string, string, string, number | undefined][] = [];
  if (can.triage(r)) items.push(["triage", "/workspace?tab=triage", "Saralash · Triage", counts.triage]);
  if (can.answer(r)) items.push(["mine", "/workspace?tab=mine", "Menga · Mine", counts.mine]);
  if (can.review(r)) items.push(["review", "/workspace?tab=review", "Tekshiruv · Review", counts.review]);
  if (can.translate(r)) items.push(["translate", "/workspace?tab=translate", "Tarjima · Translate", counts.translate]);
  items.push(["all", "/workspace?tab=all", "Barcha savollar · All", undefined]);
  if (can.admin(r)) items.push(["team", "/workspace/team", "Jamoa · Team", undefined]);
  items.push(["profile", "/workspace/profile", "Profilim · My profile", undefined]);
  return (
    <nav className="ws-nav" aria-label="Workspace">
      <div className="stack" style={{ gap: 2, marginBottom: 12 }}>
        <b>{profile.full_name}</b>
        <span className="help">{r ? ROLE_LABEL[r] : "—"}</span>
      </div>
      {items.map(([key, href, label, n]) => (
        <Link key={key} href={href} className={active === key ? "on" : ""}>
          <span>{label}</span>
          {n !== undefined && <span className="n">{n}</span>}
        </Link>
      ))}
      <form action={signOut} style={{ marginTop: 16 }}>
        <button className="btn ghost sm" type="submit">Chiqish · Sign out</button>
      </form>
    </nav>
  );
}
