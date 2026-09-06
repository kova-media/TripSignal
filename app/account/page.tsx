import { redirect } from 'next/navigation';
import SiteHeader from '@/components/site-header';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export const dynamic = 'force-dynamic';

function summarizeCriteria(criteria: Record<string, unknown>) {
  const origin = String(criteria.origin ?? 'MCI');
  const destination = String(criteria.destination ?? 'Anywhere');
  const cabin = criteria.cabin === 'premium_economy' ? 'Premium economy' : criteria.cabin === 'business' ? 'Business' : 'Economy';
  const price = Number(criteria.maxPrice ?? 0).toLocaleString();
  return `${origin} → ${destination} · ${cabin} · under $${price}`;
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/signin');

  await ensureSchema();
  const db = getDb();
  const result = await db.query<{ id: string; criteria: Record<string, unknown>; frequency: string; active: boolean; created_at: string }>(
    `select id, criteria, frequency, active, created_at
     from alerts
     where user_id = $1
     order by created_at desc`,
    [user.id],
  );

  return (
    <main className="account-page">
      <SiteHeader primaryHref="/alerts" primaryLabel="Create alert" />
      <section className="account-shell shell">
        <div className="account-intro">
          <p className="eyebrow">Your TripSignal account</p>
          <h1>You're signed in.</h1>
          <p className="account-email">{user.email}</p>
        </div>

        <section className="account-section">
          <div className="section-heading">
            <div><p className="eyebrow">Alerts</p><h2>Your fare watches</h2></div>
            <a className="button button-primary" href="/alerts">Create alert <span>↗</span></a>
          </div>

          {result.rows.length === 0 ? (
            <div className="empty-account">
              <h3>No alerts yet.</h3>
              <p>Create your first fare watch and TripSignal will monitor it for you.</p>
              <a className="text-link" href="/alerts">Create your first alert ↗</a>
            </div>
          ) : (
            <div className="account-alerts">
              {result.rows.map((alert) => (
                <article className="account-alert" key={alert.id}>
                  <div><strong>{summarizeCriteria(alert.criteria)}</strong><span>{alert.frequency} · {alert.active ? 'Active' : 'Paused'}</span></div>
                  <span className="account-status">{alert.active ? 'Watching' : 'Paused'}</span>
                </article>
              ))}
            </div>
          )}
        </section>
      </section>

      <style jsx global>{`
        .account-page{min-height:100vh;display:flex;flex-direction:column}.account-shell{width:100%;padding:76px 0 110px}.account-intro{padding:0 0 58px;border-bottom:1px solid var(--line)}.eyebrow{margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}.account-intro h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(48px,7vw,84px);line-height:.95;letter-spacing:-.065em;margin:0}.account-email{margin:18px 0 0;color:var(--muted);font-size:15px}.account-section{padding-top:48px}.section-heading{display:flex;justify-content:space-between;align-items:end;gap:24px;margin-bottom:24px}.section-heading h2{font-family:'Space Grotesk',sans-serif;font-size:32px;letter-spacing:-.04em;margin:0}.account-alerts{border-top:1px solid var(--line)}.account-alert{display:flex;justify-content:space-between;align-items:center;gap:24px;padding:23px 0;border-bottom:1px solid var(--line)}.account-alert strong{display:block;font-size:16px}.account-alert span{display:block;color:var(--muted);font-size:12px;margin-top:6px}.account-status{color:var(--accent)!important;font-weight:700!important;margin:0!important;white-space:nowrap}.empty-account{border:1px solid var(--line);padding:36px}.empty-account h3{font-family:'Space Grotesk',sans-serif;font-size:24px;margin:0 0 8px}.empty-account p{color:var(--muted);font-size:14px;margin:0 0 18px}.empty-account .text-link{font-size:13px}@media(max-width:700px){.account-shell{padding:50px 0 80px}.section-heading{align-items:start;flex-direction:column}.account-alert{align-items:start;flex-direction:column;gap:12px}}
      `}</style>
    </main>
  );
}
