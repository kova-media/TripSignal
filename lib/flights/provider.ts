import { FlightData, getFlights, type DecodedResult } from 'google-flights-ts';
import type { FlightOffer, FlightProvider, FlightSearchCriteria, FlightSegment } from './types';

const SKYTEAM_CARRIERS = new Set([
  'DL', 'AF', 'KL', 'VS', 'KE', 'AM', 'AR', 'AZ', 'CI', 'CZ', 'GA', 'MU', 'RO', 'SV', 'VN',
]);

const EUROPE_AIRPORTS = ['AMS', 'FCO', 'MAD', 'BCN', 'LIS', 'CPH'];

interface GoogleItinerary {
  airline_code?: string;
  airline_names?: string[];
  flights?: Array<{
    airline_code?: string;
    airline_name?: string;
    flight_number?: string;
    departure_airport?: string;
    arrival_airport?: string;
    departure_time?: string;
    arrival_time?: string;
  }>;
  layovers?: Array<{
    minutes?: number;
    departure_airport?: string;
  }>;
  travel_time?: number;
  departure_airport?: string;
  arrival_airport?: string;
  itinerary_summary?: {
    price?: number;
    currency?: string;
  };
}

function matchesAirline(itinerary: GoogleItinerary, airlines: string[]) {
  if (airlines.length === 0) return true;

  const codes = [
    itinerary.airline_code,
    ...(itinerary.flights ?? []).map((flight) => flight.airline_code),
  ].filter((value): value is string => Boolean(value));

  if (airlines.includes('DL')) return codes.includes('DL');
  if (airlines.includes('SKYTEAM')) return codes.some((code) => SKYTEAM_CARRIERS.has(code));
  return airlines.some((code) => codes.includes(code));
}

function itineraryToOffer(
  itinerary: GoogleItinerary,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
): FlightOffer | null {
  const price = itinerary.itinerary_summary?.price;
  if (typeof price !== 'number') return null;

  const segments: FlightSegment[] = (itinerary.flights ?? []).map((flight) => ({
    marketingCarrier: flight.airline_code ?? itinerary.airline_code ?? '—',
    operatingCarrier: flight.airline_code ?? itinerary.airline_code ?? '—',
    flightNumber: flight.flight_number,
    origin: flight.departure_airport ?? origin,
    destination: flight.arrival_airport ?? destination,
    departure: flight.departure_time ?? '',
    arrival: flight.arrival_time ?? '',
  }));

  const stops = Math.max(0, segments.length - 1);
  const id = [
    departureDate,
    returnDate,
    origin,
    destination,
    itinerary.airline_code ?? itinerary.airline_names?.join(',') ?? 'flight',
    price,
    segments.map((segment) => segment.flightNumber ?? '').join('-'),
  ].join(':');

  return {
    id,
    price,
    currency: itinerary.itinerary_summary?.currency ?? 'USD',
    origin,
    destination,
    departureDate,
    returnDate,
    stops,
    totalDurationMinutes: itinerary.travel_time,
    segments,
    source: 'Google Flights',
  } satisfies FlightOffer;
}

async function searchOne(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  criteria: FlightSearchCriteria,
): Promise<FlightOffer[]> {
  const result = await getFlights({
    flight_data: [
      new FlightData({
        date: departureDate,
        from_airport: origin,
        to_airport: destination,
      }),
      new FlightData({
        date: returnDate,
        from_airport: destination,
        to_airport: origin,
      }),
    ],
    trip: 'round-trip',
    adults: criteria.passengers,
    seat:
      criteria.cabin === 'premium_economy'
        ? 'premium-economy'
        : criteria.cabin,
    max_stops: criteria.maxStops ?? undefined,
    data_source: 'js',
    fetch_mode: 'common',
  });

  if (!result || !('best' in result)) return [];

  const decoded = result as DecodedResult;
  const itineraries = [...(decoded.best ?? []), ...(decoded.other ?? [])] as GoogleItinerary[];

  return itineraries
    .filter((itinerary) => matchesAirline(itinerary, criteria.airlines))
    .map((itinerary) => itineraryToOffer(itinerary, origin, destination, departureDate, returnDate))
    .filter((offer): offer is FlightOffer => Boolean(offer))
    .filter((offer) => offer.currency === 'USD' && offer.price < criteria.maxPrice)
    .filter((offer) => criteria.maxStops === null || offer.stops <= criteria.maxStops);
}

class GoogleFlightsProvider implements FlightProvider {
  readonly name = 'google-flights';

  async search(criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
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
      destinations.map((airport) =>
        searchOne(criteria.origin, airport, departureDate, returnDate, criteria),
      ),
    );

    return results.flat().sort((a, b) => a.price - b.price).slice(0, 25);
  }
}

export function getFlightProvider(): FlightProvider {
  return new GoogleFlightsProvider();
}
