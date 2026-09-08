import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import './tech.css';
import './color-fix.css';
import './mobile.css';
import './summary-fix.css';

export const metadata: Metadata = {
  title: 'TripSignal | Travel intelligence, on your terms',
  description: 'Set the trip you want. TripSignal watches for qualifying fares and sends you the signal.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/tripsignal-icon-daylight.svg' },
};

const themeScript = `(() => { try { const saved = localStorage.getItem('tripsignal-theme-v2'); document.documentElement.dataset.theme = saved === 'daylight' ? 'daylight' : 'redeye'; } catch { document.documentElement.dataset.theme = 'redeye'; } })();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{ __html: themeScript }} />{children}</body></html>;
}
