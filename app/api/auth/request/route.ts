import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = String(body.email ?? '').trim().toLowerCase();
    if (!validEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    const { url } = await createMagicLink(email);
    await sendMagicLinkEmail(email, url);
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('TripSignal sign-in email error:', error);
    return NextResponse.json({ error: 'We could not send the sign-in link. Please try again.' }, { status: 500 });
  }
}
