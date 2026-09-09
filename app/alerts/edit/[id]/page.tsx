import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import EditAlert from './edit-alert';

export const dynamic = 'force-dynamic';

export default async function EditAlertPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signin');
  const { id } = await params;
  return <EditAlert id={id} />;
}
