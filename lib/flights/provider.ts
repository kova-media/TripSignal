import { createQuery, getFlights, Passengers, type Flights } from 'fast-flights-ts';
import type { FlightOffer, FlightProvider, FlightSearchCriteria, FlightSegment } from './types';
import { getAirportsForCountry } from './country-airports';

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

function itineraryToOffer(result: Flights, origin: string, destination: string, departureDate: string, returnDate: string, tripType: FlightSearchCriteria['tripType']): FlightOffer | null {
  if (!Number.isFinite(result.price) || result.price <= 0) return null;
  const segments: FlightSegment[] = result.flights.map((flight) => ({
    marketingCarrier: result.airlines.join(', ') || 'Unknown airline',
    operatingCarrier: result.airlines.join(', ') || 'Unknown airline',
    origin: flight.from_airport.code,
    destination: flight.to_airport.code,
    departure: formatGoogleTime(flight.departure.date, flight.departure.time),
    arrival: formatGoogleTime(flight.arrival.date, flight.arrival.time),
  }));
  const outboundSegments = result.flights.filter((flight) => formatGoogleTime(flight.departure.date, flight.departure.time).startsWith(departureDate));
  const returnSegments = tripType === 'round-trip'
    ? result.flights.filter((flight) => formatGoogleTime(flight.departure.date, flight.departure.time).startsWith(returnDate))
    : [];
  return {
    id: [tripType, departureDate, returnDate, origin, destination, result.airlines.join('-'), result.price, segments.map((segment) => `${segment.origin}-${segment.destination}`).join('|')].join(':'),
    price: result.price,
    currency: 'USD',
    origin,
    destination,
    departureDate,
    returnDate,
    stops: Math.max(0, outboundSegments.length - 1, returnSegments.length - 1),
    totalDurationMinutes: result.flights.reduce((total, flight) => total + flight.duration, 0),
    segments,
    source: 'Google Flights',
  } satisfies FlightOffer;
}

async function searchOne(origin: string, destination: string, departureDate: string, returnDate: string, criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
  const flights = [{
    date: departureDate,
    from_airport: origin,
    to_airport: destination,
    max_stops: criteria.maxStops,
    airlines: criteria.airlines.length > 0 ? criteria.airlines : undefined,
  }];
  if (criteria.tripType === 'round-trip') {
    flights.push({
      date: returnDate,
      from_airport: destination,
      to_airport: origin,
      max_stops: criteria.maxStops,
      airlines: criteria.airlines.length > 0 ? criteria.airlines : undefined,
    });
  }
  const query = createQuery({
    flights,
    seat: criteria.cabin === 'premium_economy' ? 'premium-economy' : criteria.cabin,
    trip: criteria.tripType,
    passengers: new Passengers({ adults: criteria.passengers }),
    currency: 'USD',
    max_stops: criteria.maxStops,
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const results = await getFlights(query, { timeout: 15000, maxRetries: 2, retryDelay: 1500 });
      return results
        .filter((result) => Number.isFinite(result.price) && result.price > 0)
        .filter((result) => criteria.airlines.length === 0 || result.airlines.some((airline) => criteria.airlines.includes(airline)))
        .map((result) => itineraryToOffer(result, origin, destination, departureDate, returnDate, criteria.tripType))
        .filter((offer): offer is FlightOffer => Boolean(offer))
        .filter((offer) => criteria.maxStops === null || offer.stops <= criteria.maxStops);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const malformedRpcResponse = message.includes('RPC response missing flight data');
      if (!malformedRpcResponse || attempt === 1) {
        if (malformedRpcResponse) {
          console.warn(`TripSignal Google Flights returned malformed RPC data for ${origin}-${destination} on ${departureDate}; skipping this sample.`);
          return [];
        }
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 750));
    }
  }
  return [];
}

function returnTripDays(criteria: FlightSearchCriteria) {
  const min = Math.max(criteria.minTripDays, 1);
  const max = Math.max(criteria.maxTripDays, min);
  const midpoint = Math.round((min + max) / 2);
  return Array.from(new Set([min, midpoint, max]));
}

class GoogleFlightsProvider implements FlightProvider {
  readonly name = 'google-flights';

  async search(criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
    const destination = criteria.destination;
    let destinations: string[];
    if (destination.type === 'airport') destinations = [destination.value];
    else if (destination.type === 'airports') destinations = destination.value;
    else if (destination.type === 'region') destinations = REGION_AIRPORTS[destination.value] ?? [];
    else if (destination.type === 'country') destinations = await getAirportsForCountry(destination.value);
    else if (destination.type === 'city') destinations = [destination.value];
    else destinations = [];
    if (destinations.length === 0) return [];

    const departureDate = criteria.departureStart;
    if (criteria.tripType === 'one-way') {
      const results = await Promise.all(destinations.map((airport) => searchOne(criteria.origin, airport, departureDate, departureDate, criteria)));
      return results.flat().sort((a, b) => a.price - b.price).slice(0, 25);
    }

    const returnDates = returnTripDays(criteria).map((days) => {
      const departure = new Date(`${departureDate}T00:00:00Z`);
      departure.setUTCDate(departure.getUTCDate() + days);
      return departure.toISOString().slice(0, 10);
    });
    const results = await Promise.all(destinations.flatMap((airport) => returnDates.map((returnDate) => searchOne(criteria.origin, airport, departureDate, returnDate, criteria))));
    return results.flat().sort((a, b) => a.price - b.price).slice(0, 25);
  }
}

export function getFlightProvider(): FlightProvider {
  return new GoogleFlightsProvider();
}
