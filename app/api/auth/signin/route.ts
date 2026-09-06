import { NextResponse } from 'next/server';
import { signIn } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const user = await signIn(email, password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    return NextResponse.json({ ok: true, user: { email: user.email } });
  } catch (error) {
    console.error('TripSignal sign-in error:', error);
    return NextResponse.json({ error: 'Could not sign in right now.' }, { status: 500 });
  }
}
