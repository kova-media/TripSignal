import { NextRequest, NextResponse } from 'next/server';

type Airport = {
  iata_code: string;
  name: string;
  municipality: string;
  iso_country: string;
};

type TravelpayoutsPlace = {
  type?: string;
  code?: string;
  name?: string;
  country_code?: string;
  city_name?: string;
  country_name?: string;
  main_airport_name?: string | null;
  weight?: number;
  index_strings?: string[];
};

const AUTOCOMPLETE_URL = 'https://autocomplete.travelpayouts.com/places2';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim();
  if (!query || query.length < 2) return NextResponse.json({ airports: [] });

  try {
    const url = new URL(AUTOCOMPLETE_URL);
    url.searchParams.set('term', query);
    url.searchParams.set('locale', 'en');
    url.searchParams.append('types[]', 'airport');
    url.searchParams.append('types[]', 'city');

    const response = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!response.ok) throw new Error(`Airport autocomplete returned ${response.status}`);

    const places = (await response.json()) as TravelpayoutsPlace[];
    const airports = places
      .filter((place) => place.type === 'airport' && place.code && place.name)
      .map((place) => ({
        iata_code: place.code!,
        name: place.name!,
        municipality: place.city_name || place.name!,
        iso_country: place.country_code || '',
      }))
      .filter((airport, index, list) => list.findIndex((item) => item.iata_code === airport.iata_code) === index)
      .sort((a, b) => {
        const aCity = normalize(a.municipality) === normalize(query) ? 0 : 1;
        const bCity = normalize(b.municipality) === normalize(query) ? 0 : 1;
        return aCity - bCity;
      })
      .slice(0, 8);

    return NextResponse.json({ airports });
  } catch {
    return NextResponse.json({ airports: [] });
  }
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
