'use client';

import { useState } from 'react';

type Action = 'grant_pro' | 'demote_to_free';

export default function AdminUserActions({ userId, plan, subscriptionStatus, alertCount }: { userId: string; plan: string; subscriptionStatus: string; alertCount: number }) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState('');

  const isPro = plan !== 'free';
  const canGrant = !isPro;
  const canDemote = isPro && !['active', 'trialing'].includes(subscriptionStatus);

  async function run(action: Action) {
    if (busy) return;

    const confirmation = action === 'grant_pro'
      ? 'Grant this account Pro access for free? This does not create a Stripe subscription.'
      : alertCount > 1
        ? 'Demote this account to Free and pause all but its oldest alert?'
        : 'Demote this account to Free?';

    if (!window.confirm(confirmation)) return;

    setBusy(action);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action failed.');

      if (action === 'grant_pro') {
        setMessage(data.emailSent === false ? 'Pro granted, but the email could not be sent.' : 'Pro granted for free. Lifetime access email sent.');
      } else {
        setMessage(`Demoted to Free. ${data.pausedAlerts ?? 0} extra alert${data.pausedAlerts === 1 ? '' : 's'} paused.`);
      }
      setTimeout(() => window.location.reload(), 1800);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
      setBusy(null);
    }
  }

  if (!canGrant && !canDemote && !message) return null;

  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
    {canGrant && <button type="button" onClick={() => run('grant_pro')} disabled={Boolean(busy)} style={{ border: 0, background: 'none', padding: 0, color: 'var(--muted)', font: 'inherit', fontSize: 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>{busy === 'grant_pro' ? 'Granting…' : 'Grant Pro for Free'}</button>}
    {canDemote && <button type="button" onClick={() => run('demote_to_free')} disabled={Boolean(busy)} style={{ border: 0, background: 'none', padding: 0, color: 'var(--muted)', font: 'inherit', fontSize: 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>{busy === 'demote_to_free' ? 'Demoting…' : 'Demote to Free'}</button>}
    {message && <small style={{ width: '100%', textAlign: 'right', color: 'var(--muted)' }}>{message}</small>}
  </div>;
}
