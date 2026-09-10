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
  const common = { viewBox: '0 0 240 120', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

  if (type === 'hotel') return (
    <svg {...common}>
      <path d="M28 91h184" stroke="currentColor" strokeWidth="1.5" />
      <path d="M46 91V47l74-25 74 25v44" fill="currentColor" opacity=".08" />
      <path d="M46 91V47l74-25 74 25v44M35 91h170" stroke="currentColor" strokeWidth="1.7" />
      <path d="M72 91V58h38v33M130 91V58h38v33" stroke="currentColor" strokeWidth="1.5" />
      <path d="M79 66h24M137 66h24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M62 48h10M168 48h10M120 31v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M106 91V78h28v13" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  if (type === 'car') return (
    <svg {...common}>
      <path d="M42 79h156l-13-33H67L42 79Z" fill="currentColor" opacity=".08" />
      <path d="M42 79h156l-13-33H67L42 79ZM64 46l15-21h67l18 21M42 79v10M198 79v10" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="68" cy="79" r="13" fill="currentColor" opacity=".1" />
      <circle cx="172" cy="79" r="13" fill="currentColor" opacity=".1" />
      <circle cx="68" cy="79" r="7" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="172" cy="79" r="7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M78 46h72M98 25v21M145 25v21" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );

  if (type === 'activity') return (
    <svg {...common}>
      <path d="M38 91c14-26 26-48 48-62 18-12 38-13 57 1 15 11 25 29 59 25" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M42 92h158" stroke="currentColor" strokeWidth="1.5" />
      <path d="m80 72 15-20 14 20M129 91V65l17-15 17 15v26" fill="currentColor" opacity=".08" />
      <path d="m80 72 15-20 14 20M129 91V65l17-15 17 15v26" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="190" cy="31" r="9" fill="currentColor" opacity=".12" />
      <path d="M190 22v18M181 31h18" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );

  if (type === 'transfer') return (
    <svg {...common}>
      <path d="M35 82h170" stroke="currentColor" strokeWidth="1.5" />
      <path d="M51 82V50h138v32" fill="currentColor" opacity=".07" />
      <path d="M51 82V50h138v32M39 82h162" stroke="currentColor" strokeWidth="1.7" />
      <path d="M62 50 78 29h84l16 21" stroke="currentColor" strokeWidth="1.7" />
      <path d="M69 64h102M78 82V68M162 82V68" stroke="currentColor" strokeWidth="1.5" />
      <path d="M91 38h58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M32 94h176" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  if (type === 'insurance') return (
    <svg {...common}>
      <path d="M120 17 180 39v27c0 23-24 35-60 46-36-11-60-23-60-46V39l60-22Z" fill="currentColor" opacity=".08" />
      <path d="M120 17 180 39v27c0 23-24 35-60 46-36-11-60-23-60-46V39l60-22Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m91 61 19 19 39-42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M47 27h26M60 14v26" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );

  if (type === 'sim') return (
    <svg {...common}>
      <path d="M91 16h43l25 25v63H81V25l10-9Z" fill="currentColor" opacity=".08" />
      <path d="M91 16h43l25 25v63H81V25l10-9ZM134 17v26h25" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <rect x="98" y="55" width="44" height="34" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M106 64h28M106 74h28M113 89v-7h14v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52 93h17M172 93h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  return (
    <svg {...common}>
      <path d="M38 84h164" stroke="currentColor" strokeWidth="1.5" />
      <path d="M53 84V57h134v27" fill="currentColor" opacity=".07" />
      <path d="M53 84V57h134v27M45 84h150" stroke="currentColor" strokeWidth="1.7" />
      <path d="M68 57V43h40v14M132 57V43h40v14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M75 49h26M139 49h26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M42 94h156" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="120" cy="25" r="8" fill="currentColor" opacity=".12" />
      <path d="M116 25h8M120 21v8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
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
