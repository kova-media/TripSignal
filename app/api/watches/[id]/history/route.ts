import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { id } = await params;
  const sql = getDb();
  await ensureSchema();
  const owned = await sql.query('select id from alerts where id = $1 and user_id = $2 limit 1', [id, user.id]);
  if (!owned.rows.length) return NextResponse.json({ error: 'Watch not found.' }, { status: 404 });
  const history = await sql.query<{ observed_at: string; price: number }>(
    `select observed_at, price::float as price from fare_observations
     where alert_id = $1 order by observed_at asc limit 500`,
    [id],
  );
  return NextResponse.json({ points: history.rows });
}
