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
    // Per-alert errors are swallowed into a 200 with {errors: N}, so the
    // old "email only if runDueAlerts() throws" never fired. Email when
    // the run failed outright or badly: every checked alert failed, or at
    // least 5 alerts failed.
    if (summary.errors > 0 && (summary.errors >= summary.checked || summary.errors >= 5)) {
      await sendCronFailureEmail(
        `Alert worker completed with ${summary.errors} failed alert${summary.errors === 1 ? '' : 's'} out of ${summary.checked} checked (${summary.signals} signals, ${summary.emails} emails, ${summary.digests} digests).`,
      );
    }
    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Alert worker failed.';
    console.error('TripSignal alert worker error:', error);
    const stack = error instanceof Error && error.stack ? `\n\n${error.stack}` : '';
    await sendCronFailureEmail(`${message}${stack}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
