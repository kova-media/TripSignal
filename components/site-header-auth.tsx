'use client';

import { useEffect, useState } from 'react';
import SiteHeader from '@/components/site-header';

export default function SiteHeaderAuth() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && data.authenticated) setAuthenticated(true);
      })
      .catch(() => {});
  }, []);

  return <SiteHeader authenticated={authenticated} />;
}
