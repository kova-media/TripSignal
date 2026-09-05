'use client';

import { FormEvent, useState } from 'react';
import Brand from '@/components/brand';
import ThemeToggle from '@/components/theme-toggle';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not send the sign-in link.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the sign-in link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="nav shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand /></a>
        <ThemeToggle />
      </header>

      <section className="auth-card shell">
        <div className="auth-panel">
          {sent ? (
            <>
              <h1>Check your email.</h1>
              <p>We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes and can only be used once.</p>
              <button className="text-link auth-secondary" type="button" onClick={() => setSent(false)}>Use a different email</button>
            </>
          ) : (
            <>
              <h1>Sign in to TripSignal.</h1>
              <p>Enter your email and we’ll send you a secure sign-in link.</p>
              <form onSubmit={submit} className="auth-form">
                <label>
                  <span>Email address</span>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
                </label>
                {error && <p className="auth-error">{error}</p>}
                <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Email me a sign-in link'} <span>↗</span></button>
              </form>
            </>
          )}
        </div>
      </section>

      <footer className="footer shell"><span>TripSignal</span><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
