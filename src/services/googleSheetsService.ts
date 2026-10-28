import { APP_CONFIG, APPROVED_SEED_URLS } from '../config/app.config';
import { processSheetUrls } from './youtubeUrlParser';
import { getVideosMetadata } from './metadataService';
import { VideoItem } from '../types/video';

export interface SheetFetchResult {
  videos: VideoItem[];
  totalApproved: number;
  duplicateCount: number;
  rejectedCount: number;
  source: 'google_sheets_csv' | 'google_sheets_api' | 'seed_fallback';
  lastSynced: Date;
  error?: string;
}

/**
 * Robust CSV parser for extracting Column A from Google Sheets CSV export
 */
export function parseCsvColumnA(csvText: string): string[] {
  if (!csvText) return [];

  const rows: string[] = [];
  const lines = csvText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Handle CSV quoting for first column
    let colA = '';
    if (trimmed.startsWith('"')) {
      const closingQuote = trimmed.indexOf('"', 1);
      if (closingQuote !== -1) {
        colA = trimmed.substring(1, closingQuote);
      } else {
        colA = trimmed.replace(/^"+|"+$/g, '');
      }
    } else {
      // Split by comma
      const commaIdx = trimmed.indexOf(',');
      colA = commaIdx !== -1 ? trimmed.substring(0, commaIdx) : trimmed;
    }

    colA = colA.trim();
    if (colA) {
      rows.push(colA);
    }
  }

  return rows;
}

/**
 * Fetches approved YouTube URLs from Google Sheets.
 * Supports:
 * 1. Google Sheets API v4 (if API Key is configured)
 * 2. Public Google Sheets CSV / gviz export (no API key required if sheet is public/viewable)
 * 3. Local seed catalog fallback (if sheet ID is placeholder or unreachable)
 */
export async function fetchApprovedCatalog(
  sheetId = APP_CONFIG.GOOGLE_SHEETS_ID,
  range = APP_CONFIG.GOOGLE_SHEETS_RANGE,
  apiKey = APP_CONFIG.GOOGLE_SHEETS_API_KEY,
  youtubeApiKey = APP_CONFIG.YOUTUBE_API_KEY
): Promise<SheetFetchResult> {
  const isPlaceholder =
    !sheetId ||
    sheetId.includes('placeholder') ||
    sheetId === 'YOUR_GOOGLE_SHEET_ID';

  // If using placeholder ID and fallback is enabled, load curated seed catalog
  if (isPlaceholder && APP_CONFIG.ENABLE_SAMPLE_CATALOG_FALLBACK) {
    return loadSeedCatalog(youtubeApiKey);
  }

  let rawUrls: string[] = [];
  let source: 'google_sheets_csv' | 'google_sheets_api' | 'seed_fallback' = 'google_sheets_csv';

  try {
    if (apiKey) {
      // Method 1: Google Sheets API v4
      source = 'google_sheets_api';
      const encodedRange = encodeURIComponent(range);
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodedRange}?key=${apiKey}`;

      const res = await fetch(apiUrl);
      if (!res.ok) {
        throw new Error(`Google Sheets API returned status ${res.status}`);
      }

      const data = await res.json();
      const values: string[][] = data.values || [];
      rawUrls = values.map((row) => (row && row[0] ? String(row[0]) : '')).filter(Boolean);
    } else {
      // Method 2: Public Google Sheets export (via gviz / export?format=csv)
      source = 'google_sheets_csv';

      // Parse sheet name if specified in range (e.g. "Videos!A2:A")
      let sheetNameParam = '';
      if (range.includes('!')) {
        const sheetName = range.split('!')[0];
        sheetNameParam = `&sheet=${encodeURIComponent(sheetName)}`;
      }

      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${sheetNameParam}`;

      const res = await fetch(csvUrl);
      if (!res.ok) {
        // Fallback to alternate export format
        const altCsvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        const altRes = await fetch(altCsvUrl);
        if (!altRes.ok) {
          throw new Error(`Failed to load Google Sheet export (Status ${res.status})`);
        }
        const csvText = await altRes.text();
        rawUrls = parseCsvColumnA(csvText);
      } else {
        const csvText = await res.text();
        rawUrls = parseCsvColumnA(csvText);
      }
    }

    // Process and validate all extracted URLs
    const processed = processSheetUrls(rawUrls);

    // If Google Sheet was completely empty or failed, fallback gracefully
    if (processed.approvedVideoIds.length === 0 && APP_CONFIG.ENABLE_SAMPLE_CATALOG_FALLBACK) {
      console.warn('Google Sheet contained no valid YouTube URLs, falling back to seed catalog');
      return loadSeedCatalog(youtubeApiKey);
    }

    // Fetch video metadata for approved IDs
    const videos = await getVideosMetadata(processed.approvedVideoIds, youtubeApiKey);

    return {
      videos,
      totalApproved: videos.length,
      duplicateCount: processed.duplicateCount,
      rejectedCount: processed.rejectedRows.length,
      source,
      lastSynced: new Date(),
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn('Google Sheets sync error, using fallback catalog:', errorMessage);

    if (APP_CONFIG.ENABLE_SAMPLE_CATALOG_FALLBACK) {
      const fallback = await loadSeedCatalog(youtubeApiKey);
      fallback.error = errorMessage;
      return fallback;
    }

    return {
      videos: [],
      totalApproved: 0,
      duplicateCount: 0,
      rejectedCount: 0,
      source: 'google_sheets_csv',
      lastSynced: new Date(),
      error: errorMessage,
    };
  }
}

/**
 * Loads the curated approved seed URLs (used for development, demo, and fallback)
 */
async function loadSeedCatalog(youtubeApiKey?: string): Promise<SheetFetchResult> {
  const processed = processSheetUrls(APPROVED_SEED_URLS);
  const videos = await getVideosMetadata(processed.approvedVideoIds, youtubeApiKey);

  return {
    videos,
    totalApproved: videos.length,
    duplicateCount: processed.duplicateCount,
    rejectedCount: processed.rejectedRows.length,
    source: 'seed_fallback',
    lastSynced: new Date(),
  };
}
