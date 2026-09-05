'use client';

import { useEffect, useState } from 'react';

type Theme = 'daylight' | 'redeye';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'daylight';
  const saved = window.localStorage.getItem('tripsignal-theme');
  if (saved === 'daylight' || saved === 'redeye') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'redeye' : 'daylight';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('daylight');

  useEffect(() => {
    const initial = getInitialTheme();
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('tripsignal-theme', next);
  }

  return (
    <div className="theme-toggle" aria-label="Choose appearance">
      <button type="button" className={theme === 'daylight' ? 'theme-option active' : 'theme-option'} onClick={() => changeTheme('daylight')} aria-pressed={theme === 'daylight'}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="3" /><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.42 1.42M11.53 11.53l1.42 1.42M12.95 3.05l-1.42 1.42M4.47 11.53l-1.42 1.42" /></svg>
        Daylight
      </button>
      <button type="button" className={theme === 'redeye' ? 'theme-option active' : 'theme-option'} onClick={() => changeTheme('redeye')} aria-pressed={theme === 'redeye'}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M11.8 10.9A5.3 5.3 0 0 1 5.1 4.2a5.6 5.6 0 1 0 6.7 6.7Z" /></svg>
        Redeye
      </button>
    </div>
  );
}
