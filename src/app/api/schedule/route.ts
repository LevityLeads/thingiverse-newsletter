import { NextResponse } from 'next/server';
import type { NewsletterType } from '@/lib/types';
import { SEGMENTS, DEFAULT_SEND_HOUR_UTC } from '@/lib/config';
import { createSingleSend, scheduleSend } from '@/lib/sendgrid';

const BATCH_KEYS = ['batch1', 'batch2', 'batch3'] as const;

export async function POST(request: Request) {
  try {
    const { type, name, subject, html, startDate } = (await request.json()) as {
      type: NewsletterType;
      name: string;
      subject: string;
      html: string;
      startDate: string;
    };

    if (!type || !name || !subject || !html || !startDate) {
      return NextResponse.json(
        { error: 'type, name, subject, html, and startDate are required' },
        { status: 400 }
      );
    }

    const sends: { id: string; name: string; scheduledAt: string }[] = [];

    for (let i = 0; i < BATCH_KEYS.length; i++) {
      const batchKey = BATCH_KEYS[i];
      const segmentId = SEGMENTS[batchKey];
      const batchName = `${name} - Batch ${i + 1}`;

      // Schedule each batch one day apart at 5pm UTC
      const sendDate = new Date(startDate);
      sendDate.setUTCDate(sendDate.getUTCDate() + i);
      sendDate.setUTCHours(DEFAULT_SEND_HOUR_UTC, 0, 0, 0);
      const sendAt = sendDate.toISOString();

      const sendId = await createSingleSend(
        batchName,
        subject,
        html,
        segmentId
      );

      await scheduleSend(sendId, sendAt);

      sends.push({ id: sendId, name: batchName, scheduledAt: sendAt });
    }

    return NextResponse.json({ sends });
  } catch (err) {
    console.error('Schedule error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
