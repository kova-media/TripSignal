import { NextRequest, NextResponse } from 'next/server';
import { getCountryOptions } from '@/lib/flights/country-airports';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';

  try {
    const countries = await getCountryOptions();
    const filtered = query
      ? countries.filter((country) => country.name.toLowerCase().includes(query) || country.code.toLowerCase() === query)
      : countries;

    return NextResponse.json({ countries: filtered.slice(0, 50) });
  } catch (error) {
    console.error('TripSignal country lookup error:', error);
    return NextResponse.json({ countries: [] });
  }
}
