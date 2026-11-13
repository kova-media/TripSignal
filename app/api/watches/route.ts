import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';
import { isActiveWatch } from '@/lib/watch';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  try {
    await ensureSchema();
    const sql = getDb();
    const result = await sql.query<{ id: string; criteria: any; frequency: string; last_checked_at: string | null; latest_fare: number | null; active: boolean; deleted_at: string | null; pending_verification: boolean | null }>(
      `select a.id, a.criteria, a.frequency, a.last_checked_at, a.active, a.deleted_at, a.pending_verification,
              (select fo.price from fare_observations fo where fo.alert_id = a.id order by fo.observed_at desc limit 1)::float as latest_fare
       from alerts a
       where a.user_id = $1
         and a.active = true
         and a.deleted_at is null
         and coalesce(a.pending_verification, false) = false
         and jsonb_typeof(a.criteria) = 'object'
         and length(coalesce(a.criteria->>'origin', '')) = 3
         and a.criteria ? 'destination'
         and a.criteria ? 'maxPrice'
         and lower(coalesce(a.criteria->>'destination', '')) not in ('any destination', 'any airport')
       order by a.created_at desc`,
      [user.id],
    );
    // Same active-watch definition as profile and account (lib/watch.ts),
    // applied in code as well so the three can never drift apart.
    const watches = result.rows.filter(isActiveWatch);
    return NextResponse.json({ watches });
  } catch (error) {
    console.error('TripSignal watches error:', error);
    return NextResponse.json({ error: 'Could not load your watches. Please try again.' }, { status: 500 });
  }
}
