import type { AffiliateContext, AffiliateVertical } from '@/lib/affiliates';

const extras: Array<{ vertical: AffiliateVertical; title: string; description: string; icon: string }> = [
  { vertical: 'hotels', title: 'Hotels', description: 'Compare places to stay at your destination.', icon: 'hotel' },
  { vertical: 'cars', title: 'Rental cars', description: 'Compare rental cars for your trip.', icon: 'car' },
  { vertical: 'trains_buses', title: 'Trains & buses', description: 'Book ground transportation at your destination.', icon: 'train' },
  { vertical: 'transfers', title: 'Airport transfers', description: 'Arrange a ride between the airport and your stay.', icon: 'transfer' },
  { vertical: 'activities', title: 'Things to do', description: 'Find tours and activities at your destination.', icon: 'activity' },
  { vertical: 'insurance', title: 'Travel insurance', description: 'Review travel insurance options for your trip.', icon: 'insurance' },
  { vertical: 'sim', title: 'SIM cards', description: 'Get mobile data for your trip.', icon: 'sim' },
];

export default function TripExtras({ context }: { context: AffiliateContext }) {
  const visible = Boolean(context.destination);

  return (
    <section className={`trip-extras${visible ? ' trip-extras-visible' : ''}`} aria-label="Complete your trip">
      <div className="trip-extras-heading">
        <div>
          <span className="trip-extras-eyebrow">Complete your trip</span>
          <h2>Everything after the flight.</h2>
        </div>
        <p>Useful travel services for the destination you just selected.</p>
      </div>

      <div className="trip-extras-grid">
        {extras.map((extra) => (
          <a key={extra.vertical} className="trip-extra-card" data-affiliate-vertical={extra.vertical} href={buildHref(extra.vertical, context)}>
            <div className="trip-extra-icon" aria-hidden="true"><OutlineIcon type={extra.icon} /></div>
            <div className="trip-extra-copy">
              <strong>{extra.title}</strong>
              <span>{extra.description}</span>
              <b>View options</b>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

function OutlineIcon({ type }: { type: string }) {
  const props = { viewBox: '0 0 48 48', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };
  const stroke = 'currentColor';
  const common = { stroke, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  if (type === 'hotel') return <svg {...props} {...common}><path d="M7 40V13H41V40M4 40H44M12 40V24H36V40M12 29H36M18 24V18H30V24"/><path d="M17 33H19M29 33H31" strokeWidth="2.1"/></svg>;

  if (type === 'car') return <svg {...props} {...common}><path d="M7 32L10.5 20.5C11 18.9 12.2 18 13.8 18H34.2C35.8 18 37 18.9 37.5 20.5L41 32V38H7V32Z"/><path d="M11 20L14.5 12H33.5L37 20M14 28H34"/><circle cx="13" cy="38" r="3.5"/><circle cx="35" cy="38" r="3.5"/></svg>;

  if (type === 'train') return <svg {...props} {...common}><path d="M12 9H36C38.2 9 40 10.8 40 13V30C40 33.3 37.3 36 34 36H14C10.7 36 8 33.3 8 30V13C8 10.8 9.8 9 12 9Z"/><path d="M8 25H40M16 18H32"/><circle cx="16" cy="23" r="2"/><circle cx="32" cy="23" r="2"/><path d="M14 36L10 41M34 36L38 41"/></svg>;

  if (type === 'transfer') return <svg {...props} {...common}><path d="M8 34V23C8 20.8 9.8 19 12 19H36C38.2 19 40 20.8 40 23V34H8Z"/><path d="M12 19L15 12H33L36 19M13 28H35"/><circle cx="14" cy="34" r="3"/><circle cx="34" cy="34" r="3"/><path d="M5 12H18M5 12L9 8M5 12L9 16M43 12H30M43 12L39 8M43 12L39 16"/></svg>;

  if (type === 'activity') return <svg {...props} {...common}><path d="M7 39L18 22L25 29L36 12L41 19"/><path d="M7 39H41"/><path d="M12 39V31M36 39V27"/><circle cx="36" cy="10" r="3.5"/></svg>;

  if (type === 'insurance') return <svg {...props} {...common}><path d="M24 5L39 11V22C39 31 33 37 24 42C15 37 9 31 9 22V11L24 5Z"/><path d="M16 23L21 28L32 17" strokeWidth="2.2"/></svg>;

  return <svg {...props} {...common}><path d="M15 5H33C35.2 5 37 6.8 37 9V39C37 41.2 35.2 43 33 43H15C12.8 43 11 41.2 11 39V9C11 6.8 12.8 5 15 5Z"/><path d="M16 12H32V27H16V12ZM19 17H29M19 21H29M19 25H25"/><path d="M24 36V36.1" strokeWidth="3"/></svg>;
}

function buildHref(vertical: AffiliateVertical, context: AffiliateContext) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(context)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/api/affiliate/${vertical}${query ? `?${query}` : ''}`;
}
