'use client';

import { useFormStatus } from 'react-dom';
import { runAlertsNow } from './actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      style={{ border: '1px solid var(--accent-line)', background: 'transparent', color: 'var(--accent)', padding: '9px 12px', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.6 : 1 }}
    >
      {pending ? 'Running…' : 'Run alerts now'}
    </button>
  );
}

export default function RunButton() {
  return (
    <form action={runAlertsNow}>
      <SubmitButton />
    </form>
  );
}
