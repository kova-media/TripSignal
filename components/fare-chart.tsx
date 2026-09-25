'use client';

import { useEffect, useState } from 'react';

type Point = { observed_at: string; price: number };

const W = 320;
const H = 120;
const PAD = 8;

function toPath(points: Point[]): string {
  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const step = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;
  return points
    .map((p, i) => {
      const x = PAD + i * step;
      const y = PAD + (1 - (p.price - min) / span) * (H - PAD * 2 - 14);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

export default function FareChart({ alertId }: { alertId: string }) {
  const [points, setPoints] = useState<Point[] | null>(null);

  useEffect(() => {
    fetch(`/api/watches/${alertId}/history`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPoints(Array.isArray(data?.points) ? data.points : []))
      .catch(() => setPoints([]));
  }, [alertId]);

  if (points === null) {
    return <div className="fare-chart fare-chart-loading" aria-hidden="true" />;
  }
  if (points.length < 2) {
    return <p className="fare-chart-empty">Fare history will appear here after a few checks.</p>;
  }

  const prices = points.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const latest = prices[prices.length - 1];
  const line = toPath(points);
  const area = `${line} L${(W - PAD).toFixed(1)},${H - 6} L${PAD.toFixed(1)},${H - 6} Z`;

  return (
    <div className="fare-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Fare history, latest $${Math.round(latest).toLocaleString()}`}>
        <path d={area} className="fare-chart-area" />
        <path d={line} className="fare-chart-line" fill="none" />
      </svg>
      <div className="fare-chart-meta">
        <span>Low ${Math.round(min).toLocaleString()}</span>
        <span>High ${Math.round(max).toLocaleString()}</span>
        <strong>Now ${Math.round(latest).toLocaleString()}</strong>
      </div>
    </div>
  );
}
