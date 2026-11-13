import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

// POST-only: signing out on GET lets any site log the user out with a
// plain link or image (CSRF logout). The header now submits a POST form.
export async function POST() {
  try {
    await clearSession();
  } catch (error) {
    console.error('TripSignal sign-out error:', error);
  }
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_APP_URL ?? 'https://tripsignal.travel'));
}
