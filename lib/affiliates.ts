export type AffiliateVertical = 'hotels' | 'cars' | 'activities' | 'transfers' | 'parking' | 'insurance' | 'sim' | 'trains_buses';

export interface AffiliateContext {
  destination?: string;
  destinationCity?: string;
  destinationCountryCode?: string;
  origin?: string;
  departureDate?: string;
  returnDate?: string;
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

const kiwitaxiPromoId = '647';
const travelpayoutsMarker = process.env.TRIPSIGNAL_TRAVELPAYOUTS_MARKER ?? '776063';

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

  const deepLink = buildDestinationDeepLink(vertical, resolvedContext);
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

function buildDestinationDeepLink(vertical: AffiliateVertical, context: AffiliateContext) {
  const city = context.destinationCity?.trim();
  const countryCode = context.destinationCountryCode?.trim().toUpperCase();
  if (!city || !countryCode) return null;

  if (vertical === 'cars') {
    const countrySlug = discoverCarsCountrySlugs[countryCode];
    if (!countrySlug) return null;
    const citySlug = slugify(city);
    if (!citySlug) return null;
    const url = new URL(`https://www.discovercars.com/${countrySlug}/${citySlug}`);
    url.searchParams.set('a_aid', 'Damian');
    if (context.departureDate) url.searchParams.set('pickup_date', context.departureDate);
    if (context.returnDate) url.searchParams.set('dropoff_date', context.returnDate);
    return url.toString();
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
