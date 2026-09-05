import { NextResponse } from 'next/server';
import { runDueAlerts } from '@/lib/alerts';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get('authorization');
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const summary = await runDueAlerts();
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Alert worker failed.';
    console.error('TripSignal alert worker error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
