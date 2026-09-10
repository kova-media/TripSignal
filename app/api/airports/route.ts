import { NextRequest, NextResponse } from 'next/server';

type TravelpayoutsPlace = {
  type?: string;
  code?: string;
  name?: string;
  country_code?: string;
  country_name?: string;
  city_code?: string;
  city_name?: string;
  state_code?: string | null;
  coordinates?: { lat?: number; lon?: number };
  weight?: number;
};

type AirportResult = {
  iata_code: string;
  name: string;
  municipality: string;
  iso_country: string;
  country_name: string;
  state_code?: string;
  weight: number;
};

type OurAirport = {
  type?: string;
  name?: string;
  latitude_deg?: string;
  longitude_deg?: string;
  iso_country?: string;
  iso_region?: string;
  municipality?: string;
  scheduled_service?: string;
  iata_code?: string;
};

const AUTOCOMPLETE_URL = 'https://autocomplete.travelpayouts.com/places2';
const OUR_AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const NEARBY_RADIUS_KM = 150;

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

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2) return NextResponse.json({ airports: [] });

  try {
    const places = await fetchPlaces(query, ['airport', 'city']);
    const directAirports = places.filter((place) => place.type === 'airport');
    const matchingCity = places
      .filter((place) => place.type === 'city' && place.coordinates?.lat != null && place.coordinates?.lon != null)
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))[0];

    const center = matchingCity?.coordinates
      ? { lat: matchingCity.coordinates.lat!, lon: matchingCity.coordinates.lon! }
      : directAirports[0]?.coordinates
        ? { lat: directAirports[0].coordinates.lat!, lon: directAirports[0].coordinates.lon! }
        : null;

    const nearbyAirports = center ? await findNearbyAirports(center.lat, center.lon) : [];

    const directResults = directAirports
      .filter((place) => place.code && place.name)
      .map(toAirportResult);

    const merged = [...directResults, ...nearbyAirports]
      .filter((airport, index, list) => list.findIndex((item) => item.iata_code === airport.iata_code) === index)
      .sort((a, b) => b.weight - a.weight);

    return NextResponse.json({ airports: merged });
  } catch {
    return NextResponse.json({ airports: [] });
  }
}

async function fetchPlaces(term: string, types: string[]) {
  const url = new URL(AUTOCOMPLETE_URL);
  url.searchParams.set('term', term);
  url.searchParams.set('locale', 'en');
  for (const type of types) url.searchParams.append('types[]', type);

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });

  if (!response.ok) throw new Error(`Airport autocomplete returned ${response.status}`);
  return (await response.json()) as TravelpayoutsPlace[];
}

async function findNearbyAirports(lat: number, lon: number) {
  const response = await fetch(OUR_AIRPORTS_URL, {
    headers: { Accept: 'text/csv' },
    next: { revalidate: 86400 },
  });

  if (!response.ok) throw new Error(`Airport database returned ${response.status}`);

  const csv = await response.text();
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const index = new Map(headers.map((header, position) => [header, position]));
  const results: Array<AirportResult & { distanceKm: number; typeRank: number }> = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const type = row[index.get('type') ?? -1] || '';
    const iata = row[index.get('iata_code') ?? -1] || '';
    const scheduled = row[index.get('scheduled_service') ?? -1] || '';
    const latitude = Number(row[index.get('latitude_deg') ?? -1]);
    const longitude = Number(row[index.get('longitude_deg') ?? -1]);

    if (!iata || !airportTypeRank[type] || scheduled !== 'yes' || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    const distanceKm = haversineKm(lat, lon, latitude, longitude);
    if (distanceKm > NEARBY_RADIUS_KM) continue;

    const countryCode = row[index.get('iso_country') ?? -1] || '';
    const regionCode = row[index.get('iso_region') ?? -1] || '';
    const municipality = row[index.get('municipality') ?? -1] || '';
    const name = row[index.get('name') ?? -1] || `${iata} Airport`;
    const countryName = countryNameFromCode(countryCode);
    const stateCode = regionCode.startsWith(`${countryCode}-`) ? regionCode.slice(3) : undefined;
    const state = countryCode === 'US' && stateCode ? usStates[stateCode] || stateCode : stateCode;
    const location = state && countryName
      ? `${municipality || 'Nearby'}, ${state}, ${countryName}`
      : countryName
        ? `${municipality || 'Nearby'}, ${countryName}`
        : municipality || 'Nearby';

    results.push({
      iata_code: iata,
      name,
      municipality: location,
      iso_country: countryCode,
      country_name: countryName,
      state_code: stateCode,
      weight: airportTypeRank[type] * 100000 - distanceKm,
      distanceKm,
      typeRank: airportTypeRank[type],
    });
  }

  return results
    .sort((a, b) => b.typeRank - a.typeRank || a.distanceKm - b.distanceKm)
    .map(({ distanceKm: _distanceKm, typeRank: _typeRank, ...airport }) => airport);
}

function toAirportResult(place: TravelpayoutsPlace): AirportResult {
  const stateCode = place.state_code?.trim().toUpperCase() || undefined;
  const city = place.city_name || place.name!;
  const state = place.country_code === 'US' && stateCode
    ? usStates[stateCode] || stateCode
    : stateCode;
  const location = state && place.country_name
    ? `${city}, ${state}, ${place.country_name}`
    : place.country_name
      ? `${city}, ${place.country_name}`
      : city;

  return {
    iata_code: place.code!,
    name: place.name!,
    municipality: location,
    iso_country: place.country_code || '',
    country_name: place.country_name || '',
    state_code: stateCode,
    weight: (place.weight ?? 0) + 1000000,
  };
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
