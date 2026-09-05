'use client';

import { useEffect, useState } from 'react';

type Theme = 'daylight' | 'redeye';

function DaylightIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="daylight-sun" x1="13" y1="8" x2="33" y2="31" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE99A" />
          <stop offset="1" stopColor="#F4B83F" />
        </linearGradient>
        <linearGradient id="daylight-cloud" x1="22" y1="28" x2="39" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF3D0" />
          <stop offset="1" stopColor="#8F989D" />
        </linearGradient>
      </defs>
      <g stroke="#F5C34B" strokeWidth="3.2" strokeLinecap="round">
        <path d="M24 3.5v6" /><path d="M24 38.5v6" /><path d="M3.5 24h6" /><path d="M38.5 24h6" />
        <path d="m9.5 9.5 4.2 4.2" /><path d="m34.3 34.3 4.2 4.2" />
        <path d="m38.5 9.5-4.2 4.2" /><path d="m13.7 34.3-4.2 4.2" />
      </g>
      <circle cx="23" cy="23" r="10" fill="url(#daylight-sun)" />
      <path d="M12.5 39.5c0-4.7 3.8-8.5 8.5-8.5 1.1 0 2.1.2 3.1.6 1.4-4.4 5.5-7.6 10.4-7.6 6 0 10.9 4.9 10.9 10.9 0 1.7-.4 3.3-1.1 4.7H12.5Z" fill="url(#daylight-cloud)" stroke="#7D868C" strokeWidth="1.5" />
    </svg>
  );
}

function RedeyeIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id="redeye-moon" x1="10" y1="8" x2="35" y2="39" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB45B" />
          <stop offset=".45" stopColor="#FF6548" />
          <stop offset="1" stopColor="#C9282F" />
        </linearGradient>
      </defs>
      <path d="M28.5 7.5c-6.2 1.5-10.8 7.1-10.8 13.8 0 7.8 6.3 14.1 14.1 14.1 2.8 0 5.5-.8 7.7-2.3-2.7 4.7-7.7 7.9-13.8 7.9-8.6 0-15.6-7-15.6-15.6 0-8.5 6.8-15.4 15.3-15.6 1 0 2 .1 3.1.3Z" fill="url(#redeye-moon)" />
      <g fill="#F3DAD6">
        <path d="m36 7 1.8 4.1 4.2 1.8-4.2 1.7-1.8 4.2-1.7-4.2-4.2-1.7 4.2-1.8L36 7Z" />
        <path d="m28.5 18 1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-1.1 1.1-2.7Z" />
        <path d="m42.2 18.5.9 2.2 2.2.9-2.2.9-.9 2.2-.9-2.2-2.2-.9 2.2-.9.9-2.2Z" />
      </g>
      <path d="M8 40c0-4.1 3.3-7.4 7.4-7.4 1 0 2 .2 2.9.6 1.3-3.6 4.7-6.1 8.7-6.1 5.1 0 9.3 4 9.5 9.1 1.1-.6 2.4-.9 3.7-.9 4.3 0 7.8 3.5 7.8 7.8H8.5c-.3-1-.5-2-.5-3.1Z" fill="#2A3542" stroke="#4B5664" strokeWidth="1.4" />
    </svg>
  );
}

const baseButton: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 9,
  minWidth: 116,
  height: 42,
  padding: '5px 14px',
  border: '0',
  borderRadius: 999,
  background: 'transparent',
  color: 'var(--quiet)',
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '-0.01em',
  transition: 'background-color .2s ease, color .2s ease, box-shadow .2s ease, transform .2s ease',
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('daylight');

  useEffect(() => {
    const saved = window.localStorage.getItem('tripsignal-theme');
    const initial: Theme = saved === 'daylight' || saved === 'redeye'
      ? saved
      : window.matchMedia('(prefers-color-scheme: dark)').matches ? 'redeye' : 'daylight';
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('tripsignal-theme', next);
  }

  return (
    <div
      className="theme-toggle"
      aria-label="Choose appearance"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: 3,
        border: '1px solid var(--line-strong)',
        borderRadius: 999,
        background: 'var(--surface)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.04)',
      }}
    >
      <button
        type="button"
        className={`theme-option ${theme === 'daylight' ? 'active daylight-option' : 'daylight-option'}`}
        onClick={() => changeTheme('daylight')}
        aria-pressed={theme === 'daylight'}
        style={{
          ...baseButton,
          color: theme === 'daylight' ? 'var(--ink)' : 'var(--quiet)',
          background: theme === 'daylight' ? 'var(--surface-2)' : 'transparent',
          boxShadow: theme === 'daylight' ? 'inset 0 0 0 1px rgba(245,195,75,.72), 0 0 12px rgba(245,195,75,.08)' : 'none',
        }}
      >
        <span style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', flex: 'none' }}>
          <DaylightIcon />
        </span>
        <span>Daylight</span>
      </button>
      <button
        type="button"
        className={`theme-option ${theme === 'redeye' ? 'active redeye-option' : 'redeye-option'}`}
        onClick={() => changeTheme('redeye')}
        aria-pressed={theme === 'redeye'}
        style={{
          ...baseButton,
          color: theme === 'redeye' ? '#F2F1EC' : 'var(--quiet)',
          background: theme === 'redeye' ? '#101A2A' : 'transparent',
          boxShadow: theme === 'redeye'
            ? 'inset 0 0 0 2px #2387FF, inset 0 0 0 4px rgba(35,135,255,.28), 0 0 15px rgba(35,135,255,.18)'
            : 'none',
        }}
      >
        <span style={{ width: 28, height: 28, display: 'grid', placeItems: 'center', flex: 'none' }}>
          <RedeyeIcon />
        </span>
        <span>Redeye</span>
      </button>
    </div>
  );
}
