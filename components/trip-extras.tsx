import type { AffiliateContext, AffiliateVertical } from '@/lib/affiliates';

const extras: Array<{ vertical: AffiliateVertical; title: string; description: string; icon: string; image: string }> = [
  { vertical: 'hotels', title: 'Hotels', description: 'Compare places to stay at your destination.', icon: 'hotel', image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=85' },
  { vertical: 'cars', title: 'Rental cars', description: 'Compare rental cars for your trip.', icon: 'car', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=1200&q=85' },
  { vertical: 'trains_buses', title: 'Trains & buses', description: 'Book ground transportation at your destination.', icon: 'train', image: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&w=1200&q=85' },
  { vertical: 'transfers', title: 'Airport transfers', description: 'Arrange a ride between the airport and your stay.', icon: 'transfer', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=85' },
  { vertical: 'activities', title: 'Things to do', description: 'Find tours and activities at your destination.', icon: 'activity', image: 'https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&w=1200&q=85' },
  { vertical: 'insurance', title: 'Travel insurance', description: 'Review travel insurance options for your trip.', icon: 'insurance', image: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=1200&q=85' },
  { vertical: 'sim', title: 'SIM cards', description: 'Get mobile data for your trip.', icon: 'sim', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=85' },
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
            <div className="trip-extra-media" style={{ backgroundImage: `url(${extra.image})` }}>
              <div className="trip-extra-icon" aria-hidden="true"><OutlineIcon type={extra.icon} /></div>
            </div>
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
  const common = { stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (type === 'hotel') return <svg {...props} {...common}><path d="M6 40H42M9 40V16L24 8L39 16V40"/><path d="M16 40V28H32V40M16 21H20M28 21H32M16 25H20M28 25H32"/></svg>;
  if (type === 'car') return <svg {...props} {...common}><path d="M7 30.5L10.5 20.5C11.1 18.8 12.5 17.7 14.3 17.7H33.7C35.5 17.7 36.9 18.8 37.5 20.5L41 30.5V37H7V30.5Z"/><path d="M11 20L14.5 12.5H33.5L37 20M12 28H36"/><circle cx="13.5" cy="37" r="3"/><circle cx="34.5" cy="37" r="3"/></svg>;
  if (type === 'train') return <svg {...props} {...common}><rect x="9" y="8" width="30" height="29" rx="5"/><path d="M9 25H39M15 18H33M14 37L10 41M34 37L38 41"/><circle cx="16" cy="23" r="2"/><circle cx="32" cy="23" r="2"/></svg>;
  if (type === 'transfer') return <svg {...props} {...common}><path d="M8 34V24C8 21.2 10.2 19 13 19H35C37.8 19 40 21.2 40 24V34H8Z"/><path d="M12 19L15 12H33L36 19M13 28H35"/><circle cx="14" cy="34" r="3"/><circle cx="34" cy="34" r="3"/></svg>;
  if (type === 'activity') return <svg {...props} {...common}><path d="M6 39L18 23L25 30L36 13L42 21M6 39H42"/><circle cx="36" cy="10" r="3"/></svg>;
  if (type === 'insurance') return <svg {...props} {...common}><path d="M24 5L39 11V22C39 31 33 37 24 42C15 37 9 31 9 22V11L24 5Z"/><path d="M16 23L21.5 28.5L32 17.5" strokeWidth="2.3"/></svg>;
  return <svg {...props} {...common}><rect x="11" y="5" width="26" height="38" rx="4"/><path d="M16 12H32V27H16V12ZM19 17H29M19 21H29M19 25H25"/><path d="M21 35H27M24 32V38"/></svg>;
}

function buildHref(vertical: AffiliateVertical, context: AffiliateContext) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(context)) if (value) params.set(key, value);
  const query = params.toString();
  return `/api/affiliate/${vertical}${query ? `?${query}` : ''}`;
}
