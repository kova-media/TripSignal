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
//
// Nov 14, 2026 (free mitigation): Google kept rate-limiting TripSignal even
// after the 1.2s gaps / 12-airport cap, and the Nov 14 cron run failed 6 of
// 6. The site shares Vercel's egress IPs with every other scraper on the
// platform, so the only free lever is to ask less, more slowly: 6 airports
// per region check instead of 12, 3s between requests instead of 1.2s. That
// halves the requests per run. If this still fails, the real fix is a paid
// flight-data API, not more scraping.
//
// Nov 23, 2026: the paid API is now FlightPowers (RapidAPI "Google Flights
// Live API", by mtnrabi) — see FlightPowersProvider below. Same Google
// Flights read, fetched from their servers via residential proxies, so
// Vercel's IPs are not involved. Test plan CUSTOM-kova-test-2000-14d:
// $0, 2,000 requests, hard limit, expires Dec 6, 2026. No payment method
// is on file, so it cannot charge. PRO ($10/mo for 2,500) only on Damian's
// say-so after the test. RAPIDAPI_KEY set selects FlightPowers; unset
// falls back to the scraper above.
const SEARCH_DELAY_MS = 3000;
const MAX_DESTINATIONS_PER_CHECK = 6;
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

// FlightPowers (RapidAPI "Google Flights Live API", by mtnrabi) — Nov 23, 2026.
// The scraper above is rate-limited on Vercel's shared egress IPs (0 fare
// signals ever sent). FlightPowers runs the same Google Flights read from
// their own servers via residential proxies, so Vercel IPs are not involved.
//
// Shape: one cheapest_dates call prices up to 61 days of departure dates
// on one route (calendar estimates, no flight details), then a roundtrip /
// oneway call confirms a picked date with the real itinerary. The scan
// below mirrors the scraper's sampling (salts pick the departure start;
// region/country rotate airports) but each call covers 61 days instead of
// one date, so a run costs a handful of requests where the scraper spent
// one fetch per date pair. A 503 / degraded answer means Google did not
// answer in time and is safe to retry — the Nov 23 smoke test needed two
// retries before a 200.
const FLIGHTPOWERS_HOST = 'google-flights-live-api.p.rapidapi.com';
const FLIGHTPOWERS_BASE = `https://${FLIGHTPOWERS_HOST}/api/google_flights`;
const FLIGHTPOWERS_RETRY_DELAYS_MS = [5000, 15000];
const FLIGHTPOWERS_TIMEOUT_MS = 60000;

type CheapestDateRow = { departure_date?: string; return_date?: string | null; price?: number | null };
type CheapestDatesResponse = { dates?: CheapestDateRow[] };

type RoundTripItinerary = {
  total_price_as_number?: number;
  total_duration_seconds?: number;
  total_stops?: number;
  departure_flight_airline?: string;
  departure_flight_duration?: string;
  departure_flight_stops?: number;
  departure_flight_departure_description?: string;
  departure_flight_arrival_description?: string;
  return_flight_airline?: string;
  return_flight_duration?: string;
  return_flight_stops?: number;
  return_flight_departure_description?: string;
  return_flight_arrival_description?: string;
  buy_link?: string;
};

type OneWayItinerary = {
  price_as_number?: number;
  airline?: string;
  duration?: string;
  duration_seconds?: number;
  stops?: number;
  departure_description?: string;
  arrival_description?: string;
  buy_link?: string;
};

function cabinToSeatType(cabin: FlightSearchCriteria['cabin']): number {
  if (cabin === 'premium_economy') return 2;
  if (cabin === 'business') return 3;
  if (cabin === 'first') return 4;
  return 1;
}

function addDays(date: string, days: number): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  parsed.setUTCDate(parsed.getUTCDate() + days);
  return parsed.toISOString().slice(0, 10);
}

async function flightPowersFetch(apiKey: string, path: string, body: Record<string, unknown>): Promise<unknown> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FLIGHTPOWERS_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(`${FLIGHTPOWERS_BASE}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-rapidapi-key': apiKey,
          'x-rapidapi-host': FLIGHTPOWERS_HOST,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      if (attempt < 2) {
        await sleep(FLIGHTPOWERS_RETRY_DELAYS_MS[attempt] ?? 15000);
        continue;
      }
      throw new Error(`FlightPowers request failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    clearTimeout(timeout);
    const searchStatus = res.headers.get('x-search-status');
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(`FlightPowers key was rejected (HTTP ${res.status}). Check RAPIDAPI_KEY.`);
    }
    if (res.status === 429) {
      if (attempt < 2) {
        await sleep(FLIGHTPOWERS_RETRY_DELAYS_MS[attempt] ?? 15000);
        continue;
      }
      throw new Error('FlightPowers rate-limited TripSignal (HTTP 429).');
    }
    if (res.status === 503 || searchStatus === 'degraded' || searchStatus === 'partial') {
      if (attempt < 2) {
        await sleep(FLIGHTPOWERS_RETRY_DELAYS_MS[attempt] ?? 15000);
        continue;
      }
      throw new Error('FlightPowers search did not complete (Google Flights did not answer).');
    }
    if (res.status === 422) {
      throw new Error(`FlightPowers refused the request (HTTP 422): ${JSON.stringify(json)?.slice(0, 300) ?? ''}`);
    }
    if (!res.ok) throw new Error(`FlightPowers request failed (HTTP ${res.status}).`);
    return json;
  }
  throw new Error('FlightPowers request failed.');
}

// "5:05 PM on Tue, Oct 6" → ISO datetime. The year comes from the known
// travel date; the month/day come from the text when present.
function parseDescriptionTime(text: string | undefined, fallbackDate: string): string | null {
  if (!text) return null;
  const time = text.match(/(\d{1,2}):(\d{2})\s*([AP])\.?\s*M\.?/i);
  if (!time || !time[1] || !time[2]) return null;
  let hour = Number(time[1]);
  const minute = Number(time[2]);
  const meridiem = (time[3] ?? '').toUpperCase();
  if (meridiem === 'P' && hour < 12) hour += 12;
  if (meridiem === 'A' && hour === 12) hour = 0;
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const [fallbackYear, fallbackMonth, fallbackDay] = fallbackDate.split('-').map(Number);
  let year = fallbackYear ?? 2026;
  let month = fallbackMonth ?? 1;
  let day = fallbackDay ?? 1;
  const monthMatch = text.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2})/i);
  if (monthMatch && monthMatch[1] && monthMatch[2]) {
    month = monthNames.indexOf(monthMatch[1].toLowerCase()) + 1;
    day = Number(monthMatch[2]);
    // A December date on a January fallback (or vice versa) belongs to the
    // adjacent year.
    if (fallbackMonth === 1 && month === 12) year -= 1;
    if (fallbackMonth === 12 && month === 1) year += 1;
  }
  if (!month || !day) return null;
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
}

function parseDurationMinutes(text: string | undefined): number | null {
  if (!text) return null;
  const hours = text.match(/(\d+)\s*hr/i);
  const minutes = text.match(/(\d+)\s*min/i);
  const total = (hours && hours[1] ? Number(hours[1]) * 60 : 0) + (minutes && minutes[1] ? Number(minutes[1]) : 0);
  return total > 0 ? total : null;
}

// First defined value among candidate keys — the leg description fields
// are documented as plain-text departure/arrival descriptions, and the
// exact key spelling varies by endpoint.
function pickDescription(obj: object, keys: string[]): string | undefined {
  const record = obj as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function legSegment(
  carrier: string | undefined,
  origin: string,
  destination: string,
  departureText: string | undefined,
  arrivalText: string | undefined,
  durationText: string | undefined,
  fallbackDate: string,
  fallbackMinutes: number | null,
): FlightSegment {
  const carrierLabel = carrier && carrier.length > 0 ? carrier : 'Unknown airline';
  const departure = parseDescriptionTime(departureText, fallbackDate) ?? `${fallbackDate}T00:00:00`;
  let arrival = parseDescriptionTime(arrivalText, fallbackDate);
  if (!arrival) {
    const minutes = parseDurationMinutes(durationText) ?? fallbackMinutes ?? 120;
    arrival = new Date(new Date(`${departure}Z`).getTime() + minutes * 60000).toISOString().slice(0, 19);
  }
  if (new Date(`${arrival}Z`).getTime() < new Date(`${departure}Z`).getTime()) {
    arrival = new Date(new Date(`${arrival}Z`).getTime() + 86400000).toISOString().slice(0, 19);
  }
  return { marketingCarrier: carrierLabel, operatingCarrier: carrierLabel, origin, destination, departure, arrival };
}

function roundTripToOffer(it: RoundTripItinerary, origin: string, destination: string, departureDate: string, returnDate: string): FlightOffer | null {
  const price = it.total_price_as_number;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  const legMinutes = typeof it.total_duration_seconds === 'number' ? Math.round(it.total_duration_seconds / 60) : null;
  const outMinutes = parseDurationMinutes(it.departure_flight_duration);
  const retMinutes = parseDurationMinutes(it.return_flight_duration);
  const outbound = legSegment(
    it.departure_flight_airline, origin, destination,
    pickDescription(it, ['departure_flight_departure_description', 'departure_departure_description']),
    pickDescription(it, ['departure_flight_arrival_description', 'departure_arrival_description']),
    it.departure_flight_duration, departureDate, outMinutes ?? (legMinutes !== null ? Math.round(legMinutes / 2) : null),
  );
  const ret = legSegment(
    it.return_flight_airline, destination, origin,
    pickDescription(it, ['return_flight_departure_description', 'return_departure_description']),
    pickDescription(it, ['return_flight_arrival_description', 'return_arrival_description']),
    it.return_flight_duration, returnDate, retMinutes ?? (legMinutes !== null ? Math.round(legMinutes / 2) : null),
  );
  const airlines = [it.departure_flight_airline, it.return_flight_airline].filter((a): a is string => typeof a === 'string' && a.length > 0).join('-') || 'Unknown airline';
  const stops = typeof it.total_stops === 'number' ? it.total_stops
    : (typeof it.departure_flight_stops === 'number' ? it.departure_flight_stops : 0)
      + (typeof it.return_flight_stops === 'number' ? it.return_flight_stops : 0);
  return {
    id: ['round-trip', departureDate, returnDate, origin, destination, airlines, price, `${origin}-${destination}|${destination}-${origin}`].join(':'),
    price,
    currency: 'USD',
    origin,
    destination,
    departureDate,
    returnDate,
    stops,
    totalDurationMinutes: legMinutes ?? undefined,
    segments: [outbound, ret],
    bookingUrl: it.buy_link,
    source: 'FlightPowers',
  } satisfies FlightOffer;
}

function oneWayToOffer(it: OneWayItinerary, origin: string, destination: string, departureDate: string): FlightOffer | null {
  const price = it.price_as_number;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
  const minutes = parseDurationMinutes(it.duration) ?? (typeof it.duration_seconds === 'number' ? Math.round(it.duration_seconds / 60) : null);
  const segment = legSegment(it.airline, origin, destination, it.departure_description, it.arrival_description, it.duration, departureDate, minutes);
  return {
    id: ['one-way', departureDate, departureDate, origin, destination, it.airline ?? 'Unknown airline', price, `${origin}-${destination}`].join(':'),
    price,
    currency: 'USD',
    origin,
    destination,
    departureDate,
    returnDate: departureDate,
    stops: typeof it.stops === 'number' ? it.stops : 0,
    totalDurationMinutes: minutes ?? undefined,
    segments: [segment],
    bookingUrl: it.buy_link,
    source: 'FlightPowers',
  } satisfies FlightOffer;
}

async function cheapestDates(
  apiKey: string,
  origin: string,
  destination: string,
  from: string,
  to: string,
  nights: number | null,
  passengers: number,
): Promise<Array<{ departureDate: string; returnDate: string | null; price: number }>> {
  const body: Record<string, unknown> = {
    from_airport: origin,
    to_airport: destination,
    departure_date_from: from,
    departure_date_to: to,
    currency: 'USD',
    adults: Math.min(Math.max(passengers, 1), 9),
  };
  if (nights !== null) body.nights = nights;
  const json = await flightPowersFetch(apiKey, '/cheapest_dates/v1', body);
  const data = (json ?? {}) as CheapestDatesResponse;
  const dates = Array.isArray(data.dates) ? data.dates : [];
  return dates
    .filter((row): row is { departure_date: string; return_date?: string | null; price: number } =>
      typeof row?.departure_date === 'string' && typeof row?.price === 'number' && Number.isFinite(row.price) && row.price > 0)
    .map((row) => ({ departureDate: row.departure_date, returnDate: typeof row.return_date === 'string' ? row.return_date : null, price: row.price }));
}

async function confirmRoundTrip(
  apiKey: string,
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  criteria: FlightSearchCriteria,
): Promise<FlightOffer | null> {
  const body: Record<string, unknown> = {
    from_airport: origin,
    to_airport: destination,
    departure_date: departureDate,
    return_date: returnDate,
    currency: 'USD',
    sort_type: 'Price',
    limit: 3,
    seat_type: cabinToSeatType(criteria.cabin),
    passengers: Array.from({ length: Math.min(Math.max(criteria.passengers, 1), 9) }, () => 1),
    max_price: Math.ceil(criteria.maxPrice),
  };
  if (criteria.maxStops !== null) {
    body.max_departure_stops = criteria.maxStops;
    body.max_return_stops = criteria.maxStops;
  }
  if (criteria.airlines.length > 0) {
    body.departure_airline_codes = criteria.airlines;
    body.return_airline_codes = criteria.airlines;
  }
  const json = await flightPowersFetch(apiKey, '/roundtrip/v1', body);
  const list = (Array.isArray(json) ? json : []) as RoundTripItinerary[];
  const valid = list
    .filter((it) => typeof it?.total_price_as_number === 'number' && Number.isFinite(it.total_price_as_number) && it.total_price_as_number > 0)
    .sort((a, b) => (a.total_price_as_number ?? Infinity) - (b.total_price_as_number ?? Infinity));
  const best = valid[0];
  return best ? roundTripToOffer(best, origin, destination, departureDate, returnDate) : null;
}

async function confirmOneWay(
  apiKey: string,
  origin: string,
  destination: string,
  departureDate: string,
  criteria: FlightSearchCriteria,
): Promise<FlightOffer | null> {
  const body: Record<string, unknown> = {
    from_airport: origin,
    to_airport: destination,
    departure_date: departureDate,
    currency: 'USD',
    sort_type: 'Price',
    limit: 3,
    seat_type: cabinToSeatType(criteria.cabin),
    passengers: Array.from({ length: Math.min(Math.max(criteria.passengers, 1), 9) }, () => 1),
    max_price: Math.ceil(criteria.maxPrice),
  };
  if (criteria.maxStops !== null) body.max_stops = criteria.maxStops;
  if (criteria.airlines.length > 0) body.airline_codes = criteria.airlines;
  const json = await flightPowersFetch(apiKey, '/oneway/v1', body);
  const list = (Array.isArray(json) ? json : []) as OneWayItinerary[];
  const valid = list
    .filter((it) => typeof it?.price_as_number === 'number' && Number.isFinite(it.price_as_number) && it.price_as_number > 0)
    .sort((a, b) => (a.price_as_number ?? Infinity) - (b.price_as_number ?? Infinity));
  const best = valid[0];
  return best ? oneWayToOffer(best, origin, destination, departureDate) : null;
}

class FlightPowersProvider implements FlightProvider {
  readonly name = 'flightpowers';

  constructor(private apiKey: string) {}

  async search(criteria: FlightSearchCriteria): Promise<FlightOffer[]> {
    const destination = criteria.destination;
    let destinations: string[];
    if (destination.type === 'airport') destinations = [destination.value];
    else if (destination.type === 'region') destinations = REGION_AIRPORTS[destination.value] ?? [];
    else if (destination.type === 'country') destinations = await getAirportsForCountry(destination.value);
    else destinations = [];
    if (destinations.length === 0) throw new Error(`No destinations available for ${destination.type} "${destination.value}".`);

    const multiAirport = destination.type === 'region' || destination.type === 'country';
    if (multiAirport && destinations.length > MAX_DESTINATIONS_PER_CHECK) {
      const day = Math.floor(Date.now() / 86400000);
      const start = (day * MAX_DESTINATIONS_PER_CHECK) % destinations.length;
      destinations = Array.from({ length: MAX_DESTINATIONS_PER_CHECK }, (_, i) => destinations[(start + i) % destinations.length]!);
    }

    // One calendar call covers 61 departure dates per airport, so the
    // scan below costs a handful of requests where the scraper spent one
    // fetch per date pair. Trip lengths: min and max for a single airport,
    // the midpoint only when several airports are involved.
    //
    // Google only shows fares 330 days ahead: clamp the scan to that
    // horizon, or the API refuses the whole request with a 422 (the first
    // live run Nov 23 failed 5 of 6 alerts this way — sampled departure
    // dates near the end of a 12-month window sit past it).
    const horizon = addDays(new Date().toISOString().slice(0, 10), 330);
    const scanFrom = criteria.departureStart <= horizon ? criteria.departureStart : horizon;
    let rangeEnd = addDays(scanFrom, 60);
    if (rangeEnd > criteria.departureEnd) rangeEnd = criteria.departureEnd;
    if (rangeEnd > horizon) rangeEnd = horizon;
    const nightsList: Array<number | null> = criteria.tripType === 'one-way'
      ? [null]
      : multiAirport
        ? [Math.round((criteria.minTripDays + criteria.maxTripDays) / 2)]
        : Array.from(new Set([criteria.minTripDays, criteria.maxTripDays]));

    // Calendar calls run in parallel: they are independent, the plan
    // allows 1,000 requests an hour, and the vendor documents parallel
    // date scans. Each call still records its own failure instead of
    // failing the whole check.
    let failures = 0;
    let lastError = '';
    let calendarCalls = 0;
    const hits: Array<{ airport: string; departureDate: string; returnDate: string | null; price: number }> = [];
    const calendarJobs: Array<Promise<void>> = [];
    for (const airport of destinations) {
      for (const nights of nightsList) {
        calendarJobs.push(
          cheapestDates(this.apiKey, criteria.origin, airport, scanFrom, rangeEnd, nights, criteria.passengers)
            .then((rows) => {
              calendarCalls += 1;
              for (const row of rows) hits.push({ airport, ...row });
            })
            .catch((error: unknown) => {
              failures += 1;
              lastError = error instanceof Error ? error.message : String(error);
              console.warn(`TripSignal FlightPowers calendar failed for ${criteria.origin}-${airport}:`, lastError);
            }),
        );
      }
    }
    await Promise.all(calendarJobs);

    // Confirm only dates under the target, cheapest first, at most three
    // per airport — a confirm is a second request, so this is what keeps
    // a run inside the test plan's 2,000-request cap.
    const qualifying = hits
      .filter((hit) => hit.price < criteria.maxPrice)
      .sort((a, b) => a.price - b.price);
    const seen = new Set<string>();
    const confirmedPerAirport = new Map<string, number>();
    const offers: FlightOffer[] = [];
    for (const hit of qualifying) {
      const key = `${hit.airport}|${hit.departureDate}|${hit.returnDate ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const confirmed = confirmedPerAirport.get(hit.airport) ?? 0;
      if (confirmed >= 3) continue;
      confirmedPerAirport.set(hit.airport, confirmed + 1);
      try {
        const offer = criteria.tripType === 'one-way'
          ? await confirmOneWay(this.apiKey, criteria.origin, hit.airport, hit.departureDate, criteria)
          : hit.returnDate
            ? await confirmRoundTrip(this.apiKey, criteria.origin, hit.airport, hit.departureDate, hit.returnDate, criteria)
            : null;
        if (offer) offers.push(offer);
      } catch (error) {
        failures += 1;
        lastError = error instanceof Error ? error.message : String(error);
        console.warn(`TripSignal FlightPowers confirm failed for ${criteria.origin}-${hit.airport} on ${hit.departureDate}:`, lastError);
      }
    }
    console.log(`TripSignal FlightPowers search ${criteria.origin}→${destination.type}:${destination.value}: ${calendarCalls} calendar calls, ${offers.length} offers, ${failures} failures.`);
    if (offers.length === 0 && failures > 0) {
      throw new Error(`All FlightPowers searches failed: ${lastError}`);
    }
    return offers.sort((a, b) => a.price - b.price).slice(0, 25);
  }
}

export function getFlightProvider(): FlightProvider {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (apiKey) return new FlightPowersProvider(apiKey);
  return new GoogleFlightsProvider();
}
