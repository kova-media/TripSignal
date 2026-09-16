import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import AlertBuilder from './alert-builder';

export const metadata = {
  title: 'Create a Flight Price Alert',
  description: 'Create a TripSignal flight price watch by choosing your route, travel window, cabin, stops and target fare.',
};

export default async function AlertsPage() {
  const currentUser = await getCurrentUser();

  return (
    <Suspense fallback={null}>
      <AlertBuilder accountEmail={currentUser?.email ?? null} />
    </Suspense>
  );
}
