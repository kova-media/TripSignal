import Brand from '@/components/brand';

export default function NotFound() {
  return (
    <main className="notfound-page">
      <header className="nav shell">
        <a className="brand-link" href="/" aria-label="TripSignal home"><Brand /></a>
      </header>

      <section className="notfound-card shell">
        <div className="notfound-panel">
          <p className="notfound-eyebrow">404</p>
          <h1>This page didn&rsquo;t take off.</h1>
          <p>The page you&rsquo;re looking for doesn&rsquo;t exist or was moved. Let&rsquo;s get you back to watching fares.</p>
          <div className="notfound-actions">
            <a className="button button-primary" href="/">Back to home</a>
            <a className="text-link" href="/alerts">Create a fare alert</a>
          </div>
        </div>
      </section>

      <footer className="footer shell"><a className="brand-link" href="/" aria-label="TripSignal home"><Brand compact /></a><span>Travel intelligence, on your terms.</span><span>&copy; 2026 TripSignal</span></footer>

      <style>{`
        .notfound-page{min-height:100vh;display:flex;flex-direction:column}
        .notfound-card{flex:1;display:grid;place-items:center;padding:60px 0 90px}
        .notfound-panel{width:min(100%,560px);text-align:center;background:var(--surface);border:1px solid var(--line);border-radius:24px;padding:56px 44px;box-shadow:var(--shadow)}
        .notfound-eyebrow{margin:0 0 10px;color:var(--accent);font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
        .notfound-panel h1{font-family:'Space Grotesk',sans-serif;font-size:clamp(34px,5vw,50px);line-height:1.02;letter-spacing:-.055em;margin:0 0 16px}
        .notfound-panel>p{color:var(--muted);font-size:15px;line-height:1.7;margin:0 0 30px}
        .notfound-actions{display:flex;gap:18px;align-items:center;justify-content:center;flex-wrap:wrap}
        @media(max-width:560px){.notfound-panel{padding:40px 26px}}
      `}</style>
    </main>
  );
}
