import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Anywhere fares — find cheap destinations',
  description:
    'Pick a home airport and a region. TripSignal scans the cheapest round-trip fares to every major airport in that region and shows you where your budget can take you.',
};

export default function AnywhereLayout({ children }: { children: ReactNode }) {
  return children;
}
