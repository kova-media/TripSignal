'use client';

import { FormEvent, useEffect, useState } from 'react';
import styles from './referral-panel.module.css';

type ReferralState = {
  code: string;
  bonusWatches: number;
  referredBy: boolean;
};

export default function ReferralPanel() {
  const [data, setData] = useState<ReferralState | null>(null);
  const [loading, setLoading] = useState(true);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referrals', { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((result) => {
        if (result && result.code) setData(result);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function copyLink() {
    if (!data) return;
    const link = `https://tripsignal.travel/signup?ref=${data.code}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copy didn’t work — select the link above and copy it manually.');
    }
  }

  async function redeem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRedeeming(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/referrals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: redeemCode }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not redeem that code.');
      setSuccess('Referral applied — your friend earned a bonus watch.');
      setData((previous) => (previous ? { ...previous, referredBy: true } : previous));
      setRedeemCode('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not redeem that code.');
    } finally {
      setRedeeming(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.panel}>
        <p className={styles.muted}>Loading referrals…</p>
      </div>
    );
  }
  if (!data) return null;

  const link = `https://tripsignal.travel/signup?ref=${data.code}`;

  return (
    <div className={styles.panel}>
      <p className={styles.eyebrow}>Referrals</p>
      <h2 className={styles.title}>Refer friends, earn watches</h2>
      <p className={styles.text}>
        Share your link. When a friend signs up and redeems your code, you earn +1 bonus watch
        every month — on top of your free monthly watch.
      </p>

      <label className={styles.label}>
        <span>Your referral link</span>
        <div className={styles.linkRow}>
          <input className={styles.input} type="text" value={link} readOnly onFocus={(event) => event.target.select()} />
          <button className="button button-primary" type="button" onClick={copyLink}>
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </label>

      <div className={styles.stats}>
        <div><span>Bonus watches earned</span><strong>{data.bonusWatches}</strong></div>
        <div><span>Free watches / month</span><strong>{1 + data.bonusWatches}</strong></div>
      </div>

      <div className={styles.divider} />

      <h3 className={styles.subtitle}>Have a referral code?</h3>
      {data.referredBy ? (
        <p className={styles.text}>You’ve already redeemed a referral code.</p>
      ) : (
        <form onSubmit={redeem} className={styles.form}>
          <input
            className={styles.input}
            type="text"
            value={redeemCode}
            onChange={(event) => setRedeemCode(event.target.value.toUpperCase())}
            placeholder="8-character code"
            maxLength={8}
            autoComplete="off"
            required
          />
          <button className="button button-primary" type="submit" disabled={redeeming}>
            {redeeming ? 'Redeeming…' : 'Redeem'}
          </button>
        </form>
      )}
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </div>
  );
}
