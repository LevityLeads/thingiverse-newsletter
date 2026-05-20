import { SENDER_ID, SUPPRESSION_GROUP } from './config';
import type { SingleSend, SendStats } from './types';

const SENDGRID_BASE = 'https://api.sendgrid.com/v3';

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function sgFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(`${SENDGRID_BASE}${path}`, {
    ...options,
    headers: { ...headers(), ...(options.headers as Record<string, string>) },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SendGrid ${options.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }

  return res;
}

export async function sendTestEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  await sgFetch('/mail/send', {
    method: 'POST',
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }], subject }],
      from: { email: 'marketing@thingiverse.com', name: 'Thingiverse' },
      content: [{ type: 'text/html', value: html }],
      tracking_settings: {
        click_tracking: { enable: true },
        open_tracking: { enable: true },
      },
    }),
  });
}

export async function createSingleSend(
  name: string,
  subject: string,
  html: string,
  segmentId: string
): Promise<string> {
  const res = await sgFetch('/marketing/singlesends', {
    method: 'POST',
    body: JSON.stringify({
      name,
      send_to: { segment_ids: [segmentId] },
      email_config: {
        subject,
        html_content: html,
        sender_id: SENDER_ID,
        suppression_group_id: SUPPRESSION_GROUP,
        generate_plain_content: true,
        editor: 'code',
      },
    }),
  });

  const data = await res.json();
  return data.id;
}

export async function scheduleSend(
  sendId: string,
  sendAt: string
): Promise<void> {
  await sgFetch(`/marketing/singlesends/${sendId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify({ send_at: sendAt }),
  });
}

export async function listSends(): Promise<SingleSend[]> {
  const res = await sgFetch('/marketing/singlesends?page_size=25');
  const data = await res.json();
  return data.result || [];
}

export async function getSendStats(
  sendId: string
): Promise<SendStats | null> {
  const res = await sgFetch(`/marketing/singlesends/${sendId}/stats`);
  const data = await res.json();

  const entry = data.results?.[0];
  if (!entry?.stats) return null;

  const s = entry.stats;
  return {
    delivered: s.delivered ?? 0,
    opens: s.opens ?? 0,
    unique_opens: s.unique_opens ?? 0,
    clicks: s.clicks ?? 0,
    unique_clicks: s.unique_clicks ?? 0,
    bounces: s.bounces ?? 0,
    spam_reports: s.spam_reports ?? 0,
    unsubscribes: s.unsubscribes ?? 0,
    requests: s.requests ?? 0,
  };
}

export async function cancelSend(sendId: string): Promise<void> {
  await sgFetch(`/marketing/singlesends/${sendId}/schedule`, {
    method: 'DELETE',
  });
}
