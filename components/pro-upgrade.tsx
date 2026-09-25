'use client';

import { useEffect, useState } from 'react';
import BillingButton from '@/app/account/billing-button';

type MeState = 'loading' | 'signed-out' | 'signed-in';

export default function ProUpgrade() {
  const [state, setState] = useState<MeState>('loading');
  const [active, setActive] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data && data.authenticated) {
          setActive(Boolean(data.subscriptionActive));
          setState('signed-in');
        } else {
          setState('signed-out');
        }
      })
      .catch(() => setState('signed-out'));
  }, []);

  if (state !== 'signed-in') {
    return <a className="button button-primary" href="/signin?next=%2Faccount">Sign in to upgrade</a>;
  }
  return <BillingButton active={active} />;
}
