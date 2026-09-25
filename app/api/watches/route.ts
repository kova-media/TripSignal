import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const sql = getDb();
  await ensureSchema();
  const result = await sql.query<{ id: string; criteria: any; frequency: string; last_checked_at: string | null; latest_fare: number | null }>(
    `select a.id, a.criteria, a.frequency, a.last_checked_at,
            (select fo.price from fare_observations fo where fo.alert_id = a.id order by fo.observed_at desc limit 1)::float as latest_fare
     from alerts a
     where a.user_id = $1
       and a.active = true
       and jsonb_typeof(a.criteria) = 'object'
       and length(coalesce(a.criteria->>'origin', '')) = 3
       and a.criteria ? 'destination'
       and a.criteria ? 'maxPrice'
       and lower(coalesce(a.criteria->>'destination', '')) not in ('any destination', 'any airport')
     order by a.created_at desc`,
    [user.id],
  );
  return NextResponse.json({ watches: result.rows });
}
