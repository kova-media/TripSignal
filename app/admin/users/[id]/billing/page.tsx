import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import SiteHeader from '@/components/site-header';
import { getDb, ensureSchema } from '@/lib/db';
import { requireAdmin, isAdminError } from '@/lib/admin';
import styles from '../../../admin.module.css';

export const dynamic = 'force-dynamic';

function formatDate(value: string | Date | null) {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
}

function stripeDashboardUrl(type: 'customers' | 'subscriptions', id: string) {
  return `https://dashboard.stripe.com/${type}/${encodeURIComponent(id)}`;
}

export default async function AdminUserBillingPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    await ensureSchema();
    await requireAdmin();
    const { id } = await params;
    const db = getDb();

    const result = await db.query<{
      id: string;
      email: string;
      name: string | null;
      plan: string;
      subscription_status: string;
      stripe_customer_id: string | null;
      stripe_subscription_id: string | null;
      subscription_current_period_end: string | null;
      created_at: string;
    }>(
      `select id, email, name, plan, subscription_status, stripe_customer_id, stripe_subscription_id, subscription_current_period_end, created_at
       from users where id = $1 limit 1`,
      [id],
    );

    const user = result.rows[0];
    if (!user) notFound();

    const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
    const stateMatches = user.subscription_status === 'lifetime'
      ? user.plan === 'pro' && !user.stripe_subscription_id && !user.subscription_current_period_end
      : (user.plan === 'pro' && ['active', 'trialing'].includes(user.subscription_status)) || (user.plan === 'free' && !['active', 'trialing'].includes(user.subscription_status));
    const periodEnded = user.subscription_current_period_end ? new Date(user.subscription_current_period_end).getTime() < Date.now() : false;

    return <main className={styles.page}>
      <SiteHeader authenticated primaryHref="/profile" primaryLabel="Profile" />
      <section className="shell"><div className={styles.main}>
        <div className={styles.detailBack}><Link href={`/admin/users/${user.id}`}>← Back to User</Link></div>
        <div className={styles.masthead}>
          <div><p className={styles.eyebrow}>Billing management</p><h1 className={styles.title}>{user.name || user.email.split('@')[0]}</h1><p className={styles.subhead}>{user.email}</p></div>
          <span className={styles.adminBadge}>{user.plan === 'free' ? 'FREE' : 'PRO'}</span>
        </div>

        <section className={styles.grid}>
          <div className={styles.metric}><span>TripSignal plan</span><strong>{user.plan === 'free' ? 'Free' : 'Pro'}</strong><small>{user.subscription_status}</small></div>
          <div className={styles.metric}><span>Billing state</span><strong>{stateMatches ? 'In sync' : 'Mismatch'}</strong><small>{stripeConfigured ? 'Stripe configured' : 'Stripe key missing'}</small></div>
          <div className={styles.metric}><span>Customer</span><strong>{user.stripe_customer_id ? 'Linked' : 'Missing'}</strong><small>Stripe customer</small></div>
          <div className={styles.metric}><span>Subscription</span><strong>{user.stripe_subscription_id ? 'Linked' : 'Missing'}</strong><small>{user.subscription_status === 'lifetime' ? 'Lifetime access' : periodEnded ? 'Period ended' : 'Period current'}</small></div>
          <div className={styles.metric}><span>Period ends</span><strong>{user.subscription_current_period_end ? new Date(user.subscription_current_period_end).toLocaleDateString() : 'None'}</strong><small>{formatDate(user.subscription_current_period_end)}</small></div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Stripe</p><h2>Subscription state</h2></div></div>
          <div className={styles.detailCard}>
            <div><span>Customer ID</span><strong>{user.stripe_customer_id || 'Not linked'}</strong></div>
            <div><span>Subscription ID</span><strong>{user.stripe_subscription_id || 'Not linked'}</strong></div>
            <div><span>Status</span><strong>{user.subscription_status}</strong></div>
            <div><span>Current period</span><strong>{formatDate(user.subscription_current_period_end)}</strong></div>
          </div>
          <div className={styles.adminActions}>
            {user.stripe_customer_id && <a className="button button-secondary" href={stripeDashboardUrl('customers', user.stripe_customer_id)} target="_blank" rel="noreferrer">Open customer in Stripe</a>}
            {user.stripe_subscription_id && <a className="button button-secondary" href={stripeDashboardUrl('subscriptions', user.stripe_subscription_id)} target="_blank" rel="noreferrer">Open subscription in Stripe</a>}
          </div>
        </section>

        {!stateMatches && <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Attention</p><h2>Account state mismatch</h2></div></div>
          <div className={styles.errorCard}><strong>TripSignal currently shows {user.plan === 'free' ? 'Free' : 'Pro'} with Stripe status “{user.subscription_status}”.</strong><small>Do not change the account state from this page. Verify the Stripe customer and subscription first.</small></div>
        </section>}

        <section className={styles.section}>
          <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Account</p><h2>Billing record</h2></div></div>
          <div className={styles.detailCard}>
            <div><span>Email</span><strong>{user.email}</strong></div>
            <div><span>Plan</span><strong>{user.plan}</strong></div>
            <div><span>Subscription status</span><strong>{user.subscription_status}</strong></div>
            <div><span>Account created</span><strong>{formatDate(user.created_at)}</strong></div>
          </div>
        </section>

        <p className={styles.detailFootnote}>Billing changes are intentionally read-only here. Stripe remains the source for payment and subscription actions; TripSignal account state should be reconciled through verified billing events.</p>
      </div></section>
    </main>;
  } catch (error) {
    if (isAdminError(error)) redirect('/signin');
    throw error;
  }
}
