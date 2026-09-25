'use client';

import { useEffect, useState } from 'react';
import LoungeGuide from '@/components/lounge-guide';

type Watch = {
  id: string;
  criteria: any;
  frequency: string;
  last_checked_at: string | null;
  latest_fare: number | null;
};

type DashboardState = 'loading' | 'signed-out' | 'empty' | 'ready';

function countryName(code: unknown) {
  const value = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(value)) return String(code ?? 'Not set');
  return new Intl.DisplayNames(['en'], { type: 'region' }).of(value) ?? value;
}

function formatChecked(value: string | null) {
  if (!value) return 'Not checked yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not checked yet';
  const diff = Date.now() - date.getTime();
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.round(diff / 60000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.round(diff / 3600000)}h ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function destinationLabel(criteria: any) {
  const mode = criteria.destinationMode;
  if (mode === 'country') return countryName(criteria.destination);
  if (mode === 'region') return criteria.destination || criteria.region || 'Not set';
  return criteria.destination || 'Not set';
}

export default function HomeDashboard() {
  const [state, setState] = useState<DashboardState>('loading');
  const [watches, setWatches] = useState<Watch[]>([]);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then(async (me) => {
        if (!me || !me.authenticated) {
          setState('signed-out');
          return;
        }
        const data = await fetch('/api/watches', { cache: 'no-store' })
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null);
        const list: Watch[] = Array.isArray(data?.watches) ? data.watches : [];
        setWatches(list);
        setState(list.length ? 'ready' : 'empty');
      })
      .catch(() => setState('signed-out'));
  }, []);

  const headingCopy =
    state === 'ready' || state === 'empty'
      ? 'Each watch has its own rules. TripSignal checks them on schedule and keeps the result simple.'
      : 'Sign in to see the flight fare watches you have running.';

  return (
    <>
      <div className="preview-heading">
        <p className="section-kicker">Your flight price watches</p>
        <h2>Set it once.<br /><em>Let it run.</em></h2>
        <p>{headingCopy}</p>
      </div>
      {state === 'ready' ? (
        <div className="watch-dashboard">
          <div className="dashboard-head">
            <div><span>Active watches</span><strong>{watches.length}</strong></div>
            <span className="dashboard-status"><i /> Monitoring</span>
          </div>
          {watches.map((watch) => {
            const c = watch.criteria || {};
            const origin = c.origin || 'Not set';
            const cabin = c.cabin ? String(c.cabin).replace(/_/g, ' ') : 'Any cabin';
            const stops = c.maxStops != null ? `${c.maxStops} stop${c.maxStops === 1 ? '' : 's'} max` : '';
            const target = Number(c.maxPrice);
            return (
              <article className="watch-row" key={watch.id}>
                <div className="watch-route">
                  <strong>{origin}</strong><span>→</span><strong>{destinationLabel(c)}</strong>
                  <small>{cabin}{stops ? ` · ${stops}` : ''}</small>
                </div>
                <div className="watch-fare">
                  <span>Latest fare</span>
                  <strong>{watch.latest_fare != null ? `$${Math.round(watch.latest_fare).toLocaleString()}` : '—'}</strong>
                  <small>{watch.latest_fare != null ? `Target $${Number.isFinite(target) ? Math.round(target).toLocaleString() : '—'}` : 'No fare found yet'}</small>
                </div>
                <div className="watch-fare">
                  <span>Last checked</span>
                  <strong>{formatChecked(watch.last_checked_at)}</strong>
                  <small>{watch.frequency} · Active watch</small>
                </div>
                <a className="watch-pill" href="/profile">Manage</a>
                <LoungeGuide alertId={watch.id} />
              </article>
            );
          })}
        </div>
      ) : state === 'empty' ? (
        <div className="empty-watches">
          <p>No active watches yet.</p>
          <a className="button button-primary" href="#explore">Start watching</a>
        </div>
      ) : (
        <div className="empty-watches">
          <p>Sign in to see your watches.</p>
          <a className="button button-primary" href="/signin">Sign in</a>
        </div>
      )}
    </>
  );
}
