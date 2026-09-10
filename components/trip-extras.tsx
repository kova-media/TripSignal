import type { AffiliateContext, AffiliateVertical } from '@/lib/affiliates';

const extras: Array<{ vertical: AffiliateVertical; title: string; description: string; graphic: string }> = [
  { vertical: 'hotels', title: 'Hotels', description: 'Compare places to stay at your destination.', graphic: 'hotel' },
  { vertical: 'cars', title: 'Rental cars', description: 'Compare rental cars for your trip.', graphic: 'car' },
  { vertical: 'activities', title: 'Things to do', description: 'Find tours and activities at your destination.', graphic: 'activity' },
  { vertical: 'transfers', title: 'Airport transfers', description: 'Arrange a ride between the airport and your stay.', graphic: 'transfer' },
  { vertical: 'insurance', title: 'Travel insurance', description: 'Review travel insurance options for your trip.', graphic: 'insurance' },
  { vertical: 'sim', title: 'SIM cards', description: 'Get mobile data for your trip.', graphic: 'sim' },
  { vertical: 'trains_buses', title: 'Trains & buses', description: 'Book ground transportation at your destination.', graphic: 'transport' },
];

export default function TripExtras({ context }: { context: AffiliateContext }) {
  return (
    <section className="trip-extras" aria-label="Complete your trip">
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
            <div className="trip-extra-graphic" aria-hidden="true">
              <Graphic type={extra.graphic} />
            </div>
            <div className="trip-extra-copy">
              <strong>{extra.title}</strong>
              <span>{extra.description}</span>
              <b>View options</b>
            </div>
          </a>
        ))}
      </div>
      <p className="trip-extras-disclosure">TripSignal may earn a commission from some links.</p>
    </section>
  );
}

function Graphic({ type }: { type: string }) {
  const common = { viewBox: '0 0 180 100', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

  if (type === 'hotel') return (
    <svg {...common}><path d="M28 72V37l62-18 62 18v35"/><path d="M20 72h140M42 72V48h38v24M100 72V48h38v24M52 37v-9M90 26v-9M128 37v-9"/><rect x="56" y="55" width="10" height="8" rx="1"/><rect x="114" y="55" width="10" height="8" rx="1"/></svg>
  );
  if (type === 'car') return (
    <svg {...common}><path d="M30 66h120l-10-27H48L30 66Z"/><path d="M47 39 58 25h64l11 14M40 66v12M140 66v12M50 78h12M118 78h12"/><circle cx="51" cy="66" r="9"/><circle cx="129" cy="66" r="9"/><path d="M63 39h54"/></svg>
  );
  if (type === 'activity') return (
    <svg {...common}><circle cx="90" cy="48" r="29"/><path d="M90 19v58M61 48h58M69 27c12 10 30 10 42 0M69 69c12-10 30-10 42 0"/><path d="M90 8v11M90 77v15M50 48H35M145 48h-15"/></svg>
  );
  if (type === 'transfer') return (
    <svg {...common}><path d="M25 68h130M39 68V39h102v29"/><path d="M48 39 61 24h58l13 15M67 51h46M76 68v12M104 68v12"/><path d="M28 84h124"/></svg>
  );
  if (type === 'insurance') return (
    <svg {...common}><path d="M90 14 137 31v28c0 20-19 31-47 38-28-7-47-18-47-38V31L90 14Z"/><path d="m67 56 15 15 31-34"/></svg>
  );
  if (type === 'sim') return (
    <svg {...common}><path d="M66 13h35l18 18v56H61V18l5-5Z"/><path d="M96 14v20h20M72 48h40M72 60h40M72 72h22"/><rect x="72" y="82" width="16" height="6" rx="1"/></svg>
  );
  return (
    <svg {...common}><path d="M24 30h132M24 50h132M24 70h132"/><circle cx="45" cy="30" r="7"/><circle cx="115" cy="50" r="7"/><circle cx="76" cy="70" r="7"/><path d="M52 30h54M122 50h34M83 70h44"/></svg>
  );
}

function buildHref(vertical: AffiliateVertical, context: AffiliateContext) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(context)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return `/api/affiliate/${vertical}${query ? `?${query}` : ''}`;
}
