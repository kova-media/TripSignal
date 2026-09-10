'use client';

import { useState } from 'react';

export default function AdminUserActions({ userId, plan, subscriptionStatus, alertCount }: { userId: string; plan: string; subscriptionStatus: string; alertCount: number }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const canDemote = plan !== 'free' && alertCount > 1 && !['active', 'trialing'].includes(subscriptionStatus);

  async function demote() {
    if (!canDemote || busy) return;
    if (!window.confirm('Demote this account to Free and pause all but its oldest alert?')) return;

    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'demote_to_free' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action failed.');
      setMessage(`Demoted to Free. ${data.pausedAlerts ?? 0} extra alert${data.pausedAlerts === 1 ? '' : 's'} paused.`);
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
      setBusy(false);
    }
  }

  if (!canDemote && !message) return null;

  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
    {canDemote && <button type="button" onClick={demote} disabled={busy} style={{ border: 0, background: 'none', padding: 0, color: 'var(--muted)', font: 'inherit', fontSize: 12, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>{busy ? 'Demoting…' : 'Demote to Free'}</button>}
    {message && <small style={{ width: '100%', textAlign: 'right', color: 'var(--muted)' }}>{message}</small>}
  </div>;
}
