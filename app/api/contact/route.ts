import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const runtime = 'nodejs';

const MAX_NAME = 100;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 160;
const MAX_MESSAGE = 5000;

function clean(value: unknown, maxLength: number) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  }[character] ?? character));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = clean(body.name, MAX_NAME);
    const email = clean(body.email, MAX_EMAIL);
    const subject = clean(body.subject, MAX_SUBJECT);
    const message = clean(body.message, MAX_MESSAGE);
    const website = clean(body.website, 200);

    // Quietly accept the honeypot field so simple bots do not learn the form was rejected.
    if (website) return NextResponse.json({ ok: true });

    if (!name || !subject || !message) {
      return NextResponse.json({ error: 'Please complete all required fields.' }, { status: 400 });
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const recipient = process.env.CONTACT_EMAIL;
    const from = process.env.ALERT_FROM_EMAIL || 'TripSignal Alerts <alerts@tripsignal.travel>';

    if (!apiKey || !recipient) {
      console.error('TripSignal contact form is missing RESEND_API_KEY or CONTACT_EMAIL.');
      return NextResponse.json({ error: 'The contact form is temporarily unavailable.' }, { status: 503 });
    }

    const resend = new Resend(apiKey);
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

    const { error } = await resend.emails.send({
      from,
      to: [recipient],
      replyTo: email,
      subject: `TripSignal contact: ${subject}`,
      text: `New TripSignal contact message\n\nName: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `<!doctype html><html lang="en"><body style="margin:0;background:#f6f5f1;color:#151817;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif"><div style="max-width:680px;margin:40px auto;padding:32px;background:#fffefa;border:1px solid #dedfda"><p style="margin:0;color:#5b8def;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">TripSignal contact</p><h1 style="margin:12px 0 26px;font-size:30px;line-height:1.1">${safeSubject}</h1><p style="margin:0 0 8px"><strong>From:</strong> ${safeName}</p><p style="margin:0 0 22px"><strong>Email:</strong> ${safeEmail}</p><div style="padding-top:22px;border-top:1px solid #dedfda;font-size:15px;line-height:1.7">${safeMessage}</div></div></body></html>`,
    });

    if (error) {
      console.error('TripSignal contact email error:', error);
      return NextResponse.json({ error: 'We could not send your message. Please try again.' }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('TripSignal contact form error:', error);
    return NextResponse.json({ error: 'We could not send your message. Please try again.' }, { status: 400 });
  }
}
