import { getStaff } from "@/lib/staff";
import Nav from "../Nav";
import Pending from "../Pending";
import { updateProfile } from "../actions";

export const dynamic = "force-dynamic";

export default async function MyProfile({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const { user, profile } = await getStaff();
  if (!profile.role) return <Pending email={user.email ?? ""} />;
  const { saved } = await searchParams;
  return (
    <div className="ws">
      <Nav profile={profile} active="profile" />
      <section className="ws-main">
        <h1 style={{ fontSize: "1.5rem" }}>Profilim · My profile</h1>
        {saved && <div className="alert ok" role="status">Saqlandi · Saved</div>}
        <form action={updateProfile} className="stack card" style={{ maxWidth: 720 }}>
          <label className="field"><span>To‘liq ism · Full name</span><input type="text" name="full_name" defaultValue={profile.full_name ?? ""} /></label>
          <div className="grid-2">
            <label className="field"><span>Lavozim (uz) · Title</span><input type="text" name="title_uz" defaultValue={profile.title_uz ?? ""} placeholder="Masalan: Fiqh o‘qituvchisi" /></label>
            <label className="field"><span>Title (en)</span><input type="text" name="title_en" defaultValue={profile.title_en ?? ""} placeholder="e.g. Teacher of fiqh" /></label>
          </div>
          <label className="field"><span>Qisqacha (uz) · Bio</span><textarea name="bio_uz" defaultValue={profile.bio_uz ?? ""} style={{ minHeight: 90 }} /></label>
          <label className="field"><span>Bio (en)</span><textarea name="bio_en" defaultValue={profile.bio_en ?? ""} style={{ minHeight: 90 }} /></label>
          <label className="field"><span>Ma’lumoti va ijozalari · Education and ijazahs</span><textarea name="credentials" defaultValue={profile.credentials ?? ""} style={{ minHeight: 90 }} /></label>
          <div><button className="btn" type="submit">Saqlash · Save</button></div>
        </form>
      </section>
    </div>
  );
}
