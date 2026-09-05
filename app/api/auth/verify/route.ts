import { NextResponse } from 'next/server';
import { consumeMagicLink } from '@/lib/auth';

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!token) return NextResponse.redirect(new URL('/signin?error=missing', request.url));

  try {
    const user = await consumeMagicLink(token);
    if (!user) return NextResponse.redirect(new URL('/signin?error=expired', request.url));
    return NextResponse.redirect(new URL('/alerts', request.url));
  } catch (error) {
    console.error('TripSignal sign-in verification error:', error);
    return NextResponse.redirect(new URL('/signin?error=failed', request.url));
  }
}
