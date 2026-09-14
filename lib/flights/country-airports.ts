type CountryAirport = {
  iata_code: string;
  name: string;
  municipality: string;
  iso_country: string;
  type: 'large_airport' | 'medium_airport' | 'small_airport';
};

type AirportRow = {
  type: string;
  name: string;
  municipality: string;
  iso_country: string;
  scheduled_service: string;
  iata_code: string;
};

const AIRPORTS_URL = 'https://davidmegginson.github.io/ourairports-data/airports.csv';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_COUNTRY_AIRPORTS = 10;

let cachePromise: Promise<AirportRow[]> | null = null;
let cacheLoadedAt = 0;

export async function getAirportsForCountry(countryCode: string): Promise<string[]> {
  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return [];

  const airports = await loadAirports();
  const matches = airports
    .filter((airport) => airport.iso_country === code)
    .map((airport) => ({
      code: airport.iata_code,
      rank: airport.type === 'large_airport' ? 3 : airport.type === 'medium_airport' ? 2 : 1,
    }))
    .sort((a, b) => b.rank - a.rank || a.code.localeCompare(b.code));

  const major = matches.filter((airport) => airport.rank >= 2).slice(0, MAX_COUNTRY_AIRPORTS);
  if (major.length >= MAX_COUNTRY_AIRPORTS) return major.map((airport) => airport.code);

  return matches.slice(0, MAX_COUNTRY_AIRPORTS).map((airport) => airport.code);
}

export async function getCountryOptions() {
  const airports = await loadAirports();
  const codes = Array.from(new Set(airports.map((airport) => airport.iso_country).filter((code) => /^[A-Z]{2}$/.test(code))));
  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });

  return codes
    .map((code) => ({ code, name: displayNames.of(code) || code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function loadAirports(): Promise<AirportRow[]> {
  const now = Date.now();
  if (cachePromise && now - cacheLoadedAt < CACHE_TTL_MS) return cachePromise;

  cacheLoadedAt = now;
  cachePromise = fetch(AIRPORTS_URL, {
    headers: { Accept: 'text/csv' },
    next: { revalidate: 86400 },
  })
    .then(async (response) => {
      if (!response.ok) throw new Error(`Airport database returned ${response.status}`);
      return parseAirports(await response.text());
    })
    .catch((error) => {
      cachePromise = null;
      cacheLoadedAt = 0;
      throw error;
    });

  return cachePromise;
}

function parseAirports(csv: string): AirportRow[] {
  const rows = parseCsv(csv);
  if (rows.length < 2) return [];

  const headers = rows[0];
  const index = new Map(headers.map((header, position) => [header, position]));
  const get = (row: string[], key: string) => row[index.get(key) ?? -1] || '';
  const airports: AirportRow[] = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const type = get(row, 'type');
    const iata = get(row, 'iata_code').trim().toUpperCase();
    const scheduled = get(row, 'scheduled_service').toLowerCase();
    if (!['large_airport', 'medium_airport', 'small_airport'].includes(type) || !iata || scheduled !== 'yes') continue;

    airports.push({
      type,
      name: get(row, 'name'),
      municipality: get(row, 'municipality'),
      iso_country: get(row, 'iso_country').trim().toUpperCase(),
      scheduled_service: scheduled,
      iata_code: iata,
    });
  }

  return airports;
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
