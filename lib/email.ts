import { Resend } from 'resend';
import type { FlightOffer } from './flights/types';

const ALERT_FROM_EMAIL = 'TripSignal Alerts <alerts@tripsignal.travel>';

type AlertEmailCriteria = {
  maxPrice: number;
  cabin: 'economy' | 'premium_economy' | 'business';
  airlineMode: string;
  maxStops: string;
  tripLength: string;
};

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured.');
  return new Resend(process.env.RESEND_API_KEY);
}

function getFrom() {
  return ALERT_FROM_EMAIL;
}

function cabinLabel(cabin: AlertEmailCriteria['cabin']) {
  if (cabin === 'premium_economy') return 'Premium economy';
  if (cabin === 'business') return 'Business';
  return 'Economy';
}

function stopLabel(stops: number) {
  return stops === 0 ? 'Nonstop' : `${stops} stop${stops === 1 ? '' : 's'}`;
}

function airlineLabel(offer: FlightOffer) {
  const airlines = offer.segments
    .map((segment) => segment.marketingCarrier)
    .filter(Boolean)[0] ?? 'Airline unavailable';
  return airlines.replace(/,\s*/g, ' / ');
}

function formatDateRange(departureDate: string, returnDate: string) {
  const departure = new Date(`${departureDate}T12:00:00Z`);
  const returned = new Date(`${returnDate}T12:00:00Z`);
  const month = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' });
  const day = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' });
  const year = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' });
  const departureMonth = month.format(departure);
  const returnMonth = month.format(returned);
  const departureYear = year.format(departure);
  const returnYear = year.format(returned);

  if (departureMonth === returnMonth && departureYear === returnYear) {
    return `${departureMonth} ${day.format(departure)}–${day.format(returned)}, ${departureYear}`;
  }
  if (departureYear === returnYear) {
    return `${departureMonth} ${day.format(departure)}–${returnMonth} ${day.format(returned)}, ${departureYear}`;
  }
  return `${departureMonth} ${day.format(departure)}, ${departureYear}–${returnMonth} ${day.format(returned)}, ${returnYear}`;
}

function formatDuration(minutes?: number) {
  if (!minutes || minutes <= 0) return 'Duration unavailable';
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours}h ${remaining}m` : `${hours}h`;
}

function tripLengthDays(offer: FlightOffer) {
  const departure = new Date(`${offer.departureDate}T12:00:00Z`).getTime();
  const returned = new Date(`${offer.returnDate}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((returned - departure) / 86400000));
}

function tripLengthRange(value: string): [number, number] {
  switch (value) {
    case '3–7 days': return [3, 7];
    case '1–2 weeks': return [7, 14];
    case '1–4 weeks': return [7, 28];
    default: return [7, 21];
  }
}

function criteriaMatchCount(offer: FlightOffer, criteria: AlertEmailCriteria) {
  const [minTripDays, maxTripDays] = tripLengthRange(criteria.tripLength);
  const tripDays = tripLengthDays(offer);
  const matches = [
    offer.price < criteria.maxPrice,
    true,
    true,
    criteria.airlineMode === 'all' || airlineLabel(offer).toUpperCase().includes(criteria.airlineMode.toUpperCase()),
    criteria.maxStops === 'any' || offer.stops <= Number(criteria.maxStops),
    tripDays >= minTripDays && tripDays <= maxTripDays,
  ];
  return matches.filter(Boolean).length;
}

function flightUrl(offer: FlightOffer) {
  const query = `Flights from ${offer.origin} to ${offer.destination} on ${offer.departureDate} through ${offer.returnDate}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(query)}`;
}

function offerLabel(offer: FlightOffer) {
  return `${offer.origin} → ${offer.destination} · ${formatDateRange(offer.departureDate, offer.returnDate)} · ${stopLabel(offer.stops)} · $${offer.price.toLocaleString()}`;
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

export async function sendFareSignalEmail(email: string, offers: FlightOffer[], criteria: AlertEmailCriteria) {
  const resend = getResend();
  const first = offers[0];
  if (!first) return;

  const featuredCards = offers.map((offer, index) => {
    const belowTarget = Math.max(0, criteria.maxPrice - offer.price);
    const matchCount = criteriaMatchCount(offer, criteria);
    const cardBackground = index === 0 ? '#171c1b' : '#111615';
    const route = `${escapeHtml(offer.origin)} <span style="color:#7f8985;font-weight:400">→</span> ${escapeHtml(offer.destination)}`;
    const details = `${escapeHtml(airlineLabel(offer))} <span style="color:#68716f">·</span> ${escapeHtml(cabinLabel(criteria.cabin))} <span style="color:#68716f">·</span> ${escapeHtml(stopLabel(offer.stops))} <span style="color:#68716f">·</span> ${escapeHtml(formatDuration(offer.totalDurationMinutes))}`;
    const targetRow = `<tr><td style="padding:20px 0 19px;border-top:1px solid #2b3432"><span style="color:#98a19e;font-size:14px;line-height:20px">Your target</span></td><td align="right" style="padding:20px 0 19px;border-top:1px solid #2b3432"><strong style="color:#f2f4f1;font-size:18px;line-height:24px">$${criteria.maxPrice.toLocaleString()}</strong><span style="color:#91b79e;font-size:14px;font-weight:700;margin-left:14px">$${belowTarget.toLocaleString()} below target</span></td></tr>`;
    const button = `<a href="${escapeHtml(flightUrl(offer))}" style="display:inline-block;background:#f2f4f1;color:#101413;text-decoration:none;padding:13px 18px;border-radius:999px;font-size:14px;font-weight:700;line-height:18px">View signal ↗</a>`;

    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:separate;background:${cardBackground};border:1px solid #2c3633;border-radius:24px;margin:0 0 18px"><tr><td style="padding:22px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-size:14px;font-weight:700;color:#91b79e"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#91b79e;margin-right:10px"></span>Signal found</td><td align="right" style="font-size:13px;color:#8f9995">Just now</td></tr></table><div style="font-size:72px;line-height:.95;font-weight:800;letter-spacing:-4px;color:#f2f4f1;margin-top:30px"><span style="font-size:26px;letter-spacing:0;color:#7d8783;vertical-align:20px;margin-right:4px">$</span>${offer.price.toLocaleString()}</div><div style="font-size:31px;line-height:38px;font-weight:800;letter-spacing:-1.2px;color:#f2f4f1;margin-top:26px">${route}</div><div style="font-size:16px;line-height:24px;color:#a9b0ad;margin-top:10px">${escapeHtml(formatDateRange(offer.departureDate, offer.returnDate))}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px"><tr><td style="padding:18px 0;border-top:1px solid #2b3432;border-bottom:1px solid #2b3432;font-size:14px;line-height:20px;color:#aeb5b2">${details}</td></tr>${targetRow}</table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:18px 0 22px;font-size:14px;line-height:20px;color:#89938f">Matches ${matchCount} of 6 criteria</td><td align="right" style="padding:18px 0 22px">${button}</td></tr></table></td></tr></table>`;
  }).join('');

  const moreSignals = offers.length > 1
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:8px"><tr><td style="padding:8px 0 14px;color:#e7ebe8;font-size:18px;font-weight:700">More signals</td></tr>${offers.slice(1).map((offer) => `<tr><td style="padding:14px 0;border-top:1px solid #2b3432"><a href="${escapeHtml(flightUrl(offer))}" style="color:#f2f4f1;text-decoration:none;font-weight:700">${escapeHtml(offer.origin)} → ${escapeHtml(offer.destination)}</a><br><span style="color:#8f9995;font-size:13px;line-height:21px">${escapeHtml(formatDateRange(offer.departureDate, offer.returnDate))} · $${offer.price.toLocaleString()} · ${escapeHtml(stopLabel(offer.stops))}</span></td></tr>`).join('')}</table>`
    : '';

  const text = `TripSignal found a qualifying fare.\n\n${offers.map(offerLabel).join('\n')}\n\nPrices and availability can change. View the signal to continue to Google Flights.`;
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><style>:root{color-scheme:dark light}@media only screen and (max-width:600px){.email-shell{padding:18px 12px!important}.email-card{padding:20px!important}.price{font-size:58px!important}.route{font-size:27px!important;line-height:34px!important}.details{font-size:12px!important}.target{display:block!important}.target-value{display:block!important;margin-top:5px!important}.cta-cell{display:block!important;text-align:left!important;padding-top:6px!important}.cta-button{display:block!important;text-align:center!important}.footer-copy{font-size:11px!important}}</style></head><body bgcolor="#0b0f0e" style="margin:0;padding:0;background:#0b0f0e;color:#f2f4f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0b0f0e" style="width:100%;background:#0b0f0e"><tr><td class="email-shell" align="center" style="padding:32px 16px"><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px"><tr><td style="padding:0 2px 22px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="color:#f2f4f1;font-size:18px;font-weight:800;letter-spacing:-.4px"><span style="display:inline-block;width:24px;height:24px;border:2px solid #91b79e;border-radius:50%;vertical-align:-7px;margin-right:8px;position:relative"></span>TripSignal</td><td align="right" style="color:#91b79e;font-size:12px;font-weight:700;letter-spacing:.02em">SIGNAL FOUND</td></tr></table></td></tr><tr><td>${featuredCards}</td></tr><tr><td>${moreSignals}</td></tr><tr><td style="padding:20px 4px 0;color:#79837f;font-size:12px;line-height:19px">Prices and availability can change. Open the signal as soon as possible to see the current fare. TripSignal does not sell tickets or guarantee fare availability.</td></tr><tr><td class="footer-copy" style="padding:24px 4px 4px;color:#5f6965;font-size:12px;line-height:18px">You received this email because an active TripSignal alert matched a qualifying fare.<br><a href="https://tripsignal.travel" style="color:#91b79e;text-decoration:none">tripsignal.travel</a></td></tr></table></td></tr></table></body></html>`;

  const { error } = await resend.emails.send({
    from: getFrom(),
    to: [email],
    subject: `TripSignal found $${first.price.toLocaleString()} · ${first.origin} → ${first.destination}`,
    text,
    html,
  });
  if (error) throw new Error(error.message);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character));
}
