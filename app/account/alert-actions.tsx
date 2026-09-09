'use client';

import { useState } from 'react';
import styles from './account.module.css';

export default function AlertActions({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function remove() {
    setDeleting(true);
    setError('');
    try {
      const response = await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not delete this alert.');
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete this alert.');
      setDeleting(false);
    }
  }

  if (!confirming) {
    return <div className={styles.alertActions}><a className={styles.editButton} href={`/alerts/edit/${id}`}>Edit</a><button type="button" className={styles.deleteButton} onClick={() => setConfirming(true)}>Delete</button></div>;
  }

  return (
    <div className={styles.deleteConfirm}>
      <span>Delete this fare watch?</span>
      <button type="button" className={styles.deleteConfirmButton} onClick={remove} disabled={deleting}>{deleting ? 'Deleting…' : 'Yes, delete'}</button>
      <button type="button" className={styles.cancelButton} onClick={() => setConfirming(false)} disabled={deleting}>Cancel</button>
      {error && <span className={styles.deleteError}>{error}</span>}
    </div>
  );
}
