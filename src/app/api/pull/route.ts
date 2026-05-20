import { NextResponse } from 'next/server';
import type { NewsletterType } from '@/lib/types';
import { fetchCreators, fetchThings } from '@/lib/metabase';
import { parseUsername, parseThingId } from '@/lib/url-parser';

export async function POST(request: Request) {
  try {
    const { type, urls } = (await request.json()) as {
      type: NewsletterType;
      urls: string[];
    };

    if (!type || !urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: 'type and urls are required' },
        { status: 400 }
      );
    }

    if (type === 'creator-spotlight') {
      const usernames = urls
        .map(parseUsername)
        .filter((u): u is string => u !== null);

      if (usernames.length === 0) {
        return NextResponse.json(
          { error: 'No valid creator URLs found' },
          { status: 400 }
        );
      }

      const creators = await fetchCreators(usernames);

      if (creators.length === 0) {
        return NextResponse.json(
          { error: `Metabase returned no data for usernames: ${usernames.join(', ')}. The database replica may be lagging. Try again in a few minutes.` },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: creators });
    }

    if (type === 'the-build') {
      const thingIds = urls
        .map(parseThingId)
        .filter((id): id is number => id !== null);

      if (thingIds.length === 0) {
        return NextResponse.json(
          { error: 'No valid thing URLs found' },
          { status: 400 }
        );
      }

      const things = await fetchThings(thingIds);

      if (things.length === 0) {
        return NextResponse.json(
          { error: `Metabase returned no data for thing IDs: ${thingIds.join(', ')}. The database replica may be lagging. Try again in a few minutes.` },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: things });
    }

    return NextResponse.json(
      { error: `Unknown newsletter type: ${type}` },
      { status: 400 }
    );
  } catch (err) {
    console.error('Pull error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
