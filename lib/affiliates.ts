export type AffiliateVertical = 'hotels' | 'cars' | 'activities' | 'transfers' | 'parking' | 'insurance';

export interface AffiliateContext {
  destination?: string;
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
];

const verticalLabels: Record<AffiliateVertical, string> = {
  hotels: 'Hotels',
  cars: 'Rental cars',
  activities: 'Things to do',
  transfers: 'Airport transfers',
  parking: 'Airport parking',
  insurance: 'Travel insurance',
};

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

export function getAffiliateProviders() {
  return providers.map((provider) => ({
    key: provider.key,
    name: provider.name,
    verticals: provider.verticals,
    configured: Boolean(process.env[provider.envKey] ?? provider.defaultDestination),
  }));
}
