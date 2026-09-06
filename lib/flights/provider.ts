import { createQuery, getFlights, Passengers, type Flights } from 'fast-flights-ts';
import type { FlightOffer, FlightProvider, FlightSearchCriteria, FlightSegment } from './types';

const EUROPE_AIRPORTS = [
  'AMS', 'FCO', 'MAD', 'BCN', 'LIS', 'CPH', 'FRA', 'MUC', 'BER', 'VIE', 'PRG', 'BUD',
  'WAW', 'ARN', 'OSL', 'HEL', 'ATH', 'ZAG', 'VCE', 'MXP', 'NAP', 'BRU', 'DUS', 'HAM', 'GVA',
  'MAN', 'EDI', 'IST',
];

const REGION_AIRPORTS: Record<string, string[]> = {
  Europe: EUROPE_AIRPORTS,
  'North America': ['JFK', 'EWR', 'BOS', 'ATL', 'ORD', 'DFW', 'IAH', 'MIA', 'LAX', 'SFO', 'SEA', 'DEN', 'YYZ', 'YVR', 'MEX'],
  'South America': ['GRU', 'EZE', 'SCL', 'BOG', 'LIM', 'GIG'],
  Asia: ['NRT', 'HND', 'ICN', 'PEK', 'PVG', 'HKG', 'SIN', 'BKK', 'DEL', 'BOM', 'TPE', 'KUL'],
  Africa: ['JNB', 'CPT', 'CAI', 'NBO', 'CMN', 'ADD'],
  'Middle East': ['DOH', 'DXB', 'AUH', 'RUH', 'JED', 'IST', 'TLV'],
  Oceania: ['SYD', 'MEL', 'BNE', 'PER', 'AKL'],
};

function formatGoogleTime(date: readonly [number, number, number], time: readonly [number, number]) {
  const [year = 0, month = 1, day = 1] = date;
  const [hour = 0, minute = 0] = time;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function getLegs(result: Flights, origin: string, destination: string) {
  const flights = [...result.flights];
  const outbound = flights.filter((flight) => flight.from_airport.code === origin || flight.to_airport.code !== origin);
  const returnFlights = flights.filter((flight) => flight.from_airport.code === destination || flight.to_airport.code !== destination);

  if (outbound.length === 0 || returnFlights.length === 0) {
    return { outbound: flights, returnFlights: [] };
  }

  return {
    outbound: outbound.filter((flight) => flight.from_airport.code !== destination),
    returnFlights: returnFlights.filter((flight) => flight.from_airport.code !== origin),
  };
}

function countStops(flights: readonly Flights['flights'][number][]) {
  return Math.max(0, flights.length - 1);
}

function itineraryToOffer(
  result: Flights,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
): FlightOffer | null {
  if (!Number.isFinite(result.price)) return null;

  const segments: FlightSegment[] = result.flights.map((flight) => ({
    marketingCarrier: flight.from_airport.code,
    operatingCarrier: flight.from_airport.code,
    origin: flight.from_airport.code,
    destination: flight.to_airport.code,
    departure: formatGoogleTime(flight.departure.date, flight.departure.time),
    arrival: formatGoogleTime(flight.arrival.date, flight.arrival.time),
  }));

  const outbound = segments.filter((segment) => segment.departure.startsWith(departureDate));
  const returnSegments = segments.filter((segment) => segment.departure.startsWith(returnDate));
  const outboundStops = countStops(outbound);
  const returnStops = countStops(returnSegments);

  return {
    id: [departureDate, returnDate, origin, destination, result.airlines.join('-'), result.price, segments.map((segment) => `${segment.origin}-${segment.destination}`).join('|')].join(':'),
    price: result.price,
    currency: 'USD',
    origin,
    destination,
    departureDate,
    returnDate,
    stops: Math.max(outboundStops, returnStops),
    totalDurationMinutes: result.flights.reduce((total, flight) => total + flight.duration, 0),
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
  const query = createQuery({
    flights: [
      {
        date: departureDate,
        from_airport: origin,
        to_airport: destination,
        max_stops: criteria.maxStops,
        airlines: criteria.airlines.length > 0 ? criteria.airlines : undefined,
      },
      {
        date: returnDate,
        from_airport: destination,
        to_airport: origin,
        max_stops: criteria.maxStops,
        airlines: criteria.airlines.length > 0 ? criteria.airlines : undefined,
      },
    ],
    seat: criteria.cabin === 'premium_economy' ? 'premium-economy' : criteria.cabin,
    trip: 'round-trip',
    passengers: new Passengers({ adults: criteria.passengers }),
    currency: 'USD',
    max_stops: criteria.maxStops,
  });

  const results = await getFlights(query, {
    timeout: 15000,
    maxRetries: 2,
    retryDelay: 1500,
  });

  return results
    .filter((result) => result.price < criteria.maxPrice)
    .filter((result) => criteria.airlines.length === 0 || result.airlines.some((airline) => criteria.airlines.includes(airline)))
    .map((result) => itineraryToOffer(result, origin, destination, departureDate, returnDate))
    .filter((offer): offer is FlightOffer => Boolean(offer))
    .filter((offer) => criteria.maxStops === null || offer.stops <= criteria.maxStops);
}

class GoogleFlightsProvider implements FlightProvider {
  readonly name = 'google-flights';

  async search(criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
    const destination = criteria.destination;
    const destinations = destination.type === 'airport'
      ? [destination.value]
      : destination.type === 'airports'
        ? destination.value
        : destination.type === 'region'
          ? REGION_AIRPORTS[destination.value] ?? []
          : destination.type === 'city'
            ? [destination.value]
            : [];

    if (destinations.length === 0) return [];

    const departureDate = criteria.departureStart;
    const tripDays = Math.max(criteria.minTripDays, 1);
    const departure = new Date(`${departureDate}T00:00:00Z`);
    departure.setUTCDate(departure.getUTCDate() + tripDays);
    const returnDate = departure.toISOString().slice(0, 10);

    const results = await Promise.all(
      destinations.map((airport) => searchOne(criteria.origin, airport, departureDate, returnDate, criteria)),
    );

    return results.flat().sort((a, b) => a.price - b.price).slice(0, 25);
  }
}

export function getFlightProvider(): FlightProvider {
  return new GoogleFlightsProvider();
}
