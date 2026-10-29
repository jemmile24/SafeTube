import { APP_CONFIG, APPROVED_SEED_URLS } from '../config/app.config';
import { processSheetRowEntries, SheetRowData } from './youtubeUrlParser';
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
 * Splits a CSV line taking quotes into account
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Robust CSV parser for extracting Column A (URL), Column B (Title), Column C (Category)
 */
export function parseCsvRows(csvText: string): SheetRowData[] {
  if (!csvText) return [];

  const rows: SheetRowData[] = [];
  const lines = csvText.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cols = parseCsvLine(trimmed);
    const url = cols[0] || '';
    const customTitle = cols[1] || undefined;
    const customCategory = cols[2] || undefined;

    if (url) {
      rows.push({
        url,
        customTitle,
        customCategory,
      });
    }
  }

  return rows;
}

/**
 * Legacy helper for backwards compatibility
 */
export function parseCsvColumnA(csvText: string): string[] {
  return parseCsvRows(csvText).map((r) => r.url);
}

/**
 * Fetches approved YouTube URLs from Google Sheets.
 * Supports:
 * 1. Google Sheets API v4 (if API Key is configured)
 * 2. Public Google Sheets CSV / gviz export (no API key required if sheet is public/viewable)
 * 3. Seed fallback (only if ENABLE_SAMPLE_CATALOG_FALLBACK is true)
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
  if (isPlaceholder) {
    if (APP_CONFIG.ENABLE_SAMPLE_CATALOG_FALLBACK) {
      return loadSeedCatalog(youtubeApiKey);
    }
    return {
      videos: [],
      totalApproved: 0,
      duplicateCount: 0,
      rejectedCount: 0,
      source: 'google_sheets_csv',
      lastSynced: new Date(),
      error: 'No Google Sheet ID configured',
    };
  }

  let rowData: SheetRowData[] = [];
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
      rowData = values
        .filter((row) => row && row[0])
        .map((row) => ({
          url: String(row[0] || ''),
          customTitle: row[1] ? String(row[1]) : undefined,
          customCategory: row[2] ? String(row[2]) : undefined,
        }));
    } else {
      // Method 2: Public Google Sheets export (via gviz / export?format=csv)
      source = 'google_sheets_csv';

      let sheetNameParam = '';
      if (range.includes('!') && !range.startsWith('Sheet1') && !range.startsWith('Videos')) {
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
        rowData = parseCsvRows(csvText);
      } else {
        const csvText = await res.text();
        rowData = parseCsvRows(csvText);
      }
    }

    // Process and validate all extracted URLs
    const processed = processSheetRowEntries(rowData);

    // If Google Sheet was completely empty
    if (processed.approvedVideoIds.length === 0) {
      if (APP_CONFIG.ENABLE_SAMPLE_CATALOG_FALLBACK) {
        console.warn('Google Sheet contained no valid YouTube URLs, falling back to seed catalog');
        return loadSeedCatalog(youtubeApiKey);
      }
      return {
        videos: [],
        totalApproved: 0,
        duplicateCount: processed.duplicateCount,
        rejectedCount: processed.rejectedRows.length,
        source,
        lastSynced: new Date(),
      };
    }

    // Fetch video metadata for approved IDs
    const fetchedVideos = await getVideosMetadata(processed.approvedVideoIds, youtubeApiKey);

    // Merge developer custom titles and categories from the sheet if provided!
    const customMap = new Map<string, { customTitle?: string; customCategory?: string }>();
    processed.approvedEntries.forEach((entry) => {
      customMap.set(entry.videoId, {
        customTitle: entry.customTitle,
        customCategory: entry.customCategory,
      });
    });

    const finalVideos: VideoItem[] = fetchedVideos.map((video) => {
      const custom = customMap.get(video.id);
      return {
        ...video,
        title: custom?.customTitle || video.title,
        customTitle: custom?.customTitle,
        category: custom?.customCategory,
        description: custom?.customCategory
          ? `${custom.customCategory} • ${video.description}`
          : video.description,
      };
    });

    return {
      videos: finalVideos,
      totalApproved: finalVideos.length,
      duplicateCount: processed.duplicateCount,
      rejectedCount: processed.rejectedRows.length,
      source,
      lastSynced: new Date(),
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn('Google Sheets sync error:', errorMessage);

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
 * Loads the curated approved seed URLs (used only when fallback is explicitly enabled)
 */
async function loadSeedCatalog(youtubeApiKey?: string): Promise<SheetFetchResult> {
  const rowData: SheetRowData[] = APPROVED_SEED_URLS.map((url) => ({ url }));
  const processed = processSheetRowEntries(rowData);
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
