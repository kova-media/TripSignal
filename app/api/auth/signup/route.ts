import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const name = typeof body.name === 'string' ? body.name.trim().replace(/\s+/g, ' ') : '';

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Enter your name.' }, { status: 400 });
    }

    if (!validEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const { url } = await createMagicLink(email, name);
    await sendMagicLinkEmail(email, url);
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('TripSignal sign-up email error:', error);
    return NextResponse.json({ error: 'We could not send the verification link. Please try again.' }, { status: 500 });
  }
}
