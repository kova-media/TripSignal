import type { ReactNode } from 'react';

export interface FareSignalData {
  origin: string;
  destination: string;
  destinationName?: string;
  price: number;
  target: number;
  dates: string;
  cabin: string;
  stops: string;
  airline: string;
  matched?: number;
}

export default function FareSignal({ signal, action }: { signal: FareSignalData; action?: ReactNode }) {
  const savings = Math.max(0, signal.target - signal.price);
  return (
    <div className="fare-signal" aria-label={`${signal.origin} to ${signal.destination} fare signal`}>
      <div className="fare-signal-top">
        <span><i /> Fare signal</span>
        <span>QUALIFIED</span>
      </div>
      <div className="fare-signal-route">
        <strong>{signal.origin}</strong><span>→</span><strong>{signal.destination}</strong>
        {signal.destinationName && <small>{signal.destinationName}</small>}
      </div>
      <div className="fare-signal-price">${signal.price.toLocaleString()}</div>
      <div className="fare-signal-date">{signal.dates}</div>
      <div className="fare-signal-meta"><span>{signal.cabin}</span><span>{signal.airline}</span><span>{signal.stops}</span></div>
      <div className="fare-signal-rule"><span>Your target</span><strong>${signal.target.toLocaleString()}</strong><b>${savings.toLocaleString()} below</b></div>
      <div className="fare-signal-bottom">
        <span>{signal.matched ? `${signal.matched} criteria matched` : 'Criteria matched'}</span>
        {action ?? <span>TripSignal</span>}
      </div>
    </div>
  );
}
