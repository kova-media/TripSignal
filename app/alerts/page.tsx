import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import AlertBuilder from './alert-builder';

export const metadata = {
  title: 'Create a Flight Alert | TripSignal',
  description: 'Set the criteria TripSignal should watch for.',
};

export default async function AlertsPage() {
  const currentUser = await getCurrentUser();

  return (
    <Suspense fallback={null}>
      <AlertBuilder accountEmail={currentUser?.email ?? null} />
    </Suspense>
  );
}
