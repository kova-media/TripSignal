export type AffiliateVertical = 'hotels' | 'cars' | 'activities' | 'transfers' | 'parking' | 'insurance' | 'sim' | 'trains_buses';

export interface AffiliateContext {
  destination?: string;
  destinationCity?: string;
  destinationCountryCode?: string;
  origin?: string;
  departureDate?: string;
  returnDate?: string;
  passengers?: string;
  alertId?: string;
  signalId?: string;
}

interface AffiliateProvider {
  key: string;
  name: string;
  verticals: AffiliateVertical[];
  envKey: string;
  defaultDestination?: string;
}

const providers: AffiliateProvider[] = [
  { key: 'klook', name: 'Klook', verticals: ['hotels'], envKey: 'TRIPSIGNAL_AFFILIATE_KLOOK_HOTELS_URL', defaultDestination: 'https://klook.tpo.mx/O9U20LAg' },
  { key: 'discovercars', name: 'Discover Cars', verticals: ['cars'], envKey: 'TRIPSIGNAL_AFFILIATE_DISCOVERCARS_URL', defaultDestination: 'https://www.discovercars.com/?a_aid=Damian' },
  { key: 'klook', name: 'Klook', verticals: ['activities'], envKey: 'TRIPSIGNAL_AFFILIATE_KLOOK_ACTIVITIES_URL', defaultDestination: 'https://klook.tpo.mx/zExsNd44' },
  { key: 'kiwitaxi', name: 'Kiwitaxi', verticals: ['transfers'], envKey: 'TRIPSIGNAL_AFFILIATE_KIWITAXI_URL', defaultDestination: 'https://kiwitaxi.tpo.mx/b1AKHy0t' },
  { key: 'awin-parking', name: 'Airport Parking', verticals: ['parking'], envKey: 'TRIPSIGNAL_AFFILIATE_PARKING_URL' },
  { key: 'ekta', name: 'EKTA', verticals: ['insurance'], envKey: 'TRIPSIGNAL_AFFILIATE_INSURANCE_URL', defaultDestination: 'https://ektatraveling.tpo.mx/EXezz7j8' },
  { key: 'yesim', name: 'Yesim', verticals: ['sim'], envKey: 'TRIPSIGNAL_AFFILIATE_YESIM_URL', defaultDestination: 'https://yesim.tpo.mx/C8mknDqd' },
  { key: 'klook', name: 'Klook', verticals: ['trains_buses'], envKey: 'TRIPSIGNAL_AFFILIATE_KLOOK_TRAINS_BUSES_URL', defaultDestination: 'https://klook.tpo.mx/UMVxCcwo' },
];

const verticalLabels: Record<AffiliateVertical, string> = {
  hotels: 'Hotels', cars: 'Rental cars', activities: 'Things to do', transfers: 'Airport transfers', parking: 'Airport parking', insurance: 'Travel insurance', sim: 'SIM cards', trains_buses: 'Trains & buses',
};

const discoverCarsCountrySlugs: Record<string, string> = {
  AR: 'argentina', AT: 'austria', AU: 'australia', BE: 'belgium', BR: 'brazil', CA: 'canada', CH: 'switzerland', CL: 'chile', CN: 'china',
  CZ: 'czech-republic', DE: 'germany', DK: 'denmark', ES: 'spain', FR: 'france', GB: 'united-kingdom', GR: 'greece', HR: 'croatia',
  HU: 'hungary', IE: 'ireland', IN: 'india', IT: 'italy-mainland', JP: 'japan', KR: 'south-korea', MX: 'mexico', NL: 'netherlands',
  NZ: 'new-zealand', PT: 'portugal', SG: 'singapore', TH: 'thailand', TR: 'turkey', US: 'united-states', ZA: 'south-africa',
};

const destinationMetadataByIata: Record<string, { city: string; countryCode: string }> = {
  ATL: { city: 'Atlanta', countryCode: 'US' }, BOS: { city: 'Boston', countryCode: 'US' }, BWI: { city: 'Baltimore', countryCode: 'US' }, CLT: { city: 'Charlotte', countryCode: 'US' },
  DCA: { city: 'Washington', countryCode: 'US' }, DEN: { city: 'Denver', countryCode: 'US' }, DFW: { city: 'Dallas', countryCode: 'US' }, DTW: { city: 'Detroit', countryCode: 'US' },
  EWR: { city: 'Newark', countryCode: 'US' }, FLL: { city: 'Fort Lauderdale', countryCode: 'US' }, IAH: { city: 'Houston', countryCode: 'US' }, JFK: { city: 'New York', countryCode: 'US' },
  LAX: { city: 'Los Angeles', countryCode: 'US' }, LAS: { city: 'Las Vegas', countryCode: 'US' }, LGA: { city: 'New York', countryCode: 'US' }, MCO: { city: 'Orlando', countryCode: 'US' },
  MIA: { city: 'Miami', countryCode: 'US' }, MSP: { city: 'Minneapolis', countryCode: 'US' }, ORD: { city: 'Chicago', countryCode: 'US' }, PHL: { city: 'Philadelphia', countryCode: 'US' },
  PHX: { city: 'Phoenix', countryCode: 'US' }, SAN: { city: 'San Diego', countryCode: 'US' }, SEA: { city: 'Seattle', countryCode: 'US' }, SFO: { city: 'San Francisco', countryCode: 'US' },
  SLC: { city: 'Salt Lake City', countryCode: 'US' }, STL: { city: 'St. Louis', countryCode: 'US' }, TPA: { city: 'Tampa', countryCode: 'US' }, YYZ: { city: 'Toronto', countryCode: 'CA' },
  YVR: { city: 'Vancouver', countryCode: 'CA' }, YUL: { city: 'Montreal', countryCode: 'CA' }, AMS: { city: 'Amsterdam', countryCode: 'NL' }, ATH: { city: 'Athens', countryCode: 'GR' },
  BCN: { city: 'Barcelona', countryCode: 'ES' }, BER: { city: 'Berlin', countryCode: 'DE' }, BRU: { city: 'Brussels', countryCode: 'BE' }, CDG: { city: 'Paris', countryCode: 'FR' },
  CPH: { city: 'Copenhagen', countryCode: 'DK' }, DUB: { city: 'Dublin', countryCode: 'IE' }, FCO: { city: 'Rome', countryCode: 'IT' }, FRA: { city: 'Frankfurt', countryCode: 'DE' },
  GVA: { city: 'Geneva', countryCode: 'CH' }, LHR: { city: 'London', countryCode: 'GB' }, LGW: { city: 'London', countryCode: 'GB' }, STN: { city: 'London', countryCode: 'GB' },
  LTN: { city: 'London', countryCode: 'GB' }, LCY: { city: 'London', countryCode: 'GB' }, LIS: { city: 'Lisbon', countryCode: 'PT' }, MAD: { city: 'Madrid', countryCode: 'ES' },
  MXP: { city: 'Milan', countryCode: 'IT' }, LIN: { city: 'Milan', countryCode: 'IT' }, MUC: { city: 'Munich', countryCode: 'DE' }, PRG: { city: 'Prague', countryCode: 'CZ' },
  VIE: { city: 'Vienna', countryCode: 'AT' }, ZRH: { city: 'Zurich', countryCode: 'CH' }, BUD: { city: 'Budapest', countryCode: 'HU' }, ZAG: { city: 'Zagreb', countryCode: 'HR' },
  VCE: { city: 'Venice', countryCode: 'IT' }, NCE: { city: 'Nice', countryCode: 'FR' }, IST: { city: 'Istanbul', countryCode: 'TR' }, NRT: { city: 'Tokyo', countryCode: 'JP' },
  HND: { city: 'Tokyo', countryCode: 'JP' }, ICN: { city: 'Seoul', countryCode: 'KR' }, GMP: { city: 'Seoul', countryCode: 'KR' }, PEK: { city: 'Beijing', countryCode: 'CN' },
  PKX: { city: 'Beijing', countryCode: 'CN' }, PVG: { city: 'Shanghai', countryCode: 'CN' }, HKG: { city: 'Hong Kong', countryCode: 'HK' }, SIN: { city: 'Singapore', countryCode: 'SG' },
  BKK: { city: 'Bangkok', countryCode: 'TH' }, DEL: { city: 'Delhi', countryCode: 'IN' }, BOM: { city: 'Mumbai', countryCode: 'IN' }, DXB: { city: 'Dubai', countryCode: 'AE' },
  DOH: { city: 'Doha', countryCode: 'QA' }, JNB: { city: 'Johannesburg', countryCode: 'ZA' }, CPT: { city: 'Cape Town', countryCode: 'ZA' }, GRU: { city: 'Sao Paulo', countryCode: 'BR' },
  EZE: { city: 'Buenos Aires', countryCode: 'AR' }, SCL: { city: 'Santiago', countryCode: 'CL' }, MEX: { city: 'Mexico City', countryCode: 'MX' }, CUN: { city: 'Cancun', countryCode: 'MX' },
  SYD: { city: 'Sydney', countryCode: 'AU' }, MEL: { city: 'Melbourne', countryCode: 'AU' }, AKL: { city: 'Auckland', countryCode: 'NZ' },
};

const klookCities: Record<string, { id: number; page: string; dest: string }> = {
  amsterdam: { id: 90, page: '90-amsterdam-hotels', dest: 'amsterdam' },
  bangkok: { id: 27, page: '27-bangkok-hotels', dest: 'bangkok' },
  barcelona: { id: 108, page: '108-barcelones-hotels', dest: 'barcelona' },
  budapest: { id: 307, page: '307-budapest-hotels', dest: 'budapest' },
  london: { id: 106, page: '106-london-hotels', dest: 'london' },
  paris: { id: 107, page: '107-paris-hotels', dest: 'paris' },
  prague: { id: 333, page: '333-prague-hotels', dest: 'prague' },
  rome: { id: 92, page: '92-rome-hotels', dest: 'rome' },
  seoul: { id: 13, page: '13-seoul-hotels', dest: 'seoul' },
  tokyo: { id: 28, page: '28-tokyo-hotels', dest: 'tokyo' },
  vienna: { id: 91, page: '91-vienna-hotels', dest: 'vienna' },
  warsaw: { id: 351, page: '351-warsaw-hotels', dest: 'warsaw' },
};

// Yesim eSIM country page slug per destination country code, verified
// Nov 24 2026 (each https://yesim.app/country/<slug>/ returns 200).
const yesimCountrySlugs: Record<string, string> = {
  NL: 'netherlands',
  TH: 'thailand',
  ES: 'spain',
  HU: 'hungary',
  GB: 'united-kingdom',
  FR: 'france',
  CZ: 'czech-republic',
  IT: 'italy',
  KR: 'south-korea',
  JP: 'japan',
  AT: 'austria',
  PL: 'poland',
};

// EKTA country pages, from ektatraveling.com/sitemap-countries.xml
// (Nov 24 2026). Europe: /travel-insurance-for-europe/<slug>/,
// Asia: /travel-insurance-for-asia/<slug>/.
const ektaCountryPages: Record<string, { region: 'europe' | 'asia'; slug: string }> = {
  NL: { region: 'europe', slug: 'netherlands' },
  TH: { region: 'asia', slug: 'thailand' },
  ES: { region: 'europe', slug: 'spain' },
  HU: { region: 'europe', slug: 'hungary' },
  GB: { region: 'europe', slug: 'united-kingdom' },
  FR: { region: 'europe', slug: 'france' },
  CZ: { region: 'europe', slug: 'czech-republic' },
  IT: { region: 'europe', slug: 'italy' },
  KR: { region: 'asia', slug: 'south-korea' },
  JP: { region: 'asia', slug: 'japan' },
  AT: { region: 'europe', slug: 'austria' },
  PL: { region: 'europe', slug: 'poland' },
};

// Klook's Europe rail product only covers European destinations; other
// destinations fall back to the generic Klook transport link.
const europeanCountryCodes = new Set([
  'AT', 'BE', 'CH', 'CZ', 'DE', 'DK', 'ES', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IT', 'NL', 'PL', 'PT',
]);

// Yesim deep link generated in Travelpayouts (Nov 24, 2026) for the Spain
// eSIM page. Same tp.media wrapper pattern as Klook: swapping `u` to
// another country page keeps tracking intact.
function wrapYesimDeepLink(destinationUrl: string) {
  const url = new URL('https://tp.media/r');
  url.searchParams.set('campaign_id', '224');
  url.searchParams.set('marker', travelpayoutsMarker);
  url.searchParams.set('p', '5998');
  url.searchParams.set('trs', '572527');
  url.searchParams.set('u', destinationUrl);
  return url.toString();
}

// Klook deep link generated in Travelpayouts (Nov 24, 2026) for the
// Barcelona hotels page. The old tpo.mx short link pointed at Klook's
// generic /hotels/ page and dropped city/date params; this tp.media
// wrapper carries the full Klook URL as `u`. Verified Nov 24: swapping
// `u` to any of the 12 city pages above lands on that city's page with
// tracking intact.
function wrapKlookDeepLink(destinationUrl: string) {
  const url = new URL('https://tp.media/r');
  url.searchParams.set('campaign_id', '137');
  url.searchParams.set('marker', travelpayoutsMarker);
  url.searchParams.set('p', '4110');
  url.searchParams.set('trs', '572527');
  url.searchParams.set('u', destinationUrl);
  return url.toString();
}

const kiwitaxiPromoId = '647';
const travelpayoutsMarker = process.env.TRIPSIGNAL_TRAVELPOUTS_MARKER ?? '776063';

export const affiliateVerticals = Object.keys(verticalLabels) as AffiliateVertical[];

export function isAffiliateVertical(value: string): value is AffiliateVertical {
  return affiliateVerticals.includes(value as AffiliateVertical);
}

export function getAffiliateProvider(vertical: AffiliateVertical) {
  return providers.find((provider) => provider.verticals.includes(vertical)) ?? null;
}

export function getAffiliateConfig(vertical: AffiliateVertical) {
  const provider = getAffiliateProvider(vertical);
  if (!provider) return null;
  const destination = process.env[provider.envKey] ?? provider.defaultDestination;
  return { vertical, label: verticalLabels[vertical], provider, destination, configured: Boolean(destination) };
}

export function buildAffiliateUrl(vertical: AffiliateVertical, context: AffiliateContext = {}) {
  const config = getAffiliateConfig(vertical);
  if (!config?.destination) return null;

  const metadata = context.destination ? destinationMetadataByIata[context.destination.toUpperCase()] : undefined;
  const resolvedContext: AffiliateContext = {
    ...context,
    ...(metadata && !context.destinationCity ? { destinationCity: metadata.city } : {}),
    ...(metadata && !context.destinationCountryCode ? { destinationCountryCode: metadata.countryCode } : {}),
  };

  const deepLink = buildDestinationDeepLink(vertical, resolvedContext, config.destination);
  if (deepLink) return deepLink;

  const url = new URL(config.destination);
  if (!url.hostname.endsWith('tpo.mx') && !url.hostname.endsWith('discovercars.com')) {
    const params: Record<string, string> = {
      destination: resolvedContext.destination ?? '', origin: resolvedContext.origin ?? '', departureDate: resolvedContext.departureDate ?? '',
      returnDate: resolvedContext.returnDate ?? '', alertId: resolvedContext.alertId ?? '', signalId: resolvedContext.signalId ?? '',
    };
    for (const [key, value] of Object.entries(params)) if (value) url.searchParams.set(`ts_${key}`, value);
  }
  return url.toString();
}

function buildDestinationDeepLink(vertical: AffiliateVertical, context: AffiliateContext, affiliateDestination: string) {
  const city = context.destinationCity?.trim();
  const countryCode = context.destinationCountryCode?.trim().toUpperCase();
  if (!city || !countryCode) return null;

  if (vertical === 'hotels') {
    const hotelCity = klookCities[city.toLowerCase()];
    if (!hotelCity) return null;
    if (context.departureDate && context.returnDate) {
      // With dates, link straight to Klook's search-results page: it is
      // the only Klook URL that honors dates (check_in/check_out — found
      // Nov 24 by picking dates on Klook and reading the resulting URL).
      // The city page's date picker ignores URL dates entirely.
      const adults = Math.max(1, Math.min(9, parseInt(context.passengers ?? '2', 10) || 2));
      const results = new URL('https://www.klook.com/hotels/searchresult/');
      results.searchParams.set('room_num', '1');
      results.searchParams.set('adult_num', String(adults));
      results.searchParams.set('child_num', '0');
      results.searchParams.set('stype', 'city');
      results.searchParams.set('svalue', String(hotelCity.id));
      results.searchParams.set('override', city);
      results.searchParams.set('title', city);
      results.searchParams.set('check_in', context.departureDate);
      results.searchParams.set('check_out', context.returnDate);
      return wrapKlookDeepLink(results.toString());
    }
    // No dates (window-only alert): the city page, which fills in the
    // destination; dates are picked on Klook.
    const destination = new URL(`https://www.klook.com/hotels/city/${hotelCity.page}/`);
    return wrapKlookDeepLink(destination.toString());
  }

  if (vertical === 'cars') {
    const countrySlug = discoverCarsCountrySlugs[countryCode];
    if (!countrySlug) return null;
    const citySlug = slugify(city);
    if (!citySlug) return null;
    // The city page fills in the location. Dates are NOT passed: the
    // page's form ignores pickup_date/dropoff_date, and DiscoverCars'
    // /search/ results URL only works with a server-issued search id
    // tied to the visitor's session — a link built with a made-up id
    // 404s for a fresh visitor (verified Nov 24; an earlier test only
    // passed because that browser already had a DiscoverCars session).
    // So the traveler picks the dates on DiscoverCars.
    const url = new URL(`https://www.discovercars.com/${countrySlug}/${citySlug}`);
    url.searchParams.set('a_aid', 'Damian');
    return url.toString();
  }

  if (vertical === 'activities') {
    const klookCity = klookCities[city.toLowerCase()];
    if (!klookCity) return null;
    // Klook's city hub page (things to do in the city). Verified Nov 24
    // for all 12 cities via redirect traces through the wrapper.
    const destination = new URL(`https://www.klook.com/destination/c${klookCity.id}-${klookCity.dest}/`);
    return wrapKlookDeepLink(destination.toString());
  }

  if (vertical === 'trains_buses') {
    // Klook sells specific train routes, so a train search needs a
    // second city the traveler hasn't entered — an origin-only search
    // is not possible (verified Nov 24: it auto-fills Paris and the
    // search errors). The best destination-aware link is Klook's Europe
    // rail search page for European destinations, with the trip's
    // departure date and passenger count prefilled (verified Nov 24:
    // the date is accepted; the route still defaults to London-Paris
    // and the traveler picks their real route). Elsewhere the generic
    // Klook transport link stands.
    if (!europeanCountryCodes.has(countryCode)) return null;
    const search = new URL('https://www.klook.com/en-US/rails-4/364891-europe/search/');
    if (context.departureDate) search.searchParams.set('departure_date', context.departureDate);
    search.searchParams.set('departure_time', '08:00');
    search.searchParams.set('passengers', JSON.stringify([{
      count: Number(context.passengers) || 1,
      passenger_type: 'adult',
      name: 'Adult',
      ages: [],
    }]));
    return wrapKlookDeepLink(search.toString());
  }

  if (vertical === 'sim') {
    const slug = yesimCountrySlugs[countryCode];
    if (!slug) return null;
    // Yesim's country eSIM page, via the Yesim Travelpayouts wrapper
    // (campaign 224, generated Nov 24 for Spain; `u` swaps per country).
    return wrapYesimDeepLink(`https://yesim.app/country/${slug}/`);
  }

  if (vertical === 'transfers') {
    const customUrl = new URL('https://kiwitaxi.com/en/search');
    customUrl.searchParams.set('to', city);
    const url = new URL('https://c1.travelpayouts.com/click');
    url.searchParams.set('shmarker', travelpayoutsMarker);
    url.searchParams.set('promo_id', kiwitaxiPromoId);
    url.searchParams.set('source_type', 'customlink');
    url.searchParams.set('type', 'click');
    url.searchParams.set('custom_url', customUrl.toString());
    return url.toString();
  }

  if (vertical === 'insurance') {
    const ekta = ektaCountryPages[countryCode];
    if (!ekta) {
      // No country page for this destination: EKTA's homepage directly.
      // (The tracked EKTA link is dead — see below — so no falling back
      // to the generic provider link, which returns a 400.)
      return 'https://ektatraveling.com/';
    }
    // EKTA's Travelpayouts program is INACTIVE as of Nov 24, 2026 and
    // its tracked link (ektatraveling.tpo.mx/EXezz7j8) returns a 400, so
    // this is a DIRECT link to the destination country's EKTA page — it
    // works for the traveler but earns no commission. EKTA's site also
    // has no quote form anymore (checked Nov 24), so dates can't be
    // prefilled; the country page shows the plans for that destination.
    return `https://ektatraveling.com/travel-insurance-for-${ekta.region}/${ekta.slug}/`;
  }

  return null;
}

function slugify(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function getAffiliateProviders() {
  return providers.map((provider) => ({
    key: provider.key,
    name: provider.name,
    verticals: provider.verticals,
    configured: Boolean(process.env[provider.envKey] ?? provider.defaultDestination),
  }));
}
