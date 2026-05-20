import { NextResponse } from 'next/server';
import { sendTestEmail } from '@/lib/sendgrid';

export async function POST(request: Request) {
  try {
    const { to, subject, html } = await request.json();

    if (!to || !subject || !html) {
      return NextResponse.json(
        { error: 'to, subject, and html are required' },
        { status: 400 }
      );
    }

    await sendTestEmail(to, subject, html);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Test send error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
