import type { AffiliateContext, AffiliateVertical } from '@/lib/affiliates';

const extras: Array<{ vertical: AffiliateVertical; title: string; description: string }> = [
  { vertical: 'hotels', title: 'Hotels', description: 'Compare places to stay at your destination.' },
  { vertical: 'cars', title: 'Rental cars', description: 'Compare rental cars for your trip.' },
  { vertical: 'activities', title: 'Things to do', description: 'Find tours and activities at your destination.' },
  { vertical: 'transfers', title: 'Airport transfers', description: 'Arrange a ride between the airport and your stay.' },
  { vertical: 'insurance', title: 'Travel insurance', description: 'Review travel insurance options for your trip.' },
  { vertical: 'sim', title: 'SIM cards', description: 'Get mobile data for your trip.' },
  { vertical: 'trains_buses', title: 'Trains & buses', description: 'Book ground transportation at your destination.' },
];

export default function TripExtras({ context }: { context: AffiliateContext }) {
  return (
    <section className="trip-extras" aria-label="Complete your trip">
      <div className="trip-extras-heading">
        <div>
          <span className="trip-extras-eyebrow">Complete your trip</span>
          <h2>Book the rest of your trip</h2>
        </div>
        <p>TripSignal may earn a commission from some links.</p>
      </div>

      <div className="trip-extras-grid">
        {extras.map((extra) => (
          <a
            key={extra.vertical}
            className="trip-extra-card"
            href={buildHref(extra.vertical, context)}
          >
            <strong>{extra.title}</strong>
            <span>{extra.description}</span>
            <b>View options</b>
          </a>
        ))}
      </div>
    </section>
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
