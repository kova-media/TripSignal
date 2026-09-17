'use client';

import { useEffect, useMemo, useState } from 'react';

type Point = { observedAt: string; price: number };
type HistoryResponse = { points: Point[]; target: number; currency: string };

function money(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function dateLabel(value: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value));
}

export default function FareHistory({ alertId }: { alertId: string }) {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/alerts/${alertId}/history?days=90`, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error('History unavailable');
        return response.json() as Promise<HistoryResponse>;
      })
      .then((next) => { if (!cancelled) setData(next); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [alertId]);

  const points = data?.points ?? [];
  const chart = useMemo(() => {
    if (points.length < 2) return null;
    const width = 760;
    const height = 220;
    const padX = 8;
    const padY = 18;
    const prices = points.map((point) => point.price);
    const min = Math.min(...prices, data?.target ?? Infinity);
    const max = Math.max(...prices, data?.target ?? -Infinity);
    const range = Math.max(max - min, 100);
    const yMin = Math.max(0, min - range * 0.12);
    const yMax = max + range * 0.12;
    const x = (index: number) => padX + (index / Math.max(points.length - 1, 1)) * (width - padX * 2);
    const y = (price: number) => height - padY - ((price - yMin) / Math.max(yMax - yMin, 1)) * (height - padY * 2);
    const line = points.map((point, index) => `${x(index).toFixed(1)},${y(point.price).toFixed(1)}`).join(' ');
    const area = `${padX},${height - padY} ${line} ${width - padX},${height - padY}`;
    const targetY = data?.target ? y(data.target) : null;
    return { width, height, line, area, targetY, low: Math.min(...prices), high: Math.max(...prices), latest: points[points.length - 1].price };
  }, [points, data?.target]);

  return (
    <div className="fare-history">
      <div className="fare-history-head">
        <div><span>Fare history · 90 days</span><strong>{chart ? money(chart.latest) : '—'}</strong></div>
        {chart && <div className="fare-history-range"><span>Low {money(chart.low)}</span><span>High {money(chart.high)}</span></div>}
      </div>
      {loading ? <div className="fare-history-empty">Loading fare history…</div> : error ? <div className="fare-history-empty">Fare history is temporarily unavailable.</div> : points.length < 2 ? <div className="fare-history-empty"><strong>Building your fare history.</strong><span>TripSignal records the lowest fare each time your watch runs. The chart appears after the first few checks.</span></div> : (
        <div className="fare-history-chart">
          <svg viewBox={`0 0 ${chart?.width ?? 760} ${chart?.height ?? 220}`} preserveAspectRatio="none" role="img" aria-label="Fare history chart">
            {chart?.targetY != null && <line x1="0" x2={chart.width} y1={chart.targetY} y2={chart.targetY} className="fare-history-target" />}
            <polygon points={chart?.area} className="fare-history-area" />
            <polyline points={chart?.line} className="fare-history-line" />
          </svg>
          <div className="fare-history-axis"><span>{dateLabel(points[0].observedAt)}</span><span>{dateLabel(points[points.length - 1].observedAt)}</span></div>
          {data?.target ? <div className="fare-history-target-label">Target {money(data.target)}</div> : null}
        </div>
      )}
    </div>
  );
}
