import { NextResponse } from 'next/server';
import { createMagicLink } from '@/lib/auth';
import { sendPasswordResetEmail } from '@/lib/email';
import { getDb, ensureSchema } from '@/lib/db';

function validEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';

    if (!validEmail(email)) {
      return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
    }

    await ensureSchema();
    const db = getDb();
    const existing = await db.query('select id from users where email = $1 limit 1', [email]);

    if (existing.rows.length > 0) {
      const { url } = await createMagicLink(email);
      const resetUrl = `${url}&next=${encodeURIComponent('/account/setup')}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    // Always respond the same way so we don't reveal which emails have accounts.
    return NextResponse.json({ sent: true });
  } catch (error) {
    console.error('TripSignal password reset error:', error);
    return NextResponse.json({ error: 'We could not send the reset link. Please try again.' }, { status: 500 });
  }
}
