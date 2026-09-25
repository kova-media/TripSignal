/**
 * Optional SMS alerts via Twilio. OFF by default: nothing in the codebase calls
 * this unless the Twilio env vars are present AND the user has opted in.
 *
 * Env vars:
 *   TWILIO_ACCOUNT_SID  - Twilio account SID (AC...)
 *   TWILIO_AUTH_TOKEN   - Twilio auth token
 *   TWILIO_FROM_NUMBER  - Verified Twilio sender number in E.164, e.g. +15551234567
 *
 * No new npm dependencies: plain fetch against Twilio's REST API.
 */

const TWILIO_API = 'https://api.twilio.com/2010-04-01';

type SmsConfig = { sid: string; authToken: string; from: string };

function smsConfig(): SmsConfig {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_NUMBER;
  if (!sid || !authToken || !from) {
    throw new Error(
      'SMS alerts are not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER.',
    );
  }
  return { sid, authToken, from };
}

/** True when all Twilio env vars are present. Callers use this to treat SMS as disabled. */
export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

function validE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone.trim());
}

/**
 * Send a single SMS via Twilio. Keep `message` short — aim for under 160
 * characters so it fits in one segment. Throws when Twilio is not configured
 * or the send fails. Never logs the recipient or message contents.
 */
export async function sendSmsAlert(to: string, message: string): Promise<void> {
  const { sid, authToken, from } = smsConfig();
  const recipient = to.trim();
  if (!validE164(recipient)) {
    throw new Error('Invalid recipient phone number. Use E.164 format, e.g. +15551234567.');
  }
  const credentials = Buffer.from(`${sid}:${authToken}`).toString('base64');
  const response = await fetch(
    `${TWILIO_API}/Accounts/${encodeURIComponent(sid)}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: recipient, From: from, Body: message }).toString(),
    },
  );
  if (!response.ok) {
    // Twilio error payloads carry code/message only, never the recipient or body.
    let detail = '';
    try {
      const payload = (await response.json()) as { code?: number; message?: string };
      detail = [payload.code, payload.message].filter(Boolean).join(' ');
    } catch {
      detail = '';
    }
    throw new Error(`Twilio SMS send failed (HTTP ${response.status}). ${detail}`.trim());
  }
}
