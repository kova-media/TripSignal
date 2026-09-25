import { NextResponse } from 'next/server';
import { runDueAlerts } from '@/lib/alerts';
import { ensureSchema } from '@/lib/db';
import { sendCronFailureEmail } from '@/lib/email';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    await ensureSchema();
    const summary = await runDueAlerts();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Alert worker failed.';
    console.error('TripSignal alert worker error:', error);
    const stack = error instanceof Error && error.stack ? `\n\n${error.stack}` : '';
    await sendCronFailureEmail(`${message}${stack}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
