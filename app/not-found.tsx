import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap narrow stack" style={{ paddingBlock: 64 }}>
      <h1>Sahifa topilmadi · Page not found</h1>
      <p className="muted">Bu manzilda sahifa yo‘q. · There is no page at this address.</p>
      <div className="row"><Link className="btn" href="/uz">Bosh sahifa</Link><Link className="btn ghost" href="/en">Home</Link></div>
    </main>
  );
}
