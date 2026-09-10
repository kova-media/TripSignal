import type { AffiliateContext, AffiliateVertical } from '@/lib/affiliates';

const extras: Array<{ vertical: AffiliateVertical; title: string; description: string; image: string }> = [
  { vertical: 'hotels', title: 'Hotels', description: 'Compare places to stay at your destination.', image: 'hotel' },
  { vertical: 'cars', title: 'Rental cars', description: 'Compare rental cars for your trip.', image: 'car' },
  { vertical: 'activities', title: 'Things to do', description: 'Find tours and activities at your destination.', image: 'activity' },
  { vertical: 'transfers', title: 'Airport transfers', description: 'Arrange a ride between the airport and your stay.', image: 'transfer' },
  { vertical: 'insurance', title: 'Travel insurance', description: 'Review travel insurance options for your trip.', image: 'insurance' },
  { vertical: 'sim', title: 'SIM cards', description: 'Get mobile data for your trip.', image: 'sim' },
  { vertical: 'trains_buses', title: 'Trains & buses', description: 'Book ground transportation at your destination.', image: 'transport' },
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
            <div className="trip-extra-visual" aria-hidden="true">
              <EditorialVisual type={extra.image} />
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

function EditorialVisual({ type }: { type: string }) {
  const common = { viewBox: '0 0 640 300', fill: 'none', xmlns: 'http://www.w3.org/2000/svg' };

  if (type === 'hotel') return (
    <svg {...common}>
      <defs><linearGradient id="hotelSky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="currentColor" stopOpacity=".05"/><stop offset="1" stopColor="currentColor" stopOpacity=".18"/></linearGradient></defs>
      <rect width="640" height="300" rx="10" fill="url(#hotelSky)" />
      <path d="M0 222C90 204 132 194 215 207C304 221 350 180 431 187C520 195 562 168 640 177V300H0V222Z" fill="currentColor" opacity=".08"/>
      <path d="M90 224V96L260 48L430 96V224" fill="currentColor" opacity=".11"/>
      <path d="M90 224V96L260 48L430 96V224M70 224H450" stroke="currentColor" strokeWidth="3"/>
      <path d="M128 224V130H220V224M300 224V130H392V224" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M143 150H205M315 150H377" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".75"/>
      <path d="M260 48V78M245 224V184H275V224" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="530" cy="72" r="30" fill="currentColor" opacity=".1"/>
      <path d="M530 42V102M500 72H560" stroke="currentColor" strokeWidth="2" opacity=".65"/>
    </svg>
  );

  if (type === 'car') return (
    <svg {...common}>
      <rect width="640" height="300" rx="10" fill="currentColor" opacity=".045"/>
      <path d="M0 220C108 208 180 196 272 213C367 231 467 189 640 200V300H0V220Z" fill="currentColor" opacity=".1"/>
      <path d="M0 249C118 226 190 228 287 246C393 266 500 220 640 235" stroke="currentColor" strokeWidth="2" opacity=".35"/>
      <path d="M130 198L171 120H420L483 198H130Z" fill="currentColor" opacity=".12"/>
      <path d="M130 198L171 120H420L483 198H130ZM150 198H463V220H150V198Z" stroke="currentColor" strokeWidth="3" strokeLinejoin="round"/>
      <path d="M191 122L215 83H381L412 122M215 84L225 122M381 84L370 122" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="194" cy="217" r="28" fill="currentColor" opacity=".08"/><circle cx="194" cy="217" r="14" stroke="currentColor" strokeWidth="3"/>
      <circle cx="421" cy="217" r="28" fill="currentColor" opacity=".08"/><circle cx="421" cy="217" r="14" stroke="currentColor" strokeWidth="3"/>
      <path d="M35 260H605" stroke="currentColor" strokeWidth="2" opacity=".3"/>
    </svg>
  );

  if (type === 'activity') return (
    <svg {...common}>
      <rect width="640" height="300" rx="10" fill="currentColor" opacity=".04"/>
      <path d="M0 226L115 156L205 191L315 93L410 166L505 112L640 194V300H0V226Z" fill="currentColor" opacity=".1"/>
      <path d="M0 226L115 156L205 191L315 93L410 166L505 112L640 194" stroke="currentColor" strokeWidth="3"/>
      <path d="M0 252C102 231 183 240 269 257C367 276 485 231 640 244" stroke="currentColor" strokeWidth="2" opacity=".35"/>
      <path d="M292 102L315 76L338 102V139H292V102Z" fill="currentColor" opacity=".13" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="518" cy="68" r="25" fill="currentColor" opacity=".09"/>
      <path d="M518 43V93M493 68H543" stroke="currentColor" strokeWidth="2" opacity=".55"/>
      <path d="M108 156V109M95 121L108 108L121 121" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (type === 'transfer') return (
    <svg {...common}>
      <rect width="640" height="300" rx="10" fill="currentColor" opacity=".04"/>
      <path d="M0 222H640V300H0V222Z" fill="currentColor" opacity=".08"/>
      <path d="M72 222V92H500V222M48 222H525" stroke="currentColor" strokeWidth="3"/>
      <path d="M105 92L140 52H432L468 92" stroke="currentColor" strokeWidth="3"/>
      <path d="M125 127H447M125 163H447" stroke="currentColor" strokeWidth="2" opacity=".55"/>
      <path d="M180 222V174H230V222M342 222V174H392V222" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M152 68H421" stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".65"/>
      <path d="M65 258H575" stroke="currentColor" strokeWidth="2" opacity=".35"/>
      <path d="M550 86L582 118M582 86L550 118" stroke="currentColor" strokeWidth="2" opacity=".55"/>
    </svg>
  );

  if (type === 'insurance') return (
    <svg {...common}>
      <rect width="640" height="300" rx="10" fill="currentColor" opacity=".04"/>
      <path d="M320 42L463 91V153C463 211 406 240 320 267C234 240 177 211 177 153V91L320 42Z" fill="currentColor" opacity=".1"/>
      <path d="M320 42L463 91V153C463 211 406 240 320 267C234 240 177 211 177 153V91L320 42Z" stroke="currentColor" strokeWidth="3"/>
      <path d="M254 151L301 198L391 104" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="110" cy="79" r="25" fill="currentColor" opacity=".08"/>
      <path d="M110 54V104M85 79H135" stroke="currentColor" strokeWidth="2" opacity=".55"/>
      <path d="M485 225L518 192L551 225" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity=".5"/>
    </svg>
  );

  if (type === 'sim') return (
    <svg {...common}>
      <rect width="640" height="300" rx="10" fill="currentColor" opacity=".04"/>
      <rect x="245" y="32" width="150" height="242" rx="24" fill="currentColor" opacity=".1" stroke="currentColor" strokeWidth="3"/>
      <rect x="267" y="62" width="106" height="166" rx="8" fill="currentColor" opacity=".07" stroke="currentColor" strokeWidth="2"/>
      <path d="M286 105C300 91 316 84 333 84C350 84 366 91 380 105M298 126C308 116 320 111 333 111C346 111 358 116 368 126M316 148C321 143 327 140 333 140C339 140 345 143 350 148" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="333" cy="188" r="7" fill="currentColor" opacity=".5"/>
      <path d="M111 235C151 192 179 173 218 157M422 156C462 173 490 193 529 235" stroke="currentColor" strokeWidth="2.5" opacity=".3"/>
      <path d="M75 260H565" stroke="currentColor" strokeWidth="2" opacity=".3"/>
    </svg>
  );

  return (
    <svg {...common}>
      <rect width="640" height="300" rx="10" fill="currentColor" opacity=".04"/>
      <path d="M0 224H640V300H0V224Z" fill="currentColor" opacity=".08"/>
      <path d="M72 224L186 172L301 224L416 172L540 224" stroke="currentColor" strokeWidth="3" opacity=".7"/>
      <path d="M74 224V97H250V224M390 224V97H566V224" stroke="currentColor" strokeWidth="3"/>
      <path d="M102 126H222M420 126H540M102 161H222M420 161H540" stroke="currentColor" strokeWidth="2.5" opacity=".55"/>
      <path d="M250 224H390L351 191H289L250 224Z" fill="currentColor" opacity=".12" stroke="currentColor" strokeWidth="2.5"/>
      <circle cx="272" cy="231" r="13" stroke="currentColor" strokeWidth="2.5"/><circle cx="368" cy="231" r="13" stroke="currentColor" strokeWidth="2.5"/>
      <path d="M60 258H580" stroke="currentColor" strokeWidth="2" opacity=".3"/>
      <path d="M318 67V36M306 48L318 36L330 48" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity=".55"/>
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
