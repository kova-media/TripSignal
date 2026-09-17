export type LoungeAirportContext = 'departure' | 'layover' | 'arrival';

export type LoungeRecord = {
  id: string;
  airport: string;
  name: string;
  terminal?: string | null;
  location?: string | null;
  airside?: boolean | null;
  accessMethods: string[];
  membershipRequired?: boolean | null;
  dayPassPrice?: string | null;
  hourlyPrice?: string | null;
  maxStay?: string | null;
  amenities: string[];
  guestPolicy?: string | null;
  hours?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
};

export function normalizeAirportCode(value: unknown) {
  const code = String(value ?? '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(code) ? code : '';
}

export function loungeDirectoryLinks(airport: string) {
  const code = normalizeAirportCode(airport);
  if (!code) return [];
  return [
    {
      name: 'Priority Pass',
      description: `Check participating lounges at ${code}, access rules and current conditions.`,
      url: 'https://www.prioritypass.com/en-GB/airport-lounges',
    },
    {
      name: 'Plaza Premium',
      description: `Check paid lounge passes and eligible locations for ${code}.`,
      url: 'https://www.plazapremiumlounge.com/en-uk/landing-pages/eligible-locations',
    },
  ];
}

export function extractAirportContexts(offer: any) {
  const allSegments = Array.isArray(offer?.segments) ? offer.segments : [];
  const departureDate = String(offer?.departureDate ?? '').slice(0, 10);
  const outboundSegments = departureDate
    ? allSegments.filter((segment: any) => String(segment?.departure ?? '').slice(0, 10) === departureDate)
    : allSegments;
  const segments = outboundSegments.length > 0 ? outboundSegments : allSegments;
  const contexts: Array<{ airport: string; context: LoungeAirportContext; segmentIndex?: number; arrival?: string; departure?: string }> = [];

  const firstOrigin = normalizeAirportCode(segments[0]?.origin ?? offer?.origin);
  if (firstOrigin) contexts.push({ airport: firstOrigin, context: 'departure' });

  segments.forEach((segment: any, index: number) => {
    const destination = normalizeAirportCode(segment?.destination);
    if (!destination) return;
    const isFinal = index === segments.length - 1;
    if (!isFinal) {
      contexts.push({
        airport: destination,
        context: 'layover',
        segmentIndex: index,
        arrival: segment?.arrival,
        departure: segments[index + 1]?.departure,
      });
    }
  });

  const finalDestination = normalizeAirportCode(segments[segments.length - 1]?.destination ?? offer?.destination);
  if (finalDestination && finalDestination !== firstOrigin) contexts.push({ airport: finalDestination, context: 'arrival' });

  const seen = new Set<string>();
  return contexts.filter((item) => {
    const key = `${item.airport}:${item.context}:${item.segmentIndex ?? ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
