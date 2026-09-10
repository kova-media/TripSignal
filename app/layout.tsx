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

const travelpayoutsScript = `<script nowprocket data-noptimize="1" data-cfasync="false" data-wpfc-render="false" seraph-accel-crit="1" data-no-defer="1" data-cmp-ab="2">
  (function () {
      var script = document.createElement("script");
      script.async = 1;
      script.setAttribute("data-cmp-ab","2");
      script.src = 'https://tp-em.com/NTcyNTI3.js?t=572527';
      document.head.appendChild(script);
  })();
</script>`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body><script dangerouslySetInnerHTML={{ __html: themeScript }} /><script dangerouslySetInnerHTML={{ __html: frequencyScript }} />{children}<script dangerouslySetInnerHTML={{ __html: travelpayoutsScript }} /></body></html>;
}
