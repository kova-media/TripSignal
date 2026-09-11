import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

async function signOut() {
  try {
    await clearSession();
  } catch (error) {
    console.error('TripSignal sign-out error:', error);
  }
}

export async function POST() {
  await signOut();
  return NextResponse.json({ signedOut: true });
}

export async function GET() {
  await signOut();
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL ?? 'https://tripsignal.travel'));
}
