'use client';

import { useEffect, useState } from 'react';
import TripDiscoveryDirect from '@/components/trip-discovery-direct';

export default function DiscoveryWithEmail() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.email) setEmail(data.email);
      })
      .catch(() => {});
  }, []);

  return <TripDiscoveryDirect accountEmail={email} />;
}
