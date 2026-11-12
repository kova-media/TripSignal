'use client';

import { useState } from 'react';

export default function TestAlertButton() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setSending(true);
    setError('');
    setSent(false);
    try {
      const response = await fetch('/api/profile/test-alert', { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not send the test alert.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the test alert.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <button type="button" className="button button-primary" onClick={send} disabled={sending}>
        {sending ? 'Sending…' : sent ? 'Test sent — send another' : 'Send a test alert'}
      </button>
      {sent ? <p style={{ margin: '12px 0 0', color: 'var(--muted)', fontSize: 12 }}>Check your inbox for a test signal email.</p> : null}
      {error ? <p style={{ margin: '12px 0 0', color: '#b05b5b', fontSize: 12 }}>{error}</p> : null}
    </div>
  );
}
