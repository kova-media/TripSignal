import type { Metadata } from 'next';
import AirplaneCursor from '@/components/airplane-cursor';
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
import './flighty-ui.css';
import './destination-cleanup.css';
import './airplane-cursor.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
  : process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`)
    : undefined;

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: { default: 'TripSignal | Flight Price Alerts & Fare Monitoring', template: '%s | TripSignal' },
  description: 'TripSignal monitors flight fares for the trips you care about and alerts you when prices match your target. Set your route, dates, cabin and price once, then let TripSignal keep checking.',
  keywords: ['flight price alerts','flight fare alerts','flight price tracker','airfare price tracker','cheap flight alerts','flight fare monitoring','airfare alerts','track flight prices','flight deal alerts'],
  applicationName: 'TripSignal', category: 'travel', creator: 'TripSignal', publisher: 'TripSignal',
  alternates: siteUrl ? { canonical: '/' } : undefined,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
  openGraph: { type: 'website', siteName: 'TripSignal', title: 'TripSignal | Flight Price Alerts & Fare Monitoring', description: 'Set your route, dates and target price. TripSignal keeps watching flight fares and alerts you when a fare matches.', locale: 'en_US', url: siteUrl?.toString() },
  twitter: { card: 'summary_large_image', title: 'TripSignal | Flight Price Alerts & Fare Monitoring', description: 'Track flight prices and get alerted when fares match your criteria.' },
  manifest: '/manifest.webmanifest', themeColor: '#F6F7F9',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/tripsignal-icon-blue.svg' },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': siteUrl ? `${siteUrl.toString()}#organization` : '#organization', name: 'TripSignal', description: 'Flight fare monitoring and price alert service.', url: siteUrl?.toString() },
    { '@type': 'WebSite', '@id': siteUrl ? `${siteUrl.toString()}#website` : '#website', name: 'TripSignal', url: siteUrl?.toString(), description: 'Flight fare monitoring that alerts travelers when fares match their route, dates and target price.', publisher: { '@id': siteUrl ? `${siteUrl.toString()}#organization` : '#organization' }, inLanguage: 'en-US' },
    { '@type': 'Service', '@id': siteUrl ? `${siteUrl.toString()}#service` : '#service', name: 'TripSignal Flight Fare Monitoring', serviceType: 'Flight fare monitoring and price alerts', provider: { '@id': siteUrl ? `${siteUrl.toString()}#organization` : '#organization' }, areaServed: 'Worldwide', description: 'A flight fare monitoring service that checks selected routes and alerts users when fares meet their criteria. TripSignal does not book flights.', offers: [{ '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD', description: 'One new watch each month.' }, { '@type': 'Offer', name: 'TripSignal Pro', price: '19.99', priceCurrency: 'USD', priceSpecification: { '@type': 'UnitPriceSpecification', price: '19.99', priceCurrency: 'USD', unitText: 'YEAR' }, description: 'Unlimited flight fare watches.' }] },
  ],
};

const themeScript = `(() => { try { const saved = localStorage.getItem('tripsignal-theme-v2'); document.documentElement.dataset.theme = saved === 'redeye' ? 'redeye' : 'daylight'; } catch { document.documentElement.dataset.theme = 'daylight'; } })();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></head>
      <body><script dangerouslySetInnerHTML={{ __html: themeScript }} /><AirplaneCursor />{children}</body>
    </html>
  );
}
