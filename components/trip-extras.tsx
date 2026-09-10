import type { AffiliateContext, AffiliateVertical } from '@/lib/affiliates';

const extras: Array<{ vertical: AffiliateVertical; title: string; description: string; icon: string }> = [
  { vertical: 'hotels', title: 'Hotels', description: 'Compare places to stay at your destination.', icon: 'hotel' },
  { vertical: 'cars', title: 'Rental cars', description: 'Compare rental cars for your trip.', icon: 'car' },
  { vertical: 'activities', title: 'Things to do', description: 'Find tours and activities at your destination.', icon: 'activity' },
  { vertical: 'transfers', title: 'Airport transfers', description: 'Arrange a ride between the airport and your stay.', icon: 'transfer' },
  { vertical: 'insurance', title: 'Travel insurance', description: 'Review travel insurance options for your trip.', icon: 'insurance' },
  { vertical: 'sim', title: 'SIM cards', description: 'Get mobile data for your trip.', icon: 'sim' },
  { vertical: 'trains_buses', title: 'Trains & buses', description: 'Book ground transportation at your destination.', icon: 'transport' },
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

  if (type === 'hotel') return <svg {...props}><path d="M7 40V18L24 8L41 18V40M4 40H44M12 40V25H21V40M27 40V25H36V40M17 18H31M24 8V15" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M16 30H19M29 30H32" stroke={stroke} strokeWidth="2.4" strokeLinecap="round"/></svg>;
  if (type === 'car') return <svg {...props}><path d="M6 30L10 18H38L42 30V37H6V30Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round"/><path d="M10 18L14 11H34L38 18M14 24H34" stroke={stroke} strokeWidth="1.8" strokeLinecap="round"/><circle cx="13" cy="37" r="4" stroke={stroke} strokeWidth="1.8"/><circle cx="35" cy="37" r="4" stroke={stroke} strokeWidth="1.8"/></svg>;
  if (type === 'activity') return <svg {...props}><path d="M5 39L16 23L24 30L35 12L43 20" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 39H43" stroke={stroke} strokeWidth="1.8" strokeLinecap="round"/><path d="M9 39V29M39 39V27" stroke={stroke} strokeWidth="1.5"/><circle cx="36" cy="10" r="4" stroke={stroke} strokeWidth="1.6"/></svg>;
  if (type === 'transfer') return <svg {...props}><path d="M7 38V17H41V38M4 38H44M12 17L16 10H32L36 17" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M13 27H35M17 38V31M31 38V31" stroke={stroke} strokeWidth="1.6" strokeLinecap="round"/><path d="M10 10H38" stroke={stroke} strokeWidth="2" strokeLinecap="round"/></svg>;
  if (type === 'insurance') return <svg {...props}><path d="M24 5L39 11V22C39 31 33 37 24 42C15 37 9 31 9 22V11L24 5Z" stroke={stroke} strokeWidth="1.8" strokeLinejoin="round"/><path d="M16 23L21 28L32 17" stroke={stroke} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
  if (type === 'sim') return <svg {...props}><rect x="14" y="5" width="20" height="38" rx="4" stroke={stroke} strokeWidth="1.8"/><rect x="18" y="12" width="12" height="16" rx="1.5" stroke={stroke} strokeWidth="1.5"/><path d="M20 17H28M20 21H28M20 25H25" stroke={stroke} strokeWidth="1.5" strokeLinecap="round"/><circle cx="24" cy="36" r="1.5" fill={stroke}/></svg>;
  return <svg {...props}><path d="M6 34H42M10 34V17H24V34M28 34V17H42V34M13 21H21M31 21H39" stroke={stroke} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M24 17V10M21 13L24 10L27 13" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 39H41" stroke={stroke} strokeWidth="1.8" strokeLinecap="round"/></svg>;
}

function buildHref(vertical: AffiliateVertical, context: AffiliateContext) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(context)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/api/affiliate/${vertical}${query ? `?${query}` : ''}`;
}
