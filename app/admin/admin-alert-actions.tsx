'use client';

import { useState } from 'react';

export default function AdminAlertActions({ id, active }: { id: string; active: boolean }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function run(action: 'toggle' | 'retry') {
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch(`/api/admin/alerts/${id}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Action failed.');
      setMessage(action === 'retry' ? 'Retry started.' : active ? 'Paused.' : 'Resumed.');
      setTimeout(() => window.location.reload(), 700);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Action failed.');
      setBusy(false);
    }
  }

  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
    <button type="button" onClick={() => run('retry')} disabled={busy} style={{ border: 0, background: 'none', padding: 0, color: 'var(--accent)', font: 'inherit', fontSize: 11, fontWeight: 700, cursor: busy ? 'default' : 'pointer' }}>{busy ? 'Working…' : 'Retry'}</button>
    <button type="button" onClick={() => run('toggle')} disabled={busy} style={{ border: 0, background: 'none', padding: 0, color: 'var(--muted)', font: 'inherit', fontSize: 11, fontWeight: 600, cursor: busy ? 'default' : 'pointer' }}>{active ? 'Pause' : 'Resume'}</button>
    {message && <small style={{ width: '100%', textAlign: 'right', color: 'var(--muted)' }}>{message}</small>}
  </div>;
}
