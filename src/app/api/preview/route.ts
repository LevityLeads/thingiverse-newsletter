import { NextResponse } from 'next/server';
import type { NewsletterType } from '@/lib/types';
import { BANNERS } from '@/lib/config';
import { fetchCreators, fetchThings } from '@/lib/metabase';
import { renderCreatorSpotlight } from '@/lib/templates/creator-spotlight';
import { renderTheBuild } from '@/lib/templates/the-build';

function parseUsername(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    // Skip if the first segment is a thing URL
    if (parts[0].startsWith('thing:')) return null;
    return parts[0];
  } catch {
    return null;
  }
}

function parseThingId(url: string): number | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    for (const part of parts) {
      const match = part.match(/^thing:(\d+)/);
      if (match) return parseInt(match[1], 10);
    }
    return null;
  } catch {
    return null;
  }
}

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

    const activeBanners = BANNERS.filter((b) => b.active);

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
      const html = renderCreatorSpotlight(creators, activeBanners);

      return NextResponse.json({ html, data: creators });
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
      const html = renderTheBuild(things, activeBanners);

      return NextResponse.json({ html, data: things });
    }

    return NextResponse.json(
      { error: `Unknown newsletter type: ${type}` },
      { status: 400 }
    );
  } catch (err) {
    console.error('Preview error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
