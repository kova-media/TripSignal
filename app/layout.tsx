import type { Metadata } from 'next';
import './globals.css';
import './brand.css';
import './tech.css';
import './color-fix.css';
import './mobile.css';
import './summary-fix.css';
import './ui-fixes.css';
import './frequency-fix.css';
import './selection-fix.css';
import './trip-extras.css';

export const metadata: Metadata = {
  title: 'TripSignal | Travel intelligence, on your terms',
  description: 'Set the trip you want. TripSignal watches for qualifying fares and sends you the signal.',
  manifest: '/manifest.webmanifest',
  themeColor: '#0E1112',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/tripsignal-icon-blue.svg',
  },
};

const themeScript = `(() => { try { const saved = localStorage.getItem('tripsignal-theme-v2'); document.documentElement.dataset.theme = saved === 'daylight' ? 'daylight' : 'redeye'; } catch { document.documentElement.dataset.theme = 'redeye'; } })();`;

const frequencyScript = `(() => {
  const mount = () => {
    const original = document.querySelector('#discovery-frequency');
    const advanced = original?.closest('.discovery-advanced');
    const summary = advanced?.querySelector('summary');
    if (!original || !advanced || !summary || advanced.querySelector('.discovery-frequency-visible')) return;

    const field = document.createElement('div');
    field.className = 'discovery-field discovery-frequency-visible';
    field.innerHTML = '<label for="discovery-frequency-visible">Scan frequency</label><select id="discovery-frequency-visible"><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option></select>';
    const visible = field.querySelector('select');
    if (!visible) return;

    visible.value = original.value;
    visible.addEventListener('change', () => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')?.set;
      setter?.call(original, visible.value);
      original.dispatchEvent(new Event('change', { bubbles: true }));
    });
    summary.insertAdjacentElement('afterend', field);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();
  const observer = new MutationObserver(mount);
  observer.observe(document.body, { childList: true, subtree: true });
})();`;

const tripExtrasScript = `(() => {
  const sync = () => {
    const extras = document.querySelector('.trip-extras');
    const discoveryLayout = document.querySelector('.discovery-layout');
    const routeMap = discoveryLayout?.querySelector('.route-map');
    const destination = document.querySelector<HTMLInputElement>('#airport-destination');
    if (!extras || !discoveryLayout || !routeMap || !destination) return;

    const selected = destination.value.trim().match(/\\(([A-Za-z]{3})\\)$/);
    const code = selected?.[1]?.toUpperCase() ?? '';
    const originInput = document.querySelector<HTMLInputElement>('#airport-from');
    const origin = originInput?.value.trim().match(/\\(([A-Za-z]{3})\\)$/)?.[1]?.toUpperCase() ?? '';

    if (extras.parentElement !== discoveryLayout || extras.previousElementSibling !== routeMap) {
      routeMap.insertAdjacentElement('afterend', extras);
    }

    extras.classList.toggle('trip-extras-visible', Boolean(code));

    extras.querySelectorAll<HTMLAnchorElement>('[data-affiliate-vertical]').forEach((link) => {
      const vertical = link.dataset.affiliateVertical;
      if (!vertical) return;
      const params = new URLSearchParams();
      if (code) params.set('destination', code);
      if (origin) params.set('origin', origin);
      link.href = '/api/affiliate/' + vertical + (params.toString() ? '?' + params.toString() : '');
    });
  };

  const start = () => {
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['value'] });
    document.addEventListener('input', sync, true);
    document.addEventListener('change', sync, true);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: frequencyScript }} />
        <script dangerouslySetInnerHTML={{ __html: tripExtrasScript }} />
        {children}
      </body>
    </html>
  );
}
