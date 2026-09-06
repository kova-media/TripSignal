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
    </main>
  );
}
