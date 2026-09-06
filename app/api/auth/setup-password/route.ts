import { NextResponse } from 'next/server';
import { setPasswordForCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const password = typeof body.password === 'string' ? body.password : '';

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await setPasswordForCurrentUser(password);
    if (!user) return NextResponse.json({ error: 'Your sign-in session has expired. Please request a new sign-in link.' }, { status: 401 });

    return NextResponse.json({ ok: true, user: { email: user.email } });
  } catch (error) {
    console.error('TripSignal password setup error:', error);
    return NextResponse.json({ error: 'Could not set your password right now.' }, { status: 500 });
  }
}
