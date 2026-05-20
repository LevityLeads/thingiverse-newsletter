import { NextResponse } from 'next/server';
import { getSendStats } from '@/lib/sendgrid';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sendId = searchParams.get('sendId');

    if (!sendId) {
      return NextResponse.json(
        { error: 'sendId query parameter is required' },
        { status: 400 }
      );
    }

    const stats = await getSendStats(sendId);

    if (!stats) {
      return NextResponse.json(
        { error: 'No stats found for this send' },
        { status: 404 }
      );
    }

    return NextResponse.json({ stats });
  } catch (err) {
    console.error('Stats error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
