import { NextResponse } from 'next/server';
import { listSends } from '@/lib/sendgrid';

export async function GET() {
  try {
    const sends = await listSends();
    return NextResponse.json({ sends });
  } catch (err) {
    console.error('List sends error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
