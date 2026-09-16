import { getCurrentUser } from '@/lib/auth';
import SiteHeader from '@/components/site-header';
import TripDiscoveryDirect from '@/components/trip-discovery-direct';

export const metadata = {
  title: 'Create a Flight Price Alert',
  description: 'Create a TripSignal flight price watch by choosing your route, travel window, cabin, stops and target fare.',
};

export default async function AlertsPage() {
  const currentUser = await getCurrentUser();

  return (
    <main className="alerts-page">
      <SiteHeader backHref="/" backLabel="Home" authenticated={Boolean(currentUser)} primaryHref={currentUser ? '/profile' : undefined} primaryLabel={currentUser ? 'Profile' : undefined} />
      <section className="shell" style={{ paddingBlock: '48px 96px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <p className="eyebrow">TripSignal</p>
            <h1 style={{ margin: 0 }}>Create a flight price alert.</h1>
            <p style={{ maxWidth: 680, color: 'var(--muted)', lineHeight: 1.6 }}>Set your route, travel window, cabin and target fare. TripSignal will keep watching the search and alert you when a qualifying fare appears.</p>
          </div>
          <TripDiscoveryDirect accountEmail={currentUser?.email ?? null} />
        </div>
      </section>
    </main>
  );
}
