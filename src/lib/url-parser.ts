function normalizeUrl(url: string): string {
  let u = url.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = 'https://' + u;
  }
  return u;
}

export function parseUsername(url: string): string | null {
  try {
    const parsed = new URL(normalizeUrl(url));
    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    if (parts[0].startsWith('thing:')) return null;
    return parts[0];
  } catch {
    return null;
  }
}

export function parseThingId(url: string): number | null {
  // Handle bare "thing:12345" input
  const bareMatch = url.trim().match(/^thing:(\d+)/);
  if (bareMatch) return parseInt(bareMatch[1], 10);

  try {
    const parsed = new URL(normalizeUrl(url));
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
