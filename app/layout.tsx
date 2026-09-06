import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import './tech.css';
import './color-fix.css';
import './mobile.css';

export const metadata: Metadata = {
  title: 'TripSignal | Travel intelligence, on your terms',
  description: 'Set the trip you want. TripSignal watches for qualifying fares and sends you the signal.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/tripsignal-icon-daylight.svg',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
