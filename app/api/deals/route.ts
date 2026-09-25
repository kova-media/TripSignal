import { NextResponse } from 'next/server';
import { getDeals } from '@/lib/deals';

export async function GET() {
  try {
    const deals = await getDeals();
    return NextResponse.json({ deals });
  } catch (error) {
    console.error('TripSignal deals error:', error);
    return NextResponse.json({ deals: [] });
  }
}
