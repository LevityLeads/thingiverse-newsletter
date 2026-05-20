import { NextResponse } from 'next/server';
import type { NewsletterType, Thing, Creator } from '@/lib/types';
import { BANNERS } from '@/lib/config';
import { fetchCreators, fetchThings } from '@/lib/metabase';
import { renderCreatorSpotlight } from '@/lib/templates/creator-spotlight';
import { renderTheBuild } from '@/lib/templates/the-build';
import { parseUsername, parseThingId } from '@/lib/url-parser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type } = body as { type: NewsletterType };

    if (!type) {
      return NextResponse.json(
        { error: 'type is required' },
        { status: 400 }
      );
    }

    const activeBanners = BANNERS.filter((b) => b.active);

    if (type === 'creator-spotlight') {
      let creators: Creator[];

      if (body.creators && Array.isArray(body.creators) && body.creators.length > 0) {
        // New flow: pre-built data with taglines/bios from UI
        creators = body.creators;
      } else if (body.urls && Array.isArray(body.urls) && body.urls.length > 0) {
        // Legacy flow: fetch from Metabase
        const usernames = (body.urls as string[])
          .map(parseUsername)
          .filter((u): u is string => u !== null);

        if (usernames.length === 0) {
          return NextResponse.json(
            { error: 'No valid creator URLs found' },
            { status: 400 }
          );
        }

        creators = await fetchCreators(usernames);

        if (creators.length === 0) {
          return NextResponse.json(
            { error: `Metabase returned no data for usernames: ${usernames.join(', ')}. The database replica may be lagging. Try again in a few minutes.` },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'creators array or urls array is required' },
          { status: 400 }
        );
      }

      const html = renderCreatorSpotlight(creators, activeBanners);
      return NextResponse.json({ html, data: creators });
    }

    if (type === 'the-build') {
      let things: Thing[];
      const introText: string | undefined = body.introText;

      if (body.things && Array.isArray(body.things) && body.things.length > 0) {
        // New flow: pre-built data with descriptions from UI
        things = body.things;
      } else if (body.urls && Array.isArray(body.urls) && body.urls.length > 0) {
        // Legacy flow: fetch from Metabase
        const thingIds = (body.urls as string[])
          .map(parseThingId)
          .filter((id): id is number => id !== null);

        if (thingIds.length === 0) {
          return NextResponse.json(
            { error: 'No valid thing URLs found' },
            { status: 400 }
          );
        }

        things = await fetchThings(thingIds);

        if (things.length === 0) {
          return NextResponse.json(
            { error: `Metabase returned no data for thing IDs: ${thingIds.join(', ')}. The database replica may be lagging. Try again in a few minutes.` },
            { status: 404 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'things array or urls array is required' },
          { status: 400 }
        );
      }

      const html = renderTheBuild(things, activeBanners, introText);
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
