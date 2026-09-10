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
  {
    key: 'klook',
    name: 'Klook',
    verticals: ['hotels'],
    envKey: 'TRIPSIGNAL_AFFILIATE_KLOOK_HOTELS_URL',
    defaultDestination: 'https://klook.tpo.mx/O9U20LAg',
  },
  {
    key: 'discovercars',
    name: 'Discover Cars',
    verticals: ['cars'],
    envKey: 'TRIPSIGNAL_AFFILIATE_DISCOVERCARS_URL',
    defaultDestination: 'https://www.discovercars.com/?a_aid=Damian',
  },
  {
    key: 'klook',
    name: 'Klook',
    verticals: ['activities'],
    envKey: 'TRIPSIGNAL_AFFILIATE_KLOOK_ACTIVITIES_URL',
    defaultDestination: 'https://klook.tpo.mx/zExsNd44',
  },
  {
    key: 'kiwitaxi',
    name: 'Kiwitaxi',
    verticals: ['transfers'],
    envKey: 'TRIPSIGNAL_AFFILIATE_KIWITAXI_URL',
    defaultDestination: 'https://kiwitaxi.tpo.mx/b1AKHy0t',
  },
  {
    key: 'awin-parking',
    name: 'Airport Parking',
    verticals: ['parking'],
    envKey: 'TRIPSIGNAL_AFFILIATE_PARKING_URL',
  },
  {
    key: 'ekta',
    name: 'EKTA',
    verticals: ['insurance'],
    envKey: 'TRIPSIGNAL_AFFILIATE_INSURANCE_URL',
    defaultDestination: 'https://ektatraveling.tpo.mx/EXezz7j8',
  },
  {
    key: 'yesim',
    name: 'Yesim',
    verticals: ['sim'],
    envKey: 'TRIPSIGNAL_AFFILIATE_YESIM_URL',
    defaultDestination: 'https://yesim.tpo.mx/C8mknDqd',
  },
  {
    key: 'klook',
    name: 'Klook',
    verticals: ['trains_buses'],
    envKey: 'TRIPSIGNAL_AFFILIATE_KLOOK_TRAINS_BUSES_URL',
    defaultDestination: 'https://klook.tpo.mx/UMVxCcwo',
  },
];

const verticalLabels: Record<AffiliateVertical, string> = {
  hotels: 'Hotels',
  cars: 'Rental cars',
  activities: 'Things to do',
  transfers: 'Airport transfers',
  parking: 'Airport parking',
  insurance: 'Travel insurance',
  sim: 'SIM cards',
  trains_buses: 'Trains & buses',
};

const discoverCarsCountrySlugs: Record<string, string> = {
  AR: 'argentina',
  AT: 'austria',
  AU: 'australia',
  BE: 'belgium',
  BR: 'brazil',
  CA: 'canada',
  CH: 'switzerland',
  CL: 'chile',
  CN: 'china',
  CO: 'colombia',
  CR: 'costa-rica',
  CZ: 'czech-republic',
  DE: 'germany',
  DK: 'denmark',
  DO: 'dominican-republic',
  ES: 'spain',
  FR: 'france',
  GB: 'united-kingdom',
  GR: 'greece',
  HR: 'croatia',
  HU: 'hungary',
  IE: 'ireland',
  IN: 'india',
  IT: 'italy-mainland',
  JP: 'japan',
  KR: 'south-korea',
  MX: 'mexico',
  NL: 'netherlands',
  NO: 'norway',
  NZ: 'new-zealand',
  PT: 'portugal',
  SE: 'sweden',
  SG: 'singapore',
  TH: 'thailand',
  TR: 'turkey',
  US: 'united-states',
  ZA: 'south-africa',
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
  return {
    vertical,
    label: verticalLabels[vertical],
    provider,
    destination,
    configured: Boolean(destination),
  };
}

export function buildAffiliateUrl(vertical: AffiliateVertical, context: AffiliateContext = {}) {
  const config = getAffiliateConfig(vertical);
  if (!config?.destination) return null;

  const deepLink = buildDestinationDeepLink(vertical, context);
  if (deepLink) return deepLink;

  const url = new URL(config.destination);

  if (!url.hostname.endsWith('tpo.mx') && !url.hostname.endsWith('discovercars.com')) {
    const params: Record<string, string> = {
      destination: context.destination ?? '',
      origin: context.origin ?? '',
      departureDate: context.departureDate ?? '',
      returnDate: context.returnDate ?? '',
      alertId: context.alertId ?? '',
      signalId: context.signalId ?? '',
    };

    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(`ts_${key}`, value);
    }
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
    const countrySlug = countryNameSlug(countryCode);
    if (!countrySlug) return null;

    const destination = encodeURIComponent(city);
    const url = new URL('https://c1.travelpayouts.com/click');
    url.searchParams.set('shmarker', travelpayoutsMarker);
    url.searchParams.set('promo_id', kiwitaxiPromoId);
    url.searchParams.set('source_type', 'customlink');
    url.searchParams.set('type', 'click');
    url.searchParams.set('custom_url', `https://kiwitaxi.com/en/search?to=${destination}`);
    return url.toString();
  }

  return null;
}

function slugify(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function countryNameSlug(countryCode: string) {
  const countryNames: Record<string, string> = {
    AR: 'argentina', AT: 'austria', AU: 'australia', BE: 'belgium', BR: 'brazil', CA: 'canada', CH: 'switzerland',
    CL: 'chile', CN: 'china', CZ: 'czech-republic', DE: 'germany', DK: 'denmark', ES: 'spain', FR: 'france',
    GB: 'united-kingdom', GR: 'greece', HR: 'croatia', HU: 'hungary', IE: 'ireland', IN: 'india', IT: 'italy',
    JP: 'japan', KR: 'south-korea', MX: 'mexico', NL: 'netherlands', NZ: 'new-zealand', PT: 'portugal',
    SG: 'singapore', TH: 'thailand', TR: 'turkey', US: 'united-states', ZA: 'south-africa',
  };
  return countryNames[countryCode] ?? null;
}

export function getAffiliateProviders() {
  return providers.map((provider) => ({
    key: provider.key,
    name: provider.name,
    verticals: provider.verticals,
    configured: Boolean(process.env[provider.envKey] ?? provider.defaultDestination),
  }));
}
