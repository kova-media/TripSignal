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
}

const providers: AffiliateProvider[] = [
  { key: 'travelpayouts', name: 'Travelpayouts', verticals: ['hotels', 'activities', 'transfers', 'insurance'], envKey: 'TRIPSIGNAL_AFFILIATE_TRAVELPAYOUTS_URL' },
  { key: 'discovercars', name: 'Discover Cars', verticals: ['cars'], envKey: 'TRIPSIGNAL_AFFILIATE_DISCOVERCARS_URL' },
  { key: 'awin-parking', name: 'Airport Parking', verticals: ['parking'], envKey: 'TRIPSIGNAL_AFFILIATE_PARKING_URL' },
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

  const destination = process.env[provider.envKey];
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

  return url.toString();
}

export function getAffiliateProviders() {
  return providers.map((provider) => ({
    key: provider.key,
    name: provider.name,
    verticals: provider.verticals,
    configured: Boolean(process.env[provider.envKey]),
  }));
}
