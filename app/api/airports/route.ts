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

const AUTOCOMPLETE_URL = 'https://autocomplete.travelpayouts.com/places2';

const usStates: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana',
  ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee',
  TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia',
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2) return NextResponse.json({ airports: [] });

  try {
    const places = await fetchPlaces(query, ['airport', 'city']);
    const directAirports = places.filter((place) => place.type === 'airport');
    const matchingCities = places
      .filter((place) => place.type === 'city' && place.code)
      .sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0))
      .slice(0, 3);

    const cityAirports = await Promise.all(
      matchingCities.map((city) => fetchPlaces(city.code!, ['airport'])),
    );

    const merged = [...directAirports, ...cityAirports.flat()]
      .filter((place) => place.type === 'airport' && place.code && place.name)
      .map(toAirportResult)
      .filter((airport, index, list) => list.findIndex((item) => item.iata_code === airport.iata_code) === index)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 8);

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

function toAirportResult(place: TravelpayoutsPlace): AirportResult {
  const stateCode = place.state_code?.trim().toUpperCase() || undefined;
  return {
    iata_code: place.code!,
    name: place.name!,
    municipality: place.city_name || place.name!,
    iso_country: place.country_code || '',
    country_name: place.country_name || '',
    state_code: stateCode,
    weight: place.weight ?? 0,
  };
}

export function formatLocation(airport: AirportResult) {
  const state = airport.iso_country === 'US' && airport.state_code
    ? usStates[airport.state_code] || airport.state_code
    : airport.state_code;

  if (state && airport.country_name) return `${airport.municipality}, ${state}, ${airport.country_name}`;
  if (airport.country_name) return `${airport.municipality}, ${airport.country_name}`;
  return airport.municipality;
}
