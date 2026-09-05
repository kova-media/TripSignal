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
      <button type="button" className={theme === 'daylight' ? 'theme-option active daylight-option' : 'theme-option daylight-option'} onClick={() => changeTheme('daylight')} aria-pressed={theme === 'daylight'}>
        <svg className="daylight-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M3 14.5h14" />
          <path d="M5 14.5a5 5 0 0 1 10 0" />
          <path d="M10 3v2M4.7 5.7l1.4 1.4M15.3 5.7l-1.4 1.4" />
        </svg>
        Daylight
      </button>
      <button type="button" className={theme === 'redeye' ? 'theme-option active redeye-option' : 'theme-option redeye-option'} onClick={() => changeTheme('redeye')} aria-pressed={theme === 'redeye'}>
        <svg className="redeye-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M2.5 10s2.8-5 7.5-5 7.5 5 7.5 5-2.8 5-7.5 5-7.5-5-7.5-5Z" />
          <circle cx="10" cy="10" r="2.5" />
        </svg>
        Redeye
      </button>
    </div>
  );
}
