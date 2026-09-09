'use client';

import { useState } from 'react';

export default function BillingButton({ active }: { active: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function startCheckout() {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || 'Could not start checkout.');
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setLoading(false);
    }
  }

  if (active) return <span className="billing-active">TripSignal Pro · Active</span>;

  return (
    <div>
      <button className="button button-primary" type="button" onClick={startCheckout} disabled={loading}>
        {loading ? 'Opening checkout…' : 'Upgrade to Pro · $19.99/year'}
      </button>
      {error ? <p className="billing-error">{error}</p> : null}
    </div>
  );
}
