'use client';

import { FormEvent, useState } from 'react';
import styles from '@/app/account/account.module.css';

type SmsSettingsProps = {
  initialPhone?: string | null;
  initialOptIn?: boolean;
};

/**
 * SMS alert preferences for the profile page. Saves via POST /api/profile/phone
 * (not implemented yet — that route is the integration point for persisting
 * `users.phone` / `users.sms_opt_in`).
 */
export default function SmsSettings({ initialPhone = null, initialOptIn = false }: SmsSettingsProps) {
  const [phone, setPhone] = useState(initialPhone ?? '');
  const [optIn, setOptIn] = useState(initialOptIn);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(initialOptIn && Boolean(initialPhone));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch('/api/profile/phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), smsOptIn: optIn }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save SMS settings.');
      setEnabled(optIn && phone.trim().length > 0);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save SMS settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className={styles.section}>
      <div className={styles.sectionHeading}>
        <div>
          <p className={styles.eyebrow}>Notifications</p>
          <h2 className={styles.sectionTitle}>SMS alerts</h2>
        </div>
      </div>
      <div className={styles.appearanceRow}>
        <div style={{ flex: 1 }}>
          <h3 className={styles.billingTitle}>Get fare signals by text</h3>
          <p className={styles.billingText}>
            Optional. Every match is emailed regardless — SMS is a second channel for
            time-sensitive fares. Standard messaging rates apply.
          </p>
          <p className={styles.billingText} style={{ marginTop: 8 }}>
            Status: <strong>{enabled ? 'Enabled' : 'Disabled'}</strong>
          </p>
          <form onSubmit={submit} className={styles.form} style={{ marginTop: 18, maxWidth: 420 }}>
            <label className={styles.label}>
              <span>Mobile number</span>
              <input
                className={styles.input}
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+17852171106"
                autoComplete="tel"
                inputMode="tel"
              />
            </label>
            <label className={styles.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={optIn}
                onChange={(event) => setOptIn(event.target.checked)}
              />
              <span>Send me SMS alerts for matching fares</span>
            </label>
            {error && <p className={styles.error}>{error}</p>}
            {saved && !error && <p className={styles.note}>Saved. SMS alerts are {enabled ? 'on' : 'off'}.</p>}
            <button className="button button-primary" type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save SMS settings'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
