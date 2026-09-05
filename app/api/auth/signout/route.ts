import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export async function POST() {
  try {
    await clearSession();
  } catch (error) {
    console.error('TripSignal sign-out error:', error);
  }
  return NextResponse.json({ signedOut: true });
}
