import { CONTACT_API } from '../constants';
import type { EmailMessage } from './email-message';

interface SendInput {
  apiKey: string;
  to: string;
  /** The visitor's address: replying to the email answers them. */
  replyTo: string;
  message: EmailMessage;
}

/** Resend's HTTP status, or null when the request never got an answer (network, timeout). */
export interface SendResult {
  sent: boolean;
  status: number | null;
}

/** Sends one email through Resend's REST API. */
export async function sendWithResend(
  { apiKey, to, replyTo, message }: SendInput,
  fetchImpl: typeof fetch,
): Promise<SendResult> {
  try {
    const response = await fetchImpl(CONTACT_API.resendSendUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_API.from,
        to: [to],
        reply_to: replyTo,
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(CONTACT_API.upstreamTimeoutMs),
    });
    return { sent: response.ok, status: response.status };
  } catch {
    return { sent: false, status: null };
  }
}
