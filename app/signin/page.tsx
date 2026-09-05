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
              <div className="auth-mark" aria-hidden="true">✓</div>
              <h1>Check your email.</h1>
              <p>We sent a sign-in link to <strong>{email}</strong>. It expires in 15 minutes and can only be used once.</p>
              <button className="text-link auth-secondary" type="button" onClick={() => setSent(false)}>Use a different email</button>
            </>
          ) : (
            <>
              <h1>Sign in to TripSignal.</h1>
              <p>Enter your email and we’ll send you a secure sign-in link. No password to remember.</p>
              <form onSubmit={submit} className="auth-form">
                <label>
                  <span>Email address</span>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
                </label>
                {error && <p className="auth-error">{error}</p>}
                <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Email me a sign-in link'} <span>↗</span></button>
              </form>
              <p className="auth-note">By continuing, you agree to TripSignal’s terms and privacy policy.</p>
            </>
          )}
        </div>
      </section>

      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>

      <style jsx global>{`
        .auth-page{min-height:100vh;display:flex;flex-direction:column}.auth-page>.nav{flex:none}.auth-card{flex:1;display:grid;place-items:center;padding:55px 0 90px}.auth-panel{width:min(100%,470px);background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:46px;box-shadow:var(--shadow)}.auth-panel h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(36px,5vw,52px);line-height:1;letter-spacing:-.06em;margin:0 0 18px}.auth-panel>p{color:var(--muted);font-size:14px;line-height:1.7;margin:0}.auth-panel>p strong{color:var(--ink);font-weight:600}.auth-form{display:flex;flex-direction:column;gap:19px;margin-top:30px}.auth-form label{display:flex;flex-direction:column;gap:9px}.auth-form label>span{font-size:12px;font-weight:600}.auth-form input{width:100%;border:1px solid var(--line-strong);background:var(--bg);border-radius:11px;padding:15px;color:var(--ink);outline:none}.auth-form input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.auth-submit{width:100%;padding:14px 18px}.auth-error{color:#a24f4f!important;font-size:12px!important;margin:0!important}.auth-note{font-size:11px!important;color:var(--quiet)!important;margin-top:22px!important;line-height:1.6!important}.auth-secondary{display:inline-block;margin-top:25px;background:none;border:0;padding:0;font-size:12px}.auth-mark{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:var(--accent-soft);color:var(--accent);font-weight:700;margin-bottom:22px}@media(max-width:560px){.auth-card{padding:35px 0 65px}.auth-panel{padding:31px 24px;border-radius:20px}.auth-panel h1{font-size:39px}}
      `}</style>
    </main>
  );
}
