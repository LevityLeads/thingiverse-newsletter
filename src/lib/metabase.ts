import { METABASE_URL, METABASE_DB } from './config';
import type { Creator, Design, Thing } from './types';

interface MetabaseResponse {
  data: {
    rows: unknown[][];
    cols: { name: string }[];
  };
}

async function queryMetabase(sql: string): Promise<MetabaseResponse> {
  const res = await fetch(`${METABASE_URL}/api/dataset`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.METABASE_API_KEY!,
    },
    body: JSON.stringify({
      database: METABASE_DB,
      type: 'native',
      native: { query: sql },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Metabase query failed (${res.status}): ${text}`);
  }

  return res.json();
}

function escapeSQL(value: string): string {
  return value.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

export async function fetchCreators(usernames: string[]): Promise<Creator[]> {
  if (usernames.length === 0) return [];

  const quoted = usernames.map((u) => `'${escapeSQL(u)}'`).join(', ');

  const creatorSQL = `SELECT u.id, u.username, u.first_name, u.last_name, u.bio, i.path as avatar_path FROM users u LEFT JOIN images i ON u.image_id = i.id WHERE u.username IN (${quoted})`;

  const result = await queryMetabase(creatorSQL);

  const creators: Creator[] = await Promise.all(
    result.data.rows.map(async (row) => {
      const userId = row[0] as number;
      const username = row[1] as string;
      const firstName = (row[2] as string) || '';
      const lastName = (row[3] as string) || '';
      const bio = (row[4] as string) || '';
      const avatarPath = (row[5] as string) || null;

      const designs = await fetchCreatorDesigns(userId);

      return {
        id: userId,
        username,
        firstName,
        lastName,
        bio,
        tagline: '',
        avatarPath,
        designs,
      };
    })
  );

  return creators;
}

async function fetchCreatorDesigns(userId: number): Promise<Design[]> {
  const sql = `SELECT t.id, t.name, t.like_count, t.collect_count, t.comment_count, i.path as image_path FROM things t LEFT JOIN images i ON t.image_id = i.id WHERE t.user_id = ${userId} AND t.is_published = 1 AND t.is_private = 0 ORDER BY t.like_count DESC LIMIT 4`;

  const result = await queryMetabase(sql);

  return result.data.rows.map((row) => ({
    id: row[0] as number,
    name: (row[1] as string) || '',
    likeCount: (row[2] as number) || 0,
    collectCount: (row[3] as number) || 0,
    commentCount: (row[4] as number) || 0,
    imagePath: (row[5] as string) || null,
  }));
}

function groupImagesByThing(result: MetabaseResponse): Map<number, string[]> {
  const map = new Map<number, string[]>();
  for (const row of result.data.rows) {
    const thingId = row[0] as number;
    const path = row[1] as string;
    if (!map.has(thingId)) map.set(thingId, []);
    map.get(thingId)!.push(path);
  }
  return map;
}

async function fetchThingSecondaryImages(thingIds: number[]): Promise<Map<number, string[]>> {
  if (thingIds.length === 0) return new Map();
  const ids = thingIds.join(', ');

  try {
    // Try thing_images junction table (most likely schema)
    const sql = `SELECT ti.thing_id, i.path FROM thing_images ti JOIN images i ON ti.image_id = i.id WHERE ti.thing_id IN (${ids}) ORDER BY ti.thing_id, ti.sort_order LIMIT 50`;
    const result = await queryMetabase(sql);
    return groupImagesByThing(result);
  } catch {
    // Fallback: try querying images table directly
    try {
      const sql = `SELECT thing_id, path FROM images WHERE thing_id IN (${ids}) ORDER BY thing_id, id LIMIT 50`;
      const result = await queryMetabase(sql);
      return groupImagesByThing(result);
    } catch {
      console.warn('Could not fetch secondary images - table may not exist');
      return new Map();
    }
  }
}

export async function fetchThings(thingIds: number[]): Promise<Thing[]> {
  if (thingIds.length === 0) return [];

  const ids = thingIds.join(', ');

  const sql = `SELECT t.id, t.name, t.like_count, t.collect_count, t.comment_count, i.path as image_path, u.username, u.first_name, u.last_name FROM things t LEFT JOIN images i ON t.image_id = i.id LEFT JOIN users u ON t.user_id = u.id WHERE t.id IN (${ids})`;

  const result = await queryMetabase(sql);

  const things: Thing[] = result.data.rows.map((row) => ({
    id: row[0] as number,
    name: (row[1] as string) || '',
    description: '',
    likeCount: (row[2] as number) || 0,
    collectCount: (row[3] as number) || 0,
    commentCount: (row[4] as number) || 0,
    imagePath: (row[5] as string) || null,
    secondaryImages: [],
    creator: {
      username: (row[6] as string) || '',
      firstName: (row[7] as string) || '',
      lastName: (row[8] as string) || '',
    },
  }));

  // Try to get secondary images
  const secondaryMap = await fetchThingSecondaryImages(thingIds);
  for (const thing of things) {
    const images = secondaryMap.get(thing.id) || [];
    // Exclude the primary image, take up to 3
    thing.secondaryImages = images
      .filter((p) => p !== thing.imagePath)
      .slice(0, 3);
  }

  return things;
}
