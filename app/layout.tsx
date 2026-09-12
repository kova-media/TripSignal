import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import './tech.css';
import './color-fix.css';
import './mobile.css';
import './summary-fix.css';
import './ui-fixes.css';
import './selection-fix.css';
import './trip-extras.css';
import './discovery-layout-fix.css';
import './premium-ui.css';

export const metadata: Metadata = {
  title: 'TripSignal | Travel intelligence, on your terms',
  description: 'Set the trip you want. TripSignal watches for qualifying fares and sends you the signal.',
  manifest: '/manifest.webmanifest',
  themeColor: '#F6F7F9',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/tripsignal-icon-blue.svg' },
};

const themeScript = `(() => { try { const saved = localStorage.getItem('tripsignal-theme-v2'); document.documentElement.dataset.theme = saved === 'redeye' ? 'redeye' : 'daylight'; } catch { document.documentElement.dataset.theme = 'daylight'; } })();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{ __html: themeScript }} />{children}</body></html>;
}
