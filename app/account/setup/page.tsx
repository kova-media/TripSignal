'use client';

import { FormEvent, useState } from 'react';
import Brand from '@/components/brand';
import ThemeToggle from '@/components/theme-toggle';

export default function AccountSetupPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not set your password.');
      window.location.href = '/account';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not set your password.');
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
          <p className="eyebrow">One last step</p>
          <h1>Set your TripSignal password.</h1>
          <p>Your email has been verified. Create a password so you can sign in to your account anytime.</p>
          <form onSubmit={submit} className="auth-form">
            <label><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" autoComplete="new-password" minLength={8} required /></label>
            <label><span>Confirm password</span><input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Enter your password again" autoComplete="new-password" minLength={8} required /></label>
            {error && <p className="auth-error">{error}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Saving password…' : 'Finish setup'} <span>↗</span></button>
          </form>
          <p className="auth-note">Your account is already verified. Your password is securely encrypted before it is stored.</p>
        </div>
      </section>

      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>
    </main>
  );
}
