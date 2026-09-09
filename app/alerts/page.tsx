import { Suspense } from 'react';
import AlertBuilder from './alert-builder';

export const metadata = {
  title: 'Create a Flight Alert | TripSignal',
  description: 'Set the criteria TripSignal should watch for.',
};

export default function AlertsPage() {
  return (
    <Suspense fallback={null}>
      <AlertBuilder />
    </Suspense>
  );
}
