'use client';

import { useEffect, useState } from 'react';

type Theme = 'daylight' | 'redeye';
const THEME_KEY = 'tripsignal-theme-v2';

function DaylightIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="23" cy="23" r="10" fill="#F4B83F"/><g stroke="#F5C34B" strokeWidth="3.2" strokeLinecap="round"><path d="M24 3.5v6"/><path d="M24 38.5v6"/><path d="M3.5 24h6"/><path d="M38.5 24h6"/><path d="m9.5 9.5 4.2 4.2"/><path d="m34.3 34.3 4.2 4.2"/><path d="m38.5 9.5-4.2 4.2"/><path d="m13.7 34.3-4.2 4.2"/></g></svg>;
}

function RedeyeIcon() {
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M28.5 7.5c-6.2 1.5-10.8 7.1-10.8 13.8 0 7.8 6.3 14.1 14.1 14.1 2.8 0 5.5-.8 7.7-2.3-2.7 4.7-7.7 7.9-13.8 7.9-8.6 0-15.6-7-15.6-15.6 0-8.5 6.8-15.4 15.3-15.6 1 0 2 .1 3.1.3Z" fill="#FF6548"/><g fill="#F3DAD6"><path d="m36 7 1.8 4.1 4.2 1.8-4.2 1.7-1.8 4.2-1.7-4.2-4.2-1.7 4.2-1.8L36 7Z"/><path d="m28.5 18 1.1 2.7 2.7 1.1-2.7 1.1-1.1 2.7-1.1-2.7-2.7-1.1 2.7-2.7Z"/></g></svg>;
}

const baseButton: React.CSSProperties = { position:'relative', display:'flex', alignItems:'center', justifyContent:'center', gap:7, minWidth:0, height:36, padding:'4px 10px', border:0, borderRadius:999, background:'transparent', color:'var(--quiet)', fontSize:11, fontWeight:600, letterSpacing:'-0.01em', whiteSpace:'nowrap' };

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('redeye');

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(THEME_KEY);
      const initial: Theme = saved === 'daylight' ? 'daylight' : 'redeye';
      setTheme(initial);
      document.documentElement.dataset.theme = initial;
    } catch {
      document.documentElement.dataset.theme = 'redeye';
    }
  }, []);

  function changeTheme(next: Theme) {
    setTheme(next);
    try {
      document.documentElement.dataset.theme = next;
      window.localStorage.setItem(THEME_KEY, next);
    } catch {}
  }

  return <div className="theme-toggle" aria-label="Choose appearance" style={{display:'inline-flex',alignItems:'center',width:'fit-content',maxWidth:'100%',gap:2,padding:3,border:'1px solid var(--line-strong)',borderRadius:999,background:'var(--surface)'}}>
    <button type="button" className={`theme-option ${theme === 'daylight' ? 'active' : ''}`} onClick={() => changeTheme('daylight')} aria-pressed={theme === 'daylight'} style={{...baseButton,color:theme === 'daylight'?'var(--ink)':'var(--quiet)',background:theme === 'daylight'?'var(--surface-2)':'transparent'}}><span style={{width:22,height:22,display:'grid',placeItems:'center'}}><DaylightIcon/></span><span>Daylight</span></button>
    <button type="button" className={`theme-option ${theme === 'redeye' ? 'active' : ''}`} onClick={() => changeTheme('redeye')} aria-pressed={theme === 'redeye'} style={{...baseButton,color:theme === 'redeye'?'#F2F1EC':'var(--quiet)',background:theme === 'redeye'?'#101A2A':'transparent',boxShadow:theme === 'redeye'?'inset 0 0 0 2px #2387FF, 0 0 15px rgba(35,135,255,.18)':'none'}}><span style={{width:22,height:22,display:'grid',placeItems:'center'}}><RedeyeIcon/></span><span>Redeye</span></button>
  </div>;
}
