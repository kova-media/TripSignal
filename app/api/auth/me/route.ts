import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ authenticated: false, email: null, subscriptionActive: false });
  const sql = getDb();
  await ensureSchema();
  const result = await sql.query<{ subscription_status: string | null }>(
    'select subscription_status from users where id = $1 limit 1',
    [user.id],
  );
  const status = result.rows[0]?.subscription_status;
  return NextResponse.json({
    authenticated: true,
    email: user.email,
    subscriptionActive: status === 'active' || status === 'trialing' || status === 'lifetime',
  });
}
