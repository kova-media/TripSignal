'use client';

import { useState } from 'react';
import { runAlertsNow } from './actions';

export default function RunButton() {
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState('');

  async function handleClick() {
    setPending(true);
    setResult('');
    try {
      const outcome = await runAlertsNow();
      if (outcome.ok) {
        const s = outcome.summary;
        setResult(`Checked ${s.checked} · ${s.signals} signals · ${s.emails} emails · ${s.errors} errors${s.digests ? ` · ${s.digests} digests` : ''}`);
      } else {
        setResult(`Run failed: ${outcome.error}`);
      }
    } catch (error) {
      setResult(error instanceof Error ? error.message : 'Run failed.');
    }
    setPending(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        style={{ border: '1px solid var(--accent-line)', background: 'transparent', color: 'var(--accent)', padding: '9px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.6 : 1 }}
      >
        {pending ? 'Running…' : 'Run alerts now'}
      </button>
      {result && <span style={{ fontSize: 11, color: 'var(--muted)' }}>{result}</span>}
    </div>
  );
}
