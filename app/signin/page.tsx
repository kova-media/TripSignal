'use client';

import { FormEvent, useState } from 'react';
import Brand from '@/components/brand';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'password' | 'link'>('password');
  const [linkSent, setLinkSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'link') {
        const response = await fetch('/api/auth/signin/magic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not send the sign-in link.');
        setLinkSent(true);
        return;
      }
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Invalid email or password.');
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.href = next && next.startsWith('/') ? next : '/account';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="nav shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand /></a>
      </header>

      <section className="auth-card shell">
        <div className="auth-panel">
          <h1>Sign in to TripSignal.</h1>
          <p>Sign in with your password or a one-time email link to access your fare watches.</p>
          <form onSubmit={submit} className="auth-form">
            <label>
              <span>Email address</span>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" autoComplete="email" required />
            </label>
            {mode === 'password' ? (
              <>
                <label>
                  <span>Password</span>
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" autoComplete="current-password" required />
                </label>
                <p className="auth-forgot"><a href="/reset">Forgot password?</a></p>
              </>
            ) : (
              <p className="auth-note">We’ll email you a one-time sign-in link. It expires in 15 minutes.</p>
            )}
            {error && <p className="auth-error">{error}</p>}
            {linkSent && mode === 'link' && !error && <p className="auth-note">Check your inbox — your sign-in link is on its way.</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={loading}>{loading ? 'Sending…' : mode === 'link' ? 'Email me a sign-in link' : 'Sign in'}</button>
          </form>
          <p className="auth-switch">{mode === 'password' ? <a href="#" onClick={(event) => { event.preventDefault(); setMode('link'); setError(''); }}>Email me a sign-in link instead</a> : <a href="#" onClick={(event) => { event.preventDefault(); setMode('password'); setError(''); setLinkSent(false); }}>Use my password instead</a>}</p>
          <p className="auth-switch">Don’t have an account? <a href="/signup">Sign up</a></p>
          <p className="auth-note">By continuing, you agree to TripSignal’s terms and privacy policy.</p>
        </div>
      </section>

      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>© 2026 TripSignal</span></footer>

      <style jsx global>{`
        .auth-page{min-height:100vh;display:flex;flex-direction:column}.auth-page>.nav{flex:none}.auth-card{flex:1;display:grid;place-items:center;padding:55px 0 90px}.auth-panel{width:min(100%,470px);background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:46px;box-shadow:var(--shadow)}.auth-panel h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(36px,5vw,52px);line-height:1;letter-spacing:-.06em;margin:0 0 18px}.auth-panel>p{color:var(--muted);font-size:14px;line-height:1.7;margin:0}.auth-form{display:flex;flex-direction:column;gap:19px;margin-top:30px}.auth-form label{display:flex;flex-direction:column;gap:9px}.auth-form label>span{font-size:12px;font-weight:600}.auth-form input{width:100%;border:1px solid var(--line-strong);background:var(--bg);border-radius:11px;padding:15px;color:var(--ink);outline:none}.auth-form input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}.auth-submit{width:100%;padding:14px 18px}.auth-error{color:#a24f4f!important;font-size:12px!important;margin:0!important}.auth-switch{font-size:13px!important;margin-top:23px!important;color:var(--muted)!important}.auth-switch a{color:var(--ink);font-weight:600;text-decoration:underline;text-underline-offset:3px}.auth-forgot{font-size:12px!important;margin:-8px 0 0!important;text-align:right}.auth-forgot a{color:var(--muted);text-decoration:underline;text-underline-offset:3px}.auth-forgot a:hover{color:var(--ink)}.auth-note{font-size:11px!important;color:var(--quiet)!important;margin-top:22px!important;line-height:1.6!important}@media(max-width:560px){.auth-card{padding:35px 0 65px}.auth-panel{padding:31px 24px;border-radius:20px}.auth-panel h1{font-size:39px}}
      `}</style>
    </main>
  );
}
