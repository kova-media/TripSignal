'use client';

import { FormEvent, useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setMessage('');

    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? ''),
          email: String(data.get('email') ?? ''),
          subject: String(data.get('subject') ?? ''),
          message: String(data.get('message') ?? ''),
          website: String(data.get('website') ?? ''),
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Unable to send your message.');

      form.reset();
      setStatus('success');
      setMessage('Your message has been sent.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Unable to send your message. Please try again.');
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-field-row">
        <label>
          Name
          <input name="name" type="text" autoComplete="name" maxLength={100} required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" maxLength={254} required />
        </label>
      </div>

      <label>
        Subject
        <input name="subject" type="text" maxLength={160} required />
      </label>

      <label>
        Message
        <textarea name="message" rows={7} maxLength={5000} required />
      </label>

      <input className="contact-honeypot" name="website" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="contact-submit-row">
        <button type="submit" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending…' : 'Send message'}
        </button>
        {message && <p className={status === 'error' ? 'contact-status contact-error' : 'contact-status'}>{message}</p>}
      </div>
    </form>
  );
}
