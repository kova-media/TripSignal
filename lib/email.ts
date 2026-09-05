import { Resend } from 'resend';
import type { FlightOffer } from './flights/types';

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured.');
  return new Resend(process.env.RESEND_API_KEY);
}

function getFrom() {
  if (!process.env.ALERT_FROM_EMAIL) throw new Error('ALERT_FROM_EMAIL is not configured.');
  return process.env.ALERT_FROM_EMAIL;
}

function offerLabel(offer: FlightOffer) {
  const stopLabel = offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops === 1 ? '' : 's'}`;
  return `${offer.origin} → ${offer.destination} · ${offer.departureDate} to ${offer.returnDate} · ${stopLabel}`;
}

export async function sendMagicLinkEmail(email: string, url: string) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: getFrom(),
    to: [email],
    subject: 'Sign in to TripSignal',
    text: `Sign in to TripSignal:\n\n${url}\n\nThis link expires in 15 minutes and can only be used once.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#102321"><p style="font-size:13px;font-weight:700">TripSignal</p><h1 style="font-size:32px">Sign in to TripSignal.</h1><p>Use the button below to continue to your account.</p><p style="margin:28px 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#527f7a;color:#fff;text-decoration:none;padding:13px 19px;border-radius:999px;font-weight:700">Sign in</a></p><p style="color:#68716f;font-size:13px">This link expires in 15 minutes and can only be used once. If you did not request it, you can ignore this email.</p></div>`,
  });
  if (error) throw new Error(error.message);
}

export async function sendAlertCreatedEmail(email: string, summary: string) {
  const resend = getResend();
  const { error } = await resend.emails.send({
    from: getFrom(),
    to: [email],
    subject: 'Your TripSignal alert is active',
    text: `Your TripSignal alert is active.\n\n${summary}\n\nWe’ll email you when a qualifying fare is found.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;color:#102321"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">TripSignal</p><h1>Your alert is active.</h1><p>${escapeHtml(summary)}</p><p>We’ll email you when a qualifying fare is found.</p></div>`,
  });
  if (error) throw new Error(error.message);
}

export async function sendFareSignalEmail(email: string, offers: FlightOffer[]) {
  const resend = getResend();
  const rows = offers.map((offer) => `<tr><td style="padding:14px 0;border-bottom:1px solid #ddd"><strong>${escapeHtml(offer.origin)} → ${escapeHtml(offer.destination)}</strong><br><span style="color:#5b6866">${escapeHtml(offer.departureDate)} to ${escapeHtml(offer.returnDate)} · ${offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops === 1 ? '' : 's'}`}</span></td><td style="padding:14px 0;border-bottom:1px solid #ddd;text-align:right"><strong style="font-size:22px">$${offer.price.toLocaleString()}</strong><br><span style="color:#5b6866">${escapeHtml(offer.currency)}</span></td></tr>`).join('');
  const first = offers[0];
  const { error } = await resend.emails.send({
    from: getFrom(),
    to: [email],
    subject: `TripSignal: qualifying fare found · ${first.origin} → ${first.destination}`,
    text: `A qualifying fare was found.\n\n${offers.map(offerLabel).join('\n')}`,
    html: `<div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;color:#102321"><p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase">TripSignal signal</p><h1>A qualifying fare was found.</h1><table style="width:100%;border-collapse:collapse">${rows}</table><p style="color:#5b6866">Prices and availability can change. Open the booking result as soon as possible.</p></div>`,
  });
  if (error) throw new Error(error.message);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character));
}
