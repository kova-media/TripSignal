import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });
  }

  await ensureSchema();
  const db = getDb();
  const result = await db.query(
    `delete from alerts where id = $1 and user_id = $2 returning id`,
    [id, user.id],
  );

  if (!result.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
