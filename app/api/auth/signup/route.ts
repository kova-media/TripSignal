import { NextResponse } from 'next/server';
import { signUp } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await signUp(email, password);
    return NextResponse.json({ ok: true, user: { email: user.email } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not create your account.';
    if (message.includes('already exists')) {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    console.error('TripSignal sign-up error:', error);
    return NextResponse.json({ error: 'Could not create your account right now.' }, { status: 500 });
  }
}
