import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getDb, ensureSchema } from '@/lib/db';

async function getOwnedAlert(id: string, userId: string) {
  await ensureSchema();
  const db = getDb();
  return db.query<{ id: string; active: boolean }>(
    `select id, active from alerts where id = $1 and user_id = $2`,
    [id, userId],
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });

  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid alert.' }, { status: 400 });
  }

  let body: { active?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ error: 'Active must be true or false.' }, { status: 400 });
  }

  const owned = await getOwnedAlert(id, user.id);
  if (!owned.rowCount) return NextResponse.json({ error: 'Alert not found.' }, { status: 404 });

  const db = getDb();
  await db.query(`update alerts set active = $1 where id = $2 and user_id = $3`, [body.active, id, user.id]);
  return NextResponse.json({ ok: true, active: body.active });
}

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
