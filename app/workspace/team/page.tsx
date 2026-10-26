import { redirect } from "next/navigation";
import { can, getStaff, ROLE_LABEL, type Role } from "@/lib/staff";
import Nav from "../Nav";
import { setRole } from "../actions";

export const dynamic = "force-dynamic";

export default async function Team() {
  const { sb, profile } = await getStaff();
  if (!can.admin(profile.role)) redirect("/workspace");
  const { data } = await sb.from("profiles").select("id,full_name,role,is_public,created_at").order("created_at");
  const rows = (data ?? []) as { id: string; full_name: string | null; role: Role | null; is_public: boolean; created_at: string }[];
  return (
    <div className="ws">
      <Nav profile={profile} active="team" />
      <section className="ws-main">
        <h1 style={{ fontSize: "1.5rem" }}>Jamoa · Team</h1>
        <p className="help">Yangi xodim /workspace/login sahifasida ro‘yxatdan o‘tadi, keyin siz bu yerda unga rol berasiz. “Ochiq profil” belgilansa, u Olimlar sahifasida ko‘rinadi. · New staff sign up at /workspace/login, then you give them a role here. “Public profile” lists them on the Scholars page.</p>
        <div className="table-wrap"><table>
          <thead><tr><th>Ism · Name</th><th>Rol · Role</th><th>Ochiq profil · Public</th><th></th></tr></thead>
          <tbody>{rows.map((p) => (
            <tr key={p.id}>
              <td>{p.full_name ?? "—"}{p.id === profile.id && <span className="help"> (siz)</span>}</td>
              <td colSpan={3}>
                <form action={setRole} className="row">
                  <input type="hidden" name="id" value={p.id} />
                  <select name="role" defaultValue={p.role ?? ""} style={{ maxWidth: 240 }} disabled={p.id === profile.id}>
                    <option value="">— rol yo‘q · no access</option>
                    {(Object.keys(ROLE_LABEL) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                  </select>
                  {p.id === profile.id && <input type="hidden" name="role" value={p.role ?? ""} />}
                  <label className="check"><input type="checkbox" name="is_public" defaultChecked={p.is_public} /> Ochiq · Public</label>
                  <button className="btn sm" type="submit">Saqlash · Save</button>
                </form>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </section>
    </div>
  );
}
