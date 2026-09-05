import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripSignal | Travel deals that meet your criteria',
  description: 'Set the price, destination, dates, and airlines you want. TripSignal watches for the trip that fits.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
