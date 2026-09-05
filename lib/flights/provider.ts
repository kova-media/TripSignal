import type { FlightOffer, FlightProvider, FlightSearchCriteria, FlightSegment } from './types';

const SKYTEAM_CARRIERS = new Set([
  'DL', 'AF', 'KL', 'VS', 'KE', 'AM', 'AR', 'AZ', 'CI', 'CZ', 'GA', 'MU', 'RO', 'SV', 'VN',
]);

const EUROPE_AIRPORTS = ['AMS', 'FCO', 'MAD', 'BCN', 'LIS', 'CPH'];

interface DuffelSegment {
  origin?: { iata_code?: string };
  destination?: { iata_code?: string };
  departing_at?: string;
  arriving_at?: string;
  flight_number?: string;
  marketing_carrier?: { iata_code?: string };
  operating_carrier?: { iata_code?: string };
}

interface DuffelOffer {
  id: string;
  total_amount?: string;
  total_currency?: string;
  slices?: Array<{ segments?: DuffelSegment[] }>;
}

interface DuffelResponse {
  data?: {
    offers?: DuffelOffer[];
  };
}

function toSegments(offer: DuffelOffer): FlightSegment[] {
  return (offer.slices ?? []).flatMap((slice) =>
    (slice.segments ?? []).map((segment) => ({
      marketingCarrier: segment.marketing_carrier?.iata_code ?? '—',
      operatingCarrier: segment.operating_carrier?.iata_code ?? '—',
      flightNumber: segment.flight_number,
      origin: segment.origin?.iata_code ?? '—',
      destination: segment.destination?.iata_code ?? '—',
      departure: segment.departing_at ?? '',
      arrival: segment.arriving_at ?? '',
    }))
  );
}

function matchesAirline(offer: DuffelOffer, airlines: string[]) {
  if (airlines.length === 0) return true;
  const segments = toSegments(offer);
  if (airlines.includes('DL')) {
    return segments.some((segment) => segment.marketingCarrier === 'DL' || segment.operatingCarrier === 'DL');
  }
  if (airlines.includes('SKYTEAM')) {
    return segments.some((segment) => SKYTEAM_CARRIERS.has(segment.marketingCarrier) || SKYTEAM_CARRIERS.has(segment.operatingCarrier));
  }
  return airlines.some((code) => segments.some((segment) => segment.marketingCarrier === code || segment.operatingCarrier === code));
}

async function searchOne(
  token: string,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  criteria: FlightSearchCriteria,
): Promise<FlightOffer[]> {
  const response = await fetch(
    'https://api.duffel.com/air/offer_requests?return_offers=true&view=offers&supplier_timeout=8000',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Duffel-Version': 'v2',
      },
      body: JSON.stringify({
        data: {
          cabin_class: criteria.cabin,
          max_connections: criteria.maxStops ?? 1,
          passengers: Array.from({ length: criteria.passengers }, () => ({ type: 'adult' })),
          slices: [
            { origin, destination, departure_date: departureDate },
            { origin: destination, destination: origin, departure_date: returnDate },
          ],
        },
      }),
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Duffel search failed (${response.status}): ${body.slice(0, 500)}`);
  }

  const json = (await response.json()) as DuffelResponse;
  return (json.data?.offers ?? [])
    .filter((offer) => offer.total_amount && offer.total_currency)
    .filter((offer) => offer.total_currency === 'USD')
    .filter((offer) => Number(offer.total_amount) < criteria.maxPrice)
    .filter((offer) => matchesAirline(offer, criteria.airlines))
    .map((offer) => {
      const segments = toSegments(offer);
      const stops = Math.max(0, segments.length - 2);
      return {
        id: offer.id,
        price: Number(offer.total_amount),
        currency: offer.total_currency ?? 'USD',
        origin,
        destination,
        departureDate,
        returnDate,
        stops,
        segments,
        source: 'Duffel',
      } satisfies FlightOffer;
    });
}

class DuffelFlightProvider implements FlightProvider {
  readonly name = 'duffel';

  async search(criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
    const token = process.env.DUFFEL_ACCESS_TOKEN;
    if (!token) {
      throw new Error('DUFFEL_ACCESS_TOKEN is not configured. Add a Duffel access token to the Vercel environment.');
    }

    const destination = criteria.destination;
    const destinations =
      destination.type === 'airport'
        ? [destination.value]
        : destination.type === 'airports'
          ? destination.value
          : destination.type === 'region' && destination.value.toLowerCase() === 'europe'
            ? EUROPE_AIRPORTS
            : destination.type === 'city'
              ? [destination.value]
              : ['AMS'];

    const departureDate = criteria.departureStart;
    const tripDays = Math.max(criteria.minTripDays, 1);
    const departure = new Date(`${departureDate}T00:00:00Z`);
    departure.setUTCDate(departure.getUTCDate() + tripDays);
    const returnDate = departure.toISOString().slice(0, 10);

    const results = await Promise.all(
      destinations.map((airport) => searchOne(token, criteria.origin, airport, departureDate, returnDate, criteria))
    );

    return results.flat().sort((a, b) => a.price - b.price).slice(0, 25);
  }
}

export function getFlightProvider(): FlightProvider {
  return new DuffelFlightProvider();
}
