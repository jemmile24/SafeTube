import type { VercelRequest, VercelResponse } from '@vercel/node';

// Canonical YouTube video ID regex
const YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

function extractVideoId(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (YOUTUBE_ID_REGEX.test(trimmed)) return trimmed;

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = url.hostname.toLowerCase();

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('/')[0];
      return YOUTUBE_ID_REGEX.test(id) ? id : null;
    }

    if (
      host === 'www.youtube.com' ||
      host === 'youtube.com' ||
      host === 'm.youtube.com' ||
      host === 'www.youtube-nocookie.com'
    ) {
      if (url.pathname === '/watch') {
        const id = url.searchParams.get('v');
        return id && YOUTUBE_ID_REGEX.test(id) ? id : null;
      }
      if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) {
        const id = url.pathname.split('/')[2];
        return id && YOUTUBE_ID_REGEX.test(id) ? id : null;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sheetId = (req.query.sheetId as string) || process.env.GOOGLE_SHEETS_ID;
  const range = (req.query.range as string) || process.env.GOOGLE_SHEETS_RANGE || 'Videos!A2:A';
  const sheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;

  if (!sheetId) {
    return res.status(400).json({ error: 'Missing GOOGLE_SHEETS_ID' });
  }

  try {
    let rawUrls: string[] = [];

    if (sheetsApiKey) {
      // Fetch via Google Sheets API v4
      const sheetsUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(
        range
      )}?key=${sheetsApiKey}`;
      const sheetsRes = await fetch(sheetsUrl);
      if (!sheetsRes.ok) {
        throw new Error(`Sheets API failed with status ${sheetsRes.status}`);
      }
      const data = await sheetsRes.json();
      rawUrls = (data.values || []).map((row: any) => row[0]).filter(Boolean);
    } else {
      // Fetch via public CSV export
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
      const csvRes = await fetch(csvUrl);
      if (!csvRes.ok) {
        throw new Error(`Public CSV export failed with status ${csvRes.status}`);
      }
      const csvText = await csvRes.text();
      rawUrls = csvText
        .split(/\r?\n/)
        .map((line) => line.replace(/^"+|"+$/g, '').split(',')[0].trim())
        .filter(Boolean);
    }

    // Deduplicate and validate
    const seen = new Set<string>();
    const videoIds: string[] = [];

    for (const url of rawUrls) {
      const id = extractVideoId(url);
      if (id && !seen.has(id)) {
        seen.add(id);
        videoIds.push(id);
      }
    }

    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({
      approvedVideoIds: videoIds,
      totalCount: videoIds.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
