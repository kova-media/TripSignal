import { NextRequest, NextResponse } from 'next/server';

type AirportResult = {
  iata_code: string;
  name: string;
  municipality: string;
  iso_country: string;
  country_name: string;
  state_code?: string;
  weight: number;
};

type AirportRecord = {
  type: string;
  name: string;
  latitude: number;
  longitude: number;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: string;
  iata_code: string;
  keywords: string;
};

const OUR_AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const NEARBY_RADIUS_KM = 150;
const AIRPORT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

const usStates: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

const airportTypeRank: Record<string, number> = {
  large_airport: 3,
  medium_airport: 2,
  small_airport: 1,
};

let airportDataPromise: Promise<AirportRecord[]> | null = null;
let airportDataLoadedAt = 0;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2) return NextResponse.json({ airports: [] });

  try {
    const airports = await loadAirports();
    const normalizedQuery = normalize(query);
    const queryTokens = normalizedQuery.split(' ').filter(Boolean);

    const matches = airports
      .map((airport) => ({ airport, score: searchScore(airport, normalizedQuery, queryTokens) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    if (matches.length === 0) return NextResponse.json({ airports: [] });

    const directResults = matches.map(({ airport, score }) => toAirportResult(airport, score));
    const centers = matches
      .filter(({ airport }) => Number.isFinite(airport.latitude) && Number.isFinite(airport.longitude))
      .slice(0, 5)
      .map(({ airport }) => ({ lat: airport.latitude, lon: airport.longitude }));

    const nearby = findNearbyAirports(airports, centers, new Set(directResults.map((airport) => airport.iata_code)));

    const merged = [...directResults, ...nearby]
      .filter((airport, index, list) => list.findIndex((item) => item.iata_code === airport.iata_code) === index)
      .sort((a, b) => b.weight - a.weight);

    return NextResponse.json({ airports: merged });
  } catch {
    return NextResponse.json({ airports: [] });
  }
}

async function loadAirports() {
  const now = Date.now();
  if (airportDataPromise && now - airportDataLoadedAt < AIRPORT_CACHE_TTL_MS) return airportDataPromise;

  airportDataLoadedAt = now;
  airportDataPromise = fetch(OUR_AIRPORTS_URL, {
    headers: { Accept: 'text/csv' },
    next: { revalidate: 86400 },
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Airport database returned ${response.status}`);
      return parseAirports(await response.text());
    })
    .catch((error) => {
      airportDataPromise = null;
      airportDataLoadedAt = 0;
      throw error;
    });

  return airportDataPromise;
}

function parseAirports(csv: string): AirportRecord[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const index = new Map(headers.map((header, position) => [header, position]));
  const get = (row: string[], key: string) => row[index.get(key) ?? -1] || '';

  const airports: AirportRecord[] = [];
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const type = get(row, 'type');
    const iata = get(row, 'iata_code').trim().toUpperCase();
    const scheduled = get(row, 'scheduled_service').toLowerCase();
    const latitude = Number(get(row, 'latitude_deg'));
    const longitude = Number(get(row, 'longitude_deg'));

    if (!airportTypeRank[type] || !iata || scheduled !== 'yes' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    airports.push({
      type,
      name: get(row, 'name'),
      latitude,
      longitude,
      iso_country: get(row, 'iso_country').trim().toUpperCase(),
      iso_region: get(row, 'iso_region').trim().toUpperCase(),
      municipality: get(row, 'municipality'),
      scheduled_service: scheduled,
      iata_code: iata,
      keywords: get(row, 'keywords'),
    });
  }

  return airports;
}

function searchScore(airport: AirportRecord, query: string, tokens: string[]) {
  const iata = normalize(airport.iata_code);
  const name = normalize(airport.name);
  const municipality = normalize(airport.municipality);
  const region = normalize(airport.iso_region.replace(`${airport.iso_country}-`, ''));
  const keywords = normalize(airport.keywords);
  const country = normalize(airport.iso_country);
  const searchable = `${name} ${municipality} ${iata} ${region} ${country} ${keywords}`;

  if (iata === query) return 5000;
  if (municipality === query) return 4500;
  if (name === query) return 4400;
  if (municipality.startsWith(query)) return 4000;
  if (name.startsWith(query)) return 3900;

  const allTokensMatch = tokens.length > 0 && tokens.every((token) => searchable.includes(token));
  if (!allTokensMatch) return 0;

  let score = 1000;
  if (municipality.includes(query)) score += 900;
  if (name.includes(query)) score += 700;
  if (keywords.includes(query)) score += 500;
  if (iata.includes(query)) score += 400;
  if (region === query || country === query) score += 300;
  return score + airportTypeRank[airport.type] * 10;
}

function findNearbyAirports(airports: AirportRecord[], centers: Array<{ lat: number; lon: number }>, directCodes: Set<string>) {
  const results = new Map<string, AirportResult & { distanceKm: number; typeRank: number }>();

  for (const airport of airports) {
    if (directCodes.has(airport.iata_code)) continue;

    const typeRank = airportTypeRank[airport.type] || 0;
    let nearestDistance = Infinity;
    for (const center of centers) {
      const distance = haversineKm(center.lat, center.lon, airport.latitude, airport.longitude);
      if (distance < nearestDistance) nearestDistance = distance;
    }

    if (nearestDistance > NEARBY_RADIUS_KM) continue;

    const result = toAirportResult(airport, 0);
    results.set(airport.iata_code, {
      ...result,
      distanceKm: nearestDistance,
      typeRank,
      weight: typeRank * 100000 - nearestDistance,
    });
  }

  return Array.from(results.values())
    .sort((a, b) => b.typeRank - a.typeRank || a.distanceKm - b.distanceKm)
    .map(({ distanceKm: _distanceKm, typeRank: _typeRank, ...airport }) => airport);
}

function toAirportResult(airport: AirportRecord, searchScoreValue: number): AirportResult {
  const stateCode = airport.iso_country === 'US' && airport.iso_region.startsWith('US-')
    ? airport.iso_region.slice(3)
    : undefined;
  const state = stateCode ? usStates[stateCode] || stateCode : undefined;
  const countryName = countryNameFromCode(airport.iso_country);
  const city = airport.municipality || airport.name;
  const location = state && countryName
    ? `${city}, ${state}, ${countryName}`
    : countryName
      ? `${city}, ${countryName}`
      : city;

  return {
    iata_code: airport.iata_code,
    name: airport.name,
    municipality: location,
    iso_country: airport.iso_country,
    country_name: countryName,
    state_code: stateCode,
    weight: searchScoreValue + airportTypeRank[airport.type] * 10,
  };
}

function normalize(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function countryNameFromCode(code: string) {
  if (!code) return '';
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(degreesToRadians(lat1)) * Math.cos(degreesToRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value: number) {
  return value * (Math.PI / 180);
}

function parseCsv(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
