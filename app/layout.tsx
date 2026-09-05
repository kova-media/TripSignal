import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripSignal | Travel intelligence, on your terms',
  description: 'Set the trip you want. TripSignal watches for qualifying fares and sends you the signal.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
