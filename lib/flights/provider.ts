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

export const REGION_NAMES = Object.keys(REGION_AIRPORTS);

// Google Flights has no official API — TripSignal reaches it through
// fast-flights-ts, an unofficial scraper, and Google rate-limits bursts of
// it (HTTP 429). Searches therefore run one at a time with a gap between
// them, and a 429 backs off and retries instead of failing the whole alert
// check outright.
const SEARCH_DELAY_MS = 1200;
const MAX_DESTINATIONS_PER_CHECK = 12;
const RATE_LIMIT_RETRY_DELAYS_MS = [5000, 15000, 30000];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimited(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes('429') || message.toLowerCase().includes('too many requests');
}

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

  const maxAttempts = 4; // first try + up to 3 retries when Google rate-limits
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
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
      if (message.includes('RPC response missing flight data')) {
        console.warn(`TripSignal Google Flights returned malformed RPC data for ${origin}-${destination} on ${departureDate}; skipping this sample.`);
        // Throw instead of returning []: when every sample is malformed the
        // caller must record an error run, not a success with 0 offers.
        // A single malformed sample among successful ones is still
        // absorbed by the per-search catch in search().
        throw new Error(`Google Flights returned malformed data for ${origin}-${destination} on ${departureDate}.`);
      }
      if (isRateLimited(error) && attempt < maxAttempts - 1) {
        const delay = RATE_LIMIT_RETRY_DELAYS_MS[attempt] ?? 30000;
        console.warn(`TripSignal Google Flights rate-limited ${origin}-${destination} on ${departureDate}; retrying in ${delay / 1000}s (attempt ${attempt + 2}/${maxAttempts}).`);
        await sleep(delay);
        continue;
      }
      throw error;
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
    else if (destination.type === 'region') destinations = REGION_AIRPORTS[destination.value] ?? [];
    else if (destination.type === 'country') destinations = await getAirportsForCountry(destination.value);
    else destinations = [];
    // Empty destinations used to return [] and record a success run with 0
    // offers. That is no data, not a success — throw so callers record an
    // error run and interactive callers can show a friendly "no data" state.
    if (destinations.length === 0) throw new Error(`No destinations available for ${destination.type} "${destination.value}".`);

    // A region or country can fan out to dozens of airports. Check only a
    // subset per run and rotate it daily, so every airport gets covered over
    // time without firing dozens of requests in one check.
    const multiAirport = destination.type === 'region' || destination.type === 'country';
    if (multiAirport && destinations.length > MAX_DESTINATIONS_PER_CHECK) {
      const day = Math.floor(Date.now() / 86400000);
      const start = (day * MAX_DESTINATIONS_PER_CHECK) % destinations.length;
      destinations = Array.from({ length: MAX_DESTINATIONS_PER_CHECK }, (_, i) => destinations[(start + i) % destinations.length]!);
    }

    const departureDate = criteria.departureStart;
    const allReturnDays = returnTripDays(criteria);
    // Fewer return dates when several airports are involved: min and max trip
    // lengths only. Single-airport checks keep all three.
    const returnDays = multiAirport
      ? Array.from(new Set([allReturnDays[0]!, allReturnDays[allReturnDays.length - 1]!]))
      : allReturnDays;
    const returnDates = returnDays.map((days) => {
      const departure = new Date(`${departureDate}T00:00:00Z`);
      departure.setUTCDate(departure.getUTCDate() + days);
      return departure.toISOString().slice(0, 10);
    });

    // One search at a time with a gap between them. Firing them all in
    // parallel is what got TripSignal rate-limited. A single failed search
    // skips that airport/date instead of failing the whole check.
    const jobs: Array<{ airport: string; returnDate: string }> = criteria.tripType === 'one-way'
      ? destinations.map((airport) => ({ airport, returnDate: departureDate }))
      : destinations.flatMap((airport) => returnDates.map((returnDate) => ({ airport, returnDate })));
    const results: FlightOffer[][] = [];
    let failures = 0;
    for (let i = 0; i < jobs.length; i += 1) {
      const job = jobs[i]!;
      try {
        results.push(await searchOne(criteria.origin, job.airport, departureDate, job.returnDate, criteria));
      } catch (error) {
        failures += 1;
        console.warn(`TripSignal search failed for ${criteria.origin}-${job.airport} on ${departureDate}:`, error instanceof Error ? error.message : error);
      }
      if (i < jobs.length - 1) await sleep(SEARCH_DELAY_MS);
    }
    const offers = results.flat();
    if (offers.length === 0 && failures > 0) {
      throw new Error('All flight searches failed (Google Flights rate-limited TripSignal).');
    }
    return offers.sort((a, b) => a.price - b.price).slice(0, 25);
  }
}

export function getFlightProvider(): FlightProvider {
  return new GoogleFlightsProvider();
}
